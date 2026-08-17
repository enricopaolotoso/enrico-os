import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = join(root, 'public', 'data', 'linkedin.json');

const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
const authorUrn = process.env.LINKEDIN_AUTHOR_URN;
const linkedinVersion = process.env.LINKEDIN_VERSION || '202601';
const profileUrl = process.env.LINKEDIN_PROFILE_URL || 'https://linkedin.com/in/enricopaolotoso';

function emptyData(error = null) {
  return {
    updatedAt: new Date().toISOString(),
    profileUrl,
    post: null,
    error
  };
}

async function readExistingData() {
  try {
    return JSON.parse(await readFile(outputPath, 'utf8'));
  } catch {
    return null;
  }
}

async function save(data) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function normalizeCommentary(commentary) {
  if (typeof commentary === 'string') return commentary.trim();
  if (typeof commentary?.text === 'string') return commentary.text.trim();
  return '';
}

function excerpt(text, maxLength = 280) {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).replace(/\s+\S*$/, '')}...`;
}

function postUrl(id) {
  return id ? `https://www.linkedin.com/feed/update/${id}` : profileUrl;
}

async function linkedinFetch(path) {
  const response = await fetch(`https://api.linkedin.com${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Linkedin-Version': linkedinVersion,
      'X-Restli-Protocol-Version': '2.0.0',
      'X-RestLi-Method': 'FINDER'
    }
  });

  const text = await response.text();
  let result = {};
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { message: text };
  }

  if (!response.ok) {
    throw new Error(result.message || result.serviceErrorCode || `LinkedIn API ${response.status}`);
  }

  return result;
}

if (!accessToken || !authorUrn) {
  const existing = await readExistingData();
  if (existing) {
    console.warn('LinkedIn: secret mancanti. Mantengo il JSON esistente.');
    process.exit(0);
  }

  await save(emptyData('Credenziali LinkedIn non configurate. Aggiungi LINKEDIN_ACCESS_TOKEN e LINKEDIN_AUTHOR_URN nei GitHub secrets.'));
  console.warn(`LinkedIn: credenziali mancanti. Creato fallback valido in ${outputPath}`);
  process.exit(0);
}

try {
  const params = new URLSearchParams({
    q: 'author',
    author: authorUrn,
    count: '1',
    sortBy: 'CREATED',
    viewContext: 'READER'
  });
  const data = await linkedinFetch(`/rest/posts?${params.toString()}`);
  const latest = data.elements?.[0] || null;

  const text = normalizeCommentary(latest?.commentary);
  const publishedAt = latest?.publishedAt ? new Date(latest.publishedAt).toISOString() : null;
  const lastModifiedAt = latest?.lastModifiedAt ? new Date(latest.lastModifiedAt).toISOString() : publishedAt;
  const id = latest?.id || '';

  await save({
    updatedAt: new Date().toISOString(),
    profileUrl,
    post: latest
      ? {
          id,
          url: postUrl(id),
          text,
          excerpt: excerpt(text),
          publishedAt,
          lastModifiedAt,
          contentType: latest.content ? Object.keys(latest.content)[0] || 'post' : 'post'
        }
      : null,
    error: latest ? null : 'Nessun post pubblico trovato per questo autore.'
  });

  console.log(`LinkedIn: dati aggiornati in ${outputPath}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const existing = await readExistingData();

  if (existing) {
    await save({
      ...existing,
      updatedAt: existing.updatedAt || new Date().toISOString(),
      error: message
    });
    console.error(`LinkedIn: ${message}. Mantengo l’ultimo post salvato.`);
    process.exit(0);
  }

  await save(emptyData(message));
  console.error(`LinkedIn: ${message}. Creato JSON fallback.`);
  process.exit(0);
}
