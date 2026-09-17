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
