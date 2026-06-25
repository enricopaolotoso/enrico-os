export const site = {
  name: 'Enrico Paolo Toso',
  shortName: 'Enrico',
  title: 'Enrico Paolo Toso | Digital Builder',
  description: 'Portfolio personale di Enrico Paolo Toso, digital builder a Padova. Branding, web, e-commerce, contenuti, AI e progetti digitali.',
  url: 'https://www.enricopaolotoso.it',
  email: null as string | null,
  location: 'Padova, Veneto',
  role: 'Digital Builder',
  socials: {
    instagram: null,
    tiktok: null,
    linkedin: null,
    youtube: null,
    raviez: null,
    netmarket: null
  } as Record<string, string | null>,
  intro: {
    headline: 'Portfolio personale, reimmaginato come un desktop Mac.',
    text: 'Ogni app, cartella e file apre una parte diversa di ciò che costruisco: brand, siti web, contenuti, e-commerce, AI e progetti digitali.'
  },
  desktopItems: [
    { id: 'readme', title: 'README.md', type: 'document', app: 'readme', x: 52, y: 350 },
    { id: 'raviez', title: 'Raviez', type: 'folder', app: 'finder', x: 170, y: 90 },
    { id: 'netmarket', title: 'Netmarket.app', type: 'appfile', app: 'finder', x: 340, y: 110 },
    { id: 'tiktok', title: 'TikTok_5M.mov', type: 'video', app: 'photos', x: 580, y: 70 },
    { id: 'filters', title: 'Instagram Filters', type: 'folder', app: 'finder', x: 820, y: 120 },
    { id: 'youtube', title: 'YouTube Archive', type: 'folder', app: 'finder', x: 1040, y: 85 },
    { id: 'branding', title: 'Branding.case', type: 'pdf', app: 'finder', x: 250, y: 360 },
    { id: 'ecommerce', title: 'E-commerce Builds', type: 'folder', app: 'finder', x: 720, y: 360 },
    { id: 'ai', title: 'AI Workflows.note', type: 'note', app: 'notes', x: 1010, y: 350 }
  ],
  projects: [
    {
      name: 'Raviez',
      kind: 'Brand DTC',
      date: '2023 — oggi',
      description: 'Statement apparel brand nato come laboratorio reale su branding, community, contenuto e vendita online.',
      stats: ['~1.600 magliette vendute', '~7.000 follower Instagram', 'Focus: produzione, marginalità, community']
    },
    {
      name: 'Netmarket',
      kind: 'Agenzia digitale',
      date: 'Operatività attuale',
      description: 'Ambiente in cui lavoro su branding, siti web, e-commerce, social content, ADV e strategie digitali per aziende.',
      stats: ['Web design', 'WooCommerce', 'SEO', 'Branding', 'Marketing']
    },
    {
      name: 'JoyLife',
      kind: 'Progetto digitale/community',
      date: 'Sperimentazione',
      description: 'Spazio di sperimentazione su contenuti, eventi, community e opportunità digitali.',
      stats: ['Community', 'Contenuti', 'Eventi', 'Sperimentazione']
    },
    {
      name: 'Creator Archive',
      kind: 'Archivio contenuti',
      date: '2014 — oggi',
      description: 'Dai primi video YouTube ai contenuti TikTok con milioni di visualizzazioni.',
      stats: ['Video TikTok da 5M views', 'Account cresciuto fino a ~15K follower', 'Editing, storytelling, format']
    }
  ],
  notes: [
    {
      id: 'about',
      folder: 'Profilo',
      title: 'Chi è Enrico',
      body: `Enrico Paolo Toso è un digital builder di Padova.\n\nCostruisce progetti digitali unendo branding, contenuti, sviluppo web, marketing e AI.\n\nNon lavora su una singola disciplina: il suo focus è progettare sistemi completi, dove identità, prodotto, comunicazione e distribuzione funzionano insieme.`
    },
    {
      id: 'manifesto',
      folder: 'Profilo',
      title: 'Manifesto operativo',
      body: `Costruire prima di parlare.\n\nTestare prima di teorizzare.\n\nUnire estetica, business e distribuzione.\n\nCercare progetti con potenziale reale, non solo idee interessanti.`
    },
    {
      id: 'timeline',
      folder: 'Archivio',
      title: 'Timeline',
      body: `2014 — Primi contenuti su YouTube.\n2018 — Filtri Instagram per locali, eventi e brand.\n2020 — Sperimentazioni TikTok e contenuti social.\n2021 — Branding e progetti web.\n2023 — Lancio Raviez.\nOggi — Brand, siti, contenuti, AI e progetti digitali.`
    },
    {
      id: 'principles',
      folder: 'Profilo',
      title: 'Principi',
      body: `Libertà.\nCostruzione.\nCrescita.\n\nIl denaro è una leva, non il fine.\nLa creatività conta solo se diventa sistema.\nLa velocità conta solo se produce direzione.`
    }
  ],
  modules: [
    { name: 'Brand Strategy', value: 86, text: 'Naming, posizionamento, identità visiva, architettura del messaggio.' },
    { name: 'Web & E-commerce', value: 84, text: 'WordPress, WooCommerce, Elementor, customer journey, CRO base.' },
    { name: 'Content Creation', value: 86, text: 'Video, foto, montaggio, format social, storytelling e community.' },
    { name: 'Digital Marketing', value: 78, text: 'Funnel, acquisizione, social, advertising, analisi e ottimizzazione.' },
    { name: 'AI Workflow', value: 80, text: 'Ricerca, ideazione, automazione, sistemi di contenuto e produttività.' },
    { name: 'Problem Solving', value: 90, text: 'Soluzioni pragmatiche, apprendimento veloce e capacità di esecuzione.' }
  ]
};
