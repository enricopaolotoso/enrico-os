export type FileSystemItemType =
  | 'folder'
  | 'image'
  | 'video'
  | 'document'
  | 'pdf'
  | 'link'
  | 'note'
  | 'app'
  | 'audio'
  | 'playlist';

export type FileSystemItemAspectRatio =
  | 'square'
  | 'horizontal'
  | 'vertical'
  | 'wide'
  | 'portrait'
  | 'auto';

export type FileSystemItem = {
  id: string;
  name: string;
  type: FileSystemItemType;
  path: string;
  icon?: string;
  thumbnail?: string;
  aspectRatio?: FileSystemItemAspectRatio;
  width?: number;
  height?: number;
  mimeType?: string;
  description?: string;
  url?: string;
  link?: string;
  external?: boolean;
  app?: string;
  children?: FileSystemItem[];
  content?: string;
};

export const fileSystem: FileSystemItem = {
  id: 'desktop',
  name: 'Desktop',
  type: 'folder',
  path: '/Desktop',
  description: 'Il desktop del portfolio di Enrico Toso.',
  children: [
    {
  id: 'readme',
  name: 'README.md',
  type: 'document',
  path: '/Desktop/README.md',
  icon: 'MD',
  aspectRatio: 'portrait',
  mimeType: 'text/markdown',
  description:
    'Guida al portfolio: app, cartelle, progetti e scorciatoie per esplorare il desktop personale di Enrico Toso.',
  content: `# Enrico Toso

Ciao, sono **Enrico Toso**, digital builder a Milano e Padova.

Costruisco brand, siti web, e-commerce, contenuti e progetti digitali combinando identità, comunicazione, tecnologia, marketing e AI.

Il mio nome completo è **Enrico Paolo Toso**, ma online uso principalmente Enrico Toso.

Questo sito è il mio portfolio personale: non una pagina statica, ma un piccolo desktop interattivo dove raccogliere progetti, esperimenti, appunti, contenuti e parti del mio percorso.

---

## Cosa faccio

Lavoro su progetti digitali che uniscono più livelli:

- identità visiva e direzione creativa;
- siti web e interfacce digitali;
- e-commerce e sistemi di vendita online;
- contenuti per social e campagne;
- advertising e strategie di acquisizione;
- automazioni, workflow e strumenti AI;
- sviluppo di brand e progetti proprietari.

Mi interessa costruire cose che non siano solo belle da vedere, ma che abbiano una logica, una struttura e una direzione.

---

## Dove lavoro

Sono cresciuto dentro **Netmarket**, agenzia di comunicazione e digital con sede in Veneto.

Lì lavoro su siti web, branding, marketing, contenuti, e-commerce e strategie digitali per aziende, brand e attività locali.

Accanto al lavoro in agenzia porto avanti anche progetti personali, tra cui **Raviez**, un brand streetwear nato come laboratorio reale su identità, community, contenuto e vendita online.

---

## Perché “digital builder”

Non mi riconosco in una sola etichetta.

Non sono solo un designer, solo uno sviluppatore, solo un marketer o solo un creator.

Mi interessa il punto in cui queste cose si incontrano: trasformare un’idea in qualcosa che esiste davvero, funziona, comunica, vende, cresce e lascia una traccia.

Per questo uso il termine **digital builder**.

Costruire, per me, significa collegare:

\`\`\`txt
idea → identità → prodotto → contenuto → distribuzione → crescita
\`\`\`

---

## Cosa trovi in questo sito

Questo portfolio è organizzato come un desktop.

Puoi aprire cartelle, file e applicazioni per esplorare parti diverse del mio lavoro e della mia identità digitale.

### Finder

La mappa principale del sito.

Qui trovi cartelle, documenti, immagini, progetti e contenuti organizzati come in un file system.

### Progetti

Una raccolta di lavori, esperimenti e case study legati a web, branding, e-commerce, contenuti e progetti digitali.

### Raviez

Il mio progetto streetwear e direct-to-consumer.

Un laboratorio pratico su brand identity, prodotto, comunicazione, community e vendita online.

### Netmarket

Il contesto professionale in cui lavoro ogni giorno su siti web, comunicazione, marketing, contenuti e soluzioni digitali per clienti reali.

### Creator Archive

Una parte del mio percorso legata alla creazione di contenuti, ai social, a TikTok, YouTube Shorts, Instagram e ai formati digitali nativi delle piattaforme.

### Spotify

Una sezione più personale, con playlist pubbliche, artisti e tracce più ascoltate.

Non serve a spiegare cosa faccio, ma a mostrare una parte del mio immaginario.

### Terminale

Una piccola interfaccia testuale per esplorare comandi, scorciatoie e dettagli nascosti del sito.

### Mail

Il modo più diretto per contattarmi.

---

## Stack e strumenti

Uso strumenti diversi in base al progetto, ma lavoro spesso con:

- WordPress;
- WooCommerce;
- Elementor;
- Astro;
- HTML, CSS e JavaScript;
- GitHub;
- GitHub Actions;
- SiteGround;
- Meta Ads;
- Google Ads;
- TikTok Ads;
- GA4 e GTM;
- Brevo;
- strumenti AI e workflow custom.

La tecnologia, per me, non è il punto di arrivo.

È il mezzo per costruire esperienze, processi e progetti più efficaci.

---

## Temi su cui lavoro

Alcuni temi ricorrenti nel mio lavoro:

- branding;
- web design;
- e-commerce;
- content creation;
- social media;
- performance marketing;
- AI applicata ai processi creativi e operativi;
- personal branding;
- creator economy;
- direct-to-consumer;
- automazioni;
- sistemi digitali per aziende e brand.

---

## Il mio approccio

Cerco di evitare il digitale fatto solo di estetica, trend o strumenti usati a caso.

Un progetto per me deve rispondere a domande concrete:

\`\`\`txt
Che identità ha?
A chi parla?
Perché dovrebbe interessare?
Come viene scoperto?
Come converte?
Come cresce?
Come resta coerente nel tempo?
\`\`\`

La parte visiva è importante, ma da sola non basta.

Un sito, un brand o un contenuto funzionano quando forma, messaggio, struttura e distribuzione lavorano nella stessa direzione.

---

## In breve

Sono **Enrico Toso**, digital builder a Milano e Padova.

Costruisco progetti digitali tra brand, web, e-commerce, contenuti, marketing e AI.

Questo sito raccoglie una parte del mio percorso: quello che faccio, quello che sto costruendo e il modo in cui penso il digitale.

Se vuoi capire da dove partire, apri il Finder.

Se vuoi andare dritto al punto, apri Mail.`
},
    {
      id: 'raviez',
      name: 'Raviez',
      type: 'folder',
      path: '/Desktop/Raviez',
      description:
        'Brand DTC costruito come laboratorio reale su identità, community, contenuto e vendita online.',
      children: [
        {
          id: 'raviez-overview',
          name: 'Raviez Overview.md',
          type: 'document',
          path: '/Desktop/Raviez/Raviez Overview.md',
          icon: 'MD',
          aspectRatio: 'portrait',
          mimeType: 'text/markdown',
          description:
            'Raviez è uno statement apparel brand nato nel 2023. Il progetto unisce prodotto, identità, community, contenuti e vendita online.'
        },
        {
          id: 'raviez-photo',
          name: 'raviez ok.jpg',
          type: 'image',
          path: '/Desktop/Raviez/raviez ok.jpg',
          thumbnail: '/photos/raviez%20ok.jpg',
          aspectRatio: 'vertical',
          width: 1000,
          height: 1250,
          mimeType: 'image/jpeg',
          url: '/photos/raviez%20ok.jpg',
          description: 'Immagine dall’archivio visuale di Raviez.'
        },
        {
          id: 'raviez-results',
          name: 'Risultati.note',
          type: 'note',
          path: '/Desktop/Raviez/Risultati.note',
          aspectRatio: 'portrait',
          mimeType: 'text/plain',
          description:
            'Circa 1.600 magliette vendute e una community Instagram cresciuta fino a circa 7.000 follower.'
        },
        {
          id: 'raviez-shop',
          name: 'Raviez online',
          type: 'link',
          path: '/Desktop/Raviez/Raviez online',
          icon: '↗',
          aspectRatio: 'horizontal',
          description: 'Collegamento al progetto Raviez. Il sito pubblico è in aggiornamento.',
          url: 'https://instagram.com/raviez'
        }
      ]
    },
    {
      id: 'netmarket',
      name: 'Netmarket',
      type: 'folder',
      path: '/Desktop/Netmarket',
      description:
        'Ambiente operativo dedicato a branding, siti web, e-commerce, contenuti e strategie digitali.',
      children: [
        {
          id: 'netmarket-profile',
          name: 'Netmarket.md',
          type: 'document',
          path: '/Desktop/Netmarket/Netmarket.md',
          icon: 'MD',
          aspectRatio: 'portrait',
          mimeType: 'text/markdown',
          description:
            'In Netmarket lavoro su web design, WooCommerce, SEO, branding, contenuti e marketing digitale.'
        },
        {
          id: 'netmarket-app',
          name: 'Progetti.app',
          type: 'app',
          path: '/Desktop/Netmarket/Progetti.app',
          icon: 'P',
          aspectRatio: 'square',
          app: 'projects',
          description: 'Apre l’app Progetti del portfolio.'
        },
        {
          id: 'netmarket-link',
          name: 'netmarket.it',
          type: 'link',
          path: '/Desktop/Netmarket/netmarket.it',
          icon: '↗',
          aspectRatio: 'horizontal',
          url: 'https://www.netmarket.it',
          description: 'Sito ufficiale di Netmarket.'
        }
      ]
    },
    {
      id: 'youtube-2016',
      name: 'youtube2016.mp4',
      type: 'video',
      path: '/Desktop/youtube2016.mp4',
      thumbnail: '/images/copertina-video.jpg',
      aspectRatio: 'wide',
      width: 816,
      height: 452,
      mimeType: 'video/mp4',
      url: 'https://youtu.be/hTxmt7l1pao',
      external: true,
      description: 'Uno dei primi video YouTube pubblicati da Enrico nel 2016.'
    },
    {
      id: 'intervista-podcast',
      name: 'intervista podcast',
      type: 'video',
      path: '/Desktop/intervista podcast',
      thumbnail: '/images/intervista%20youtube%20podcast%20enrico%20toso%20enrico%20paolo%20toso.jpg',
      aspectRatio: 'wide',
      width: 320,
      height: 180,
      mimeType: 'video/mp4',
      url: 'https://www.youtube.com/watch?v=GGhU2WUxayk',
      external: true,
      description: 'Intervista podcast con Enrico Toso.'
    },
    {
      id: 'joylife',
      name: 'joylife.jpg',
      type: 'image',
      path: '/Desktop/joylife.jpg',
      thumbnail: '/images/joylife.jpg',
      aspectRatio: 'square',
      width: 1169,
      height: 1155,
      mimeType: 'image/jpeg',
      url: '/images/joylife.jpg',
      description:
        'JoyLife è un progetto digitale e di community nato per sperimentare contenuti, eventi, collaborazioni e nuove opportunità creative.'
    },
    {
      id: 'filtri-mm',
      name: 'filtri-mm.jpg',
      type: 'image',
      path: '/Desktop/filtri-mm.jpg',
      thumbnail: '/images/filtri-mm.jpg',
      aspectRatio: 'vertical',
      width: 640,
      height: 1260,
      mimeType: 'image/jpeg',
      url: '/images/filtri-mm.jpg',
      description:
        'Nel 2020 ho iniziato a sviluppare filtri Instagram personali. In seguito ho iniziato a proporli come servizio commerciale a eventi, discoteche, brand e influencer, raggiungendo un totale di +50M impression.'
    },
    {
      id: 'cir-come-nella-vita',
      name: 'cir-comenellavita.jpg',
      type: 'image',
      path: '/Desktop/cir-comenellavita.jpg',
      thumbnail: '/images/cir-comenellavita.jpg',
      aspectRatio: 'square',
      width: 1163,
      height: 1156,
      mimeType: 'image/jpeg',
      url: '/images/cir-comenellavita.jpg',
      description:
        'Come nella vita è un progetto creativo legato a storytelling, produzione visuale e sperimentazione di nuovi linguaggi.'
    }
  ]
};

export function flattenFileSystem(root: FileSystemItem = fileSystem): FileSystemItem[] {
  return [root, ...(root.children ?? []).flatMap((item) => flattenFileSystem(item))];
}

export function getFileSystemItemByPath(path: string): FileSystemItem | undefined {
  return flattenFileSystem().find((item) => item.path === path);
}
