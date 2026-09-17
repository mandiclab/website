// Gallery lightbox (DJC-DIY, drivepad). Ported from the concept:
// - role="dialog" + aria-modal; everything behind it is hidden from assistive
//   tech while it is open; Tab and Shift+Tab stay inside it
// - focus goes to the close button on open and back to the tile it was
//   opened from on close
// - Escape closes, Left/Right and swipe move between photos, clicking the
//   backdrop closes
// - moving between photos fades the whole content — photo and the text beside
//   it — out and back in; the arrows and the close mark stay put, and the new
//   photo takes its size while nothing is showing, so no shape jumps
// Only tiles that contain an image take part.

(function () {
  var grid = document.querySelector('.gallery-grid');
  if (!grid) return;
  var host = grid.closest('.gallery') || grid.parentNode;
  var tiles = Array.prototype.slice.call(grid.querySelectorAll('.shot'));
  var FADE_MS = 300;   // --dur-base, the time the content takes to fade

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    for (var k in attrs || {}) node.setAttribute(k, attrs[k]);
    return node;
  }

  function shots() {
    return tiles.map(function (btn) {
      var img = btn.querySelector('img');
      if (!img || !img.getAttribute('src')) return null;
      return {
        btn: btn,
        src: img.currentSrc || img.src,
        alt: img.getAttribute('alt') || '',
        w: img.naturalWidth || Number(img.getAttribute('width')) || 0,
        h: img.naturalHeight || Number(img.getAttribute('height')) || 0
      };
    }).filter(Boolean);
  }

  // ── Photo notes (.md next to the photo) ─────────────────────────────────
  // A photo can have a text file with the same name (1.webp → 1.md). Lines
  // like "instagram: name" become a link with that platform's icon, and the
  // rest of the file becomes paragraphs. No file, or an empty one, means no
  // text beside the photo and the photo sits in the middle instead.

  var PLATFORMS = {
    instagram: 'https://www.instagram.com/{h}/',
    youtube: 'https://www.youtube.com/@{h}',
    tiktok: 'https://www.tiktok.com/@{h}',
    github: 'https://github.com/{h}',
    'ko-fi': 'https://ko-fi.com/{h}',
    discord: ''    // a username has no page; only a link is used as given
  };

  var notes = {};   // src → { links: [], paras: [] } once loaded

  function noteUrl(src) {
    return src.split('#')[0].split('?')[0].replace(/\.[a-z0-9]+$/i, '.md');
  }

  function parseNote(text) {
    var out = { links: [], paras: [] }, rest = [];
    text.split(/\r?\n/).forEach(function (line) {
      var m = /^\s*([a-z][a-z-]*)\s*:\s*(.+?)\s*$/i.exec(line);
      var key = m ? m[1].toLowerCase().replace('kofi', 'ko-fi') : null;
      if (!m || !(key in PLATFORMS)) { rest.push(line); return; }
      var value = m[2], href = '', handle = value;
      if (/^https?:\/\//i.test(value)) {
        href = value;
        handle = value.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
      } else {
        handle = '@' + value.replace(/^@/, '');
        if (PLATFORMS[key]) href = PLATFORMS[key].replace('{h}', encodeURIComponent(value.replace(/^@/, '')));
      }
      out.links.push({ platform: key, href: href, handle: handle });
    });
    rest.join('\n').split(/\n\s*\n/).forEach(function (block) {
      var p = block.replace(/\s*\n\s*/g, ' ').trim();
      if (p) out.paras.push(p);
    });
    return out;
  }

  function ensureNote(src, done) {
    if (!src || notes[src]) { if (done) done(); return; }
    notes[src] = { links: [], paras: [] };   // nothing until the file answers
    if (typeof fetch !== 'function') { if (done) done(); return; }
    fetch(noteUrl(src), { cache: 'no-cache' })
      .then(function (res) { return res.ok ? res.text() : ''; })
      .catch(function () { return ''; })
      .then(function (text) {
        if (text) notes[src] = parseNote(text);
        if (done) done();
      });
  }

  function infoOf(entry) {
    return (entry && notes[entry.src]) || { links: [], paras: [] };
  }

  var st = null;          // open state, null when closed
  var dom = null;         // lightbox elements while mounted
  var returnTo = null;
  var closing = false;
  var closeTimer = null, fadeTimer = null;
  var hiddenBehind = [];
  var touchX = null;

  // ── Mount / unmount ─────────────────────────────────────────────────────

  function mount() {
    if (dom) return;
    var dialog = el('div', 'lightbox', { role: 'dialog', 'aria-modal': 'true', tabindex: '-1' });
    var comp = el('div', 'lb-comp');
    var stage = el('div', 'lb-stage');
    var photo = el('img', 'lb-photo', { alt: '' });
    var closeBtn = el('button', 'lb-close', { type: 'button', 'aria-label': 'Close' });
    var x = el('span', 'lb-x');
    x.appendChild(el('span'));
    x.appendChild(el('span'));
    closeBtn.appendChild(x);
    stage.appendChild(photo);
    comp.appendChild(stage);
    var prev = el('button', 'lb-edge lb-prev', { type: 'button', 'aria-label': 'Previous image' });
    prev.appendChild(el('span'));
    var next = el('button', 'lb-edge lb-next', { type: 'button', 'aria-label': 'Next image' });
    next.appendChild(el('span'));
    dialog.appendChild(comp);
    dialog.appendChild(prev);
    dialog.appendChild(next);
    dialog.appendChild(closeBtn);

    dom = { dialog: dialog, comp: comp, stage: stage, photo: photo, closeBtn: closeBtn, prev: prev, next: next, info: null, infoKey: null };

    dialog.addEventListener('click', function (e) { e.preventDefault(); close(); });
    stage.addEventListener('click', function (e) { e.stopPropagation(); });
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    prev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    dialog.addEventListener('keydown', trapTab);
    dialog.addEventListener('touchstart', function (e) {
      touchX = e.touches && e.touches[0] ? e.touches[0].clientX : null;
    }, { passive: true });
    dialog.addEventListener('touchend', function (e) {
      var end = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
      if (touchX === null || end === null) return;
      var dx = end - touchX;
      touchX = null;
      if (Math.abs(dx) > 48) { e.stopPropagation(); step(dx > 0 ? -1 : 1); }
    });

    host.appendChild(dialog);
    hideBehind(dialog);
    requestAnimationFrame(function () { if (dom) (dom.closeBtn || dom.dialog).focus(); });
  }

  function unmount() {
    if (!dom) return;
    showBehind();
    dom.dialog.remove();
    dom = null;
  }

  // Hides everything outside the dialog from assistive tech; restored on close.
  function hideBehind(modal) {
    showBehind();
    var node = modal;
    while (node && node.parentNode && node.parentNode.nodeType === 1) {
      var sibs = node.parentNode.children;
      for (var i = 0; i < sibs.length; i++) {
        var s = sibs[i];
        if (s === node || /^(SCRIPT|STYLE|LINK|HEAD)$/.test(s.tagName)) continue;
        if (s.getAttribute('aria-hidden') === 'true') continue;
        s.setAttribute('aria-hidden', 'true');
        hiddenBehind.push(s);
      }
      node = node.parentNode;
    }
  }

  function showBehind() {
    hiddenBehind.forEach(function (s) { s.removeAttribute('aria-hidden'); });
    hiddenBehind = [];
  }

  function trapTab(e) {
    if (e.key !== 'Tab' || !dom) return;
    var root = dom.dialog;
    var nodes = root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
    var f = Array.prototype.filter.call(nodes, function (n) { return n.offsetWidth > 0 || n.offsetHeight > 0 || n === document.activeElement; });
    if (!f.length) { e.preventDefault(); root.focus(); return; }
    var first = f[0], last = f[f.length - 1], act = document.activeElement;
    if (e.shiftKey) {
      if (act === first || act === root || !root.contains(act)) { e.preventDefault(); last.focus(); }
    } else if (act === last || act === root || !root.contains(act)) { e.preventDefault(); first.focus(); }
  }

  // ── Open / close ────────────────────────────────────────────────────────

  function open(at, fromTile) {
    var list = shots();
    if (!list.length) return;
    clearTimeout(closeTimer);
    clearTimeout(fadeTimer);
    closing = false;
    returnTo = fromTile || null;
    document.body.style.overflow = 'hidden';
    st = { lb: at, vis: false, fading: false };
    mount();
    dom.dialog.classList.remove('is-fading');
    preload(list, at);
    ensureNote(list[at].src, function () { if (st && !closing) render(); });
    render();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (st && !closing) { st.vis = true; render(); } });
    });
  }

  function close() {
    if (!st || closing) return;
    closing = true;
    clearTimeout(fadeTimer);
    document.body.style.overflow = '';
    showBehind();
    var back = returnTo;
    returnTo = null;
    if (back && back.isConnected) {
      // Tiles are buttons and already focusable; only make other elements focusable.
      if (back.tabIndex < 0 && !back.hasAttribute('tabindex')) back.setAttribute('tabindex', '-1');
      back.focus();
    }
    st.vis = false;
    render();
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () { unmount(); st = null; closing = false; }, 400);
  }

  function preload(list, i) {
    [-1, 1].forEach(function (d) {
      var e = list[(i + d + list.length) % list.length];
      if (e && e.src) { var im = new Image(); im.src = e.src; ensureNote(e.src); }
    });
  }

  // ── Moving between photos ───────────────────────────────────────────────
  // The content fades out, the next photo and its text take its place while
  // nothing is showing, and it all fades back in. Clicking again during the
  // fade just moves on further, so a burst of clicks lands on the right photo.

  function step(dir) {
    if (!st || closing) return;
    var list = shots();
    if (list.length < 2) return;
    st.lb = ((st.lb + dir) % list.length + list.length) % list.length;
    preload(list, st.lb);
    var next = list[st.lb].src;
    if (st.fading) {          // already on its way out; it will pick this up
      ensureNote(next);
      return;
    }

    // The fade has to be under way before anything else can redraw, or a note
    // that is already at hand would swap the photo in on the spot.
    st.fading = true;
    dom.dialog.classList.add('is-fading');
    ensureNote(next, function () { if (st && !closing && !st.fading) render(); });
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(function () {
      if (!st || closing) return;
      render();               // swap photo and text while nothing is showing
      st.fading = false;

      // Fade back in only once the new photo can actually be drawn. Until then
      // the <img> still shows the old one, which looked like the two flickering
      // over each other.
      var photo = dom.photo, shown = false;
      function fadeIn() {
        if (shown) return;
        shown = true;
        clearTimeout(fadeTimer);
        if (st && !closing && dom) dom.dialog.classList.remove('is-fading');
      }
      fadeTimer = setTimeout(fadeIn, 600);      // never wait for ever
      if (photo.decode) photo.decode().then(fadeIn, fadeIn);
      else if (photo.complete && photo.naturalWidth) fadeIn();
      else photo.addEventListener('load', fadeIn, { once: true });
    }, FADE_MS);
  }

  // ── Render ──────────────────────────────────────────────────────────────

  function render() {
    if (!dom || !st) return;
    var list = shots();
    var n = list.length;
    if (!n) return;
    var idx = ((Number(st.lb) || 0) % n + n) % n;
    var entry = list[idx];
    var meta = infoOf(entry);
    var hasInfo = !!(meta.links.length || meta.paras.length);
    var vw = window.innerWidth, vh = window.innerHeight;
    var narrow = vw < 820;
    var infoPx = Math.round(Math.min(380, Math.max(320, vw * 0.26)));
    var gapPx = Math.round(Math.min(54, Math.max(24, vw * 0.03)));
    // The photo keeps air around it instead of filling the screen, and on a
    // large monitor it stops growing at these caps.
    var maxW = Math.min(vw * (narrow ? 0.88 : 0.80), 1440);
    var maxH = Math.min(vh * (narrow ? 0.68 : 0.78), 900);
    var availW = hasInfo && !narrow ? Math.min(maxW, vw * 0.92 - infoPx - gapPx) : maxW;
    var availH = hasInfo && narrow ? Math.min(maxH, vh * 0.86 - 200 - gapPx) : maxH;

    dom.dialog.setAttribute('aria-label', 'Gallery image ' + (idx + 1) + ' of ' + n);
    dom.dialog.classList.toggle('is-visible', st.vis);

    var k = entry.w && entry.h ? Math.min(availW / entry.w, availH / entry.h) : 0;
    if (dom.photo.getAttribute('src') !== entry.src) dom.photo.setAttribute('src', entry.src);
    dom.photo.alt = entry.alt;
    setStyle(dom.photo, {
      width: k ? Math.round(entry.w * k) + 'px' : 'auto',
      height: k ? Math.round(entry.h * k) + 'px' : 'auto',
      maxWidth: Math.round(availW) + 'px',
      maxHeight: Math.round(availH) + 'px'
    });

    if (hasInfo) {
      if (!dom.info) {
        dom.info = el('div', 'lb-info');
        dom.info.addEventListener('click', function (e) { e.stopPropagation(); });
        dom.comp.appendChild(dom.info);
      }
      if (dom.infoKey !== entry.src) {
        dom.infoKey = entry.src;
        dom.info.textContent = '';
        if (meta.links.length) {
          var links = el('div', 'lb-links');
          meta.links.forEach(function (l) {
            // Without an address it is just the icon and the name, not a link.
            var a = el(l.href ? 'a' : 'div', null, l.href ? { href: l.href, target: '_blank', rel: 'noopener noreferrer' } : null);
            var icon = el('span', 'lb-link-icon');
            if (l.platform) icon.style.setProperty('--icon', "url('/assets/socials/" + l.platform + ".svg')");
            a.appendChild(icon);
            a.appendChild(document.createTextNode(l.handle));
            links.appendChild(a);
          });
          dom.info.appendChild(links);
        }
        meta.paras.forEach(function (text) {
          var p = el('p', 'lb-desc');
          p.textContent = text;
          dom.info.appendChild(p);
        });
      }
      dom.info.style.width = narrow ? 'min(100%,480px)' : infoPx + 'px';
    } else if (dom.info) {
      dom.info.remove();
      dom.info = null;
      dom.infoKey = null;
    }
  }

  function setStyle(node, styles) {
    for (var k in styles) node.style[k] = styles[k];
  }

  // ── Wiring ──────────────────────────────────────────────────────────────

  tiles.forEach(function (tile) {
    tile.addEventListener('click', function () {
      var list = shots();
      var at = -1;
      for (var i = 0; i < list.length; i++) if (list[i].btn === tile) at = i;
      if (at < 0) return;   // empty placeholder tile
      open(at, tile);
    });
  });

  window.addEventListener('keydown', function (e) {
    if (!st || closing) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  window.addEventListener('resize', function () { if (st) render(); });
})();
