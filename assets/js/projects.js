// Projects page: search, Sort and Filter menus, the card reorder animation and
// the background grid that stays aligned with the card column.
// Ported from the concept's logic; timings and easings are the concept's.

(function () {
  var section = document.querySelector('.projects');
  if (!section) return;

  var inner = section.querySelector('.projects-inner');
  var toolbarSearch = section.querySelector('.search');
  var toolbarControls = section.querySelector('.projects-controls');
  var input = section.querySelector('#search-projects');
  var emptyMsg = section.querySelector('.projects-empty');
  var filterDot = section.querySelector('.filter-dot');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var state = { query: '', sort: 'Newest', filter: 'All', menu: null, menuOut: null };

  // Card data is read from the HTML, so the markup stays the single source.
  var cards = Array.prototype.map.call(section.querySelectorAll('.pcard-wrap'), function (el) {
    return {
      key: el.getAttribute('data-key'),
      el: el,
      order: Number(el.getAttribute('data-order')),
      date: el.getAttribute('data-date'),
      title: el.querySelector('.pcard-title').textContent,
      desc: el.querySelector('.pcard-desc').textContent,
      tags: Array.prototype.map.call(el.querySelectorAll('.pill'), function (t) { return t.textContent; })
    };
  }).sort(function (a, b) { return a.order - b.order; });

  // ── Catalog ─────────────────────────────────────────────────────────────

  function visibleKeys(st) {
    var q = st.query.trim().toLowerCase();
    var f = st.filter.toLowerCase();
    var list = cards.filter(function (p) {
      var inFilter = f === 'all' || p.tags.some(function (t) { return t.toLowerCase() === f; });
      var inQuery = !q || (p.title + ' ' + p.desc + ' ' + p.tags.join(' ')).toLowerCase().indexOf(q) >= 0;
      return inFilter && inQuery;
    });
    if (st.sort === 'Name') {
      list.sort(function (a, b) { return a.title.toLowerCase().localeCompare(b.title.toLowerCase()); });
    } else {
      // Dated projects are sorted among the positions they occupy; undated
      // ones keep their place.
      var slots = [];
      list.forEach(function (p, i) { if (p.date) slots.push(i); });
      var dated = slots.map(function (i) { return list[i]; }).sort(function (a, b) {
        return st.sort === 'Oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      });
      slots.forEach(function (pos, n) { list[pos] = dated[n]; });
    }
    return list.map(function (p) { return p.key; });
  }

  function cardByKey(key) {
    for (var i = 0; i < cards.length; i++) if (cards[i].key === key) return cards[i];
    return null;
  }

  function renderCards() {
    var keys = visibleKeys(state);
    cards.forEach(function (p) { if (keys.indexOf(p.key) < 0 && p.el.parentNode) p.el.remove(); });
    var entering = [];
    keys.forEach(function (key) {
      var el = cardByKey(key).el;
      if (!el.isConnected) entering.push(el);
      inner.insertBefore(el, emptyMsg);
    });
    // A card coming back must not keep the faded-out end state of its exit.
    entering.forEach(function (el) {
      if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
    });
    emptyMsg.hidden = keys.length > 0;
    gridSync();
  }

  function mountedCards() {
    return cards.filter(function (p) { return p.el.isConnected; });
  }

  var firstRects = null;

  function capture() {
    firstRects = new Map();
    mountedCards().forEach(function (p) { firstRects.set(p.key, p.el.getBoundingClientRect()); });
  }

  // FLIP: cards that stay slide from their old position, new cards fade in.
  function runFlip() {
    var first = firstRects;
    if (!first) return;
    firstRects = null;
    var ease = 'cubic-bezier(0.16,1,0.3,1)';
    mountedCards().forEach(function (p) {
      var el = p.el;
      if (!el.animate) return;
      el.getAnimations().forEach(function (a) { a.cancel(); });
      if (reducedMotion.matches) return;
      if (first.has(p.key)) {
        var a = first.get(p.key), b = el.getBoundingClientRect();
        var dx = a.left - b.left, dy = a.top - b.top;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          el.style.zIndex = '2';
          var anim = el.animate(
            [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }],
            { duration: 560, easing: ease });
          anim.onfinish = anim.oncancel = function () { el.style.zIndex = ''; };
        }
      } else {
        el.animate(
          [{ opacity: 0, transform: 'translateY(4px) scale(0.985)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
          { duration: 280, easing: ease });
      }
    });
  }

  function commit(next) {
    if (next === pending) pending = null;
    capture();
    Object.assign(state, next);
    renderControls();
    renderCards();
    requestAnimationFrame(runFlip);
  }

  var exitTimer = null;
  var pending = null;

  // Cards that drop out fade first; the rest reflow once they are gone.
  function applyCatalog(next) {
    // A change that arrives while cards are still fading out is merged with
    // the waiting one instead of replacing it.
    next = Object.assign({}, pending, next);
    pending = next;
    var cur = visibleKeys(state);
    var nextVis = visibleKeys(Object.assign({}, state, next));
    var leaving = cur.filter(function (k) { return nextVis.indexOf(k) < 0; });
    clearTimeout(exitTimer);
    if (!leaving.length || reducedMotion.matches) { commit(next); return; }
    leaving.forEach(function (k) {
      var el = cardByKey(k).el;
      if (!el.animate) return;
      el.getAnimations().forEach(function (a) { a.cancel(); });
      el.animate(
        [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(-4px) scale(0.985)' }],
        { duration: 220, easing: 'cubic-bezier(0.33,0,0.25,1)', fill: 'forwards' });
    });
    exitTimer = setTimeout(function () { commit(next); }, 235);
  }

  var queryTimer = null;
  input.addEventListener('input', function () {
    var v = input.value;
    clearTimeout(queryTimer);
    queryTimer = setTimeout(function () { applyCatalog({ query: v }); }, 110);
  });

  // ── Menus ───────────────────────────────────────────────────────────────

  var menus = {};
  Array.prototype.forEach.call(section.querySelectorAll('[data-menu]'), function (root) {
    menus[root.getAttribute('data-menu')] = {
      root: root,
      toggle: root.querySelector('.menu-toggle'),
      panel: root.querySelector('.menu-panel')
    };
  });

  var menuTimer = null;

  function renderMenus() {
    Object.keys(menus).forEach(function (name) {
      var m = menus[name];
      var open = state.menu === name;
      m.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      m.panel.hidden = !(open || state.menuOut === name);
      m.panel.classList.toggle('is-closing', !open);
    });
  }

  function toggleMenu(name) {
    if (state.menu === name) { closeMenu(); return; }
    clearTimeout(menuTimer);
    state.menuOut = state.menu || null;
    state.menu = name;
    renderMenus();
    menuTimer = setTimeout(function () { state.menuOut = null; renderMenus(); }, 160);
    clampMenu(name);
  }

  function closeMenu() {
    if (!state.menu) return;
    clearTimeout(menuTimer);
    state.menuOut = state.menu;
    state.menu = null;
    renderMenus();
    menuTimer = setTimeout(function () { state.menuOut = null; renderMenus(); }, 160);
  }

  // Keeps an open menu at least 16px inside the viewport.
  function clampMenu(name) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var panel = menus[name].panel;
        panel.style.setProperty('--ml-shift', '0px');
        var PAD = 16;
        var r = panel.getBoundingClientRect();
        var shift = 0;
        if (r.left < PAD) shift = PAD - r.left;
        else if (r.right > window.innerWidth - PAD) shift = (window.innerWidth - PAD) - r.right;
        if (shift) panel.style.setProperty('--ml-shift', shift + 'px');
      });
    });
  }

  Object.keys(menus).forEach(function (name) {
    menus[name].toggle.addEventListener('click', function () { toggleMenu(name); });
  });

  var sortOpts = section.querySelectorAll('.sort-opt');
  var filterOpts = section.querySelectorAll('.filter-opt');

  // Selected options, the Filter colour and its dot follow the applied state,
  // so they change together with the cards.
  function renderControls() {
    Array.prototype.forEach.call(sortOpts, function (b) {
      b.classList.toggle('is-selected', b.getAttribute('data-value') === state.sort);
    });
    var kind = 'all';
    Array.prototype.forEach.call(filterOpts, function (b) {
      var on = b.getAttribute('data-value') === state.filter;
      b.classList.toggle('is-selected', on);
      if (on) kind = b.getAttribute('data-kind');
    });
    menus.filter.toggle.classList.toggle('is-active', state.filter !== 'All');
    filterDot.hidden = state.filter === 'All';
    filterDot.setAttribute('data-kind', kind);
  }

  Array.prototype.forEach.call(sortOpts, function (btn) {
    btn.addEventListener('click', function () {
      var v = btn.getAttribute('data-value');
      closeMenu();
      if (state.sort !== v) commit({ sort: v });
    });
  });

  Array.prototype.forEach.call(filterOpts, function (btn) {
    btn.addEventListener('click', function () {
      closeMenu();
      applyCatalog({ filter: btn.getAttribute('data-value') });
    });
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.menu) closeMenu();
  });

  document.addEventListener('mousedown', function (e) {
    if (!state.menu) return;
    if (e.target.closest && e.target.closest('[data-menu]')) return;
    closeMenu();
  });

  // ── Grid alignment ──────────────────────────────────────────────────────
  // The background grid is anchored to the card column, so the column width
  // and every block above it must land on whole grid units at any width.

  function gridSync() {
    var g = parseFloat(getComputedStyle(section).getPropertyValue('--g')) || 46;
    if (inner.clientWidth) {
      var cw = Math.floor(inner.clientWidth / g) * g;
      if (cw > 24 * g) cw = 24 * g;
      if (cw < 3 * g) cw = 3 * g;
      section.style.setProperty('--cw', cw + 'px');
    }
    var sr = toolbarSearch.getBoundingClientRect(), cr = toolbarControls.getBoundingClientRect();
    var wrapped = cr.top >= sr.bottom - 1;
    section.style.setProperty('--tbh', (wrapped ? 3 * g : 2 * g) + 'px');
    // Stacked cards have no fixed height, so round their natural height up to
    // a whole grid unit.
    var stacked = window.matchMedia('(max-width: 1170px)').matches;
    mountedCards().forEach(function (p) {
      var card = p.el.querySelector('.pcard');
      card.style.minHeight = '';
      if (!stacked) return;
      var h = card.offsetHeight;
      if (h) card.style.minHeight = Math.ceil(h / g) * g + 'px';
    });
  }

  gridSync();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(gridSync).observe(inner);
  window.addEventListener('resize', gridSync);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(gridSync);
})();
