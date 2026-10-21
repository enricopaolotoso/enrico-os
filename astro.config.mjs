// @ts-check
import { defineConfig } from 'astro/config';
import { writeFile } from 'node:fs/promises';

/** @type {import('astro').AstroIntegration} */
const siteGround404 = {
  name: 'siteground-404',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await writeFile(new URL('.htaccess', dir), `RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\\.enricotoso\\.com(?::[0-9]+)?$ [NC]
RewriteRule ^ https://enricotoso.com%{REQUEST_URI} [R=301,L,NE]

ErrorDocument 404 /404.html
`);
    }
  }
};

// https://astro.build/config
export default defineConfig({
  site: 'https://enricotoso.com',
  integrations: [siteGround404],
  devToolbar: {
    enabled: false
  }
});
