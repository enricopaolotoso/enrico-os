# Enrico OS

Portfolio personale di Enrico Paolo Toso, costruito con Astro e presentato come un desktop interattivo ispirato a macOS.

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

## Libreria Foto

Copia le immagini in `public/photos`. Sono supportati PNG, JPG/JPEG, WebP, GIF e AVIF. Il nome del file viene usato come titolo e le nuove immagini vengono rilevate automaticamente durante lo sviluppo o alla build successiva.

## Contatti

Email e profili social sono intenzionalmente opzionali. Finché non vengono inseriti in `src/data/site.ts`, l’interfaccia mostra uno stato “in aggiornamento” e non genera link fittizi.
