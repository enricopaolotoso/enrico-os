# SEO

The canonical origin is https://enricotoso.com. Titles and descriptions live in
`src/data/site.ts` (homepage) and `src/pages/enrico-toso.astro` (profile).
`BaseLayout.astro` shares the canonical URL, Open Graph/Twitter metadata and
linked Person, WebSite and WebPage/ProfilePage entities. Only visible content
should be represented by additional structured data; the profile has no FAQ.

`public/sitemap.xml` lists the two indexable canonical pages. Update it whenever
an indexable page is added or removed. Dates, priority and frequency are omitted:
the daily Spotify/LinkedIn rebuild is not evidence of a substantive page change.
If lastmod is added later, use a verified content modification date, never the
build timestamp. robots.txt references this sitemap. The custom 404 is noindex.

The social card is a 2048 × 1152 JPEG, published as `/social-card.jpg` with the
correct media type and alt text. The legacy `.png` URL remains available for old
external links, but is no longer advertised (its original bytes were JPEG).

The build generates `.htaccess` with a permanent www-to-apex redirect, preserving
path and query string, and the custom 404 handler. SiteGround provides HTTPS.

Before upload, CI checks built metadata, JSON-LD, sitemap URLs and actual image
dimensions with `node scripts/verify-seo.mjs`. After upload and automatic cache
purge, deployment verification compares ordinary desktop/mobile responses,
including sitemap, robots and social image, against the build. Then
`node scripts/verify-seo.mjs --live` checks HTTP/HTTPS www redirects for homepage,
profile with a query string, sitemap and a missing path. Failures fail the deploy.
