import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = 'http://127.0.0.1:8888/callback';
const scopes = [
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative'
];

if (!clientId || !clientSecret) {
  console.error('Mancano SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET nelle variabili ambiente.');
  process.exit(1);
}

const state = randomBytes(18).toString('hex');
const authorizationUrl = new URL('https://accounts.spotify.com/authorize');
authorizationUrl.search = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  scope: scopes.join(' '),
  redirect_uri: redirectUri,
  state
}).toString();

function openBrowser(url) {
  const platform = process.platform;
  const command =
    platform === 'darwin' ? ['open', [url]] :
    platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] :
    ['xdg-open', [url]];

  try {
    const child = spawn(command[0], command[1], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
  } catch {
    // The printed URL is always available as a fallback.
  }
}

async function exchangeCode(code) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error_description || result.error || 'Scambio del codice non riuscito.');
  }
  return result;
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', redirectUri);
  if (requestUrl.pathname !== '/callback') {
    response.writeHead(404).end('Not found');
    return;
  }

  if (requestUrl.searchParams.get('state') !== state) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Stato OAuth non valido.');
    server.close();
    return;
  }

  const error = requestUrl.searchParams.get('error');
  const code = requestUrl.searchParams.get('code');
  if (error || !code) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(`Autorizzazione non completata: ${error || 'codice mancante'}.`);
    server.close();
    return;
  }

  try {
    const tokens = await exchangeCode(code);
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end('<h1>Spotify collegato</h1><p>Puoi chiudere questa finestra e tornare al terminale.</p>');

    console.log('\nSPOTIFY_REFRESH_TOKEN:\n');
    console.log(tokens.refresh_token || '(Spotify non ha restituito un refresh token)');
    console.log('\nSalvalo come GitHub Secret. Non inserirlo nel repository.\n');
  } catch (exchangeError) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Errore durante lo scambio del token. Controlla il terminale.');
    console.error(exchangeError instanceof Error ? exchangeError.message : exchangeError);
  } finally {
    server.close();
  }
});

server.listen(8888, '127.0.0.1', () => {
  console.log('Apri questa URL per autorizzare Spotify:\n');
  console.log(authorizationUrl.toString());
  console.log('\nIn attesa del callback su http://127.0.0.1:8888/callback ...');
  openBrowser(authorizationUrl.toString());
});

