(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const appNames = {
    finder: 'Finder',
    projects: 'Progetti',
    notes: 'Note',
    photos: 'Foto',
    mail: 'Mail',
    terminal: 'Terminale',
    settings: 'Impostazioni',
    launchpad: 'Launchpad',
    trash: 'Cestino',
    readme: 'README.md'
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
    if (activeName) activeName.textContent = appNames[id] || 'Finder';
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

  function focusWindow(win) {
    if (!win) return;
    $$('.mac-window').forEach((item) => item.classList.remove('is-focused'));
    win.classList.remove('is-minimized');
    win.classList.add('is-focused');
    win.style.zIndex = String(++zIndex);
    setActiveApp(getAppId(win));
    updateDockState();
  }

  function openWindow(id) {
    if (!id) return;
    if (id === 'launchpad') {
      openLaunchpad();
      return;
    }

    const win = getWindow(id);
    if (!win) return;

    closeLaunchpad(false);
    win.classList.remove('is-closing', 'is-minimized');
    win.classList.add('is-open');
    win.setAttribute('aria-hidden', 'false');

    if (isMobile()) win.classList.add('is-maximized');
    focusWindow(win);

    if (id === 'terminal') {
      window.setTimeout(() => $('[data-terminal-input]', win)?.focus(), 50);
    }
  }

  function closeWindow(win) {
    if (!win || !win.classList.contains('is-open')) return;
    win.classList.remove('is-focused');
    win.classList.add('is-closing');

    window.setTimeout(() => {
      win.classList.remove('is-open', 'is-closing', 'is-minimized', 'is-maximized');
      win.style.zIndex = '';
      win.setAttribute('aria-hidden', 'true');
      const next = topWindow();
      if (next) focusWindow(next);
      else setActiveApp('Finder');
      updateDockState();
    }, 150);
  }

  function minimizeWindow(win) {
    if (!win) return;
    win.classList.add('is-minimized');
    win.classList.remove('is-focused');
    win.setAttribute('aria-hidden', 'true');
    const next = topWindow();
    if (next) focusWindow(next);
    else setActiveApp('Finder');
    updateDockState();
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
    setActiveApp(getAppId(topWindow()) || 'Finder');
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
    if (!seen) window.setTimeout(openTour, 850);
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
        openWindow(item.dataset.open);
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
        if (isMobile() || event.target.closest('button') || win.classList.contains('is-maximized')) return;
        const rect = win.getBoundingClientRect();
        const layerRect = $('#windowLayer').getBoundingClientRect();
        dragState = {
          win,
          pointerId: event.pointerId,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top,
          layerRect
        };
        header.setPointerCapture(event.pointerId);
        focusWindow(win);
      });

      header.addEventListener('pointermove', (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        const { win: dragged, offsetX, offsetY, layerRect } = dragState;
        const maxX = layerRect.width - dragged.offsetWidth - 8;
        const maxY = layerRect.height - dragged.offsetHeight - 8;
        const left = Math.max(8, Math.min(event.clientX - layerRect.left - offsetX, maxX));
        const top = Math.max(8, Math.min(event.clientY - layerRect.top - offsetY, maxY));
        dragged.style.left = `${left}px`;
        dragged.style.top = `${top}px`;
      });

      const endDrag = (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
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
    const files = $$('.finder-file', finder);
    const grid = $('[data-finder-grid]', finder);
    const search = $('[data-finder-search]', finder);
    const openButton = $('.finder-open-button', finder);
    let selectedAction = 'readme';

    function selectFile(file) {
      files.forEach((entry) => entry.classList.remove('is-selected'));
      file.classList.add('is-selected');
      $('#finderPreviewIcon', finder).textContent = $('.finder-file-icon', file)?.textContent || '📄';
      $('#finderPreviewTitle', finder).textContent = file.dataset.previewTitle;
      $('#finderPreviewKind', finder).textContent = file.dataset.previewKind;
      $('#finderPreviewDescription', finder).textContent = file.dataset.previewDescription;
      selectedAction = file.dataset.open;
    }

    files.forEach((file) => {
      file.addEventListener('click', (event) => {
        event.stopPropagation();
        selectFile(file);
        if (isMobile()) openWindow(file.dataset.open);
      });
      file.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        openWindow(file.dataset.open);
      });
    });

    openButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openWindow(selectedAction);
    });

    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      files.forEach((file) => {
        const haystack = `${file.dataset.previewTitle} ${file.dataset.previewKind} ${file.dataset.previewDescription}`.toLowerCase();
        const words = haystack.split(/[^a-z0-9à-öø-ÿ]+/).filter(Boolean);
        const matches = query.length <= 2 ? words.includes(query) : haystack.includes(query);
        file.hidden = !matches;
        if (matches) visible += 1;
      });
      $('.finder-empty', finder).hidden = visible > 0;
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
    const finder = getWindow('finder');
    if (finder?.classList.contains('is-open')) {
      finder.style.zIndex = String(++zIndex);
      focusWindow(finder);
    }
  }

  function init() {
    updateClock();
    window.setInterval(updateClock, 15000);
    bindOpenActions();
    bindWindowControls();
    bindMenuCommands();
    bindDesktopItems();
    bindDragWindows();
    bindDragDesktopItems();
    bindKeyboard();
    bindCopyButtons();
    bindTerminal();
    bindNotes();
    bindFinder();
    bindLaunchpadSearch();
    bindPhotoLibrary();
    bindProjectFilters();
    bindSettings();
    initTour();
    initLoader();
    initWindowState();
    updateDockState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
