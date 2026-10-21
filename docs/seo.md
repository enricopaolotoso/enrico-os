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
path and query string, and the custom 404 handler. SiteGround provides HTTPS;
HTTP www requests first upgrade to HTTPS www, then redirect to the apex.
NGINX Direct Delivery is disabled for enricotoso.com in Site Tools > Speed >
Caching so that static resources also obey the host redirect. Dynamic Cache
and its automated deployment purge remain enabled. Re-enabling Direct Delivery
requires an equivalent NGINX-level host redirect; otherwise live SEO checks fail.

Before upload, CI checks built metadata, JSON-LD, sitemap URLs and actual image
dimensions with `node scripts/verify-seo.mjs`. After upload and automatic cache
purge, deployment verification compares ordinary desktop/mobile responses,
including sitemap, robots and social image, against the build. Then
`node scripts/verify-seo.mjs --live` checks HTTP/HTTPS www redirects for homepage,
profile with a query string, sitemap and a missing path. Failures fail the deploy.

Public verification runs over SSH on SiteGround using Node 22 because the
SiteGround anti-bot layer can challenge GitHub-hosted runner IPs with HTTP 202.
The expected SHA-256 manifest is generated from CI's build and uploaded privately,
so responses are still checked against the original build, not against themselves.
Requests use the public domain, ordinary cache and desktop/mobile user agents.
No bot protection exceptions are installed.
