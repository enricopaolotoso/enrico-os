import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = join(root, 'public', 'data', 'spotify.json');
const ranges = ['short_term', 'medium_term', 'long_term'];

function emptyData(error = null) {
  return {
    updatedAt: new Date().toISOString(),
    profile: {
      displayName: '',
      url: '',
      image: ''
    },
    playlists: [],
    topArtists: {
      short_term: [],
      medium_term: [],
      long_term: []
    },
    topTracks: {
      short_term: [],
      medium_term: [],
      long_term: []
    },
    error
  };
}

async function save(data) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
const configuredUserId = process.env.SPOTIFY_USER_ID;

if (!clientId || !clientSecret || !refreshToken) {
  await save(emptyData('Credenziali Spotify non configurate. I dati saranno generati durante il deploy.'));
  console.warn(`Spotify: credenziali mancanti. Creato fallback valido in ${outputPath}`);
  process.exit(0);
}

async function getAccessToken() {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error_description || result.error || 'Access token non disponibile.');
  return result.access_token;
}

async function spotifyFetch(path, token) {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || `Spotify API ${response.status}`);
  }
  return result;
}

async function getAllPlaylists(token) {
  let next = '/me/playlists?limit=50';
  const items = [];
  while (next) {
    const page = await spotifyFetch(next.replace('https://api.spotify.com/v1', ''), token);
    items.push(...(page.items || []));
    next = page.next;
  }
  return items;
}

try {
  const token = await getAccessToken();
  const profile = await spotifyFetch('/me', token);
  const ownerId = configuredUserId || profile.id;
  const playlistItems = await getAllPlaylists(token);

  const [artistResults, trackResults] = await Promise.all([
    Promise.all(ranges.map((range) => spotifyFetch(`/me/top/artists?limit=20&time_range=${range}`, token))),
    Promise.all(ranges.map((range) => spotifyFetch(`/me/top/tracks?limit=20&time_range=${range}`, token)))
  ]);

  const data = emptyData();
  data.profile = {
    displayName: profile.display_name || profile.id || '',
    url: profile.external_urls?.spotify || '',
    image: profile.images?.[0]?.url || ''
  };
  data.playlists = playlistItems
    .filter(
      (playlist) =>
        playlist?.owner?.id === ownerId && playlist?.public === true,
    )
    .map((playlist) => ({
      id: playlist.id,
      name: playlist.name || '',
      description: playlist.description || '',
      image: playlist.images?.[0]?.url || '',
      tracksTotal: playlist.tracks?.total || 0,
      url: playlist.external_urls?.spotify || ''
    }));

  ranges.forEach((range, index) => {
    data.topArtists[range] = (artistResults[index].items || []).map((artist, rank) => ({
      id: artist.id,
      rank: rank + 1,
      name: artist.name || '',
      genres: artist.genres || [],
      image: artist.images?.[0]?.url || '',
      popularity: artist.popularity || 0,
      url: artist.external_urls?.spotify || ''
    }));

    data.topTracks[range] = (trackResults[index].items || []).map((track, rank) => ({
      id: track.id,
      rank: rank + 1,
      name: track.name || '',
      artist: track.artists?.[0]?.name || '',
      artists: (track.artists || []).map((artist) => artist.name),
      album: track.album?.name || '',
      image: track.album?.images?.[0]?.url || '',
      durationMs: track.duration_ms || 0,
      url: track.external_urls?.spotify || ''
    }));
  });

  await save(data);
  console.log(`Spotify: dati aggiornati in ${outputPath}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await save(emptyData(message));
  console.error(`Spotify: ${message}. Creato JSON fallback.`);
  process.exitCode = 0;
}
