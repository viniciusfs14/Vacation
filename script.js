/* Personalize estes dados antes de compartilhar o convite.
 * WhatsApp: código do país + DDD + número, apenas dígitos.
 * Sem número válido, a resposta abre o seletor de contatos do WhatsApp.
 */
const CONFIG = {
  recipientName: 'Jennifer',
  senderName: 'Vinícius',
  whatsappNumber: '5531982491262',
  personalNote: 'Foi em São João del-Rei que a gente se conheceu. Depois veio o rolê com a turma, as bebidas e o Fuscas Lanches. Agora olha onde eu vim parar: escolhendo cidades de Minas e fazendo um site inteiro pra te chamar pra viajar. Acho que me empolguei um pouquinho. kkkkk'
};

(() => {
  'use strict';

  const DATA = {
    destination: {
      'ouro-preto': {
        title: 'Ouro Preto',
        image: 'assets/photos/ouro-preto.jpg',
        width: 1600,
        fallback: 'assets/ouro-preto.svg',
        previewTitle: 'Ladeiras, cafés e uma boa conversa.',
        previewText: 'Um passeio pelo centro histórico, uma pausa para o café e a gente decidindo o resto pelo caminho.',
        finalMessage: 'Quero descobrir um café novo com você, me perder um pouco pelas ladeiras e guardar mais histórias nossas pelo caminho. Ouro Preto pode ser o cenário da próxima lembrança boa que a gente vai criar juntos.',
        finalNote: 'um café, uma esquina bonita e mais uma lembrança nossa.'
      },
      'sao-thome': {
        title: 'São Thomé das Letras',
        image: 'assets/photos/sao-thome.jpg',
        width: 1600,
        fallback: 'assets/sao-thome.svg',
        previewTitle: 'Um pôr do sol para ver de pertinho.',
        previewText: 'Um pouco de natureza, um mirante bonito e tempo de sobra para aproveitar a companhia.',
        finalMessage: 'Quero sentar do seu lado, ver o céu mudar de cor e deixar a conversa durar um pouco mais. Em São Thomé, a gente encontra um horizonte novo e tempo para aproveitar o que está começando entre nós.',
        finalNote: 'um pôr do sol fica ainda melhor quando é dividido com você.'
      },
      'sao-joao': {
        title: 'São João del-Rei',
        image: 'assets/photos/sao-joao.jpg',
        width: 1296,
        fallback: 'assets/sao-joao.svg',
        previewTitle: 'Voltar para onde a nossa história começou.',
        previewText: 'Revisitar São João, descobrir outros cantinhos e guardar mais uma lembrança boa desse lugar.',
        finalMessage: 'Foi em São João del-Rei que a gente se encontrou. Eu queria voltar para criar mais uma lembrança com você, com tempo para conversar, rir de alguma bobagem e descobrir o que vem depois daquele primeiro encontro.',
        finalNote: 'Voltar onde começou, dessa vez só nós dois.'
      }
    },
    activity: {
      jantar: 'Jantar sem olhar o relógio',
      passeio: 'Um passeio sem roteiro',
      filme: 'Filme, cobertor e conversa'
    },
    vibe: {
      calma: 'Sem pressa de ir embora',
      aventura: 'Risadas e pequenas aventuras',
      surpresa: 'Deixar a vida surpreender'
    }
  };
  const STEP_NAMES = ['O convite', 'A cartinha', 'O destino', 'Nosso ritmo', 'Nossa passagem'];
  const STORAGE_KEY = 'entre-nos:convite:v2';
  const screens = [...document.querySelectorAll('[data-screen]')];
  const selections = { destination: null, activity: null, vibe: null };
  let currentScreen = 0;
  let letterOpen = false;
  let announcementId = 0;
  let ticketDownloadInProgress = false;
  let ticketRequestVersion = 0;
  let ticketSaveObjectUrl = null;
  let ticketShareFile = null;
  let ticketSaveReturnFocus = null;

  const byId = id => document.getElementById(id);
  const setText = (id, value) => {
    const element = byId(id);
    if (element) element.textContent = value;
  };
  const isValidChoice = (field, value) => Object.hasOwn(DATA, field)
    && typeof value === 'string' && Object.hasOwn(DATA[field], value);
  const matchesMedia = query => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const isCompactViewport = () => matchesMedia('(max-width: 960px)');

  function announce(message) {
    const region = byId('liveAnnouncement');
    if (!region) return;
    const id = ++announcementId;
    region.textContent = '';
    window.requestAnimationFrame(() => {
      if (id === announcementId) region.textContent = message;
    });
  }

  function maximumAvailableScreen() {
    if (!letterOpen) return 1;
    if (!selections.destination) return 2;
    if (!selections.activity || !selections.vibe) return 3;
    return screens.length - 1;
  }

  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ currentScreen, letterOpen, selections }));
    } catch {
      // O convite continua funcionando quando o navegador bloqueia armazenamento.
    }
  }

  function restoreState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return false;
      for (const field of Object.keys(selections)) {
        if (isValidChoice(field, saved.selections?.[field])) selections[field] = saved.selections[field];
      }
      letterOpen = saved.letterOpen === true;
      if (Number.isInteger(saved.currentScreen)) {
        currentScreen = Math.max(0, Math.min(saved.currentScreen, maximumAvailableScreen()));
      }
      return currentScreen > 0 || letterOpen || Object.values(selections).some(Boolean);
    } catch {
      return false;
    }
  }

  function personalize() {
    document.querySelectorAll('[data-recipient]').forEach(element => {
      element.textContent = CONFIG.recipientName;
    });
    document.querySelectorAll('[data-sender]').forEach(element => {
      element.textContent = CONFIG.senderName;
    });
    document.title = `Entre nós — um convite para ${CONFIG.recipientName}`;
    byId('openLetter')?.setAttribute('aria-label', `Abrir a carta para ${CONFIG.recipientName}`);
    const personalNote = byId('personalNote');
    if (personalNote) {
      personalNote.textContent = CONFIG.personalNote.trim();
      personalNote.hidden = !CONFIG.personalNote.trim();
    }
    setText('whatsappTip', whatsappNumber()
      ? `Sua resposta vai para ${CONFIG.senderName}. Você confere a mensagem antes de enviar.`
      : `Escolha o contato de ${CONFIG.senderName} no WhatsApp e confira a mensagem antes de enviar.`);
  }

  function updateLetter() {
    byId('envelopeZone')?.classList.toggle('is-open', letterOpen);
    const button = byId('openLetter');
    if (button) {
      button.setAttribute('aria-expanded', String(letterOpen));
      button.disabled = letterOpen;
    }
    if (byId('letterContent')) byId('letterContent').hidden = !letterOpen;
    if (byId('letterNext')) byId('letterNext').hidden = !letterOpen;
  }

  function updateChoices() {
    document.querySelectorAll('[data-choice]').forEach(button => {
      const selected = selections[button.dataset.choice] === button.dataset.value;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      if (button.dataset.choice === 'destination') {
        const label = button.querySelector('[data-choice-label]');
        if (label) {
          label.textContent = selected
            ? 'Nosso destino escolhido'
            : label.dataset.idleLabel || button.dataset.idleLabel || 'Escolher esse destino';
        }
      }
    });
    document.querySelectorAll('[data-requires]').forEach(button => {
      const fields = button.dataset.requires.split(',').map(field => field.trim());
      button.disabled = !fields.every(field => Boolean(selections[field]));
    });
    const destination = DATA.destination[selections.destination];
    if (byId('destinationPreview')) byId('destinationPreview').hidden = !destination;
    setText('previewTitle', destination?.previewTitle || '');
    setText('previewText', destination?.previewText || '');
    setText('selectionHintDestination', destination
      ? 'Destino escolhido. Pode continuar.'
      : 'Escolha um destino para continuar.');
    const hasActivity = Boolean(selections.activity);
    const hasVibe = Boolean(selections.vibe);
    setText('selectionHintPlan', hasActivity && hasVibe
      ? 'Tudo escolhido. Sua passagem está pronta.'
      : hasActivity
        ? 'Escolha um combinado para continuar.'
        : hasVibe
          ? 'Escolha um programa para continuar.'
          : 'Escolha um programa e um combinado para continuar.');
  }

  function fillTicket() {
    const destination = DATA.destination[selections.destination];
    if (!destination) return;
    setText('ticketPeople', `${CONFIG.recipientName} + ${CONFIG.senderName}`);
    setText('ticketDestination', destination.title);
    setText('ticketActivity', DATA.activity[selections.activity] || 'A decidir juntos');
    setText('ticketVibe', DATA.vibe[selections.vibe] || 'A decidir juntos');
    setText('finalDestination', destination.title);
    setText('finalMessage', destination.finalMessage);
    setText('finalNote', destination.finalNote);
    setText('ticketOrigin', 'São João del-Rei');
    const image = byId('ticketImage');
    if (image) {
      image.dataset.fallback = destination.fallback;
      image.srcset = `assets/photos/${selections.destination}-480.jpg 480w, assets/photos/${selections.destination}-800.jpg 800w, ${destination.image} ${destination.width}w`;
      image.sizes = '(max-width: 960px) calc(100vw - 64px), 560px';
      image.src = destination.image;
      image.alt = `Vista de ${destination.title}, nosso destino escolhido`;
    }
    setupWhatsAppLinks();
  }

  function showScreen(index, { focus = true, persist = true } = {}) {
    if (!Number.isInteger(index) || index < 0 || index >= screens.length) return;
    const nextScreen = Math.min(index, maximumAvailableScreen());
    if (nextScreen !== currentScreen) {
      ticketRequestVersion += 1;
      closeTicketSave({ restoreFocus: false });
    }
    currentScreen = nextScreen;
    screens.forEach((screen, screenIndex) => {
      const active = screenIndex === currentScreen;
      screen.hidden = !active;
      screen.classList.toggle('is-active', active);
    });
    const progress = ((currentScreen + 1) / screens.length) * 100;
    if (byId('progressFill')) byId('progressFill').style.width = `${progress}%`;
    const progressTrack = byId('progressFill')?.parentElement;
    if (progressTrack?.getAttribute('role') === 'progressbar') {
      progressTrack.setAttribute('aria-valuenow', String(currentScreen + 1));
      progressTrack.setAttribute('aria-valuemax', String(screens.length));
      progressTrack.setAttribute('aria-valuetext', `${currentScreen + 1} de ${screens.length}: ${STEP_NAMES[currentScreen]}`);
    }
    setText('chapterLabel', `${String(currentScreen + 1).padStart(2, '0')} de ${String(screens.length).padStart(2, '0')}`);
    setText('currentStepName', STEP_NAMES[currentScreen]);
    document.querySelectorAll('[data-step-index]').forEach(step => {
      const stepIndex = Number(step.dataset.stepIndex);
      step.classList.toggle('is-current', stepIndex === currentScreen);
      step.classList.toggle('is-complete', stepIndex < currentScreen);
      if (stepIndex === currentScreen) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    document.body.dataset.chapter = String(currentScreen);
    if (currentScreen === screens.length - 1) fillTicket();
    if (focus) {
      if (byId('resumeNote')) byId('resumeNote').hidden = true;
      if (isCompactViewport()) byId('experience')?.scrollIntoView({ block: 'start', behavior: 'auto' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
      const title = screens[currentScreen].querySelector('h1, h2');
      if (title) {
        title.setAttribute('tabindex', '-1');
        title.focus({ preventScroll: true });
        announce(`${STEP_NAMES[currentScreen]}. ${title.textContent.trim()}`);
      }
    }
    if (persist) saveState();
  }

  function choose(button) {
    const field = button.dataset.choice;
    const value = button.dataset.value;
    if (!isValidChoice(field, value)) return;
    ticketRequestVersion += 1;
    selections[field] = value;
    updateChoices();
    setText('copyStatus', '');
    setText('downloadStatus', '');
    if (byId('replyText')) byId('replyText').hidden = true;
    saveState();
    const label = field === 'destination' ? DATA.destination[value].title : DATA[field][value];
    announce(`Selecionado: ${label}.`);
  }

  function openLetter() {
    if (letterOpen) return;
    letterOpen = true;
    updateLetter();
    saveState();
    const content = byId('letterContent');
    const salutation = content?.querySelector('.letter-salutation') || content;
    if (salutation) {
      salutation.setAttribute('tabindex', '-1');
      salutation.focus({ preventScroll: true });
      if (isCompactViewport()) salutation.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
    announce('Sua cartinha está aberta. Leia com carinho e continue quando quiser.');
  }

  function whatsappNumber() {
    const phone = String(CONFIG.whatsappNumber || '').replace(/\D/g, '');
    return /^\d{10,15}$/.test(phone) ? phone : '';
  }

  function replyMessage(response = 'yes') {
    const destination = DATA.destination[selections.destination]?.title || 'um cantinho de Minas';
    const activity = DATA.activity[selections.activity] || 'A decidir juntos';
    const vibe = DATA.vibe[selections.vibe] || 'A decidir juntos';
    const opening = response === 'yes'
      ? `Oi, ${CONFIG.senderName}! Eu vi seu convite e topo esse fim de semana com você. ♡`
      : `Oi, ${CONFIG.senderName}! Gostei do convite. Vamos conversar sobre a data e os detalhes? ♡`;
    return `${opening}\n\nMeu roteiro:\nDestino: ${destination}\nPrograma: ${activity}\nNosso ritmo: ${vibe}\n\nA data a gente escolhe juntos!`;
  }

  function setupWhatsAppLinks() {
    const phone = whatsappNumber();
    const base = phone ? `https://wa.me/${phone}` : 'https://api.whatsapp.com/send';
    const accept = byId('acceptLink');
    const plan = byId('planLink');
    if (accept) accept.href = `${base}?text=${encodeURIComponent(replyMessage('yes'))}`;
    if (plan) plan.href = `${base}?text=${encodeURIComponent(replyMessage('plan'))}`;
    if (byId('replyText')) byId('replyText').value = replyMessage('yes');
  }

  async function copyReply() {
    const message = replyMessage('yes');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(message);
      setText('copyStatus', `Mensagem copiada. É só enviar para ${CONFIG.senderName}.`);
      return;
    } catch {
      const textarea = byId('replyText');
      if (!textarea) {
        setText('copyStatus', 'Use um dos botões acima para abrir sua resposta no WhatsApp.');
        return;
      }
      textarea.value = message;
      textarea.hidden = false;
      textarea.readOnly = true;
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, message.length);
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* Cópia manual abaixo. */ }
      if (copied) {
        textarea.hidden = true;
        byId('copyReply')?.focus();
        setText('copyStatus', `Mensagem copiada. É só enviar para ${CONFIG.senderName}.`);
      } else {
        setText('copyStatus', 'Selecione e copie a mensagem acima.');
      }
    }
  }

  function closeTicketSave({ restoreFocus = true } = {}) {
    const dialog = byId('ticketSaveDialog');
    const hadPreview = Boolean(ticketSaveObjectUrl || dialog?.hasAttribute('open'));
    const returnFocus = ticketSaveReturnFocus;
    const objectUrl = ticketSaveObjectUrl;
    ticketSaveObjectUrl = null;
    ticketShareFile = null;
    ticketSaveReturnFocus = null;

    if (dialog) {
      if (dialog.open && !dialog.classList.contains('is-fallback') && typeof dialog.close === 'function') {
        try { dialog.close(); } catch { /* O atributo abaixo também fecha a alternativa acessível. */ }
      }
      dialog.removeAttribute('open');
      dialog.classList.remove('is-fallback');
    }
    document.body.classList.remove('is-saving-ticket');
    byId('ticketSavePreview')?.removeAttribute('src');
    byId('saveTicketFile')?.removeAttribute('href');
    const shareButton = byId('shareTicket');
    if (shareButton) {
      shareButton.hidden = true;
      shareButton.disabled = false;
      shareButton.removeAttribute('aria-busy');
    }
    setText('ticketSaveStatus', '');
    if (objectUrl && typeof URL.revokeObjectURL === 'function') {
      // Dá ao navegador tempo para iniciar um salvamento já solicitado.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
    if (restoreFocus && hadPreview) {
      const target = returnFocus?.isConnected !== false && typeof returnFocus?.focus === 'function'
        ? returnFocus : byId('downloadTicket');
      target?.focus({ preventScroll: true });
    }
  }

  function showTicketSave(prepared, details, returnFocus) {
    const dialog = byId('ticketSaveDialog');
    const preview = byId('ticketSavePreview');
    const saveLink = byId('saveTicketFile');
    if (!dialog || !preview || !saveLink || !prepared?.blob || typeof URL.createObjectURL !== 'function') {
      throw new Error('Ticket preview unavailable');
    }

    closeTicketSave({ restoreFocus: false });
    const filename = prepared.filename || 'nossa-passagem.png';
    ticketSaveObjectUrl = URL.createObjectURL(prepared.blob);
    ticketSaveReturnFocus = returnFocus;
    preview.src = ticketSaveObjectUrl;
    preview.alt = `Passagem de ${details.recipientName} e ${details.senderName} para ${details.destinationName}`;
    if (Number.isInteger(prepared.width) && prepared.width > 0) preview.width = prepared.width;
    if (Number.isInteger(prepared.height) && prepared.height > 0) preview.height = prepared.height;
    saveLink.href = ticketSaveObjectUrl;
    saveLink.download = filename;

    let canShareFile = false;
    if (typeof File === 'function' && typeof navigator.canShare === 'function' && typeof navigator.share === 'function') {
      try {
        const file = new File([prepared.blob], filename, { type: prepared.blob.type || 'image/png' });
        canShareFile = navigator.canShare({ files: [file] });
        if (canShareFile) ticketShareFile = file;
      } catch { /* Salvar a imagem continua disponível sem Web Share. */ }
    }
    const shareButton = byId('shareTicket');
    if (shareButton) shareButton.hidden = !canShareFile;
    setText('ticketSaveStatus', '');

    dialog.hidden = false;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.classList.add('is-saving-ticket');
    let fallback = typeof dialog.showModal !== 'function';
    if (!fallback) {
      try { dialog.showModal(); } catch { fallback = true; }
    }
    if (fallback) {
      dialog.classList.add('is-fallback');
      dialog.setAttribute('open', '');
    }
    byId('closeTicketSave')?.focus({ preventScroll: true });
  }

  function shareTicket() {
    const file = ticketShareFile;
    const button = byId('shareTicket');
    if (!file || !button || button.disabled || typeof navigator.share !== 'function') return;
    const previousStatus = byId('ticketSaveStatus')?.textContent || '';
    const isCurrentPreview = () => ticketShareFile === file && Boolean(ticketSaveObjectUrl);
    const restoreButton = () => {
      if (!isCurrentPreview()) return;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    };
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');

    try {
      // Invocação direta no toque: preserva a ativação exigida pelo Web Share.
      const sharing = navigator.share({ files: [file], title: 'Nossa passagem' });
      Promise.resolve(sharing).then(() => {
        if (isCurrentPreview()) setText('ticketSaveStatus', 'Pronto! Você também pode salvar a imagem aqui.');
      }, error => {
        if (!isCurrentPreview()) return;
        setText('ticketSaveStatus', error?.name === 'AbortError'
          ? previousStatus
          : 'Você ainda pode usar “Baixar imagem” ou manter a passagem pressionada para guardar.');
      }).finally(restoreButton);
    } catch (error) {
      if (isCurrentPreview()) {
        setText('ticketSaveStatus', error?.name === 'AbortError'
          ? previousStatus
          : 'Você ainda pode usar “Baixar imagem” ou manter a passagem pressionada para guardar.');
      }
      restoreButton();
    }
  }

  function keepFallbackDialogFocus(event) {
    const dialog = byId('ticketSaveDialog');
    if (!dialog?.classList.contains('is-fallback') || !dialog.hasAttribute('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeTicketSave();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')]
      .filter(element => !element.hidden && !element.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  }

  async function downloadTicket() {
    const button = byId('downloadTicket');
    if (!button || ticketDownloadInProgress) return;
    const complete = Object.entries(selections).every(([field, value]) => isValidChoice(field, value));
    if (!complete) {
      setText('downloadStatus', 'Escolha o destino, o programa e o nosso ritmo para guardar a passagem.');
      return;
    }

    const destination = DATA.destination[selections.destination];
    const label = byId('downloadTicketLabel');
    const originalLabel = label?.textContent || 'Guardar nossa passagem';
    const originalDisabled = button.disabled;
    const returnFocus = document.activeElement;
    const requestVersion = ++ticketRequestVersion;
    ticketDownloadInProgress = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (label) label.textContent = 'Preparando sua passagem…';
    setText('downloadStatus', '');

    try {
      const details = {
        recipientName: CONFIG.recipientName,
        senderName: CONFIG.senderName,
        destinationKey: selections.destination,
        destinationName: destination.title,
        activity: DATA.activity[selections.activity],
        vibe: DATA.vibe[selections.vibe],
        origin: 'São João del-Rei'
      };
      const usePreview = (isCompactViewport() || matchesMedia('(pointer: coarse)'))
        && typeof window.TicketExporter?.prepare === 'function';
      if (usePreview) {
        const prepared = await window.TicketExporter.prepare(details);
        if (requestVersion !== ticketRequestVersion || currentScreen !== screens.length - 1) return;
        showTicketSave(prepared, details, returnFocus === button ? returnFocus : button);
      } else {
        if (typeof window.TicketExporter?.download !== 'function') throw new Error('Ticket exporter unavailable');
        await window.TicketExporter.download(details);
      }
      if (requestVersion !== ticketRequestVersion) return;
      setText('downloadStatus', 'Sua passagem está pronta para guardar. ♡');
    } catch {
      if (requestVersion === ticketRequestVersion) {
        closeTicketSave({ restoreFocus: false });
        setText('downloadStatus', 'Não consegui preparar a passagem agora. Toque em guardar para tentar de novo.');
      }
    } finally {
      ticketDownloadInProgress = false;
      button.disabled = originalDisabled;
      button.removeAttribute('aria-busy');
      if (label) label.textContent = originalLabel;
    }
  }

  function resetExperience() {
    ticketRequestVersion += 1;
    closeTicketSave({ restoreFocus: false });
    Object.keys(selections).forEach(field => { selections[field] = null; });
    letterOpen = false;
    currentScreen = 0;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Armazenamento opcional. */ }
    updateLetter();
    updateChoices();
    setText('copyStatus', '');
    setText('downloadStatus', '');
    if (byId('replyText')) byId('replyText').hidden = true;
    if (byId('resumeNote')) byId('resumeNote').hidden = true;
    showScreen(0, { persist: false });
  }

  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const choice = event.target.closest('[data-choice]');
    if (choice && !choice.disabled) return choose(choice);
    const next = event.target.closest('[data-next]');
    if (next && !next.disabled) return showScreen(currentScreen + 1);
    const back = event.target.closest('[data-back]');
    if (back && !back.disabled) return showScreen(currentScreen - 1);
  });
  byId('openLetter')?.addEventListener('click', openLetter);
  byId('goToStart')?.addEventListener('click', event => {
    event.preventDefault();
    showScreen(0);
  });
  byId('editChoices')?.addEventListener('click', () => showScreen(2));
  byId('restartButton')?.addEventListener('click', resetExperience);
  byId('copyReply')?.addEventListener('click', copyReply);
  byId('downloadTicket')?.addEventListener('click', downloadTicket);
  byId('shareTicket')?.addEventListener('click', shareTicket);
  byId('closeTicketSave')?.addEventListener('click', () => closeTicketSave());
  byId('ticketSaveDialog')?.addEventListener('cancel', event => {
    event.preventDefault();
    closeTicketSave();
  });
  byId('ticketSaveDialog')?.addEventListener('close', () => {
    if (!byId('ticketSaveDialog')?.open) closeTicketSave();
  });
  byId('ticketSaveDialog')?.addEventListener('keydown', keepFallbackDialogFocus);

  // Cada foto tem uma ilustração local de reserva, inclusive offline.
  document.querySelectorAll('img[data-fallback]').forEach(image => {
    const useFallback = () => {
      const fallback = image.dataset.fallback;
      if (!fallback) return;
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
      if (fallback && image.getAttribute('src') !== fallback) image.src = fallback;
    };
    image.addEventListener('error', useFallback);
    if (image.complete && image.naturalWidth === 0) useFallback();
  });

  const restored = restoreState();
  personalize();
  updateLetter();
  updateChoices();
  setupWhatsAppLinks();
  if (byId('resumeNote')) byId('resumeNote').hidden = !restored;
  showScreen(currentScreen, { focus: false });
})();
