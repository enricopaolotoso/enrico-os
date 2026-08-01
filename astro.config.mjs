// @ts-check
import { defineConfig } from 'astro/config';
import { writeFile } from 'node:fs/promises';

/** @type {import('astro').AstroIntegration} */
const siteGround404 = {
  name: 'siteground-404',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await writeFile(new URL('.htaccess', dir), 'ErrorDocument 404 /404.html\n');
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
