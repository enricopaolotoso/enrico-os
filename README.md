# Enrico OS

![Enrico OS social preview](public/social-card.png)

**Enrico OS** is the source code for [enricotoso.com](https://enricotoso.com/), the official personal portfolio of **Enrico Toso** / **Enrico Paolo Toso**, a digital builder based in Padova, Italy.

The site turns a portfolio into a small macOS-inspired desktop: windows, Finder, Dock, Notes, Photos, Spotify, Terminal, project folders, SEO landing pages and a cinematic 404 experience.

[![Build Astro and deploy to SiteGround](https://github.com/enricopaolotoso/enrico-os/actions/workflows/deploy.yml/badge.svg)](https://github.com/enricopaolotoso/enrico-os/actions/workflows/deploy.yml)

## Live Site

- Website: [enricotoso.com](https://enricotoso.com/)
- Entity profile: [enricotoso.com/enrico-toso](https://enricotoso.com/enrico-toso/)
- AI discovery file: [enricotoso.com/llms.txt](https://enricotoso.com/llms.txt)
- Humans file: [enricotoso.com/humans.txt](https://enricotoso.com/humans.txt)

## What It Is

This repository contains a static Astro site built as an interactive desktop environment. It is designed to present Enrico Toso's work, identity and projects with a strong Apple-like interface language while remaining fast, crawlable and accessible.

The portfolio includes:

- a macOS-inspired desktop with draggable, responsive windows;
- Finder-style navigation for projects, media, notes and links;
- a dedicated SEO/entity page for Enrico Toso;
- structured data, sitemap, robots, favicon and social preview assets;
- a Spotify app powered by prebuilt public JSON data;
- a cinematic 404 page with sequential system-error windows;
- responsive mobile behavior inspired by iOS/macOS interaction patterns.

## Tech Stack

- [Astro](https://astro.build/) for static site generation
- TypeScript for structured content and filesystem data
- Vanilla JavaScript for desktop/window interactions
- CSS modules by feature area for the macOS-style interface
- GitHub Actions for build and deployment
- SiteGround hosting via SCP deploy

## Project Structure

```txt
.
├── .github/workflows/deploy.yml      # Build and SiteGround deploy workflow
├── public/
│   ├── apple-icons/                  # Dock and app icons
│   ├── data/spotify.json             # Static Spotify data used by the Spotify app
│   ├── documents/                    # Finder documents
│   ├── images/                       # Hero, profile, video and SEO images
│   ├── photos/                       # Photos app gallery
│   ├── desktop.js                    # Desktop interaction layer
│   ├── favicon.png / favicon.svg     # Browser and search favicon assets
│   ├── humans.txt
│   ├── llms.txt
│   ├── robots.txt
│   ├── sitemap.xml
│   └── social-card.png
├── scripts/
│   ├── fetch-spotify.mjs
│   └── get-spotify-refresh-token.mjs
├── src/
│   ├── components/                   # Menu bar, Dock and app windows
│   ├── data/                         # Site profile and virtual filesystem
│   ├── layouts/
│   ├── pages/                        # Home, entity profile and 404
│   └── styles/                       # Global, desktop, apps and responsive styles
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Local Development

Requirements:

- Node.js `22.12` or newer
- npm

Install dependencies:

```sh
npm install
```

Run checks:

```sh
npm run check
```

Build the static site:

```sh
npm run build
```

Run the local Astro development server:

```sh
npx astro dev --background
npx astro dev status
npx astro dev logs
npx astro dev stop
```

Preview the production build:

```sh
npm run preview
```

## Content Editing

Most personal and SEO-facing content lives in:

- `src/data/site.ts` for profile data, projects, notes, social links and structured identity details;
- `src/data/filesystem.ts` for the virtual desktop, folders, files and Finder content;
- `public/photos/` for images shown by the Photos app;
- `public/documents/` for files exposed through the Finder;
- `public/images/` for profile, project, video and Open Graph assets.

New files inside `public/photos/` and `public/documents/` are available at build time and can be surfaced through the virtual filesystem.

## Spotify Data

The Spotify app reads from a static JSON file generated before deployment. Credentials are never shipped to the browser.

Generate a refresh token once:

```sh
SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... npm run spotify:auth
```

Refresh Spotify data locally:

```sh
SPOTIFY_CLIENT_ID=... \
SPOTIFY_CLIENT_SECRET=... \
SPOTIFY_REFRESH_TOKEN=... \
SPOTIFY_USER_ID=... \
npm run spotify:fetch
```

For GitHub Actions, configure these repository secrets:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`
- `SPOTIFY_USER_ID` optional
- `SFTP_HOST`
- `SFTP_USERNAME`
- `SFTP_PORT`
- `SFTP_PRIVATE_KEY`
- `SFTP_REMOTE_PATH`

If Spotify data cannot be fetched, the script writes a safe fallback JSON file so the site can still build.

## SEO And Discoverability

The site is built to make the official Enrico Toso entity clear to search engines and AI retrieval systems:

- canonical domain: `https://enricotoso.com`;
- dedicated identity page: `/enrico-toso/`;
- structured profile data in `BaseLayout.astro` and `src/data/site.ts`;
- `robots.txt`, `sitemap.xml`, `humans.txt` and `llms.txt`;
- consistent references to Enrico Paolo Toso, Padova, Netmarket, Raviez and digital builder;
- optimized favicon and social card assets.

## Deployment

Every push to `main` runs the GitHub Actions workflow:

1. checkout repository;
2. install dependencies with `npm ci`;
3. generate Spotify data;
4. build the Astro site;
5. verify `dist/`;
6. deploy `dist/*` to SiteGround via SCP.

The Astro config also writes a production `.htaccess` file so unknown routes correctly render the custom `404.html`.

## Repository Policy

This is a public personal portfolio repository. The source is visible for transparency and reference, but the design, content, images, brand assets and implementation are not released as an open-source template.

See [LICENSE.md](LICENSE.md) for usage terms and [SECURITY.md](SECURITY.md) for responsible disclosure/contact details.

