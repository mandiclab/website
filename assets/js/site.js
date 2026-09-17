// Shared behaviour for every page.

// Footer year follows the visitor's clock, as in the concept. The HTML keeps a
// fallback year for visitors without JavaScript.
document.querySelectorAll('[data-year]').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});
