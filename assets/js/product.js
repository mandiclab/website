// Product pages (DJC-DIY, easyrace): section tabs, the scroll fade on
// sideways-scrolling bars, the video picker and the FAQ accordion.
// Ported from the concept's logic.

(function () {

  // ── Scroll fade ─────────────────────────────────────────────────────────
  // A bar that scrolls sideways shows a fade on its right edge while there is
  // more to scroll to.

  function updateFades() {
    Array.prototype.forEach.call(document.querySelectorAll('.tabbar-wrap'), function (wrap) {
      var bar = wrap.querySelector('.tabbar');
      if (!bar) return;
      var more = bar.scrollWidth - bar.clientWidth - bar.scrollLeft > 4;
      wrap.setAttribute('data-fade', more ? '1' : '0');
    });
  }

  window.addEventListener('resize', updateFades);
  document.addEventListener('scroll', updateFades, true);

  // Keeps a tab inside its scrollable bar without scrollIntoView, which would
  // also scroll the page.
  function revealTab(btn) {
    var bar = btn.closest('.tabbar');
    if (!bar) return;
    var run = function () {
      var left = btn.offsetLeft - bar.offsetLeft;
      var right = left + btn.offsetWidth;
      if (left < bar.scrollLeft) bar.scrollLeft = Math.max(0, left - 12);
      else if (right > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = right - bar.clientWidth + 12;
      updateFades();
    };
    run();
    requestAnimationFrame(run);
  }

  // ── Tabs ────────────────────────────────────────────────────────────────
  // role="tablist" with roving tabindex: the selected tab is 0, the others -1.
  // Left/Right move between tabs (wrapping), Home/End jump to the ends, and
  // the panel changes with focus. Only the selected panel is shown.

  Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"]'), function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

    function select(tab, moveFocus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
        // Content that belongs to a panel but sits outside it follows it.
        Array.prototype.forEach.call(document.querySelectorAll('[data-with-panel="' + t.getAttribute('aria-controls') + '"]'), function (el) {
          el.hidden = !on;
        });
      });
      if (moveFocus) tab.focus();
      revealTab(tab);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var n = -1;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n < 0) return;
        e.preventDefault();
        select(tabs[n], true);
      });
    });
  });

  updateFades();

  // ── Video picker ────────────────────────────────────────────────────────
  // The old video fades out, the new one loads while hidden, and it fades in
  // only once the player has loaded, so the switch never shows a half-loaded
  // player (docs/odluke.md).

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var FADE_OUT_MS = 300;   // --dur-base
  var SETTLE_MS = 200;     // lets the player draw its first frame after load
  var LOAD_TIMEOUT_MS = 4000;

  Array.prototype.forEach.call(document.querySelectorAll('.video-tabs'), function (group) {
    var buttons = Array.prototype.slice.call(group.querySelectorAll('.video-tab'));
    var frame = group.parentNode.querySelector('.video-frame');
    var iframe = frame && frame.querySelector('iframe');
    if (!iframe) return;
    var selected = (buttons.filter(function (b) { return b.classList.contains('is-active'); })[0] || buttons[0]);
    var switchId = 0;
    var timers = [];

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn === selected) return;
        selected = btn;
        buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        // A newer click cancels everything still pending from an older one.
        var id = ++switchId;
        timers.forEach(clearTimeout);
        timers = [];
        frame.classList.add('is-switching');

        later(function () {
          var shown = false;
          function reveal() {
            if (shown || id !== switchId) return;
            shown = true;
            later(function () { if (id === switchId) frame.classList.remove('is-switching'); }, SETTLE_MS);
          }
          iframe.addEventListener('load', reveal, { once: true });
          iframe.src = 'https://www.youtube.com/embed/' + btn.getAttribute('data-video');
          later(reveal, LOAD_TIMEOUT_MS);
        }, reducedMotion.matches ? 0 : FADE_OUT_MS);
      });
    });
  });

  // ── FAQ ─────────────────────────────────────────────────────────────────
  // Each question toggles its own answer; the look follows aria-expanded.

  Array.prototype.forEach.call(document.querySelectorAll('.faq-q'), function (btn) {
    btn.addEventListener('click', function () {
      btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });
  });
})();
