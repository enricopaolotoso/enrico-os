import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer as httpServer } from 'node:http';
import { createServer as socketServer } from 'node:net';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { deploymentResources, verifyDeployment } from '../scripts/verify-deployment.mjs';

const exec = promisify(execFile);
const purgeScript = resolve('scripts/purge-siteground-cache.php');

async function fixture(t) {
  // Keep Unix socket paths below the macOS length limit as well as Linux's.
  const dir = await mkdtemp('/tmp/enrico-deploy-');
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const folder of ['_astro', 'enrico-toso', 'data']) await mkdir(join(dir, folder));
  const files = {
    'index.html': '<link href="/_astro/site.css" rel="stylesheet"><script src="/desktop.js?v=release"></script>New release',
    'enrico-toso/index.html': 'Current profile',
    '404.html': 'Custom not found',
    'sitemap.xml': '<urlset></urlset>',
    'social-card.jpg': 'social image',
    'robots.txt': 'User-agent: *\nAllow: /',
    '_astro/site.css': 'body{color:black}',
    'desktop.js': 'console.log("current");',
    'data/spotify.json': '{"updatedAt":"current"}',
    'data/linkedin.json': '{"post":null}',
  };
  await Promise.all(Object.entries(files).map(([file, bytes]) => writeFile(join(dir, file), bytes)));
  return { dir, files };
}

async function website(t, files, override = () => null) {
  const requests = [];
  const server = httpServer((request, response) => {
    requests.push({ url: request.url, headers: request.headers });
    const custom = override(request);
    if (custom) {
      response.writeHead(custom.status ?? 200, custom.headers ?? {});
      response.end(custom.body ?? '');
      return;
    }
    const path = new URL(request.url, 'http://localhost').pathname;
    const missing = path === '/deployment-verification-missing-page';
    const file = missing ? '404.html' : path === '/' ? 'index.html'
      : path.endsWith('/') ? `${path.slice(1)}index.html` : path.slice(1);
    response.writeHead(missing ? 404 : files[file] === undefined ? 404 : 200);
    response.end(files[file] ?? 'Unexpected path');
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  t.after(() => new Promise((done) => {
    server.closeAllConnections();
    server.close(done);
  }));
  return { origin: `http://127.0.0.1:${server.address().port}`, requests };
}

test('verifies normal desktop/mobile URLs, versioned assets and the custom 404', async (t) => {
  const { dir, files } = await fixture(t);
  const { origin, requests } = await website(t, files);
  await verifyDeployment({ distDir: dir, origin, attempts: 1, log() {} });
  const resources = await deploymentResources(dir);
  assert.equal(requests.length, resources.length * 2);
  assert.equal(requests.filter((r) => r.url === '/').length, 2);
  assert(requests.some((r) => r.url === '/desktop.js?v=release'));
  assert(requests.every((r) => !r.headers['cache-control'] && !r.headers.pragma));
  assert(requests.some((r) => r.headers['user-agent'].includes('iPhone')));
});

test('retries stale HTML until both ordinary homepage variants match the build', async (t) => {
  const { dir, files } = await fixture(t);
  let homepageRequests = 0;
  const { origin } = await website(t, files, (request) =>
    request.url === '/' && ++homepageRequests <= 2 ? { body: 'Old cached release' } : null);
  await verifyDeployment({ distDir: dir, origin, attempts: 2, intervalMs: 0, log() {} });
  assert.equal(homepageRequests, 4);
});

test('rejects a stale mobile cache even when desktop is current', async (t) => {
  const { dir, files } = await fixture(t);
  const { origin } = await website(t, files, (request) =>
    request.url === '/' && request.headers['user-agent'].includes('iPhone')
      ? { body: 'Old mobile release' } : null);
  await assert.rejects(verifyDeployment({ distDir: dir, origin, attempts: 1, log() {} }), /mobile \/: content differs/);
});

test('rejects stale data, missing CSS and a soft 404 independently', async (t) => {
  const { dir, files } = await fixture(t);
  for (const [path, status, body] of [
    ['/data/spotify.json', 200, 'Old Spotify data'],
    ['/_astro/site.css', 404, 'Missing CSS'],
    ['/deployment-verification-missing-page', 200, files['404.html']],
  ]) {
    const { origin } = await website(t, files, (request) => request.url === path ? { status, body } : null);
    await assert.rejects(verifyDeployment({ distDir: dir, origin, attempts: 1, log() {} }), /Deployment is not current/);
  }
});

test('does not accept a redirect as evidence that the canonical homepage is current', async (t) => {
  const { dir, files } = await fixture(t);
  const { origin } = await website(t, files, (request) => request.url === '/'
    ? { status: 302, headers: { Location: '/enrico-toso/' } } : null);
  await assert.rejects(verifyDeployment({ distDir: dir, origin, attempts: 1, log() {} }), /Deployment is not current/);
});

async function purgeReply(t, reply) {
  const { dir } = await fixture(t);
  const path = join(dir, 'site-tools.sock');
  let sent;
  const server = socketServer((socket) => {
    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk;
      if (!buffer.includes('\n')) return;
      sent = JSON.parse(buffer.trim());
      socket.end(`${typeof reply === 'string' ? reply : JSON.stringify(reply)}\n`);
    });
  });
  await new Promise((done) => server.listen(path, done));
  t.after(() => new Promise((done) => server.close(done)));
  return {
    run: () => exec('php', [purgeScript], { env: { ...process.env, SITEGROUND_SOCKET: path }, timeout: 15000 }),
    request: () => sent,
  };
}

const acknowledgment = {
  json: { flush_cache: 1, id: 'enricotoso.com', msg: 'OK', path: '/(.*)' },
};

test('uses the SiteGround socket protocol and confirms only this domain', async (t) => {
  const mock = await purgeReply(t, acknowledgment);
  const { stdout } = await mock.run();
  assert.match(stdout, /cache purged for enricotoso.com/);
  assert.deepEqual(mock.request(), {
    api: 'domain-all', cmd: 'update', settings: { json: 1 },
    params: { flush_cache: '1', id: 'enricotoso.com', path: '/(.*)' },
  });
});

test('fails closed for errors, malformed replies and the wrong domain or path', async (t) => {
  for (const reply of [
    { err_code: 403, message: 'Forbidden' },
    'not JSON', {}, null,
    { json: { ...acknowledgment.json, id: 'another-site.example' } },
    { json: { ...acknowledgment.json, path: '/' } },
    { json: { ...acknowledgment.json, flush_cache: 0 } },
  ]) {
    const mock = await purgeReply(t, reply);
    await assert.rejects(mock.run(), (error) => error.code === 1 && /Cache purge failed/.test(error.stderr));
  }
});

test('fails when the Site Tools socket cannot be reached', async () => {
  await assert.rejects(exec('php', [purgeScript], {
    env: { ...process.env, SITEGROUND_SOCKET: '/tmp/enrico-missing-socket.sock' }, timeout: 15000,
  }), (error) => error.code === 1 && /socket unavailable/.test(error.stderr));
});

 test('uses the original build manifest even if uploaded files and responses are both stale', async (t) => {
  const { dir, files } = await fixture(t);
  const manifestPath = join(dir, 'expected.json');
  await writeFile(manifestPath, JSON.stringify(await deploymentResources(dir)));
  files['enrico-toso/index.html'] = 'Stale uploaded profile';
  await writeFile(join(dir, 'enrico-toso/index.html'), files['enrico-toso/index.html']);
  const server = await website(t, files);
  await assert.rejects(verifyDeployment({ distDir: dir, manifestPath, origin: server.origin, attempts: 1, log: () => {} }), /content differs/);
});
