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
  link?: string;
  external?: boolean;
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
      id: 'youtube-2016',
      name: 'youtube2016.mp4',
      type: 'link',
      path: '/Desktop/youtube2016.mp4',
      thumbnail: '/images/copertina-video.jpg',
      url: 'https://youtu.be/hTxmt7l1pao',
      external: true,
      description: 'Uno dei primi video YouTube pubblicati da Enrico nel 2016.'
    },
    {
      id: 'joylife',
      name: 'joylife.jpg',
      type: 'image',
      path: '/Desktop/joylife.jpg',
      thumbnail: '/images/joylife.jpg',
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
      url: '/images/filtri-mm.jpg',
      description:
        'Progetto di filtri Instagram realizzati per locali, eventi e brand: uno dei primi servizi digitali commerciali sviluppati da Enrico.'
    },
    {
      id: 'cir-come-nella-vita',
      name: 'cir-comenellavita.jpg',
      type: 'image',
      path: '/Desktop/cir-comenellavita.jpg',
      thumbnail: '/images/cir-comenellavita.jpg',
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
