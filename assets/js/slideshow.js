// Slideshow for the Home hero, the Home news images and the product page heroes.
// Markup: [data-slideshow] containing one .slide per image. Options:
//   data-autoplay          advance on its own (never with reduced motion)
//   data-indicator="dots"  play/pause button and dots over the image (default)
//   data-indicator="thumbs" thumbnail strip below the slideshow
//   data-indicator="none"  no dots or thumbnails, arrows only (news images)
//   data-interval="6000"   milliseconds between slides
//   data-hover-pause="off" keep playing while the pointer is over it (the hero
//                          fills the screen, and it has its own pause button)
// Ported from the concept's HeroSlideshow component.

(function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    for (var k in attrs || {}) node.setAttribute(k, attrs[k]);
    return node;
  }

  function init(shell) {
    var slides = Array.prototype.slice.call(shell.querySelectorAll(':scope > .slide'));
    var count = slides.length;
    var autoplay = shell.hasAttribute('data-autoplay');
    var indicator = shell.getAttribute('data-indicator') || 'dots';
    var base = Number(shell.getAttribute('data-interval')) || 6000;

    // `paused` is the visitor's standing choice from the button; hover, focus
    // and a hidden tab are temporary holds that release on their own.
    // Keep them separate (docs/odluke.md).
    var state = { idx: 0, prev: null, dir: 1, paused: false, hover: false, focus: false, hidden: false };
    var timer = null, moveTimer = null;
    var moving = false;
    var dots = [], thumbs = [], playBtn = null;

    function held() { return state.paused || state.hover || state.focus || state.hidden; }

    // A manual change stretches the next interval once (2x), then the cycle
    // returns to the base interval.
    function schedule(delay) {
      clearTimeout(timer);
      if (!autoplay || count < 2 || reducedMotion.matches || held()) return;
      timer = setTimeout(function () {
        if (moving) { schedule(600); return; }
        go((state.idx + 1) % count, false, 1);
      }, delay);
    }

    function slideMs() {
      var v = getComputedStyle(shell).getPropertyValue('--dur-slide').trim();
      var n = parseFloat(v) || 1500;
      return /ms$/.test(v) ? n : n * 1000;
    }

    // The slides travel sideways, so the direction has to be set before the
    // classes change: the waiting slides jump to the side they come in from,
    // and only then does the new one slide in.
    function setDir(d) {
      if (state.dir === d) return;
      state.dir = d;
      shell.setAttribute('data-dir', String(d));
      void shell.offsetWidth;
    }

    // A quick second click asks for the image that is still on its way out —
    // with two images, always. The strip keeps going the way it was clicked:
    // a copy of that image carries on out of the frame, while the image itself
    // jumps (off screen) to the far side and slides back in behind it.
    function carryOut(node, dir, ms) {
      var copy = node.cloneNode(true);
      copy.classList.remove('is-active', 'is-prev');
      copy.classList.add('is-ghost');
      copy.setAttribute('aria-hidden', 'true');
      // A copy of a heading or a link must not count as a second one.
      Array.prototype.forEach.call(copy.querySelectorAll('h1,h2,h3,h4'), function (h) {
        var plain = document.createElement('div');
        plain.className = h.className;
        plain.innerHTML = h.innerHTML;
        h.parentNode.replaceChild(plain, h);
      });
      Array.prototype.forEach.call(copy.querySelectorAll('a[href]'), function (a) { a.removeAttribute('href'); });
      var ease = getComputedStyle(shell).getPropertyValue('--ease').trim() || 'ease';
      copy.style.transition = 'none';
      copy.style.transform = getComputedStyle(node).transform;
      shell.insertBefore(copy, node);
      void copy.offsetWidth;
      copy.style.transition = 'transform ' + ms + 'ms ' + ease;
      copy.style.transform = 'translateX(' + (dir > 0 ? -100 : 100) + '%)';
      setTimeout(function () { copy.remove(); }, ms + 80);
    }

    function parkOnFarSide(node, dir) {
      node.classList.remove('is-prev');
      node.style.transition = 'none';
      node.style.transform = 'translateX(' + (dir > 0 ? 100 : -100) + '%)';
      void node.offsetWidth;
      node.style.transition = '';
      node.style.transform = '';
    }

    function go(n, manual, dir) {
      if (count < 2 || n === state.idx) { if (manual) schedule(base * 2); return; }
      if (!dir) {
        var ahead = (n - state.idx + count) % count;
        dir = ahead <= count - ahead ? 1 : -1;
      }
      var wrapping = moving && n === state.prev && !reducedMotion.matches;
      setDir(dir);
      if (wrapping) {
        carryOut(slides[n], dir, slideMs());
        parkOnFarSide(slides[n], dir);
      }
      state.prev = state.idx;
      state.idx = n;
      moving = true;
      render();
      clearTimeout(moveTimer);
      // Outlasts the slide itself, or the leaving one would jump to its parked
      // side while still moving.
      moveTimer = setTimeout(function () {
        moving = false;
        state.prev = null;
        render();
      }, slideMs() + 60);
      schedule(manual ? base * 2 : base);
    }

    function step(dir) {
      if (count < 2) return;
      go(((state.idx + dir) % count + count) % count, true, dir);
    }

    function setHold(key, val) {
      if (state[key] === val) return;
      state[key] = val;
      if (key === 'paused') render();
      if (held()) clearTimeout(timer);
      else schedule(base);
    }

    function render() {
      slides.forEach(function (s, i) {
        var on = i === state.idx;
        s.classList.toggle('is-active', on);
        s.classList.toggle('is-prev', !on && i === state.prev);
        // Links on a slide that is not shown stay out of the tab order.
        Array.prototype.forEach.call(s.querySelectorAll('a[href]'), function (a) {
          if (on) a.removeAttribute('tabindex');
          else a.setAttribute('tabindex', '-1');
        });
      });
      dots.forEach(function (d, i) {
        if (i === state.idx) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      thumbs.forEach(function (t, i) {
        if (i === state.idx) t.setAttribute('aria-current', 'true');
        else t.removeAttribute('aria-current');
      });
      if (playBtn) {
        playBtn.setAttribute('aria-label', state.paused ? 'Play slideshow' : 'Pause slideshow');
        playBtn.firstChild.innerHTML = state.paused
          ? '<span class="tri"></span>'
          : '<span class="bar"></span><span class="bar"></span>';
      }
    }

    if (count > 1) {
      // Arrows on every slideshow with more than one image; only the dots and
      // the thumbnails depend on data-indicator.
      var prevBtn = el('button', 'slide-arrow is-prev', { type: 'button', 'aria-label': 'Previous slide' });
      prevBtn.appendChild(el('span'));
      prevBtn.addEventListener('click', function () { step(-1); });
      var nextBtn = el('button', 'slide-arrow is-next', { type: 'button', 'aria-label': 'Next slide' });
      nextBtn.appendChild(el('span'));
      nextBtn.addEventListener('click', function () { step(1); });
      shell.appendChild(prevBtn);
      shell.appendChild(nextBtn);

      if (indicator === 'dots') {
        var bar = el('div', 'slide-dots');
        if (autoplay) {
          playBtn = el('button', 'slide-play', { type: 'button' });
          playBtn.appendChild(el('span'));
          playBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            setHold('paused', !state.paused);
            // Restart the swap animation on every click.
            playBtn.classList.remove('is-toggled');
            void playBtn.offsetWidth;
            playBtn.classList.add('is-toggled');
          });
          bar.appendChild(playBtn);
        }
        slides.forEach(function (s, i) {
          var d = el('button', 'slide-dot', { type: 'button', 'aria-label': 'Go to slide ' + (i + 1) });
          d.appendChild(el('span'));
          d.addEventListener('click', function () { go(i, true); });
          bar.appendChild(d);
          dots.push(d);
        });
        shell.appendChild(bar);
      }

      if (indicator === 'thumbs') {
        var outer = el('div', 'slide-thumbs-outer');
        var inner = el('div', 'slide-thumbs-inner');
        var strip = el('div', 'slide-thumbs');
        slides.forEach(function (s, i) {
          var t = el('button', 'slide-thumb', { type: 'button', 'aria-label': 'Show slide ' + (i + 1) });
          var img = s.querySelector('img');
          if (img) {
            var copy = img.cloneNode(false);
            copy.alt = '';
            copy.removeAttribute('fetchpriority');
            copy.setAttribute('loading', 'lazy');
            t.appendChild(copy);
          }
          t.addEventListener('click', function () { go(i, true); });
          strip.appendChild(t);
          thumbs.push(t);
        });
        inner.appendChild(strip);
        outer.appendChild(inner);
        shell.parentNode.appendChild(outer);
      }
    }

    shell.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    if (shell.getAttribute('data-hover-pause') !== 'off') {
      shell.addEventListener('mouseenter', function () { setHold('hover', true); });
      shell.addEventListener('mouseleave', function () { setHold('hover', false); });
    }
    shell.addEventListener('focusin', function () { setHold('focus', true); });
    shell.addEventListener('focusout', function (e) {
      if (e.relatedTarget && shell.contains(e.relatedTarget)) return;
      setHold('focus', false);
    });

    var touchX = null;
    shell.addEventListener('touchstart', function (e) {
      touchX = e.touches && e.touches[0] ? e.touches[0].clientX : null;
    }, { passive: true });
    shell.addEventListener('touchend', function (e) {
      var end = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
      var start = touchX;
      touchX = null;
      if (start == null || end == null) return;
      var dx = end - start;
      if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    });

    document.addEventListener('visibilitychange', function () { setHold('hidden', !!document.hidden); });

    shell.setAttribute('data-dir', '1');
    shell.setAttribute('data-ready', '');
    render();
    schedule(base);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-slideshow]'), init);
})();
