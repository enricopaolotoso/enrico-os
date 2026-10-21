import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const origin = 'https://enricotoso.com';
const pages = [['index.html', '/', 'WebPage'], ['enrico-toso/index.html', '/enrico-toso/', 'ProfilePage']];
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]).sort(), pages.map(([, path]) => origin + path).sort());
assert.match(await readFile('dist/robots.txt', 'utf8'), /Sitemap: https:\/\/enricotoso\.com\/sitemap\.xml/);
const titles = new Set();
for (const [file, path, type] of pages) {
  const html = await readFile(`dist/${file}`, 'utf8');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g);
  assert.deepEqual(canonical, [`<link rel="canonical" href="${origin}${path}"`]);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert.ok(title && title.length <= 65);
  titles.add(title);
  assert.match(html, /<meta name="description" content="[^"]{80,170}"/);
  assert.match(html, /<meta property="og:image:width" content="2048"/);
  assert.match(html, /<meta property="og:image:height" content="1152"/);
  assert.match(html, /<meta name="twitter:image:alt" content="[^"]+"/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.ok(!schema.some(item => item['@type'] === 'FAQPage'));
  const page = schema.find(item => item['@id'] === `${origin}${path}#webpage`);
  assert.equal(page['@type'], type);
  assert.equal(page.url, origin + path);
  const person = schema.find(item => item['@type'] === 'Person');
  assert.deepEqual(person.alternateName, ['Enrico Paolo Toso']);
  assert.equal(person.mainEntityOfPage['@id'], `${origin}/enrico-toso/#webpage`);
  assert.equal(page.mainEntity['@id'], person['@id']);
}
assert.equal(titles.size, pages.length);
const notFound = await readFile('dist/404.html', 'utf8');
assert.match(notFound, /name="robots" content="noindex/);
assert.ok(!notFound.includes('application/ld+json'));
// Read JPEG frame dimensions to catch mismatches between the image and metadata.
const jpeg = await readFile('dist/social-card.jpg');
assert.equal(jpeg.readUInt16BE(0), 0xffd8);
let dimensions;
for (let offset = 2; offset < jpeg.length;) {
  const marker = jpeg.readUInt16BE(offset);
  const length = jpeg.readUInt16BE(offset + 2);
  if ([0xffc0, 0xffc1, 0xffc2].includes(marker)) {
    dimensions = [jpeg.readUInt16BE(offset + 7), jpeg.readUInt16BE(offset + 5)];
    break;
  }
  offset += length + 2;
}
assert.deepEqual(dimensions, [2048, 1152]);
if (process.argv.includes('--live')) {
  for (const protocol of ['https:', 'http:']) {
    for (const path of ['/', '/enrico-toso/?source=seo&test=1', '/sitemap.xml', '/missing-seo-page']) {
      let response = await fetch(`${protocol}//www.enricotoso.com${path}`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      // SiteGround upgrades HTTP to HTTPS before applying Apache host redirects.
      if (protocol === 'http:' && response.headers.get('location') === `https://www.enricotoso.com${path}`) {
        assert.equal(response.status, 301);
        response = await fetch(response.headers.get('location'), { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      }
      assert.equal(response.status, 301, `${protocol} www ${path}`);
      assert.equal(response.headers.get('location'), origin + path);
    }
  }
  console.log('Live www redirects verified: HTTP/HTTPS, paths and query strings.');
}
console.log('SEO verified: canonical URLs, metadata, schemas, social image, sitemap and noindex 404.');
