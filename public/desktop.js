(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const appNames = {
    desktop: 'Desktop',
    finder: 'Finder',
    projects: 'Progetti',
    notes: 'Note',
    photos: 'Foto',
    mail: 'Mail',
    terminal: 'Terminale',
    settings: 'Informazioni',
    spotify: 'Spotify',
    preview: 'Anteprima',
    quicktime: 'QuickTime Player',
    safari: 'Safari',
    launchpad: 'Launchpad',
    trash: 'Cestino'
  };

  const tourSteps = [
    {
      id: 'welcome',
      target: null,
      placement: 'center',
      title: 'Benvenuto',
      text: 'Questo sito funziona come un desktop interattivo. Puoi aprire app, cartelle e file come su un computer personale.'
    },
    {
      id: 'readme',
      target: '[data-tour-target="readme"]',
      placement: 'right',
      title: 'README.md',
      text: 'Da qui puoi leggere una panoramica rapida su chi sono, cosa faccio e come ho organizzato il sito.'
    },
    {
      id: 'finder',
      target: '[data-tour-target="finder"]',
      placement: 'right',
      title: 'Finder',
      text: 'Apri Finder per esplorare cartelle, progetti, immagini, documenti e contenuti.'
    },
    {
      id: 'dock',
      target: '[data-tour-target="dock"]',
      placement: 'top',
      title: 'Dock',
      text: 'Il Dock ti permette di aprire rapidamente le app principali del sito.'
    },
    {
      id: 'mail',
      target: '[data-tour-target="mail"]',
      placement: 'top',
      title: 'Contatti',
      text: 'Apri Mail per contattarmi direttamente dal sito. Da qui puoi inviarmi un messaggio in modo rapido.'
    }
  ];

  let zIndex = 40;
  let tourIndex = 0;
  let dragState = null;
  let focusBeforeModal = null;
  let renderFinderRecent = () => {};
  let navigateFinder = () => {};

  const fileSystem = (() => {
    try {
      return JSON.parse($('#filesystem-data')?.textContent || '{}');
    } catch {
      return {};
    }
  })();

  function walkFileSystem(item, collection = []) {
    if (!item?.id) return collection;
    collection.push(item);
    (item.children || []).forEach((child) => walkFileSystem(child, collection));
    return collection;
  }

  const fileSystemItems = walkFileSystem(fileSystem);

  function getItemById(id) {
    return fileSystemItems.find((item) => item.id === id) || null;
  }

  function getItemByPath(path) {
    return fileSystemItems.find((item) => item.path === path) || null;
  }

  function itemTypeLabel(type) {
    return {
      folder: 'Cartella',
      image: 'Immagine',
      video: 'Video',
      document: 'Documento',
      pdf: 'PDF',
      link: 'Collegamento',
      note: 'Nota',
      app: 'Applicazione',
      audio: 'Audio',
      playlist: 'Playlist'
    }[type] || 'File';
  }

  function itemMark(item) {
    if (item.icon) return item.icon;
    return {
      folder: '▣',
      image: 'IMG',
      video: '▶',
      document: 'DOC',
      pdf: 'PDF',
      link: '↗',
      note: 'Nota',
      app: 'APP'
    }[item.type] || 'FILE';
  }

  function isMarkdownItem(item) {
    return item?.type === 'document' &&
      (item.mimeType === 'text/markdown' || item.name.toLowerCase().endsWith('.md'));
  }

  const recentStorageKey = 'enrico-finder-recent';

  function readRecentIds() {
    try {
      const value = JSON.parse(localStorage.getItem(recentStorageKey) || '[]');
      return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  function recordRecent(id) {
    if (!id) return;
    const recent = readRecentIds().filter((entry) => entry !== id);
    recent.unshift(id);
    try {
      localStorage.setItem(recentStorageKey, JSON.stringify(recent.slice(0, 12)));
    } catch {
      // Storage may be unavailable.
    }
    renderFinderRecent();
  }

  function isMobile() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function getWindow(id) {
    return id ? $(`[data-window="${id}"]`) : null;
  }

  function getAppId(win) {
    return win?.dataset.window || '';
  }

  function getOpenWindows() {
    return $$('.mac-window.is-open:not(.is-minimized):not(.is-minimizing)');
  }

  function topWindow() {
    return getOpenWindows().sort(
      (a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0)
    )[0] || null;
  }

  function setActiveApp(id) {
    const activeName = $('#activeAppName');
    if (activeName) activeName.textContent = appNames[id] || 'Desktop';
  }

  function updateDockState() {
    $$('.dock-item').forEach((item) => {
      const win = getWindow(item.dataset.open);
      const active = Boolean(
        win &&
        win.classList.contains('is-open') &&
        !win.classList.contains('is-minimized')
      );
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function layoutMobileWindows() {
    const windows = getOpenWindows().sort(
      (a, b) => Number(a.style.zIndex || 0) - Number(b.style.zIndex || 0)
    );

    windows.forEach((win, index) => {
      win.style.setProperty('--mobile-stack-x', `${Math.min(index, 4) * 5}px`);
      win.style.setProperty('--mobile-stack-y', `${Math.min(index, 4) * 14}px`);
    });
  }

  function focusWindow(win) {
    if (!win) return;
    $$('.mac-window').forEach((item) => item.classList.remove('is-focused'));
    win.classList.remove('is-minimized');
    win.classList.add('is-focused');
    win.style.zIndex = String(++zIndex);
    setActiveApp(getAppId(win));
    updateDockState();
    if (isMobile()) layoutMobileWindows();
  }

  function ensurePhotoImagesLoaded(win) {
    $$('[data-photo-image]', win).forEach((image) => {
      image.loading = 'eager';
      if (image.complete && image.naturalWidth > 0) return;

      const source = image.getAttribute('src');
      if (!source) return;
      image.removeAttribute('src');
      window.requestAnimationFrame(() => {
        image.src = source;
      });
    });
  }

  function openPreview(item) {
    const preview = getWindow('preview');
    if (!preview) return;
    const media = $('[data-preview-media]', preview);
    const openLink = $('[data-preview-open]', preview);
    const markdownDocument =
      item.type === 'document' && item.name.toLowerCase().endsWith('.md');
    const mediaPreview = item.type === 'image';
    preview.classList.toggle('is-markdown', markdownDocument);
    preview.classList.toggle('is-media', mediaPreview);
    media.replaceChildren();

    $('[data-preview-window-title]', preview).textContent = item.name;
    $('[data-preview-title]', preview).textContent = item.name;
    $('[data-preview-type]', preview).textContent = itemTypeLabel(item.type);
    $('[data-preview-description]', preview).textContent =
      item.description || 'Nessuna descrizione disponibile.';

    if (markdownDocument) {
      const documentView = document.createElement('article');
      documentView.className = 'markdown-preview-document';
      const content = document.createElement('pre');
      content.textContent = item.content || item.description || 'Contenuto in preparazione.';
      documentView.appendChild(content);
      media.appendChild(documentView);
    } else if (item.type === 'image' && (item.url || item.thumbnail)) {
      const image = document.createElement('img');
      image.src = item.url || item.thumbnail;
      image.alt = item.name;
      image.loading = 'eager';
      media.appendChild(image);
    } else if (item.type === 'pdf' && item.url) {
      const object = document.createElement('object');
      object.data = item.url;
      object.type = 'application/pdf';
      object.setAttribute('aria-label', item.name);
      media.appendChild(object);
    } else {
      const documentView = document.createElement('article');
      documentView.className = 'generic-preview-document';
      const heading = document.createElement('h3');
      heading.textContent = item.name;
      const body = document.createElement('p');
      body.textContent = item.content || item.description || 'Contenuto in preparazione.';
      documentView.append(heading, body);
      media.appendChild(documentView);
    }

    const mediaLink =
      item.link ||
      (mediaPreview && item.thumbnail && item.url !== item.thumbnail && /^https?:/i.test(item.url)
        ? item.url
        : '');
    const previewLink = mediaPreview ? mediaLink : item.url;
    openLink.hidden = !previewLink;
    if (previewLink) openLink.href = previewLink;
    openWindow('preview', false);
  }

  function openQuickTime(item) {
    const quicktime = getWindow('quicktime');
    if (!quicktime) return;
    const video = $('[data-quicktime-video]', quicktime);
    const poster = $('[data-quicktime-poster]', quicktime);
    const unavailable = $('[data-quicktime-unavailable]', quicktime);
    const openLink = $('[data-quicktime-open]', quicktime);
    const playable = Boolean(item.url && /\.(mp4|webm|ogg)(?:$|[?#])/i.test(item.url));
    const videoLink = item.link || (!playable ? item.url : '');

    video.pause();
    video.removeAttribute('src');
    video.removeAttribute('poster');
    video.load();
    video.hidden = !playable;
    poster.hidden = true;
    unavailable.hidden = playable || Boolean(item.thumbnail);

    if (playable) {
      video.src = item.url;
      if (item.thumbnail) video.poster = item.thumbnail;
      video.load();
    } else if (item.thumbnail) {
      poster.src = item.thumbnail;
      poster.alt = item.name;
      poster.hidden = false;
    }

    $('[data-quicktime-window-title]', quicktime).textContent = item.name;
    $('[data-quicktime-description]', quicktime).textContent =
      item.description || 'Video dal mio archivio.';
    openLink.hidden = !videoLink;
    if (videoLink) openLink.href = videoLink;
    openWindow('quicktime', false);
  }

  function openSafari(item) {
    const safari = getWindow('safari');
    if (!safari) return;
    $('[data-safari-title]', safari).textContent = item.name;
    $('[data-safari-description]', safari).textContent =
      item.description || 'Collegamento esterno.';
    $('[data-safari-address]', safari).textContent = item.url || 'https://';
    const openLink = $('[data-safari-open]', safari);
    openLink.href = item.url || '#';
    openLink.hidden = !item.url;
    openWindow('safari', false);
  }

  function openFinder(path = '/Desktop') {
    openWindow('finder', false);
    navigateFinder(path, true);
  }

  function openItem(id) {
    const item = getItemById(id);
    if (!item) return;
    recordRecent(item.id);

    if (item.type === 'folder') {
      openFinder(item.path);
    } else if (item.type === 'note') {
      openNoteItem(item);
    } else if (item.type === 'image' || item.type === 'pdf' || item.type === 'document') {
      openPreview(item);
    } else if (item.type === 'video') {
      if (item.external && item.url) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      } else {
        openQuickTime(item);
      }
    } else if (item.type === 'link') {
      if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
    } else if (item.type === 'audio' || item.type === 'playlist') {
      if (item.url) openSafari(item);
      else openPreview(item);
    } else if (item.type === 'app' && item.app) {
      openWindow(item.app, false);
    }
  }

  window.enricoFileSystem = {
    getItemById,
    getItemByPath,
    openItem,
    openFinder
  };

  function openWindow(id, trackRecent = true) {
    if (!id) return;
    const win = getWindow(id);
    if (!win) return;
    const wasOpen = win.classList.contains('is-open');

    if (id !== 'launchpad') closeLaunchpad(false);
    win.classList.remove('is-closing', 'is-minimized', 'is-minimizing');
    win.classList.add('is-open');
    win.setAttribute('aria-hidden', 'false');

    focusWindow(win);
    if (trackRecent && id !== 'finder') recordRecent(`app-${id}`);

    if (id === 'photos') {
      ensurePhotoImagesLoaded(win);
    }

    if (id === 'notes' && !wasOpen) {
      win.dispatchEvent(new CustomEvent('notes:show-library'));
    }

    if (id === 'terminal') {
      window.setTimeout(() => $('[data-terminal-input]', win)?.focus(), 50);
    }

    if (id === 'launchpad') {
      window.setTimeout(() => $('[data-launchpad-search]', win)?.focus(), 30);
    }
  }

  function closeWindow(win) {
    if (!win || !win.classList.contains('is-open')) return;
    if (getAppId(win) === 'quicktime') {
      $('[data-quicktime-video]', win)?.pause();
    }
    win.classList.remove('is-focused');
    win.classList.add('is-closing');

    window.setTimeout(() => {
      win.classList.remove('is-open', 'is-closing', 'is-minimized', 'is-maximized');
      win.style.zIndex = '';
      win.setAttribute('aria-hidden', 'true');
      const next = topWindow();
      if (next) focusWindow(next);
      else setActiveApp('desktop');
      updateDockState();
      if (isMobile()) layoutMobileWindows();
    }, 150);
  }

  function minimizeWindow(win) {
    if (!win) return;
    win.classList.remove('is-focused');
    win.classList.add('is-minimizing');
    win.setAttribute('aria-hidden', 'true');
    const next = topWindow();
    if (next) focusWindow(next);
    else setActiveApp('desktop');
    updateDockState();
    if (isMobile()) layoutMobileWindows();

    window.setTimeout(() => {
      win.classList.remove('is-minimizing');
      win.classList.add('is-minimized');
      updateDockState();
      if (isMobile()) layoutMobileWindows();
    }, 170);
  }

  function maximizeWindow(win) {
    if (!win) return;
    win.classList.toggle('is-maximized');
    focusWindow(win);
  }

  function closeLaunchpad(restoreFocus = true) {
    const launchpad = getWindow('launchpad');
    if (!launchpad?.classList.contains('is-open')) return;
    launchpad.classList.remove('is-open', 'is-focused', 'is-minimized', 'is-minimizing', 'is-maximized');
    launchpad.style.zIndex = '';
    launchpad.setAttribute('aria-hidden', 'true');
    setActiveApp(getAppId(topWindow()) || 'desktop');
    if (restoreFocus && focusBeforeModal instanceof HTMLElement) focusBeforeModal.focus();
    updateDockState();
  }

  function closeTopLayer() {
    const tour = $('#tour.is-visible');
    if (tour) {
      closeTour();
      return;
    }
    const photoViewer = $('[data-photo-viewer]:not([hidden])');
    if (photoViewer) {
      photoViewer.hidden = true;
      const image = $('[data-photo-viewer-image]', photoViewer);
      image?.removeAttribute('src');
      return;
    }
    if ($('#windowLayer .launchpad.is-open')) {
      closeLaunchpad();
      return;
    }
    closeWindow(topWindow());
  }

  function renderTour() {
    const step = tourSteps[tourIndex];
    const tour = $('#tour');
    if (!tour) return;

    const popover = $('[data-tour-popover]', tour);
    const highlight = $('[data-tour-highlight]', tour);
    if (!popover || !highlight || !step) return;

    $('[data-tour-title]', tour).textContent = step.title;
    $('[data-tour-body]', tour).textContent = step.text || step.body || '';
    $('[data-tour-step]', tour).textContent = `${tourIndex + 1} / ${tourSteps.length}`;

    const back = $('[data-tour-back]', tour);
    const next = $('[data-tour-next]', tour);
    back.disabled = tourIndex === 0;
    next.textContent = tourIndex === tourSteps.length - 1 ? 'Fine' : 'Avanti';

    positionTourStep();
  }

  function validTourRect(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const visible =
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth;
    return visible ? rect : null;
  }

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  }

  function getTourTarget(step) {
    if (!step?.target) return null;
    const element = $(step.target);
    const rect = validTourRect(element);
    if (!rect && element instanceof HTMLElement && isMobile()) {
      element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    }
    return rect ? { element, rect } : null;
  }

  function positionTourStep() {
    const tour = $('#tour.is-visible');
    if (!tour) return;
    const step = tourSteps[tourIndex];
    const popover = $('[data-tour-popover]', tour);
    const highlight = $('[data-tour-highlight]', tour);
    if (!step || !popover || !highlight) return;

    const gap = 16;
    const margin = 16;
    const padding = 10;
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const target = getTourTarget(step);
    const popoverRect = popover.getBoundingClientRect();
    const popoverWidth = popoverRect.width || Math.min(430, window.innerWidth - margin * 2);
    const popoverHeight = popoverRect.height || 240;

    if (target) {
      const rect = target.rect;
      tour.classList.add('has-target');
      highlight.hidden = false;
      highlight.style.left = `${clamp(rect.left - padding, 8, window.innerWidth - 16)}px`;
      highlight.style.top = `${clamp(rect.top - padding, 8, window.innerHeight - 16)}px`;
      highlight.style.width = `${Math.min(rect.width + padding * 2, window.innerWidth - 16)}px`;
      highlight.style.height = `${Math.min(rect.height + padding * 2, window.innerHeight - 16)}px`;
      highlight.style.borderRadius = `${Math.max(14, Math.min(28, rect.height / 5))}px`;
    } else {
      tour.classList.remove('has-target');
      highlight.hidden = true;
    }

    let left = (window.innerWidth - popoverWidth) / 2;
    let top = (window.innerHeight - popoverHeight) / 2;

    if (target && step.placement !== 'center') {
      const rect = target.rect;
      const mobilePreferredPlacement = (() => {
        if (!mobile) return step.placement;
        const canRight = rect.right + gap + popoverWidth <= window.innerWidth - margin;
        const canLeft = rect.left - gap - popoverWidth >= margin;
        const canBottom = rect.bottom + gap + popoverHeight <= window.innerHeight - margin;
        const canTop = rect.top - gap - popoverHeight >= margin;
        if (canRight) return 'right';
        if (canLeft) return 'left';
        if (canBottom) return 'bottom';
        if (canTop) return 'top';
        return rect.top + rect.height / 2 > window.innerHeight / 2 ? 'top' : 'bottom';
      })();

      if (mobilePreferredPlacement === 'top') {
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        top = rect.top - popoverHeight - gap;
      } else if (mobilePreferredPlacement === 'bottom') {
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        top = rect.bottom + gap;
      } else if (mobilePreferredPlacement === 'left') {
        left = rect.left - popoverWidth - gap;
        top = rect.top + rect.height / 2 - popoverHeight / 2;
      } else if (mobilePreferredPlacement === 'right') {
        left = rect.right + gap;
        top = rect.top + rect.height / 2 - popoverHeight / 2;
      }
    } else if (mobile && !target) {
      left = margin;
      top = window.innerHeight - popoverHeight - margin;
    }

    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      left = (window.innerWidth - popoverWidth) / 2;
      top = (window.innerHeight - popoverHeight) / 2;
    }

    popover.style.left = `${clamp(left, margin, window.innerWidth - popoverWidth - margin)}px`;
    popover.style.top = `${clamp(top, margin, window.innerHeight - popoverHeight - margin)}px`;
    popover.dataset.placement = target ? step.placement : 'center';
  }

  function openTour() {
    const tour = $('#tour');
    if (!tour) return;
    focusBeforeModal = document.activeElement;
    tourIndex = 0;
    tour.classList.add('is-visible');
    tour.setAttribute('aria-hidden', 'false');
    renderTour();
    window.setTimeout(() => {
      $('.tour-card', tour)?.focus();
      positionTourStep();
    }, 30);
  }

  function closeTour() {
    const tour = $('#tour');
    if (!tour) return;
    tour.classList.remove('is-visible');
    tour.setAttribute('aria-hidden', 'true');
    $('[data-tour-highlight]', tour)?.setAttribute('hidden', '');
    try {
      localStorage.setItem('enrico-desktop-tour-seen', '1');
      localStorage.setItem('enricoTourDismissed', 'true');
    } catch {
      // Storage may be unavailable in privacy mode.
    }
    if (focusBeforeModal instanceof HTMLElement) focusBeforeModal.focus();
  }

  function isMobileLocked() {
    const lockScreen = $('#mobileLockScreen');
    return Boolean(
      isMobile() &&
      lockScreen &&
      !lockScreen.classList.contains('is-unlocked')
    );
  }

  function initTour() {
    const tour = $('#tour');
    if (!tour) return;

    $('[data-tour-next]', tour)?.addEventListener('click', () => {
      if (tourIndex === tourSteps.length - 1) {
        closeTour();
        return;
      }
      tourIndex += 1;
      renderTour();
    });

    $('[data-tour-back]', tour)?.addEventListener('click', () => {
      tourIndex = Math.max(0, tourIndex - 1);
      renderTour();
    });

    $('[data-tour-skip]', tour)?.addEventListener('click', closeTour);

    const reposition = () => window.requestAnimationFrame(positionTourStep);
    window.addEventListener('resize', reposition);
    window.addEventListener('orientationchange', reposition);
    window.addEventListener('scroll', reposition, true);

    let seen = false;
    try {
      seen =
        localStorage.getItem('enrico-desktop-tour-seen') === '1' ||
        localStorage.getItem('enricoTourDismissed') === 'true';
    } catch {
      seen = false;
    }
    if (!seen) {
      if (isMobileLocked()) {
        window.addEventListener(
          'mobile-desktop-unlocked',
          () => window.setTimeout(openTour, 500),
          { once: true }
        );
      } else {
        window.setTimeout(openTour, 850);
      }
    }
  }

  function updateClock() {
    const clock = $('#clock');
    if (!clock) return;
    const now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = new Intl.DateTimeFormat('it-IT', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now).replace('.', '');
  }

  function updateMobileLockClock() {
    const time = $('#mobileLockTime');
    const date = $('#mobileLockDate');
    if (!time || !date) return;

    const now = new Date();
    time.dateTime = now.toISOString();
    time.textContent = new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);
    date.textContent = new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(now);
  }

  function initMobileLockScreen() {
    const lockScreen = $('#mobileLockScreen');
    if (!lockScreen) return;

    updateMobileLockClock();

    const unlock = () => {
      if (!isMobile() || lockScreen.classList.contains('is-unlocked')) return;
      lockScreen.classList.add('is-unlocked');
      lockScreen.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => {
        lockScreen.hidden = true;
        window.dispatchEvent(new CustomEvent('mobile-desktop-unlocked'));
      }, 430);
    };

    lockScreen.addEventListener('click', unlock);
    lockScreen.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        unlock();
      }
    });
  }

  function bindOpenActions() {
    document.addEventListener('click', (event) => {
      const urlTrigger = event.target.closest('[data-url]');
      if (urlTrigger) {
        event.stopPropagation();
        if (urlTrigger.closest('.launchpad')) closeLaunchpad(false);
        window.open(urlTrigger.dataset.url, '_blank', 'noopener,noreferrer');
        return;
      }

      const itemTrigger = event.target.closest('[data-item]');
      if (itemTrigger) {
        event.stopPropagation();
        closeMenuBarMenus();
        openItem(itemTrigger.dataset.item);
        return;
      }

      const trigger = event.target.closest('[data-open]');
      if (!trigger) return;
      if (trigger.classList.contains('desktop-item') || trigger.classList.contains('finder-file')) return;
      event.stopPropagation();
      const id = trigger.dataset.open;
      if (trigger.closest('.launchpad')) closeLaunchpad(false);
      closeMenuBarMenus();
      openWindow(id);
    });
  }

  function closeMenuBarMenus(except = null) {
    $$('.menu-group.is-open').forEach((group) => {
      if (group === except) return;
      group.classList.remove('is-open');
      $('.menu-trigger', group)?.setAttribute('aria-expanded', 'false');
    });
  }

  function bindMenuBar() {
    $$('.menu-group > .menu-trigger').forEach((trigger) => {
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');

      trigger.addEventListener('click', (event) => {
        const group = trigger.closest('.menu-group');
        if (!group) return;
        const willOpen = !group.classList.contains('is-open');
        event.stopPropagation();
        closeMenuBarMenus(group);
        group.classList.toggle('is-open', willOpen);
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    });

    document.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.menu-bar')) return;
      closeMenuBarMenus();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeMenuBarMenus();
    });

    $$('.menu-dropdown [role="menuitem"]').forEach((item) => {
      item.addEventListener('click', () => closeMenuBarMenus());
    });
  }

  function bindWindowControls() {
    document.addEventListener('click', (event) => {
      const close = event.target.closest('[data-close]');
      const minimize = event.target.closest('[data-minimize]');
      const maximize = event.target.closest('[data-maximize]');
      if (!close && !minimize && !maximize) return;
      event.stopPropagation();
      const win = event.target.closest('.mac-window');
      if (close) closeWindow(win);
      if (minimize) minimizeWindow(win);
      if (maximize) maximizeWindow(win);
    });

    $$('.mac-window').forEach((win) => {
      win.setAttribute('aria-hidden', win.classList.contains('is-open') ? 'false' : 'true');
      win.addEventListener('pointerdown', () => focusWindow(win));
    });
  }

  function bindMenuCommands() {
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-command], [data-action]');
      if (!button || button.disabled) return;
      event.stopPropagation();

      const command = button.dataset.command || button.dataset.action;
      if (command === 'close-active') closeTopLayer();
      if (command === 'open-tour') openTour();
      if (command === 'show-desktop') {
        getOpenWindows().forEach((win) => closeWindow(win));
        closeLaunchpad(false);
      }
      if (command === 'select-desktop') {
        $$('.desktop-item').forEach((item) => item.classList.add('is-selected'));
        window.setTimeout(
          () => $$('.desktop-item').forEach((item) => item.classList.remove('is-selected')),
          900
        );
      }
      if (command === 'copy-email') {
        const value = $('[data-copy]')?.dataset.copy;
        if (value) await copyText(value, button);
      }
      closeMenuBarMenus();
    });
  }

  function bindDesktopItems() {
    $$('.desktop-item').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        if (item.dataset.dragging === 'true') return;
        $$('.desktop-item').forEach((entry) => entry.classList.remove('is-selected'));
        item.classList.add('is-selected');
        if (isMobile()) {
          if (item.dataset.externalUrl) {
            window.open(item.dataset.externalUrl, '_blank', 'noopener,noreferrer');
            return;
          }
          openItem(item.dataset.itemId);
        }
      });

      item.addEventListener('dblclick', (event) => {
        if (isMobile() || item.dataset.dragging === 'true') return;
        event.stopPropagation();
        if (item.dataset.externalUrl) {
          window.open(item.dataset.externalUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        openItem(item.dataset.itemId);
      });
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.desktop-item')) {
        $$('.desktop-item').forEach((item) => item.classList.remove('is-selected'));
      }
    });
  }

  function bindDragWindows() {
    $$('.window-chrome, .mac-window-header').forEach((header) => {
      const win = header.closest('.mac-window');
      if (!win) return;

      header.addEventListener('pointerdown', (event) => {
        if (
          (event.pointerType === 'mouse' && event.button !== 0) ||
          event.target.closest('button, input, textarea, select, a, label') ||
          win.classList.contains('is-maximized')
        ) return;

        focusWindow(win);
        event.stopPropagation();
        const rect = win.getBoundingClientRect();
        const layerRect = $('#windowLayer').getBoundingClientRect();
        const mobile = isMobile();
        dragState = {
          win,
          pointerId: event.pointerId,
          mobile,
          startX: event.clientX,
          startY: event.clientY,
          startLeft: rect.left,
          startTop: rect.top,
          mobileX: Number.parseFloat(
            getComputedStyle(win).getPropertyValue('--mobile-drag-x')
          ) || 0,
          mobileY: Number.parseFloat(
            getComputedStyle(win).getPropertyValue('--mobile-drag-y')
          ) || 0,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top,
          layerRect
        };
        header.setPointerCapture(event.pointerId);
        win.classList.add('is-dragging');
        event.preventDefault();
      });

      header.addEventListener('pointermove', (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        const {
          win: dragged,
          mobile,
          startX,
          startY,
          startLeft,
          startTop,
          mobileX,
          mobileY,
          offsetX,
          offsetY,
          layerRect
        } = dragState;

        if (mobile) {
          const minLeft = 4;
          const minTop = layerRect.top + 4;
          const maxLeft = Math.max(minLeft, window.innerWidth - dragged.offsetWidth - 4);
          const maxTop = Math.max(minTop, window.innerHeight - dragged.offsetHeight - 4);
          const nextLeft = Math.max(
            minLeft,
            Math.min(startLeft + event.clientX - startX, maxLeft)
          );
          const nextTop = Math.max(
            minTop,
            Math.min(startTop + event.clientY - startY, maxTop)
          );
          dragged.style.setProperty('--mobile-drag-x', `${mobileX + nextLeft - startLeft}px`);
          dragged.style.setProperty('--mobile-drag-y', `${mobileY + nextTop - startTop}px`);
        } else {
          const maxX = layerRect.width - dragged.offsetWidth - 8;
          const maxY = layerRect.height - dragged.offsetHeight - 8;
          const left = Math.max(8, Math.min(event.clientX - layerRect.left - offsetX, maxX));
          const top = Math.max(8, Math.min(event.clientY - layerRect.top - offsetY, maxY));
          dragged.style.left = `${left}px`;
          dragged.style.top = `${top}px`;
        }

        event.preventDefault();
      });

      const endDrag = (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        dragState.win.classList.remove('is-dragging');
        dragState = null;
        try {
          header.releasePointerCapture(event.pointerId);
        } catch {
          // Pointer capture may already have been released.
        }
      };
      header.addEventListener('pointerup', endDrag);
      header.addEventListener('pointercancel', endDrag);
      header.addEventListener('dblclick', (event) => {
        if (!isMobile() && !event.target.closest('button')) maximizeWindow(win);
      });
    });
  }

  function bindDragDesktopItems() {
    $$('.desktop-item').forEach((item) => {
      item.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (item.dataset.dragging === 'true') return;

        const rect = item.getBoundingClientRect();
        const desktop = $('.desktop-items');
        if (!desktop) return;
        const desktopRect = desktop.getBoundingClientRect();
        const start = { x: event.clientX, y: event.clientY };
        const offset = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        const baseLeft = rect.left - desktopRect.left;
        const baseTop = rect.top - desktopRect.top;
        const maxLeft = Math.max(0, desktopRect.width - rect.width);
        const maxTop = Math.max(0, desktopRect.height - rect.height);
        let nextLeft = clamp(baseLeft, 0, maxLeft);
        let nextTop = clamp(baseTop, 0, maxTop);
        let frame = 0;
        let moved = false;

        const paint = () => {
          frame = 0;
          item.style.transform = `translate3d(${nextLeft - baseLeft}px, ${nextTop - baseTop}px, 0)`;
        };

        const schedulePaint = () => {
          if (!frame) frame = window.requestAnimationFrame(paint);
        };

        const startDragging = () => {
          if (moved) return;
          moved = true;
          item.dataset.dragging = 'true';
          item.classList.add('is-dragging');
          item.style.willChange = 'transform';
          item.style.right = 'auto';
          $$('.desktop-item').forEach((entry) => entry.classList.remove('is-selected'));
          item.classList.add('is-selected');
        };

        item.setPointerCapture(event.pointerId);

        const onMove = (moveEvent) => {
          if (moveEvent.pointerId !== event.pointerId) return;
          const distance = Math.hypot(
            moveEvent.clientX - start.x,
            moveEvent.clientY - start.y
          );
          if (!moved && distance < 6) return;

          startDragging();
          nextLeft = clamp(moveEvent.clientX - desktopRect.left - offset.x, 0, maxLeft);
          nextTop = clamp(moveEvent.clientY - desktopRect.top - offset.y, 0, maxTop);
          schedulePaint();
          moveEvent.preventDefault();
        };

        const endDrag = (endEvent) => {
          if (endEvent.pointerId !== event.pointerId) return;
          item.removeEventListener('pointermove', onMove);
          item.removeEventListener('pointerup', endDrag);
          item.removeEventListener('pointercancel', endDrag);
          if (frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
          }
          try {
            item.releasePointerCapture(event.pointerId);
          } catch {
            // Pointer capture may already have been released.
          }
          if (moved) {
            item.style.left = `${nextLeft}px`;
            item.style.top = `${nextTop}px`;
            item.style.transform = '';
            item.style.willChange = '';
            void item.offsetWidth;
            item.classList.remove('is-dragging');
            window.setTimeout(() => delete item.dataset.dragging, 160);
          } else {
            item.classList.remove('is-dragging');
          }
        };

        item.addEventListener('pointermove', onMove);
        item.addEventListener('pointerup', endDrag);
        item.addEventListener('pointercancel', endDrag);
      });
    });
  }

  function bindKeyboard() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeTopLayer();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'w') {
        event.preventDefault();
        closeTopLayer();
      }

      const modal = $('#tour.is-visible') || $('.launchpad.is-open');
      if (event.key === 'Tab' && modal) {
        const focusable = $$('button:not([disabled]), input:not([disabled]), [tabindex="0"]', modal)
          .filter((element) => !element.hidden);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  async function copyText(value, button) {
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = 'Copiato';
    } catch {
      button.textContent = 'Copia non riuscita';
    }
    window.setTimeout(() => {
      button.textContent = original;
    }, 1300);
  }

  function bindCopyButtons() {
    $$('[data-copy]').forEach((button) => {
      button.addEventListener('click', () => copyText(button.dataset.copy, button));
    });
  }

  function bindContactForm() {
    const form = $('[data-contact-form]');
    if (!form) return;
    const status = $('[data-contact-status]', form);
    if (!status) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const submit = $('button[type="submit"]', form);
      const originalText = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Invio in corso…';
      status.className = 'contact-form-status';
      status.textContent = '';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: {
            Accept: 'application/json'
          },
          body: new FormData(form)
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'Invio non riuscito');
        }

        form.reset();
        status.classList.add('is-success');
        status.textContent = 'Messaggio inviato. Grazie, ti risponderò appena possibile.';
      } catch {
        status.classList.add('is-error');
        status.textContent = 'Non è stato possibile inviare il messaggio. Riprova tra poco oppure scrivi a enricopaolotoso@gmail.com.';
      } finally {
        submit.disabled = false;
        submit.textContent = originalText;
      }
    });
  }

  function bindTerminal() {
    const input = $('[data-terminal-input]');
    const output = $('[data-terminal-output]');
    const prompt = input?.closest('.terminal-prompt');
    if (!input || !output || !prompt) return;

    const history = [];
    let historyIndex = 0;
    const commandNames = [
      'help',
      'about',
      'skills',
      'projects',
      'raviez',
      'netmarket',
      'contact',
      'open',
      'ls',
      'pwd',
      'whoami',
      'date',
      'clear',
      'one-more-thing',
      'sudo',
      'matrix'
    ];

    const print = (text, className = 'terminal-response') => {
      const line = document.createElement('p');
      line.className = `terminal-line ${className}`;
      line.textContent = text;
      prompt.before(line);
      output.scrollTop = output.scrollHeight;
      return line;
    };

    const commandHandlers = {
      help: () => [
        'Comandi disponibili:',
        'about, skills, projects, raviez, netmarket, contact',
        'open finder|mail|notes|photos|spotify|projects',
        'ls, pwd, whoami, date, clear',
        '',
        'Easter egg: one-more-thing, sudo make me famous, matrix'
      ].join('\n'),
      about: () => 'Sono Enrico Paolo Toso, digital builder a Milano e Padova. Unisco brand, contenuto, web, marketing e AI.',
      skills: () => [
        'Core stack:',
        '- brand strategy',
        '- web design ed e-commerce',
        '- content creation',
        '- performance marketing',
        '- AI workflow e automazioni'
      ].join('\n'),
      projects: () => {
        openWindow('projects');
        return 'Apro Progetti.app...';
      },
      raviez: () => 'Raviez è un brand DTC costruito come laboratorio reale su identità, community, contenuto e vendita online.',
      netmarket: () => 'Netmarket è l’ambiente operativo dedicato a branding, siti, e-commerce, contenuti e strategie digitali.',
      contact: () => {
        openWindow('mail');
        return 'Apro Mail... Puoi scrivermi direttamente da lì.';
      },
      ls: () => 'README.md  Raviez/  Netmarket/  youtube2016.mp4  intervista podcast  joylife.jpg  filtri-mm.jpg',
      pwd: () => '/Users/enrico/portfolio',
      whoami: () => 'enrico-paolo-toso',
      date: () => new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(new Date()),
      'one-more-thing': () => 'Stay hungry. Stay building.',
      matrix: () => [
        '01100101 01101110 01110010 01101001 01100011 01101111',
        'Wake up, builder.',
        'Il portfolio ha caricato il livello segreto.'
      ].join('\n')
    };

    function runOpen(target) {
      const aliases = {
        app: 'launchpad',
        apps: 'launchpad',
        finder: 'finder',
        mail: 'mail',
        notes: 'notes',
        note: 'notes',
        photos: 'photos',
        foto: 'photos',
        spotify: 'spotify',
        projects: 'projects',
        progetti: 'projects',
        terminal: 'terminal'
      };
      const app = aliases[target];
      if (!app) return 'Uso: open finder|mail|notes|photos|spotify|projects';
      openWindow(app);
      return `Apro ${appNames[app] || app}...`;
    }

    function runCommand(rawValue) {
      const [command, ...args] = rawValue.trim().toLowerCase().split(/\s+/);
      if (!command) return;

      print(`enrico@portfolio ~ % ${rawValue}`, 'terminal-command');

      if (command === 'clear') {
        $$('.terminal-line', output).forEach((line) => line.remove());
        return;
      }

      if (command === 'open') {
        print(runOpen(args[0]));
        return;
      }

      if (command === 'sudo') {
        const request = args.join(' ');
        print(request === 'make me famous'
          ? 'Permission granted. Output: costruisci qualcosa che merita attenzione.'
          : 'Non sono nel file sudoers. Aggiungo l’incidente al backlog.'
        );
        return;
      }

      const handler = commandHandlers[command];
      print(handler ? handler(args) : `Comando non trovato: ${command}. Digita "help".`);
    }

    output.addEventListener('pointerdown', () => input.focus());

    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!history.length) return;
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex];
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!history.length) return;
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || '';
        return;
      }

      if (event.key === 'Tab') {
        const value = input.value.trim().toLowerCase();
        const match = commandNames.find((command) => command.startsWith(value));
        if (value && match) {
          event.preventDefault();
          input.value = match;
        }
        return;
      }

      if (event.key !== 'Enter') return;
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      history.push(value);
      historyIndex = history.length;
      runCommand(value);
      input.value = '';
    });
  }

  function bindNotes() {
    const windowElement = getWindow('notes');
    if (!windowElement) return;
    const notes = $$('[data-note]', windowElement);
    const title = $('#noteTitle', windowElement);
    const body = $('#noteBody', windowElement);
    const libraryScreen = $('[data-notes-screen="library"]', windowElement);
    const readerScreen = $('[data-notes-screen="reader"]', windowElement);
    const count = $('[data-notes-count]', windowElement);
    const windowTitle = $('[data-notes-window-title]', windowElement);

    if (!title || !body || !libraryScreen || !readerScreen || !count || !windowTitle) {
      return;
    }

    function showLibrary() {
      readerScreen.classList.remove('is-active');
      libraryScreen.classList.add('is-active');
      windowElement.classList.remove('is-reading-note');
      windowTitle.textContent = 'Note';
    }

    function showNote(note) {
      title.textContent = note.dataset.noteTitle;
      body.textContent = note.dataset.noteBody;
      windowTitle.textContent = note.dataset.noteTitle;
      libraryScreen.classList.remove('is-active');
      readerScreen.classList.add('is-active');
      windowElement.classList.add('is-reading-note');
      readerScreen.scrollTop = 0;
    }

    function showNoteById(id) {
      const note = notes.find((entry) => entry.dataset.note === id);
      if (note) showNote(note);
    }

    notes.forEach((note) => {
      note.addEventListener('pointerdown', (event) => event.stopPropagation());
      note.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        showNote(note);
      });
    });

    count.textContent = String(notes.length);
    const backButton = $('[data-note-back]', windowElement);
    backButton?.addEventListener('pointerdown', (event) => event.stopPropagation());
    backButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      showLibrary();
    });
    windowElement.addEventListener('notes:show-library', showLibrary);
    windowElement.addEventListener('notes:show-note', (event) => {
      showNoteById(event.detail?.noteId);
    });
    showLibrary();
  }

  function openNoteItem(item) {
    const noteId = item.noteId || item.id;
    openWindow('notes', false);
    window.setTimeout(() => {
      getWindow('notes')?.dispatchEvent(new CustomEvent('notes:show-note', {
        detail: { noteId }
      }));
    }, 0);
  }

  function bindFinder() {
    const finder = getWindow('finder');
    if (!finder) return;
    const search = $('[data-finder-search]', finder);
    const openButton = $('.finder-open-button', finder);
    const title = $('[data-finder-title]', finder);
    const currentIcon = $('[data-finder-current-icon]', finder);
    const breadcrumb = $('[data-finder-breadcrumb]', finder);
    const grid = $('[data-finder-grid]', finder);
    const back = $('[data-finder-back]', finder);
    const forward = $('[data-finder-forward]', finder);
    const applications = [
      { id: 'finder', name: 'Finder', icon: '/apple-icons/finder.png', description: 'Esplora il file system del portfolio.' },
      { id: 'projects', name: 'Progetti', icon: '/apple-icons/folder.png', description: 'Case study e progetti costruiti sul campo.' },
      { id: 'notes', name: 'Note', icon: '/apple-icons/notes.png', description: 'Profilo, manifesto, timeline e principi.' },
      { id: 'photos', name: 'Foto', icon: '/apple-icons/photos.png', description: 'Libreria fotografica personale.' },
      { id: 'mail', name: 'Mail', icon: '/apple-icons/mail.png', description: 'Form di contatto diretto.' },
      { id: 'terminal', name: 'Terminale', icon: '/apple-icons/terminal.png', description: 'Comandi rapidi del portfolio.' },
      { id: 'settings', name: 'Informazioni', icon: '/apple-icons/settings.webp', description: 'La mia biografia e i miei profili.' },
      { id: 'spotify', name: 'Spotify', icon: '/apple-icons/spotify.svg', description: 'Playlist, artisti e tracce.' },
      { id: 'launchpad', name: 'App', icon: '/apple-icons/launchpad.png', description: 'Tutte le applicazioni disponibili nel sito.' },
      { id: 'instagram', name: 'Instagram', icon: '/apple-icons/app_instagram.webp', social: 'instagram', fallback: '◎', url: 'https://instagram.com/enricotosoo', description: 'Il mio profilo Instagram.' },
      { id: 'tiktok', name: 'TikTok', icon: '/apple-icons/app_tiktok.webp', social: 'tiktok', fallback: '♪', url: 'https://tiktok.com/@enricotosoo', description: 'Il mio profilo TikTok.' },
      { id: 'linkedin', name: 'LinkedIn', icon: '/apple-icons/app_linkedin.webp', social: 'linkedin', fallback: 'in', url: 'https://linkedin.com/in/enricopaolotoso', description: 'Il mio profilo LinkedIn.' },
      { id: 'youtube', name: 'YouTube', icon: '/apple-icons/app_youtube.webp', social: 'youtube', fallback: '▶', url: 'https://youtube.com/@enricopaolotoso', description: 'Il mio canale YouTube.' }
    ];
    let currentLocation = '/Desktop';
    let selectedFile = null;
    let history = ['/Desktop'];
    let historyIndex = 0;

    function updateNavigation() {
      back.disabled = historyIndex <= 0;
      forward.disabled = historyIndex >= history.length - 1;
    }

    function resizeFinderToContent() {
      if (finder.classList.contains('is-maximized')) return;

      window.requestAnimationFrame(() => {
        const visibleFiles = $$('.finder-file', grid).filter((file) => !file.hidden);
        const listView = grid.classList.contains('is-list');
        const mobile = isMobile();
        const compact = window.matchMedia('(max-width: 560px)').matches;
        const horizontalPadding = mobile ? (compact ? 20 : 28) : 48;
        const verticalPadding = mobile ? (compact ? 40 : 44) : 48;
        const itemWidth = listView ? grid.clientWidth : compact ? 78 : mobile ? 92 : 112;
        const columnGap = listView ? 0 : compact ? 6 : mobile ? 8 : 14;
        const columns = listView
          ? 1
          : Math.max(
              1,
              Math.floor(
                (grid.clientWidth - horizontalPadding + columnGap) /
                (itemWidth + columnGap)
              )
            );
        const rows = Math.max(1, Math.ceil(visibleFiles.length / columns));
        const itemHeight = listView ? 54 : compact ? 102 : 116;
        const rowGap = listView ? 4 : compact ? 14 : mobile ? 16 : 22;
        const minimumContentHeight = mobile ? 180 : 300;
        const contentHeight = Math.max(
          minimumContentHeight,
          verticalPadding + rows * itemHeight + Math.max(0, rows - 1) * rowGap
        );
        const chromeHeight =
          $('.finder-titlebar', finder)?.offsetHeight || 52;
        const mobileTabs = $('.finder-mobile-tabs', finder);
        const tabsHeight =
          mobileTabs && getComputedStyle(mobileTabs).display !== 'none'
            ? mobileTabs.offsetHeight
            : 0;
        const pathHeight = $('.finder-pathbar', finder)?.offsetHeight || 34;
        const maximumHeight = mobile
          ? Math.min(window.innerHeight - 70, 620)
          : Math.min(window.innerHeight - 120, 720);
        const desiredHeight = Math.min(
          maximumHeight,
          chromeHeight + tabsHeight + pathHeight + contentHeight
        );

        finder.style.setProperty('--finder-auto-height', `${desiredHeight}px`);
      });
    }

    function createPlaceholder(heading, copy) {
      const empty = document.createElement('div');
      empty.className = 'finder-placeholder';
      const strong = document.createElement('strong');
      strong.textContent = heading;
      const paragraph = document.createElement('p');
      paragraph.textContent = copy;
      empty.append(strong, paragraph);
      return empty;
    }

    function createFileButton(item) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'finder-file';
      button.dataset.itemId = item.id;
      button.dataset.previewTitle = item.name;
      button.dataset.previewKind = itemTypeLabel(item.type);
      button.dataset.previewDescription = item.description || '';

      const icon = document.createElement('span');
      icon.className = `finder-file-icon finder-type-${item.type}${isMarkdownItem(item) ? ' finder-type-markdown' : ''}`;
      icon.setAttribute('aria-hidden', 'true');
      if (item.favicon && item.type === 'link') {
        const image = document.createElement('img');
        image.src = item.favicon;
        image.alt = '';
        image.loading = 'eager';
        icon.classList.add('finder-type-favicon');
        icon.appendChild(image);
      } else if (item.thumbnail || item.type === 'folder') {
        const image = document.createElement('img');
        image.src = item.thumbnail || '/apple-icons/folder.png';
        image.alt = '';
        image.loading = 'eager';
        icon.appendChild(image);
      } else {
        icon.textContent = itemMark(item);
      }

      const name = document.createElement('span');
      name.className = 'finder-file-name';
      name.textContent = item.name;
      const kind = document.createElement('small');
      kind.textContent = itemTypeLabel(item.type);
      button.append(icon, name, kind);
      return button;
    }

    function createAppButton(app) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'finder-file';
      if (app.url) button.dataset.openUrl = app.url;
      else button.dataset.openApp = app.id;
      button.dataset.previewTitle = app.name;
      button.dataset.previewKind = app.url ? 'Collegamento app' : 'Applicazione';
      button.dataset.previewDescription = app.description;

      const icon = document.createElement('span');
      icon.className = `finder-file-icon finder-app-icon ${app.social ? `finder-social-icon ${app.social}` : ''}`;
      icon.setAttribute('aria-hidden', 'true');
      if (app.icon) {
        const image = document.createElement('img');
        image.src = app.icon;
        image.alt = '';
        image.onerror = () => {
          image.remove();
          icon.textContent = app.fallback || app.name.slice(0, 1);
        };
        icon.appendChild(image);
      } else {
        icon.textContent = app.fallback || app.name.slice(0, 1);
      }
      const name = document.createElement('span');
      name.className = 'finder-file-name';
      name.textContent = app.name;
      const kind = document.createElement('small');
      kind.textContent = app.url ? 'Link' : 'Applicazione';
      button.append(icon, name, kind);
      return button;
    }

    function renderBreadcrumb(location) {
      breadcrumb.replaceChildren();
      if (!location.startsWith('/')) {
        const label = document.createElement('strong');
        label.textContent = location === 'recent' ? 'Recenti' : 'Applicazioni';
        breadcrumb.appendChild(label);
        return;
      }

      const segments = location.split('/').filter(Boolean);
      segments.forEach((segment, index) => {
        if (index > 0) {
          const separator = document.createElement('span');
          separator.className = 'finder-path-separator';
          separator.textContent = '›';
          breadcrumb.appendChild(separator);
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.finderPath = `/${segments.slice(0, index + 1).join('/')}`;
        button.textContent = segment;
        breadcrumb.appendChild(button);
      });
    }

    function finderLocationIcon(location) {
      if (location === 'applications') return '/apple-icons/launchpad.png';
      if (location === 'recent') return '/apple-icons/finder.png';
      return '/apple-icons/folder.png';
    }

    function resetPreview(locationItem, label, description, count = 0) {
      const previewIcon = $('#finderPreviewIcon', finder);
      previewIcon.replaceChildren();
      previewIcon.textContent = locationItem ? itemMark(locationItem) : label === 'Recenti' ? '◷' : '▦';
      $('#finderPreviewTitle', finder).textContent = label;
      $('#finderPreviewKind', finder).textContent = locationItem ? itemTypeLabel(locationItem.type) : 'Sezione Finder';
      $('#finderPreviewDescription', finder).textContent = description;
      $('[data-finder-preview-path]', finder).textContent = locationItem?.path || label;
      $('[data-finder-preview-count]', finder).textContent = String(count);
    }

    function renderLocation(location, addToHistory = true) {
      let label = 'Desktop';
      let description = fileSystem.description || 'Desktop del portfolio.';
      let locationItem = null;
      let items = [];

      if (location === 'recent') {
        label = 'Recenti';
        description = 'Gli ultimi file e cartelle aperti in questo browser.';
        items = readRecentIds().map(getItemById).filter(Boolean);
      } else if (location === 'applications') {
        label = 'Applicazioni';
        description = 'Le applicazioni disponibili nel mio desktop.';
      } else {
        locationItem = getItemByPath(location) || fileSystem;
        if (locationItem.type !== 'folder') locationItem = fileSystem;
        location = locationItem.path;
        label = locationItem.name;
        description = locationItem.description || 'Cartella del portfolio.';
        items = locationItem.children || [];
      }

      currentLocation = location;
      selectedFile = null;
      openButton.disabled = true;
      openButton.textContent = 'Seleziona un elemento';
      search.value = '';
      title.textContent = label;
      if (currentIcon) {
        currentIcon.src = finderLocationIcon(location);
        currentIcon.alt = '';
      }
      finder.dataset.currentPath = location;
      renderBreadcrumb(location);
      grid.replaceChildren();

      if (location === 'applications') {
        applications.forEach((app) => grid.appendChild(createAppButton(app)));
      } else if (items.length) {
        items.forEach((item) => grid.appendChild(createFileButton(item)));
      } else {
        grid.appendChild(
          createPlaceholder(
            location === 'recent' ? 'Nessun elemento recente' : 'Cartella vuota',
            location === 'recent'
              ? 'I file e le cartelle aperti compariranno qui.'
              : 'Questa cartella non contiene ancora elementi.'
          )
        );
      }

      grid.classList.toggle(
        'is-list',
        $('[data-finder-view="list"]', finder)?.classList.contains('is-active')
      );
      $$('[data-finder-location]', finder).forEach((button) => {
        button.classList.toggle('is-active', button.dataset.finderLocation === location);
      });
      resetPreview(locationItem, label, description, location === 'applications' ? applications.length : items.length);
      resizeFinderToContent();

      if (addToHistory && history[historyIndex] !== location) {
        history = history.slice(0, historyIndex + 1);
        history.push(location);
        historyIndex = history.length - 1;
      }
      updateNavigation();
    }

    function selectFile(file) {
      $$('.finder-file', finder).forEach((entry) => entry.classList.remove('is-selected'));
      file.classList.add('is-selected');
      const previewIcon = $('#finderPreviewIcon', finder);
      previewIcon.replaceChildren();
      const sourceIcon = $('.finder-file-icon', file);
      if (sourceIcon) previewIcon.appendChild(sourceIcon.cloneNode(true));
      $('#finderPreviewTitle', finder).textContent = file.dataset.previewTitle;
      $('#finderPreviewKind', finder).textContent = file.dataset.previewKind;
      $('#finderPreviewDescription', finder).textContent = file.dataset.previewDescription;
      const item = getItemById(file.dataset.itemId);
      $('[data-finder-preview-path]', finder).textContent = item?.path || 'Applicazioni';
      $('[data-finder-preview-count]', finder).textContent = item?.type === 'folder'
        ? String(item.children?.length || 0)
        : '1';
      selectedFile = file;
      openButton.disabled = false;
      openButton.textContent = 'Apri elemento';
    }

    function openFinderFile(file) {
      if (!file) return;
      if (file.dataset.itemId) openItem(file.dataset.itemId);
      if (file.dataset.openApp) openWindow(file.dataset.openApp);
      if (file.dataset.openUrl) window.open(file.dataset.openUrl, '_blank', 'noopener,noreferrer');
    }

    finder.addEventListener('click', (event) => {
      const locationButton = event.target.closest('[data-finder-location]');
      if (locationButton) {
        event.stopPropagation();
        renderLocation(locationButton.dataset.finderLocation);
        return;
      }

      const pathButton = event.target.closest('[data-finder-path]');
      if (pathButton) {
        event.stopPropagation();
        renderLocation(pathButton.dataset.finderPath);
        return;
      }

      const file = event.target.closest('.finder-file');
      if (!file) return;
      event.stopPropagation();
      selectFile(file);
      if (isMobile()) openFinderFile(file);
    });

    finder.addEventListener('dblclick', (event) => {
      const file = event.target.closest('.finder-file');
      if (!file) return;
      event.stopPropagation();
      openFinderFile(file);
    });

    openButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openFinderFile(selectedFile);
    });

    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      $$('.finder-file', grid).forEach((file) => {
        const haystack = `${file.dataset.previewTitle} ${file.dataset.previewKind} ${file.dataset.previewDescription}`.toLowerCase();
        file.hidden = !haystack.includes(query);
      });
      resizeFinderToContent();
    });

    $$('[data-finder-view]', finder).forEach((button) => {
      button.addEventListener('click', () => {
        $$('[data-finder-view]', finder).forEach((entry) => {
          const active = entry === button;
          entry.classList.toggle('is-active', active);
          entry.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        grid.classList.toggle('is-list', button.dataset.finderView === 'list');
        resizeFinderToContent();
      });
    });

    back.addEventListener('click', () => {
      if (historyIndex <= 0) return;
      historyIndex -= 1;
      renderLocation(history[historyIndex], false);
    });
    forward.addEventListener('click', () => {
      if (historyIndex >= history.length - 1) return;
      historyIndex += 1;
      renderLocation(history[historyIndex], false);
    });

    renderFinderRecent = () => {
      if (currentLocation === 'recent') renderLocation('recent', false);
    };
    navigateFinder = renderLocation;
    renderLocation('/Desktop', false);
    window.addEventListener('resize', resizeFinderToContent);
  }

  function bindLaunchpadSearch() {
    const launchpad = getWindow('launchpad');
    const search = $('[data-launchpad-search]', launchpad);
    const apps = $$('[data-app-label]', launchpad);
    if (!search) return;
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      apps.forEach((app) => {
        const matches = app.dataset.appLabel.toLowerCase().includes(query);
        app.hidden = !matches;
        if (matches) visible += 1;
      });
      $('.launchpad-empty', launchpad).hidden = visible > 0;
    });

    document.addEventListener('pointerdown', (event) => {
      if (!launchpad.classList.contains('is-open')) return;
      if (event.target.closest('.launchpad')) return;
      if (event.target.closest('[data-open="launchpad"]')) return;
      closeLaunchpad(false);
    });
  }

  function bindPhotoLibrary() {
    const photos = getWindow('photos');
    if (!photos) return;
    const items = $$('[data-photo-src]', photos);
    const viewer = $('[data-photo-viewer]', photos);
    const viewerImage = $('[data-photo-viewer-image]', photos);
    const viewerTitle = $('[data-photo-viewer-title]', photos);

    items.forEach((item) => {
      item.addEventListener('click', () => {
        viewerImage.src = item.dataset.photoSrc;
        viewerImage.alt = item.dataset.photoTitle;
        viewerTitle.textContent = item.dataset.photoTitle;
        viewer.hidden = false;
        $('[data-photo-viewer-close]', viewer)?.focus();
      });
    });

    const closeViewer = () => {
      viewer.hidden = true;
      viewerImage.removeAttribute('src');
      viewerImage.alt = '';
    };

    $('[data-photo-viewer-close]', viewer)?.addEventListener('click', closeViewer);
    viewer?.addEventListener('click', (event) => {
      if (event.target === viewer) closeViewer();
    });
  }

  function bindProjectFilters() {
    const projects = getWindow('projects');
    if (!projects) return;
    const cards = $$('[data-project-category]', projects);
    $$('[data-project-filter]', projects).forEach((button) => {
      button.addEventListener('click', () => {
        $$('[data-project-filter]', projects).forEach((entry) => entry.classList.remove('active'));
        button.classList.add('active');
        const filter = button.dataset.projectFilter;
        let visible = 0;
        cards.forEach((card) => {
          card.hidden = filter !== 'all' && card.dataset.projectCategory !== filter;
          if (!card.hidden) visible += 1;
        });
        $('.projects-empty', projects).hidden = visible > 0;
      });
    });
  }

  function bindSpotify() {
    const spotify = getWindow('spotify');
    if (!spotify) return;

    const loading = $('[data-spotify-loading]', spotify);
    const error = $('[data-spotify-error]', spotify);
    const results = $('[data-spotify-results]', spotify);
    let data = null;
    let section = 'playlists';
    let range = 'short_term';

    const imageOrFallback = (src, alt, symbol = '●') => {
      if (src) {
        const image = document.createElement('img');
        image.src = src;
        image.alt = alt;
        image.loading = 'lazy';
        return image;
      }
      const fallback = document.createElement('div');
      fallback.className = 'spotify-image-fallback';
      fallback.textContent = symbol;
      return fallback;
    };

    const externalLink = (url) => {
      const link = document.createElement('a');
      link.href = url || 'https://open.spotify.com/';
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = 'Apri su Spotify';
      return link;
    };

    function renderCards(items, type) {
      const grid = document.createElement('div');
      grid.className = 'spotify-grid';
      items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'spotify-card';
        card.appendChild(imageOrFallback(item.image, item.name));
        const heading = document.createElement('h3');
        heading.textContent = item.name;
        const description = document.createElement('p');
        if (type === 'playlist') {
          const tracksTotal = Number(item.tracksTotal);
          const parts = [];
          if (Number.isFinite(tracksTotal) && tracksTotal > 0) {
            parts.push(`${tracksTotal} ${tracksTotal === 1 ? 'brano' : 'brani'}`);
          }
          if (item.description) parts.push(item.description);
          description.textContent = parts.join(' · ') || 'Playlist';
        } else {
          description.textContent =
            (item.genres || []).slice(0, 2).join(', ') || `Popolarità ${item.popularity}`;
        }
        card.append(heading, description, externalLink(item.url));
        grid.appendChild(card);
      });
      return grid;
    }

    function formatDuration(durationMs) {
      const totalSeconds = Math.floor((durationMs || 0) / 1000);
      return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
    }

    function renderRows(items, type) {
      const list = document.createElement('div');
      list.className = 'spotify-list';
      items.forEach((item) => {
        const row = document.createElement('article');
        row.className = 'spotify-row';
        const rank = document.createElement('span');
        rank.className = 'spotify-rank';
        rank.textContent = item.rank;
        const image = imageOrFallback(item.image, item.name);
        if (!item.image) image.className = 'spotify-row-image';
        const copy = document.createElement('div');
        const heading = document.createElement('h3');
        heading.textContent = item.name;
        const subline = document.createElement('p');
        subline.textContent = type === 'track' ? item.artist : (item.genres || []).slice(0, 2).join(', ');
        copy.append(heading, subline);
        const meta = document.createElement('span');
        meta.className = 'spotify-row-meta';
        meta.textContent = type === 'track' ? `${item.album} · ${formatDuration(item.durationMs)}` : `Popolarità ${item.popularity}`;
        row.append(rank, image, copy, meta, externalLink(item.url));
        list.appendChild(row);
      });
      return list;
    }

    function render() {
      if (!data) return;
      results.innerHTML = '';
      let items = [];
      let content;

      if (section === 'playlists') {
        items = data.playlists || [];
        content = renderCards(items, 'playlist');
      } else if (section === 'artists') {
        items = data.topArtists?.[range] || [];
        content = renderRows(items, 'artist');
      } else {
        items = data.topTracks?.[range] || [];
        content = renderRows(items, 'track');
      }

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'spotify-error';
        const heading = document.createElement('strong');
        heading.textContent = 'Nessun dato disponibile';
        const copy = document.createElement('p');
        copy.textContent = 'Questa sezione verrà popolata al prossimo aggiornamento Spotify.';
        empty.append(heading, copy);
        results.appendChild(empty);
      } else {
        results.appendChild(content);
      }
    }

    $$('[data-spotify-section]', spotify).forEach((button) => {
      button.addEventListener('click', () => {
        if (!data || data.error) return;
        $$('[data-spotify-section]', spotify).forEach((entry) => entry.classList.remove('is-active'));
        button.classList.add('is-active');
        section = button.dataset.spotifySection;
        $('.spotify-ranges', spotify).hidden = section === 'playlists';
        render();
      });
    });

    $$('[data-spotify-range]', spotify).forEach((button) => {
      button.addEventListener('click', () => {
        if (!data || data.error) return;
        $$('[data-spotify-range]', spotify).forEach((entry) => entry.classList.remove('is-active'));
        button.classList.add('is-active');
        range = button.dataset.spotifyRange;
        render();
      });
    });

    fetch('/data/spotify.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('spotify.json non disponibile');
        return response.json();
      })
      .then((spotifyData) => {
        data = spotifyData;
        loading.hidden = true;
        if (data.error) {
          error.hidden = false;
          $('p', error).textContent = data.error;
          return;
        }

        results.hidden = false;
        const profileName = $('[data-spotify-profile-name]', spotify);
        const profileLink = $('[data-spotify-profile-link]', spotify);
        const updated = $('[data-spotify-updated]', spotify);
        const avatar = $('[data-spotify-profile-avatar]', spotify);
        profileName.textContent = data.profile?.displayName || 'Enrico Toso';
        profileLink.href = data.profile?.url || 'https://open.spotify.com/';
        updated.textContent = data.updatedAt
          ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.updatedAt))
          : '—';
        if (data.profile?.image) {
          avatar.textContent = '';
          avatar.appendChild(imageOrFallback(data.profile.image, data.profile.displayName || 'Profilo Spotify'));
        }
        $('.spotify-ranges', spotify).hidden = true;
        render();
      })
      .catch(() => {
        loading.hidden = true;
        error.hidden = false;
      });
  }

  function bindSettings() {
    const settings = getWindow('settings');
    if (!settings) return;
    $$('[data-settings-section]', settings).forEach((button) => {
      button.addEventListener('click', () => {
        $$('[data-settings-section]', settings).forEach((entry) => entry.classList.remove('active'));
        button.classList.add('active');
        $$('[data-settings-panel]', settings).forEach((panel) => {
          panel.hidden = panel.dataset.settingsPanel !== button.dataset.settingsSection;
        });
      });
    });
  }

  function initLoader() {
    window.setTimeout(() => $('#loader')?.classList.add('is-hidden'), 650);
  }

  function initWindowState() {
    $$('.mac-window').forEach((win) => {
      win.classList.remove('is-open', 'is-focused', 'is-minimized', 'is-minimizing', 'is-maximized', 'is-closing');
      win.style.zIndex = '';
      win.setAttribute('aria-hidden', 'true');
    });
    setActiveApp('desktop');
  }

  function init() {
    updateClock();
    updateMobileLockClock();
    window.setInterval(updateClock, 15000);
    window.setInterval(updateMobileLockClock, 15000);
    initMobileLockScreen();
    bindMenuBar();
    bindOpenActions();
    bindWindowControls();
    bindMenuCommands();
    bindDesktopItems();
    bindDragWindows();
    bindDragDesktopItems();
    bindKeyboard();
    bindCopyButtons();
    bindContactForm();
    bindTerminal();
    bindNotes();
    bindFinder();
    bindLaunchpadSearch();
    bindPhotoLibrary();
    bindProjectFilters();
    bindSpotify();
    bindSettings();
    initTour();
    initLoader();
    initWindowState();
    updateDockState();
    window.addEventListener('resize', () => {
      if (isMobile()) layoutMobileWindows();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
