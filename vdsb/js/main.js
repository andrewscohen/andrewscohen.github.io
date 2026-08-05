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

  var INTRO_SESSION_KEY = 'vdsbIntroPlayed';

  function runIntro() {
    var curtain = document.querySelector('.intro-curtain');
    if (!curtain) return;

    if (sessionStorage.getItem(INTRO_SESSION_KEY) === '1') {
      curtain.remove();
      return;
    }

    var dismissed = false;
    function fadeOut() {
      if (dismissed) return;
      dismissed = true;
      sessionStorage.setItem(INTRO_SESSION_KEY, '1');
      curtain.classList.add('intro-fade');
      curtain.addEventListener('transitionend', function handler(e) {
        if (e.target !== curtain || e.propertyName !== 'opacity') return;
        curtain.removeEventListener('transitionend', handler);
        curtain.remove();
      });
      setTimeout(function () {
        if (curtain.parentNode) curtain.remove();
      }, 1050);
    }

    curtain.addEventListener('click', fadeOut);
    document.addEventListener('keydown', function skipOnKey() {
      fadeOut();
      document.removeEventListener('keydown', skipOnKey);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        curtain.classList.add('intro-run');
      });
    });

    setTimeout(function () {
      curtain.classList.add('intro-logo-visible');
    }, 950);

    setTimeout(fadeOut, 1420);
  }

  function enableMotion() {
    if (motionQuery.matches || root.classList.contains('js-motion')) {
      return;
    }
    root.classList.replace('no-js', 'js-motion');
    setupReveals();
    runIntro();
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
    var curtain = document.querySelector('.intro-curtain');
    if (curtain) curtain.remove();
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

  var header = document.querySelector('.nav');
  var topbar = document.querySelector('.topbar');
  var cta = document.querySelector('.nav-cta');
  var mobileQuery = window.matchMedia('(max-width: 760px)');
  var scrim = document.createElement('div');
  var isOpen = false;
  var scrollX = 0;
  var scrollY = 0;
  var bodyStyles = null;

  scrim.className = 'nav-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scrim);

  function setHeaderMetrics() {
    if (!header) return;
    var topbarHeight = topbar ? topbar.getBoundingClientRect().height : 0;
    var headerStackHeight = topbarHeight + header.getBoundingClientRect().height;

    document.documentElement.style.setProperty(
      '--topbar-h',
      String(Math.ceil(topbarHeight)) + 'px'
    );
    document.documentElement.style.setProperty(
      '--header-stack-h',
      String(Math.ceil(headerStackHeight)) + 'px'
    );
  }

  function refreshHeaderMetrics() {
    window.requestAnimationFrame(function () {
      if (mobileQuery.matches) setHeaderMetrics();
    });
  }

  function lockScroll() {
    scrollX = window.pageXOffset;
    scrollY = window.pageYOffset;
    bodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };
    document.body.classList.add('nav-open');
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + String(scrollY) + 'px';
    document.body.style.left = '-' + String(scrollX) + 'px';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    if (!bodyStyles) return;
    document.body.classList.remove('nav-open');
    document.body.style.position = bodyStyles.position;
    document.body.style.top = bodyStyles.top;
    document.body.style.left = bodyStyles.left;
    document.body.style.width = bodyStyles.width;
    document.body.style.overflow = bodyStyles.overflow;
    bodyStyles = null;
    window.scrollTo(scrollX, scrollY);
  }

  function focusableLinks() {
    return Array.prototype.slice.call(links.querySelectorAll('a[href]'));
  }

  function openMenu() {
    if (isOpen || !mobileQuery.matches) return;
    isOpen = true;
    setHeaderMetrics();
    lockScroll();
    links.setAttribute('aria-hidden', 'false');
    links.classList.add('open');
    scrim.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');

    window.requestAnimationFrame(function () {
      var targets = focusableLinks();
      var target = links.querySelector('a.active') || targets[0];
      if (target) target.focus();
    });
  }

  function closeMenu(returnFocus) {
    if (!isOpen) return;
    isOpen = false;
    if (returnFocus !== false) toggle.focus();
    links.setAttribute('aria-hidden', 'true');
    links.classList.remove('open');
    scrim.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    unlockScroll();
  }

  function syncViewportMode() {
    if (mobileQuery.matches) {
      if (!isOpen) links.setAttribute('aria-hidden', 'true');
    } else {
      closeMenu(false);
      links.removeAttribute('aria-hidden');
      document.documentElement.style.removeProperty('--topbar-h');
      document.documentElement.style.removeProperty('--header-stack-h');
    }
  }

  toggle.addEventListener('click', function () {
    if (isOpen) {
      closeMenu(true);
    } else {
      openMenu();
    }
  });

  scrim.addEventListener('click', function () {
    closeMenu(true);
  });

  links.addEventListener('click', function (event) {
    if (event.target.closest('a')) closeMenu(false);
  });

  if (cta) {
    cta.addEventListener('click', function () {
      closeMenu(false);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key !== 'Tab') return;
    var targets = focusableLinks();
    if (!targets.length) return;
    var first = targets[0];
    var last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!links.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  });

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', syncViewportMode);
  } else {
    mobileQuery.addListener(syncViewportMode);
  }
  window.addEventListener('resize', function () {
    refreshHeaderMetrics();
  });
  window.addEventListener('orientationchange', refreshHeaderMetrics);
  window.addEventListener('pagehide', unlockScroll);

  syncViewportMode();
  if (mobileQuery.matches) setHeaderMetrics();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      refreshHeaderMetrics();
    });
  }
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

  slides.forEach(function (slide, index) {
    slide.setAttribute('aria-hidden', index === active ? 'false' : 'true');
  });

  function goTo(index) {
    slides[active].classList.remove('active');
    slides[active].setAttribute('aria-hidden', 'true');
    dots[active] && dots[active].classList.remove('active');
    active = index;
    slides[active].classList.add('active');
    slides[active].setAttribute('aria-hidden', 'false');
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

function prefillInterest(form) {
  // Product pages link here as contact.html?interest=Safe%20Building (etc.)
  // so the request already reflects what the visitor was looking at.
  var params = new URLSearchParams(window.location.search);
  var wanted = params.get('interest');
  if (!wanted) return;

  var select = form.querySelector('#interest');
  if (!select) return;

  var options = select.querySelectorAll('option');
  for (var i = 0; i < options.length; i++) {
    if (options[i].textContent.trim() === wanted.trim()) {
      select.value = options[i].value || options[i].textContent;
      break;
    }
  }
}

function initContactForm() {
  var form = document.querySelector('.contact-form');
  if (!form) return;

  prefillInterest(form);

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
