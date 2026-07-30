// ============================================================
// Video Doorman Safe Building — shared site JS
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  initMobileNav();
  initHeroCarousel();
  initContactForm();
});

/* ---------- Scroll reveal ----------
   Gate: <html> starts as .no-js. This script (loaded at the end of body,
   so the DOM above it is already parsed) swaps in .js-motion only when JS
   is running and the user hasn't asked for reduced motion. If either
   condition fails, .reveal elements are never targeted by the hiding CSS
   and stay fully visible. ------------------------------------------- */
(function () {
  var root = document.documentElement;
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var revealObserver = null;

  function setupReveals() {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      var children = group.querySelectorAll(':scope > .reveal');
      children.forEach(function (child, index) {
        child.style.setProperty('--reveal-delay', String(index * 80) + 'ms');
      });
    });

    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (element) {
        element.classList.add('is-visible');
      });
      return;
    }

    revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );

    reveals.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  function enableMotion() {
    if (motionQuery.matches || root.classList.contains('js-motion')) {
      return;
    }
    root.classList.replace('no-js', 'js-motion');
    setupReveals();
  }

  function disableMotion() {
    root.classList.replace('js-motion', 'no-js');
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    document.querySelectorAll('.reveal').forEach(function (element) {
      element.classList.add('is-visible');
    });
  }

  if (!motionQuery.matches) {
    enableMotion();
  }

  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', function () {
      if (motionQuery.matches) {
        disableMotion();
      } else {
        enableMotion();
      }
    });
  }
})();

/* ---------- Mobile nav toggle ---------- */
function initMobileNav() {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    links.classList.toggle('open');
  });
}

/* ---------- Homepage hero carousel ---------- */
function initHeroCarousel() {
  var carousel = document.querySelector('.carousel');
  if (!carousel) return;

  var slides = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-slide'));
  var dots = Array.prototype.slice.call(carousel.parentElement.querySelectorAll('.carousel-dot'));
  var active = 0;
  var timer = null;
  var INTERVAL_MS = 8000;

  function goTo(index) {
    slides[active].classList.remove('active');
    dots[active] && dots[active].classList.remove('active');
    active = index;
    slides[active].classList.add('active');
    dots[active] && dots[active].classList.add('active');
  }

  function next() {
    goTo((active + 1) % slides.length);
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(next, INTERVAL_MS);
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      goTo(i);
      startTimer();
    });
  });

  startTimer();
}

/* ---------- Contact form submission ----------
   Swap FORM_ENDPOINT below for your CRM's form/webhook URL
   (or a service like Formspree) once it's confirmed.
   Expects the endpoint to accept a standard POST with
   form-encoded or multipart data and return a 2xx on success.
------------------------------------------------------------- */
var FORM_ENDPOINT = 'https://formspree.io/f/REPLACE_WITH_YOUR_FORM_ID';

function initContactForm() {
  var form = document.querySelector('.contact-form');
  if (!form) return;

  var status = form.querySelector('.form-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (status) {
      status.textContent = 'Sending...';
      status.className = 'form-status';
      status.style.display = 'block';
    }

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          if (status) {
            status.textContent = "Thanks — we'll be in touch within one business day.";
            status.className = 'form-status success';
          }
        } else {
          throw new Error('Submission failed');
        }
      })
      .catch(function () {
        if (status) {
          status.textContent = 'Something went wrong. Please call 833-871-0144 or try again.';
          status.className = 'form-status error';
        }
      });
  });
}
