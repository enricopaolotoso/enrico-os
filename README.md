# Enrico OS

Portfolio personale di Enrico Toso (nome completo Enrico Paolo Toso), costruito con Astro e presentato come un desktop interattivo ispirato a macOS.

## Requisiti

- Node.js 22.12 o successivo
- npm

## Comandi

```sh
npm install
npm run build
npm run check
```

Per lo sviluppo locale, come richiesto dalle istruzioni del progetto:

```sh
npx astro dev --background
npx astro dev status
npx astro dev logs
npx astro dev stop
```

## Struttura

- `src/data/site.ts`: contenuti e configurazione del portfolio
- `src/pages/index.astro`: composizione del desktop
- `src/components/`: menu, Dock e finestre principali
- `src/styles/`: sistema visivo e responsive
- `public/desktop.js`: interazioni del desktop
- `public/apple-icons/`: icone applicazioni
- `public/photos/`: immagini mostrate automaticamente nell’app Foto
- `public/documents/`: file mostrati automaticamente nella sezione Documenti del Finder
- `public/data/spotify.json`: dati pubblici usati dall’app Spotify

## Libreria Foto

Copia le immagini in `public/photos`. Sono supportati PNG, JPG/JPEG, WebP, GIF e AVIF. Il nome del file viene usato come titolo e le nuove immagini vengono rilevate automaticamente durante lo sviluppo o alla build successiva.

## Documenti Finder

Copia i documenti in `public/documents`. Tutti i file presenti vengono elencati automaticamente nella sezione Documenti del Finder e possono essere aperti in una nuova scheda.

## App Spotify

L’app Spotify usa un file JSON statico generato prima della build. Le credenziali restano esclusivamente nell’ambiente locale o nei GitHub Secrets e non vengono inviate al browser.

Per ottenere una sola volta il refresh token:

```sh
SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... npm run spotify:auth
```

Per aggiornare i dati localmente:

```sh
SPOTIFY_CLIENT_ID=... \
SPOTIFY_CLIENT_SECRET=... \
SPOTIFY_REFRESH_TOKEN=... \
SPOTIFY_USER_ID=... \
npm run spotify:fetch
```

Nel repository GitHub configura i secret `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` e, facoltativamente, `SPOTIFY_USER_ID`. Il deploy aggiorna automaticamente playlist pubbliche, top artisti e top tracce prima della build. Se Spotify non è disponibile, viene comunque prodotto un JSON valido e il sito continua a funzionare.

## Contatti

Email e profili social sono configurati in `src/data/site.ts`. I profili social vengono mostrati anche come applicazioni nel Finder.
