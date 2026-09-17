// Gallery lightbox (DJC-DIY). Ported from the concept:
// - role="dialog" + aria-modal; everything behind it is hidden from assistive
//   tech while it is open; Tab and Shift+Tab stay inside it
// - focus goes to the close button on open and back to the tile it was
//   opened from on close
// - Escape closes, Left/Right and swipe move between photos, clicking the
//   backdrop closes
// - photos slide between two layers; clicking again mid-slide shortens the
//   running slide and queues the next one, which then runs faster
// Only tiles that contain an image take part.

(function () {
  var grid = document.querySelector('.gallery-grid');
  if (!grid) return;
  var host = grid.closest('.gallery') || grid.parentNode;
  var tiles = Array.prototype.slice.call(grid.querySelectorAll('.shot'));
  var EASE = 'cubic-bezier(.16,1,.3,1)';

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    for (var k in attrs || {}) node.setAttribute(k, attrs[k]);
    return node;
  }

  function raf2(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }

  function shots() {
    return tiles.map(function (btn) {
      var img = btn.querySelector('img');
      if (!img || !img.getAttribute('src')) return null;
      return {
        btn: btn,
        src: img.currentSrc || img.src,
        alt: img.getAttribute('alt') || '',
        w: img.naturalWidth || Number(img.getAttribute('width')) || 0,
        h: img.naturalHeight || Number(img.getAttribute('height')) || 0,
        info: btn.querySelector('template.shot-info')
      };
    }).filter(Boolean);
  }

  // Optional credit links and description for a photo.
  function infoOf(entry) {
    var out = { links: [], desc: '' };
    if (!entry || !entry.info) return out;
    var frag = entry.info.content;
    out.links = Array.prototype.map.call(frag.querySelectorAll('a'), function (a) {
      return { href: a.getAttribute('href'), handle: a.textContent.trim(), platform: a.getAttribute('data-platform') };
    });
    var p = frag.querySelector('p');
    out.desc = p ? p.textContent.trim() : '';
    return out;
  }

  var st = null;          // open state, null when closed
  var dom = null;         // lightbox elements while mounted
  var returnTo = null;
  var closing = false;
  var closeTimer = null, swapTimer = null;
  var swapping = false, swapAt = 0, queue = [], fromSlot = null;
  var hiddenBehind = [];
  var touchX = null;

  // ── Mount / unmount ─────────────────────────────────────────────────────

  function mount() {
    if (dom) return;
    var dialog = el('div', 'lightbox', { role: 'dialog', 'aria-modal': 'true', tabindex: '-1' });
    var comp = el('div', 'lb-comp');
    var stage = el('div', 'lb-stage');
    var sizer = el('img', 'lb-sizer', { alt: '' });
    var closeBtn = el('button', 'lb-close', { type: 'button', 'aria-label': 'Close' });
    var x = el('span', 'lb-x');
    x.appendChild(el('span'));
    x.appendChild(el('span'));
    closeBtn.appendChild(x);
    stage.appendChild(sizer);
    stage.appendChild(closeBtn);
    comp.appendChild(stage);
    var prev = el('button', 'lb-edge lb-prev', { type: 'button', 'aria-label': 'Previous image' });
    prev.appendChild(el('span'));
    var next = el('button', 'lb-edge lb-next', { type: 'button', 'aria-label': 'Next image' });
    next.appendChild(el('span'));
    dialog.appendChild(comp);
    dialog.appendChild(prev);
    dialog.appendChild(next);

    dom = { dialog: dialog, comp: comp, stage: stage, sizer: sizer, closeBtn: closeBtn, prev: prev, next: next, layerA: null, layerB: null, info: null, infoKey: null, ro: null };

    dialog.addEventListener('click', function (e) { e.preventDefault(); close(); });
    stage.addEventListener('click', function (e) { e.stopPropagation(); });
    closeBtn.addEventListener('click', function (e) { e.preventDefault(); close(); });
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
    sizer.addEventListener('load', measure);
    if (typeof ResizeObserver !== 'undefined') {
      dom.ro = new ResizeObserver(measure);
      dom.ro.observe(sizer);
    }

    host.appendChild(dialog);
    hideBehind(dialog);
    requestAnimationFrame(function () { if (dom) (dom.closeBtn || dom.dialog).focus(); });
  }

  function unmount() {
    if (!dom) return;
    if (dom.ro) dom.ro.disconnect();
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
    closing = false;
    returnTo = fromTile || null;
    document.body.style.overflow = 'hidden';
    st = { lb: at, vis: false, slot: 'a', srcA: list[at].src, phaseA: 'rest', dirA: 1, srcB: null, phaseB: null, dirB: 1, durT: 1000, durO: 760, iw: 0, ih: 0 };
    queue = [];
    swapping = false;
    clearTimeout(swapTimer);
    if (dom) { removeLayer('A'); removeLayer('B'); hideBehind(dom.dialog); }
    mount();
    preload(list, at);
    render();
    raf2(function () { if (st && !closing) { st.vis = true; render(); } });
  }

  function close() {
    if (!st || closing) return;
    closing = true;
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
      if (e && e.src) { var im = new Image(); im.src = e.src; }
    });
  }

  // ── Moving between photos ───────────────────────────────────────────────
  // The outgoing layer drifts against the direction of travel and fades while
  // the incoming one slides in from the other side. A click mid-slide shortens
  // the running slide and queues the next step, which runs faster the deeper
  // the queue gets.

  function step(dir) {
    if (!st || closing) return;
    var list = shots();
    if (!list.length) return;
    // Never let a lost transition wedge navigation shut.
    if (swapping && Date.now() - swapAt > 1600) { clearTimeout(swapTimer); finishSwap(); }
    if (swapping) {
      if (queue.length < 6) queue.push(dir);
      var accel = 170;
      st.durT = accel;
      st.durO = accel;
      render();
      clearTimeout(swapTimer);
      swapTimer = setTimeout(finishSwap, accel + 30);
      return;
    }
    beginSwap(dir, list);
  }

  function beginSwap(dir, list) {
    var len = list.length;
    if (len < 2) return;
    var cur = ((Number(st.lb) || 0) % len + len) % len;
    var next = (cur + dir + len) % len;
    swapAt = Date.now();
    var depth = queue.length;
    var durT = Math.max(280, Math.round(1000 / (1 + depth * 0.9)));
    var durO = Math.round(durT * 0.76);
    swapping = true;
    var F = st.slot === 'b' ? 'B' : 'A';
    var T = F === 'A' ? 'B' : 'A';
    fromSlot = F;
    st.lb = next;
    st.slot = T.toLowerCase();
    st.durT = durT;
    st.durO = durO;
    st['src' + T] = list[next].src;
    st['phase' + T] = 'enter';
    st['dir' + T] = dir;
    st['phase' + F] = 'out';
    st['dir' + F] = dir;
    render();
    preload(list, next);
    raf2(function () {
      if (!st) return;
      st['phase' + T] = 'rest';
      render();
    });
    clearTimeout(swapTimer);
    swapTimer = setTimeout(finishSwap, durT + 40);
  }

  function finishSwap() {
    if (!st) { swapping = false; return; }
    var F = fromSlot;
    if (F) {
      st['src' + F] = null;
      st['phase' + F] = null;
      render();
    }
    swapping = false;
    if (queue.length) beginSwap(queue.shift(), shots());
    else { st.durT = 1000; st.durO = 760; render(); }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  function measure() {
    if (!dom || !st) return;
    var w = dom.sizer.offsetWidth, h = dom.sizer.offsetHeight;
    if (!w || !h) return;
    if (st.iw !== w || st.ih !== h) { st.iw = w; st.ih = h; render(); }
  }

  function removeLayer(S) {
    var key = 'layer' + S;
    if (dom && dom[key]) { dom[key].remove(); dom[key] = null; }
  }

  function render() {
    if (!dom || !st) return;
    var list = shots();
    var n = list.length;
    if (!n) return;
    var idx = ((Number(st.lb) || 0) % n + n) % n;
    var entry = list[idx];
    var meta = infoOf(entry);
    var hasInfo = !!(meta.links.length || meta.desc);
    var vw = window.innerWidth, vh = window.innerHeight;
    var narrow = vw < 820;
    var infoPx = Math.round(Math.min(380, Math.max(320, vw * 0.26)));
    var gapPx = Math.round(Math.min(54, Math.max(24, vw * 0.03)));
    var availW = Math.min(hasInfo && !narrow ? vw * 0.94 - infoPx - gapPx : vw * 0.90, vw * 0.90);
    var availH = Math.min(hasInfo && narrow ? vh * 0.88 - 200 - gapPx : (hasInfo ? vh * 0.86 : vh * 0.88), narrow ? vh * 0.80 : vh * 0.88);
    var maxW = Math.round(availW) + 'px', maxH = Math.round(availH) + 'px';

    function entryOf(src) { return src ? list.filter(function (s) { return s.src === src; })[0] : null; }
    function fitOf(src) {
      var e = entryOf(src);
      if (!e || !e.w || !e.h) return { w: 'auto', h: 'auto' };
      var k = Math.min(availW / e.w, availH / e.h);
      return { w: Math.round(e.w * k) + 'px', h: Math.round(e.h * k) + 'px' };
    }

    dom.dialog.setAttribute('aria-label', 'Gallery image ' + (idx + 1) + ' of ' + n);
    dom.dialog.classList.toggle('is-visible', st.vis);

    var fit = fitOf(entry.src);
    if (dom.sizer.getAttribute('src') !== entry.src) dom.sizer.setAttribute('src', entry.src);
    dom.sizer.alt = entry.alt;
    setStyle(dom.sizer, { width: fit.w, height: fit.h, maxWidth: maxW, maxHeight: maxH });

    ['A', 'B'].forEach(function (S) {
      var src = st['src' + S];
      var key = 'layer' + S;
      if (!src) { removeLayer(S); return; }
      var phase = st['phase' + S], dir = st['dir' + S] || 1;
      var dx = phase === 'enter' ? 18 * dir : phase === 'out' ? -17 * dir : 0;
      var style = {
        opacity: phase === 'rest' ? '1' : '0',
        transform: 'translate(calc(-50% + ' + dx + 'px), -50%)',
        transition: 'opacity ' + st.durO + 'ms ' + EASE + ', transform ' + st.durT + 'ms ' + EASE
      };
      var layer = dom[key];
      if (!layer) {
        // A fresh layer, so its starting offset and transparency are a real
        // first paint and the slide-in animates from there.
        layer = el('div', 'lb-layer');
        var img = el('img');
        img.addEventListener('click', function (e) { e.stopPropagation(); });
        layer.appendChild(img);
        setStyle(layer, style);
        var before = S === 'A' && dom.layerB ? dom.layerB : dom.closeBtn;
        dom.stage.insertBefore(layer, before);
        dom[key] = layer;
      } else {
        setStyle(layer, style);
      }
      var li = layer.firstChild;
      if (li.getAttribute('src') !== src) li.setAttribute('src', src);
      var e = entryOf(src);
      li.alt = e ? e.alt : '';
      var f = fitOf(src);
      setStyle(li, { width: f.w, height: f.h, maxWidth: maxW, maxHeight: maxH });
    });

    // The close mark sits on a short extension of the image's
    // bottom-left → top-right diagonal.
    var iw = st.iw || 0, ih = st.ih || 0;
    var diag = Math.sqrt(iw * iw + ih * ih) || 1;
    var cdx = iw ? 22 * iw / diag : 15.5;
    var cdy = ih ? 22 * ih / diag : 15.5;
    dom.closeBtn.style.transform = 'translate(calc(-50% + ' + cdx.toFixed(1) + 'px), calc(50% - ' + cdy.toFixed(1) + 'px))';

    if (hasInfo) {
      if (!dom.info) {
        dom.info = el('div', 'lb-info');
        dom.info.addEventListener('click', function (e) { e.stopPropagation(); });
        dom.comp.appendChild(dom.info);
      }
      var infoKey = entry.src;
      if (dom.infoKey !== infoKey) {
        dom.infoKey = infoKey;
        dom.info.textContent = '';
        if (meta.links.length) {
          var links = el('div', 'lb-links');
          meta.links.forEach(function (l) {
            var a = el('a', null, { href: l.href, target: '_blank', rel: 'noopener noreferrer' });
            var icon = el('span', 'lb-link-icon');
            if (l.platform) icon.style.setProperty('--icon', "url('/assets/socials/" + l.platform + ".svg')");
            a.appendChild(icon);
            a.appendChild(document.createTextNode(l.handle));
            links.appendChild(a);
          });
          dom.info.appendChild(links);
        }
        if (meta.desc) {
          var p = el('p', 'lb-desc');
          p.textContent = meta.desc;
          dom.info.appendChild(p);
        }
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
