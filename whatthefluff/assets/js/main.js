/* What the Fluff — interactions
   Vanilla JS, no dependencies. Everything degrades gracefully without it. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ sticky header + progress */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.scroll-progress');
  var mobileCta = document.querySelector('.mobile-cta');
  var lastY = window.scrollY;

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-stuck', y > 12);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
    if (mobileCta) mobileCta.classList.toggle('is-visible', y > 520 || y > lastY === false && y > 200);
    lastY = y;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------------------------------------------------- mobile nav */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('is-open', !open);
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        links.classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        links.classList.remove('is-open');
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------- scroll reveal */
  var revealables = document.querySelectorAll('.reveal, [data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ------------------------------------------------------------ counters */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = (el.getAttribute('data-decimals') | 0);
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var fmt = function (n) {
      return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    if (reduced) { el.textContent = prefix + fmt(target) + suffix; return; }
    var start = performance.now(), dur = 1600;
    function frame(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* -------------------------------------------------- hero pack parallax */
  var pack = document.querySelector('[data-parallax]');
  if (pack && !reduced) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 600);
        pack.style.transform = 'translate3d(0,' + (y * 0.08) + 'px,0) scale(' + (1 + y * 0.00012) + ')';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ------------------------------------------ marquee: duplicate content */
  document.querySelectorAll('[data-marquee]').forEach(function (row) {
    row.innerHTML += row.innerHTML;
    row.setAttribute('aria-hidden', 'false');
  });

  /* ---------------------------------------------------- FAQ: one at a time */
  var faqs = document.querySelectorAll('.faq details');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      faqs.forEach(function (other) { if (other !== d) other.open = false; });
    });
  });

  /* ------------------------------------------------ multi-step book form */
  var form = document.querySelector('[data-multistep]');
  if (form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll('.form-step'));
    var dots = Array.prototype.slice.call(form.querySelectorAll('.steps-progress .dot'));
    var success = document.querySelector('.form-success');
    var current = 0;

    function paint(moved) {
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
      dots.forEach(function (d, i) {
        d.classList.toggle('done', i < current);
        d.classList.toggle('active', i === current);
      });
      if (!moved) return;
      var heading = steps[current].querySelector('h2, h3');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      var top = form.getBoundingClientRect().top + window.scrollY - 120;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    }

    function validate(stepEl) {
      var ok = true;
      stepEl.querySelectorAll('[required]').forEach(function (input) {
        var field = input.closest('.field') || input.closest('fieldset');
        var valid = input.type === 'radio'
          ? !!stepEl.querySelector('input[name="' + input.name + '"]:checked')
          : input.checkValidity() && input.value.trim() !== '';
        if (field) field.classList.toggle('has-error', !valid);
        if (!valid && ok) { ok = false; input.focus({ preventScroll: true }); }
      });
      return ok;
    }

    form.addEventListener('click', function (e) {
      var next = e.target.closest('[data-next]');
      var prev = e.target.closest('[data-prev]');
      if (next) {
        e.preventDefault();
        if (!validate(steps[current])) return;
        current = Math.min(current + 1, steps.length - 1);
        paint(true);
      }
      if (prev) {
        e.preventDefault();
        current = Math.max(current - 1, 0);
        paint(true);
      }
    });

    form.addEventListener('input', function (e) {
      var field = e.target.closest('.field, fieldset');
      if (field && field.classList.contains('has-error')) field.classList.remove('has-error');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(steps[current])) return;
      /* Mock-up: no back end wired up yet. Swap this for your form handler. */
      var name = (form.querySelector('[name="name"]') || {}).value || '';
      form.style.display = 'none';
      if (success) {
        var slot = success.querySelector('[data-name-slot]');
        if (slot && name) slot.textContent = name.split(' ')[0];
        success.classList.add('is-active');
        success.setAttribute('tabindex', '-1');
        success.focus({ preventScroll: true });
        success.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    });

    paint();
  }

  /* ------------------------------------- prefill service from query/link */
  var params = new URLSearchParams(window.location.search);
  var service = params.get('service');
  if (service) {
    var radio = document.querySelector('input[name="service"][value="' + service.replace(/"/g, '') + '"]');
    if (radio) radio.checked = true;
  }

  /* -------------------------------------------------------- footer year */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
