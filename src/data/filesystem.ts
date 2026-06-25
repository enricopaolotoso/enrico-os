export type FileSystemItemType =
  | 'folder'
  | 'image'
  | 'video'
  | 'document'
  | 'pdf'
  | 'link'
  | 'note'
  | 'app';

export type FileSystemItem = {
  id: string;
  name: string;
  type: FileSystemItemType;
  path: string;
  icon?: string;
  thumbnail?: string;
  description?: string;
  url?: string;
  app?: string;
  children?: FileSystemItem[];
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
      description:
        'Guida rapida al portfolio: app, cartelle, progetti e scorciatoie per esplorare Enrico OS.'
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
          description:
            'Raviez è uno statement apparel brand nato nel 2023. Il progetto unisce prodotto, identità, community, contenuti e vendita online.'
        },
        {
          id: 'raviez-photo',
          name: 'raviez ok.jpg',
          type: 'image',
          path: '/Desktop/Raviez/raviez ok.jpg',
          thumbnail: '/photos/raviez%20ok.jpg',
          url: '/photos/raviez%20ok.jpg',
          description: 'Immagine dall’archivio visuale di Raviez.'
        },
        {
          id: 'raviez-results',
          name: 'Risultati.note',
          type: 'note',
          path: '/Desktop/Raviez/Risultati.note',
          description:
            'Circa 1.600 magliette vendute e una community Instagram cresciuta fino a circa 7.000 follower.'
        },
        {
          id: 'raviez-shop',
          name: 'Raviez online',
          type: 'link',
          path: '/Desktop/Raviez/Raviez online',
          icon: '↗',
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
          description:
            'In Netmarket Enrico lavora su web design, WooCommerce, SEO, branding, contenuti e marketing digitale.'
        },
        {
          id: 'netmarket-app',
          name: 'Progetti.app',
          type: 'app',
          path: '/Desktop/Netmarket/Progetti.app',
          icon: 'P',
          app: 'projects',
          description: 'Apre l’app Progetti del portfolio.'
        },
        {
          id: 'netmarket-link',
          name: 'netmarket.it',
          type: 'link',
          path: '/Desktop/Netmarket/netmarket.it',
          icon: '↗',
          url: 'https://www.netmarket.it',
          description: 'Sito ufficiale di Netmarket.'
        }
      ]
    },
    {
      id: 'creator-archive',
      name: 'Creator Archive',
      type: 'folder',
      path: '/Desktop/Creator Archive',
      description:
        'Archivio di contenuti, video, format social e sperimentazioni creative dal 2014 a oggi.',
      children: [
        {
          id: 'fire-filter-video',
          name: 'Fire Filter.mp4',
          type: 'video',
          path: '/Desktop/Creator Archive/Fire Filter.mp4',
          thumbnail: '/images/filtri-fire.jpg',
          url: '/images/fire-filter.mp4',
          description: 'Video dimostrativo di uno dei filtri Instagram realizzati da Enrico.'
        },
        {
          id: 'youtube-2016',
          name: 'youtube_2016',
          type: 'link',
          path: '/Desktop/Creator Archive/youtube_2016',
          thumbnail: '/images/copertina-video.jpg',
          url: 'https://youtu.be/hTxmt7l1pao',
          description: 'Uno dei primi video YouTube pubblicati da Enrico nel 2016.'
        },
        {
          id: 'creator-podcast',
          name: 'podcast breccia.jpg',
          type: 'image',
          path: '/Desktop/Creator Archive/podcast breccia.jpg',
          thumbnail: '/photos/podcast%20breccia.jpg',
          url: '/photos/podcast%20breccia.jpg',
          description: 'Foto dall’archivio podcast e produzione contenuti.'
        },
        {
          id: 'creator-timeline',
          name: 'Timeline.note',
          type: 'note',
          path: '/Desktop/Creator Archive/Timeline.note',
          description:
            '2014: primi video YouTube. 2018: filtri Instagram. 2020: TikTok. Oggi: contenuti, brand e progetti digitali.'
        },
        {
          id: 'youtube-channel',
          name: 'Canale YouTube',
          type: 'link',
          path: '/Desktop/Creator Archive/Canale YouTube',
          icon: '▶',
          url: 'https://youtube.com/@enricopaolotoso',
          description: 'Canale YouTube personale di Enrico Toso.'
        }
      ]
    },
    {
      id: 'ai-workflows',
      name: 'AI Workflows',
      type: 'folder',
      path: '/Desktop/AI Workflows',
      description:
        'Flussi di lavoro AI per ricerca, strategia, contenuti, automazioni e produttività.',
      children: [
        {
          id: 'ai-manifesto',
          name: 'AI Workflow.note',
          type: 'note',
          path: '/Desktop/AI Workflows/AI Workflow.note',
          description:
            'L’intelligenza artificiale viene usata come leva operativa per accelerare ricerca, ideazione, produzione e analisi.'
        },
        {
          id: 'ai-notes-app',
          name: 'Note.app',
          type: 'app',
          path: '/Desktop/AI Workflows/Note.app',
          icon: 'N',
          app: 'notes',
          description: 'Apre l’app Note del portfolio.'
        },
        {
          id: 'ai-process',
          name: 'Processo.md',
          type: 'document',
          path: '/Desktop/AI Workflows/Processo.md',
          icon: 'MD',
          description:
            'Ricerca → struttura → produzione → revisione umana → pubblicazione → misurazione.'
        }
      ]
    },
    {
      id: 'ecommerce-builds',
      name: 'Ecommerce Builds',
      type: 'folder',
      path: '/Desktop/Ecommerce Builds',
      description:
        'Siti, e-commerce, customer journey, WordPress, WooCommerce e sviluppo digitale.',
      children: [
        {
          id: 'ecommerce-stack',
          name: 'Stack.md',
          type: 'document',
          path: '/Desktop/Ecommerce Builds/Stack.md',
          icon: 'MD',
          description:
            'WordPress, WooCommerce, Elementor, analytics, SEO tecnica e ottimizzazione della customer journey.'
        },
        {
          id: 'ecommerce-case',
          name: 'Ecommerce.case.pdf',
          type: 'pdf',
          path: '/Desktop/Ecommerce Builds/Ecommerce.case.pdf',
          icon: 'PDF',
          description:
            'Placeholder per un case study PDF dedicato alla progettazione e crescita di un e-commerce.'
        },
        {
          id: 'ecommerce-photo',
          name: 'primo e ultimo market.jpg',
          type: 'image',
          path: '/Desktop/Ecommerce Builds/primo e ultimo market.jpg',
          thumbnail: '/photos/primo%20e%20ultimo%20market.jpg',
          url: '/photos/primo%20e%20ultimo%20market.jpg',
          description: 'Immagine dall’archivio di progetti e mercati.'
        }
      ]
    },
    {
      id: 'contact-mail',
      name: 'Contact.mail',
      type: 'app',
      path: '/Desktop/Contact.mail',
      icon: '✉',
      app: 'mail',
      description:
        'Contatta direttamente Enrico Toso tramite il form email integrato nel portfolio.'
    }
  ]
};

export function flattenFileSystem(root: FileSystemItem = fileSystem): FileSystemItem[] {
  return [root, ...(root.children ?? []).flatMap((item) => flattenFileSystem(item))];
}

export function getFileSystemItemByPath(path: string): FileSystemItem | undefined {
  return flattenFileSystem().find((item) => item.path === path);
}
