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
      title: 'Benvenuto nel desktop di Enrico',
      body: 'Questo portfolio è stato reimmaginato come un desktop Mac. Ogni app, cartella e file apre una parte diversa del percorso di Enrico.',
    },
    {
      title: 'Il desktop',
      body: 'Seleziona gli elementi con un clic e aprili con un doppio clic. Su touch basta un singolo tocco.',
    },
    {
      title: 'Il Dock',
      body: 'Dal Dock puoi aprire Finder, Note, Foto, Mail, Terminale, Impostazioni, Launchpad e Cestino.',
    },
    {
      title: 'Progetti e competenze',
      body: 'Finder e Progetti raccolgono i case study. Note racconta il percorso, mentre Impostazioni presenta le competenze operative.',
    },
    {
      title: 'Scorciatoie',
      body: 'Premi Esc oppure ⌘/Ctrl + W per chiudere la finestra in primo piano. Puoi trascinare e ingrandire le finestre su desktop.',
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
      app: 'Applicazione'
    }[type] || 'File';
  }

  function itemMark(item) {
    if (item.icon) return item.icon;
    return {
      folder: '📁',
      image: 'IMG',
      video: '▶',
      document: 'DOC',
      pdf: 'PDF',
      link: '↗',
      note: 'Nota',
      app: 'APP'
    }[item.type] || 'FILE';
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
    return $$('.mac-window.is-open:not(.is-minimized)');
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
    media.replaceChildren();

    $('[data-preview-window-title]', preview).textContent = item.name;
    $('[data-preview-title]', preview).textContent = item.name;
    $('[data-preview-type]', preview).textContent = itemTypeLabel(item.type);
    $('[data-preview-description]', preview).textContent =
      item.description || 'Nessuna descrizione disponibile.';

    if (item.type === 'image' && (item.url || item.thumbnail)) {
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
      body.textContent = item.description || 'Contenuto in preparazione.';
      documentView.append(heading, body);
      media.appendChild(documentView);
    }

    openLink.hidden = !item.url;
    if (item.url) openLink.href = item.url;
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
    $('[data-quicktime-title]', quicktime).textContent = item.name;
    $('[data-quicktime-description]', quicktime).textContent =
      item.description || 'Video dall’archivio di Enrico Toso.';
    openLink.hidden = !item.url;
    if (item.url) openLink.href = item.url;
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
    } else if (item.type === 'image' || item.type === 'pdf' || item.type === 'document' || item.type === 'note') {
      openPreview(item);
    } else if (item.type === 'video') {
      openQuickTime(item);
    } else if (item.type === 'link') {
      openSafari(item);
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
    if (id === 'launchpad') {
      openLaunchpad();
      if (trackRecent) recordRecent('app-launchpad');
      return;
    }

    const win = getWindow(id);
    if (!win) return;

    closeLaunchpad(false);
    win.classList.remove('is-closing', 'is-minimized');
    win.classList.add('is-open');
    win.setAttribute('aria-hidden', 'false');

    focusWindow(win);
    if (trackRecent && id !== 'finder') recordRecent(`app-${id}`);

    if (id === 'photos') {
      ensurePhotoImagesLoaded(win);
    }

    if (id === 'terminal') {
      window.setTimeout(() => $('[data-terminal-input]', win)?.focus(), 50);
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
    win.classList.add('is-minimized');
    win.classList.remove('is-focused');
    win.setAttribute('aria-hidden', 'true');
    const next = topWindow();
    if (next) focusWindow(next);
    else setActiveApp('desktop');
    updateDockState();
    if (isMobile()) layoutMobileWindows();
  }

  function maximizeWindow(win) {
    if (!win) return;
    win.classList.toggle('is-maximized');
    focusWindow(win);
  }

  function openLaunchpad() {
    const launchpad = getWindow('launchpad');
    if (!launchpad) return;
    focusBeforeModal = document.activeElement;
    launchpad.classList.add('is-open');
    launchpad.style.zIndex = String(++zIndex);
    launchpad.setAttribute('aria-hidden', 'false');
    setActiveApp('launchpad');
    window.setTimeout(() => $('[data-launchpad-search]', launchpad)?.focus(), 30);
  }

  function closeLaunchpad(restoreFocus = true) {
    const launchpad = getWindow('launchpad');
    if (!launchpad?.classList.contains('is-open')) return;
    launchpad.classList.remove('is-open');
    launchpad.setAttribute('aria-hidden', 'true');
    setActiveApp(getAppId(topWindow()) || 'desktop');
    if (restoreFocus && focusBeforeModal instanceof HTMLElement) focusBeforeModal.focus();
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

    $('[data-tour-title]', tour).textContent = step.title;
    $('[data-tour-body]', tour).textContent = step.body;
    $('[data-tour-step]', tour).textContent = `Step ${tourIndex + 1} di ${tourSteps.length}`;

    const back = $('[data-tour-back]', tour);
    const next = $('[data-tour-next]', tour);
    back.hidden = tourIndex === 0;
    next.textContent = tourIndex === tourSteps.length - 1 ? 'Fine' : 'Avanti';
  }

  function openTour() {
    const tour = $('#tour');
    if (!tour) return;
    focusBeforeModal = document.activeElement;
    tourIndex = 0;
    renderTour();
    tour.classList.add('is-visible');
    tour.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => $('.tour-card', tour)?.focus(), 30);
  }

  function closeTour() {
    const tour = $('#tour');
    if (!tour) return;
    tour.classList.remove('is-visible');
    tour.setAttribute('aria-hidden', 'true');
    try {
      localStorage.setItem('enrico-desktop-tour-seen', '1');
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

    let seen = false;
    try {
      seen = localStorage.getItem('enrico-desktop-tour-seen') === '1';
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
      const trigger = event.target.closest('[data-open]');
      if (!trigger) return;
      if (trigger.classList.contains('desktop-item') || trigger.classList.contains('finder-file')) return;
      event.stopPropagation();
      const id = trigger.dataset.open;
      if (trigger.closest('.launchpad')) closeLaunchpad(false);
      openWindow(id);
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
      const button = event.target.closest('[data-command]');
      if (!button || button.disabled) return;
      event.stopPropagation();

      const command = button.dataset.command;
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
    });
  }

  function bindDesktopItems() {
    $$('.desktop-item').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        if (item.dataset.dragging === 'true') return;
        $$('.desktop-item').forEach((entry) => entry.classList.remove('is-selected'));
        item.classList.add('is-selected');
        if (isMobile()) openItem(item.dataset.itemId);
      });

      item.addEventListener('dblclick', (event) => {
        if (isMobile() || item.dataset.dragging === 'true') return;
        event.stopPropagation();
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
        if (isMobile() || event.button !== 0) return;
        const rect = item.getBoundingClientRect();
        const desktop = $('.desktop-items');
        const desktopRect = desktop.getBoundingClientRect();
        const start = { x: event.clientX, y: event.clientY };

        const onMove = (moveEvent) => {
          if (moveEvent.pointerId !== event.pointerId) return;
          if (Math.abs(moveEvent.clientX - start.x) < 4 && Math.abs(moveEvent.clientY - start.y) < 4) return;
          item.dataset.dragging = 'true';
          const left = Math.max(
            0,
            Math.min(moveEvent.clientX - desktopRect.left - (event.clientX - rect.left), desktopRect.width - item.offsetWidth)
          );
          const top = Math.max(
            0,
            Math.min(moveEvent.clientY - desktopRect.top - (event.clientY - rect.top), desktopRect.height - item.offsetHeight)
          );
          item.style.left = `${left}px`;
          item.style.top = `${top}px`;
        };

        const onUp = (upEvent) => {
          if (upEvent.pointerId !== event.pointerId) return;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          window.setTimeout(() => delete item.dataset.dragging, 0);
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
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
    if (!input || !output) return;

    const commands = {
      help: 'Comandi: about, skills, projects, raviez, netmarket, contact, clear',
      about: 'Enrico Paolo Toso è un digital builder di Padova. Unisce brand, contenuto, web, marketing e AI.',
      skills: 'Brand strategy, web ed e-commerce, content creation, digital marketing, AI workflow e problem solving.',
      projects: 'Progetti principali: Raviez, Netmarket, JoyLife e Creator Archive.',
      raviez: 'Raviez è un brand DTC costruito come laboratorio reale su identità, community, contenuto e vendita online.',
      netmarket: 'Netmarket è l’ambiente operativo dedicato a branding, siti, e-commerce, contenuti e strategie digitali.',
      contact: 'I recapiti pubblici sono in aggiornamento. Apri Mail per controllarne la disponibilità.'
    };

    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const value = input.value.trim().toLowerCase();
      if (!value) return;

      if (value === 'clear') {
        $$('.terminal-line', output).forEach((line) => line.remove());
        input.value = '';
        return;
      }

      const command = document.createElement('p');
      command.className = 'terminal-line terminal-command';
      command.textContent = `enrico@portfolio ~ % ${value}`;
      input.closest('label').before(command);

      const response = document.createElement('p');
      response.className = 'terminal-line terminal-response';
      response.textContent = commands[value] || `Comando non trovato: ${value}. Digita "help".`;
      input.closest('label').before(response);

      if (value === 'projects') openWindow('projects');
      input.value = '';
      output.scrollTop = output.scrollHeight;
    });
  }

  function bindNotes() {
    const windowElement = getWindow('notes');
    if (!windowElement) return;
    const notes = $$('[data-note]', windowElement);
    const title = $('#noteTitle', windowElement);
    const body = $('#noteBody', windowElement);
    const search = $('[data-notes-search]', windowElement);
    let folder = 'all';

    function filterNotes() {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      notes.forEach((note) => {
        const matchesFolder = folder === 'all' || note.dataset.noteFolder === folder;
        const matchesQuery = `${note.dataset.noteTitle} ${note.dataset.noteBody}`.toLowerCase().includes(query);
        note.hidden = !(matchesFolder && matchesQuery);
        if (!note.hidden) visible += 1;
      });
      $('.notes-empty', windowElement).hidden = visible > 0;
    }

    notes.forEach((note) => {
      note.addEventListener('click', () => {
        notes.forEach((entry) => entry.classList.remove('active'));
        note.classList.add('active');
        title.textContent = note.dataset.noteTitle;
        body.textContent = note.dataset.noteBody;
      });
    });

    $$('[data-note-folder]', windowElement).forEach((button) => {
      button.addEventListener('click', () => {
        $$('[data-note-folder]', windowElement).forEach((entry) => entry.classList.remove('active'));
        button.classList.add('active');
        folder = button.dataset.noteFolder;
        filterNotes();
      });
    });

    search.addEventListener('input', filterNotes);
    $('[data-focus-note-search]', windowElement)?.addEventListener('click', () => search.focus());
  }

  function bindFinder() {
    const finder = getWindow('finder');
    if (!finder) return;
    const search = $('[data-finder-search]', finder);
    const openButton = $('.finder-open-button', finder);
    const title = $('[data-finder-title]', finder);
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
      { id: 'settings', name: 'Informazioni', icon: '/apple-icons/settings.png', description: 'Biografia e profili di Enrico.' },
      { id: 'spotify', name: 'Spotify', icon: '/apple-icons/spotify.svg', description: 'Playlist, artisti e tracce.' }
    ];
    let currentLocation = '/Desktop';
    let selectedFile = null;
    let history = ['/Desktop'];
    let historyIndex = 0;

    function updateNavigation() {
      back.disabled = historyIndex <= 0;
      forward.disabled = historyIndex >= history.length - 1;
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
      icon.className = `finder-file-icon finder-type-${item.type}`;
      icon.setAttribute('aria-hidden', 'true');
      if (item.thumbnail || item.type === 'folder') {
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
      button.dataset.openApp = app.id;
      button.dataset.previewTitle = app.name;
      button.dataset.previewKind = 'Applicazione';
      button.dataset.previewDescription = app.description;

      const icon = document.createElement('span');
      icon.className = 'finder-file-icon finder-app-icon';
      icon.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img');
      image.src = app.icon;
      image.alt = '';
      icon.appendChild(image);
      const name = document.createElement('span');
      name.className = 'finder-file-name';
      name.textContent = app.name;
      const kind = document.createElement('small');
      kind.textContent = 'Applicazione';
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

    function resetPreview(locationItem, label, description, count = 0) {
      const previewIcon = $('#finderPreviewIcon', finder);
      previewIcon.replaceChildren();
      previewIcon.textContent = locationItem ? itemMark(locationItem) : label === 'Recenti' ? '🕘' : '🚀';
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
        description = 'Le applicazioni disponibili in Enrico OS.';
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
    });

    $$('[data-finder-view]', finder).forEach((button) => {
      button.addEventListener('click', () => {
        $$('[data-finder-view]', finder).forEach((entry) => {
          const active = entry === button;
          entry.classList.toggle('is-active', active);
          entry.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        grid.classList.toggle('is-list', button.dataset.finderView === 'list');
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
    launchpad.addEventListener('click', (event) => {
      if (event.target === launchpad) closeLaunchpad();
    });
  }

  function bindPhotoLibrary() {
    const photos = getWindow('photos');
    if (!photos) return;
    const items = $$('[data-photo-src]', photos);
    const search = $('[data-photo-search]', photos);
    const viewer = $('[data-photo-viewer]', photos);
    const viewerImage = $('[data-photo-viewer-image]', photos);
    const viewerTitle = $('[data-photo-viewer-title]', photos);

    function filterPhotos() {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const matchesQuery = item.dataset.photoTitle.toLowerCase().includes(query);
        item.hidden = !matchesQuery;
        if (!item.hidden) visible += 1;
      });
      $('.photos-no-results', photos).hidden = visible > 0 || items.length === 0;
    }

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

    search.addEventListener('input', filterPhotos);
    $('[data-focus-photo-search]', photos)?.addEventListener('click', () => search.focus());
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
        description.textContent =
          type === 'playlist'
            ? `${item.tracksTotal} brani${item.description ? ` · ${item.description}` : ''}`
            : (item.genres || []).slice(0, 2).join(', ') || `Popolarità ${item.popularity}`;
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
      win.classList.remove('is-open', 'is-focused', 'is-minimized', 'is-maximized', 'is-closing');
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
