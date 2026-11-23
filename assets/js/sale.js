// Black Friday sale (temporary, docs/odluke.md). The dates live in
// window.ML_SALE in the <head> of each page that shows the sale, and a line
// there marks <html data-sale="soon|on|over"> before anything is drawn, so
// neither the notice nor the prices flash the wrong state. CSS does the
// showing and hiding; this script only runs the clock and moves the phase on
// when a moment passes while the page is open.

(function () {
  var sale = window.ML_SALE;
  if (!sale) return;
  var start = Date.parse(sale.start);
  var end = Date.parse(sale.end);
  if (!start || !end) return;

  var root = document.documentElement;
  var UNITS = ['days', 'hours', 'minutes', 'seconds'];
  var timer = 0;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function split(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
  }

  function phase(now) { return now < start ? 'soon' : now < end ? 'on' : 'over'; }

  // A slide carrying data-sale-interval stays up that long while the sale is
  // announced or running, and goes back to the slideshow's pace after it.
  function pace(p) {
    document.querySelectorAll('[data-sale-interval]').forEach(function (slide) {
      if (p === 'over') slide.removeAttribute('data-interval');
      else slide.setAttribute('data-interval', slide.getAttribute('data-sale-interval'));
    });
  }

  function tick() {
    var now = Date.now();
    var p = phase(now);
    if (root.getAttribute('data-sale') !== p) { root.setAttribute('data-sale', p); pace(p); }
    if (p === 'over') { clearInterval(timer); return; }
    var parts = split((p === 'soon' ? start : end) - now);
    UNITS.forEach(function (unit, i) {
      document.querySelectorAll('[data-sale-' + unit + ']').forEach(function (cell) {
        cell.textContent = pad(parts[i]);
      });
    });
  }

  pace(phase(Date.now()));
  tick();
  timer = setInterval(tick, 1000);
})();
