// Shared behaviour for every page.

// Unreleased content carries data-draft. It stays hidden on the live site and
// shows when the site is opened locally, so work in progress can be checked
// before release (docs/odluke.md).
if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
  document.documentElement.setAttribute('data-show-drafts', '');
}

// Footer year follows the visitor's clock, as in the concept. The HTML keeps a
// fallback year for visitors without JavaScript.
document.querySelectorAll('[data-year]').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// On a phone the hero stacks: the photo takes a 3:2 band across the top and the
// text sits under it (assets/css/site.css). The hero is then only as tall as it
// needs to be, and the tallest slide's text sets that height for all of them —
// otherwise the dots and the play button would jump as the slides change.
// The CSS carries a fallback height for visitors without JavaScript.

(function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var texts = hero.querySelectorAll('.hero-text');
  if (!texts.length || !window.matchMedia) return;
  var stacked = window.matchMedia('(max-width: 640px) and (max-aspect-ratio: 3/2)');

  // The text box is a fixed height once measured, so its own height says
  // nothing; the span from the first element to the last is the real text.
  function textHeight(box) {
    var first = box.firstElementChild;
    var last = box.lastElementChild;
    if (!first) return 0;
    return last.getBoundingClientRect().bottom - first.getBoundingClientRect().top;
  }

  function fit() {
    if (!stacked.matches) { hero.style.removeProperty('--hero-text'); return; }
    var tallest = 0;
    Array.prototype.forEach.call(texts, function (box) {
      var h = textHeight(box);
      if (h > tallest) tallest = h;
    });
    if (tallest > 0) hero.style.setProperty('--hero-text', Math.ceil(tallest) + 'px');
  }

  fit();
  // The text rewraps when the fonts arrive and when the hero changes width.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  if (stacked.addEventListener) stacked.addEventListener('change', fit);
  var timer;
  function later() { clearTimeout(timer); timer = setTimeout(fit, 150); }
  window.addEventListener('resize', later);
  if (window.ResizeObserver) {
    // Width only: fit() changes the hero's height, and reacting to that would
    // chase its own tail.
    var seen = hero.clientWidth;
    new ResizeObserver(function () {
      if (hero.clientWidth === seen) return;
      seen = hero.clientWidth;
      later();
    }).observe(hero);
  }
})();
