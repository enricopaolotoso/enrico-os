import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const userAgents = {
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
};

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function deploymentResources(distDir) {
  const html = await readFile(resolve(distDir, 'index.html'), 'utf8');
  const paths = new Set([
    '/', '/enrico-toso/', '/sitemap.xml', '/robots.txt', '/social-card.jpg', '/data/spotify.json', '/data/linkedin.json',
    '/deployment-verification-missing-page',
  ]);
  for (const match of html.matchAll(/(?:src|href)=["'](\/(?:_astro\/|desktop\.js)[^"']*)["']/g)) {
    paths.add(match[1]);
  }

  return Promise.all([...paths].map(async (path) => {
    const pathname = new URL(path, 'https://enricotoso.com').pathname;
    const missingPage = path === '/deployment-verification-missing-page';
    const file = missingPage ? '404.html' : pathname === '/' ? 'index.html'
      : pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : pathname.slice(1);
    const bytes = await readFile(resolve(distDir, file));
    return { path, status: missingPage ? 404 : 200, hash: digest(bytes) };
  }));
}

export async function verifyDeployment({
  distDir = resolve(process.env.DEPLOY_DIR || 'dist'),
  origin = 'https://enricotoso.com',
  manifestPath = process.env.DEPLOY_MANIFEST,
  attempts = 6,
  intervalMs = 5000,
  requestTimeoutMs = 15000,
  log = console.log,
} = {}) {
  const resources = manifestPath
    ? JSON.parse(await readFile(manifestPath, 'utf8'))
    : await deploymentResources(distDir);
  const requests = Object.entries(userAgents).flatMap(([profile, userAgent]) =>
    resources.map((resource) => ({ ...resource, profile, userAgent })));
  let failures = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    // Homepage and data use their ordinary URLs: no cache-busting query or headers.
    // Asset URLs retain only the versions already referenced by the built HTML.
    failures = (await Promise.all(requests.map(async (resource) => {
      try {
        const response = await fetch(new URL(resource.path, origin), {
          headers: { 'User-Agent': resource.userAgent },
          redirect: 'error',
          signal: AbortSignal.timeout(requestTimeoutMs),
        });
        const hash = digest(Buffer.from(await response.arrayBuffer()));
        if (response.status !== resource.status) {
          throw new Error(`HTTP ${response.status}; expected ${resource.status}`);
        }
        if (hash !== resource.hash) throw new Error('content differs from the deployed build');
        return null;
      } catch (error) {
        return `${resource.profile} ${resource.path}: ${error.message}`;
      }
    }))).filter(Boolean);

    if (!failures.length) {
      log(`Deployment verified: ${resources.length} resources match the build on desktop and mobile.`);
      return;
    }
    log(`Verification ${attempt}/${attempts}: ${failures.join('; ')}`);
    if (attempt < attempts) await delay(intervalMs);
  }
  throw new Error(`Deployment is not current: ${failures.join('; ')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  verifyDeployment().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
