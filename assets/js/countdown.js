// Launch gate: until the moment in window.ML_LAUNCH passes, a gate covers what
// is not out yet — the card on the Projects page, and the easyrace page itself.
// The gate is in the HTML and visible by default, so a visitor who arrives
// early never sees the page flash past before the script runs. Each page sets
// window.ML_LAUNCH in its head and marks the document as launched right there
// when the moment has already passed, so a late visitor never sees the gate
// flash either.
//
// This is a tease, not a lock: the page is still in the HTML, and in the public
// repository (docs/odluke.md).

(function () {
  var when = Date.parse(window.ML_LAUNCH || '');
  var gates = document.querySelectorAll('[data-gate]');
  if (!when || !gates.length) return;

  var UNITS = ['days', 'hours', 'minutes', 'seconds'];
  var timer = 0;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Whole seconds left, split into days / hours / minutes / seconds.
  function split(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
  }

  // The content behind a full-page gate is out of reach while the gate is up:
  // inert keeps the keyboard out of it, aria-hidden keeps screen readers out.
  function shut(on) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-gate="page"]'), function (gate) {
      var page = gate.parentNode;
      Array.prototype.forEach.call(page.children, function (el) {
        if (el === gate) return;
        if (on) { el.setAttribute('aria-hidden', 'true'); el.inert = true; }
        else { el.removeAttribute('aria-hidden'); el.inert = false; }
      });
    });
  }

  function launch() {
    if (timer) clearInterval(timer);
    shut(false);
    document.documentElement.setAttribute('data-launched', '');
    Array.prototype.forEach.call(gates, function (gate) { gate.parentNode.removeChild(gate); });
  }

  function tick() {
    var left = when - Date.now();
    if (left <= 0) { launch(); return; }
    var parts = split(left);
    Array.prototype.forEach.call(gates, function (gate) {
      UNITS.forEach(function (unit, i) {
        var cell = gate.querySelector('[data-' + unit + ']');
        if (cell) cell.textContent = pad(parts[i]);
      });
    });
  }

  if (when - Date.now() <= 0) { launch(); return; }
  shut(true);
  tick();
  timer = setInterval(tick, 1000);
})();
