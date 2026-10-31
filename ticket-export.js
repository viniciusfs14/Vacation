/* Exporta uma lembrança em PNG sem capturar a tela nem depender de serviços externos. */
(() => {
  'use strict';

  const scriptUrl = document.currentScript?.src || document.baseURI;
  const photosUrl = new URL('assets/ticket-photos.js', scriptUrl).href;
  const COLORS = {
    paper: '#f7f5ee', white: '#fffef9', ink: '#243c32', muted: '#70776a',
    accent: '#a64e35', line: '#dcded1', sage: '#e9ecdf'
  };
  const WIDTH = 1080;
  let photosPromise;
  let activeDownload;

  function loadPhotos() {
    if (window.TicketPhotoAssets) return Promise.resolve(window.TicketPhotoAssets);
    if (photosPromise) return photosPromise;
    photosPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = window.setTimeout(() => finish(new Error('As fotografias não carregaram.')), 15000);
      function finish(error) {
        window.clearTimeout(timeout);
        script.onload = null;
        script.onerror = null;
        if (error) {
          script.remove();
          reject(error);
        } else {
          resolve(window.TicketPhotoAssets);
        }
      }
      script.src = photosUrl;
      script.async = true;
      script.onload = () => finish(window.TicketPhotoAssets ? null : new Error('Fotografias indisponíveis.'));
      script.onerror = () => finish(new Error('Não foi possível abrir as fotografias da passagem.'));
      document.head.appendChild(script);
    }).catch(error => {
      photosPromise = null;
      throw error;
    });
    return photosPromise;
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timeout = window.setTimeout(() => finish(new Error('A fotografia demorou para abrir.')), 15000);
      function finish(error) {
        window.clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
        if (error) reject(error);
        else resolve(image);
      }
      image.onload = () => finish(image.naturalWidth ? null : new Error('Fotografia inválida.'));
      image.onerror = () => finish(new Error('Não foi possível preparar a fotografia.'));
      // Uma imagem de dados local mantém o canvas exportável também em file://.
      image.src = source;
    });
  }

  function clean(value, fallback) {
    return typeof value === 'string' && value.trim()
      ? value.replace(/\s+/g, ' ').trim().slice(0, 180)
      : fallback;
  }

  function wrap(context, value, maxWidth) {
    const lines = [];
    let line = '';
    for (const word of String(value).split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const character of word) {
        if (line && context.measureText(line + character).width > maxWidth) {
          lines.push(line);
          line = character;
        } else line += character;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function block(context, value, x, y, maxWidth, font, lineHeight, color = COLORS.ink, draw = true) {
    context.font = font;
    const lines = wrap(context, value, maxWidth);
    if (draw) {
      context.fillStyle = color;
      context.textBaseline = 'top';
      lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
    }
    return lines.length * lineHeight;
  }

  function label(context, value, x, y, color = COLORS.muted) {
    context.font = '16px Arial, sans-serif';
    context.textBaseline = 'top';
    context.fillStyle = color;
    let position = x;
    for (const character of value) {
      context.fillText(character, position, y);
      position += context.measureText(character).width + 2;
    }
  }

  function rule(context, y, dashed = false) {
    context.save();
    context.strokeStyle = COLORS.line;
    context.lineWidth = 2;
    if (dashed) context.setLineDash([7, 8]);
    context.beginPath();
    context.moveTo(88, y);
    context.lineTo(992, y);
    context.stroke();
    context.restore();
  }

  function heart(context, x, y, size, color = COLORS.accent) {
    context.save();
    context.translate(x, y);
    context.scale(size / 24, size / 24);
    context.strokeStyle = color;
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(12, 21);
    context.bezierCurveTo(-5, 10, 0, -2, 12, 7);
    context.bezierCurveTo(24, -2, 29, 10, 12, 21);
    context.stroke();
    context.restore();
  }

  function cover(context, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    context.drawImage(image,
      (image.naturalWidth - sourceWidth) / 2, (image.naturalHeight - sourceHeight) / 2,
      sourceWidth, sourceHeight, x, y, width, height);
  }

  function makeCanvas(options, asset, image) {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Seu navegador não conseguiu criar a passagem.');

    const destination = clean(options.destinationName, 'Nosso próximo destino');
    const people = `${clean(options.recipientName, 'Você')} + ${clean(options.senderName, 'Eu')}`;
    const origin = clean(options.origin, 'São João del-Rei');
    const activity = clean(options.activity, 'A decidir juntos');
    const vibe = clean(options.vibe, 'A decidir juntos');
    const routeY = 586;
    const originHeight = block(context, origin, 92, routeY + 31, 315, '34px Georgia, serif', 43, COLORS.ink, false);
    const destinationHeight = block(context, destination, 491, routeY + 27, 495, '50px Georgia, serif', 59, COLORS.ink, false);
    const routeBottom = routeY + Math.max(31 + originHeight, 27 + destinationHeight);
    const peopleY = routeBottom + 58;
    const peopleHeight = block(context, people, 92, peopleY + 29, 894, 'italic 43px Georgia, serif', 52, COLORS.ink, false);
    const fieldsY = peopleY + 29 + peopleHeight + 35;
    const activityHeight = block(context, activity, 92, fieldsY + 29, 416, '30px Georgia, serif', 39, COLORS.ink, false);
    const vibeHeight = block(context, vibe, 568, fieldsY + 29, 418, '30px Georgia, serif', 39, COLORS.ink, false);
    const dateY = fieldsY + 29 + Math.max(activityHeight, vibeHeight) + 34;
    const stampY = dateY + 96;
    const tearY = stampY + 93;
    const ticketBottom = tearY + 117;
    const creditsY = ticketBottom + 39;
    const source = decodeURI(asset.sourceUrl).replace(/^https:\/\//, '');
    const credits = [
      `Fotografia: ${asset.title} — ${asset.author}.`,
      `Fonte: ${source}`,
      `Licença da fotografia: ${asset.license} · creativecommons.org/licenses/by-sa/4.0/`,
      'Foto redimensionada, comprimida e recortada para esta lembrança.'
    ];
    const creditHeights = credits.map(text => block(context, text, 62, 0, 956, '14px Arial, sans-serif', 20, COLORS.muted, false));
    canvas.height = Math.max(1500, Math.ceil(creditsY + creditHeights.reduce((sum, height) => sum + height + 7, 0) + 38));

    context.fillStyle = COLORS.paper;
    context.fillRect(0, 0, WIDTH, canvas.height);
    context.fillStyle = '#e8e9dc';
    context.fillRect(59, 57, 970, ticketBottom - 40);
    context.fillStyle = COLORS.white;
    context.fillRect(48, 46, 978, ticketBottom - 46);
    context.strokeStyle = COLORS.line;
    context.lineWidth = 2;
    context.strokeRect(48, 46, 978, ticketBottom - 46);

    block(context, 'entre nós.', 90, 78, 400, 'bold 48px Georgia, serif', 58);
    label(context, 'PASSAGEM PARA DOIS', 656, 96);
    heart(context, 953, 90, 25);
    cover(context, image, 70, 166, 934, 365);
    const shade = context.createLinearGradient(0, 365, 0, 531);
    shade.addColorStop(0, 'rgba(24, 48, 34, 0)');
    shade.addColorStop(1, 'rgba(24, 48, 34, .75)');
    context.fillStyle = shade;
    context.fillRect(70, 365, 934, 166);
    label(context, 'O PRÓXIMO CAPÍTULO DA NOSSA HISTÓRIA', 95, 493, COLORS.white);

    label(context, 'ONDE COMEÇOU', 92, routeY, COLORS.accent);
    block(context, origin, 92, routeY + 31, 315, '34px Georgia, serif', 43);
    label(context, 'PRÓXIMA LEMBRANÇA', 491, routeY, COLORS.accent);
    block(context, destination, 491, routeY + 27, 495, '50px Georgia, serif', 59);
    context.strokeStyle = COLORS.accent;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(425, routeY + 57);
    context.lineTo(465, routeY + 57);
    context.moveTo(454, routeY + 46);
    context.lineTo(465, routeY + 57);
    context.lineTo(454, routeY + 68);
    context.stroke();
    rule(context, routeBottom + 28);

    label(context, 'BOAS COMPANHIAS', 92, peopleY);
    block(context, people, 92, peopleY + 29, 894, 'italic 43px Georgia, serif', 52);
    label(context, 'O PROGRAMA', 92, fieldsY);
    block(context, activity, 92, fieldsY + 29, 416, '30px Georgia, serif', 39);
    label(context, 'O COMBINADO', 568, fieldsY);
    block(context, vibe, 568, fieldsY + 29, 418, '30px Georgia, serif', 39);
    label(context, 'DATA DE PARTIDA', 92, dateY);
    block(context, 'A gente escolhe juntos', 92, dateY + 29, 894, '32px Georgia, serif', 42);

    context.fillStyle = COLORS.sage;
    context.fillRect(91, stampY, 896, 59);
    context.save();
    context.strokeStyle = '#b3bfa6';
    context.setLineDash([5, 5]);
    context.strokeRect(98, stampY + 7, 882, 45);
    context.restore();
    heart(context, 119, stampY + 18, 23);
    const stampText = 'DO FUSCAS LANCHES PARA O MUNDO';
    context.font = '16px Arial, sans-serif';
    const stampWidth = context.measureText(stampText).width + (stampText.length - 1) * 2;
    label(context, stampText, (WIDTH - stampWidth) / 2, stampY + 22, COLORS.accent);
    heart(context, 935, stampY + 18, 23);
    rule(context, tearY, true);
    context.fillStyle = COLORS.paper;
    for (const x of [49, 1025]) {
      context.beginPath();
      context.arc(x, tearY, 17, 0, Math.PI * 2);
      context.fill();
    }
    block(context, 'Pouca bagagem. Muita história.', 92, tearY + 34, 640, 'italic 27px Georgia, serif', 36, COLORS.accent);
    label(context, 'FEITO COM CARINHO', 92, tearY + 77);
    context.fillStyle = COLORS.ink;
    let barcodeX = 791;
    for (let index = 0; index < 29; index++) {
      const barWidth = [2, 4, 2, 6, 3, 2, 5][index % 7];
      context.fillRect(barcodeX, tearY + 34, barWidth, 45);
      barcodeX += barWidth + [3, 2, 4][index % 3];
    }

    let creditY = creditsY;
    credits.forEach((text, index) => {
      block(context, text, 62, creditY, 956, '14px Arial, sans-serif', 20, COLORS.muted);
      creditY += creditHeights[index] + 7;
    });
    return canvas;
  }

  function pngBlob(canvas) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível criar o arquivo PNG.')), 'image/png');
      } catch (error) { reject(error); }
    });
  }

  async function prepare(options) {
    const assets = await loadPhotos();
    const asset = Object.hasOwn(assets, options.destinationKey) ? assets[options.destinationKey] : null;
    if (!asset) throw new Error('Escolha um destino antes de guardar a passagem.');
    const image = await loadImage(asset.dataUri);
    const canvas = makeCanvas(options, asset, image);
    const blob = await pngBlob(canvas);
    const slug = clean(options.destinationKey, 'minas').replace(/[^a-z0-9-]/gi, '').slice(0, 50) || 'minas';
    // Preparar o arquivo não inicia download nem cria URLs: a interface decide
    // se vai mostrar uma prévia, compartilhar ou salvar após um novo toque.
    return { blob, filename: `nossa-passagem-${slug}.png`, width: canvas.width, height: canvas.height };
  }

  async function createDownload(options) {
    const prepared = await prepare(options);
    const { blob, filename, width, height } = prepared;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    try {
      link.href = url;
      link.download = filename;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      // Dá tempo ao navegador para iniciar o download antes de liberar a URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    return { filename, width, height };
  }

  window.TicketExporter = Object.freeze({
    prepare(options = {}) {
      return prepare(options);
    },
    download(options = {}) {
      if (activeDownload) return activeDownload;
      activeDownload = createDownload(options).finally(() => { activeDownload = null; });
      return activeDownload;
    }
  });
})();
