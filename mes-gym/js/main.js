(function () {
  "use strict";

  var intro = document.getElementById("site-intro");

  if (intro) {
    var introStorageKey = intro.getAttribute("data-storage-key") || "mesIntroPlayed";
    var introHasPlayed = false;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      introHasPlayed = sessionStorage.getItem(introStorageKey) === "true";
    } catch (error) {
      introHasPlayed = false;
    }

    if (reducedMotion || introHasPlayed) {
      intro.remove();
    } else {
      intro.classList.add("is-enabled");
      document.body.classList.add("intro-active");

      window.requestAnimationFrame(function () {
        intro.classList.add("is-playing");
      });

      window.setTimeout(function () {
        intro.classList.add("is-exiting");

        window.setTimeout(function () {
          try {
            sessionStorage.setItem(introStorageKey, "true");
          } catch (error) {
            /* The animation still completes when storage is unavailable. */
          }

          document.body.classList.remove("intro-active");
          intro.remove();
        }, 400);
      }, 2200);
    }
  }

  var revealElements = document.querySelectorAll("[data-reveal]");
  var scrollBarElements = document.querySelectorAll("[data-scroll-bar]");
  var swipeRevealTracks = document.querySelectorAll("[data-swipe-reveal]");
  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var supportsIntersectionObserver = "IntersectionObserver" in window;

  if (!reduceMotionQuery.matches && supportsIntersectionObserver && (revealElements.length || scrollBarElements.length || swipeRevealTracks.length)) {
    var activeScrollBars = new Set();
    var activeSwipeReveals = new Set();
    var motionFrame = null;

    function updateMotion() {
      motionFrame = null;

      if (!activeScrollBars.size && !activeSwipeReveals.size) return;

      var viewportH = window.innerHeight;

      activeScrollBars.forEach(function (element) {
        var bounds = element.getBoundingClientRect();
        var elementCenter = bounds.top + bounds.height / 2;
        var raw = (viewportH - elementCenter) / (viewportH / 2);
        var progress = Math.max(0, Math.min(1, raw));
        var scale = 0.2 + 0.8 * progress;

        element.style.setProperty("--bar-scale", scale.toFixed(3));
      });

      activeSwipeReveals.forEach(function (track) {
        var stage = track.querySelector("[data-swipe-reveal-stage]");

        if (!stage) return;

        var bounds = track.getBoundingClientRect();
        var stickyTop = parseFloat(window.getComputedStyle(stage).top) || 0;
        var scrollRange = Math.max(1, bounds.height - stage.offsetHeight);
        /* Scrub across the exact interval in which the stage is pinned. */
        var raw = (stickyTop - bounds.top) / scrollRange;
        var progress = Math.max(0, Math.min(1, raw));
        var clipRight = 100 - progress * 100;

        track.style.setProperty("--swipe-progress", progress.toFixed(3));
        track.style.setProperty("--swipe-clip", clipRight.toFixed(3) + "%");
      });

      motionFrame = window.requestAnimationFrame(updateMotion);
    }

    function startMotionUpdates() {
      if ((activeScrollBars.size || activeSwipeReveals.size) && motionFrame === null) {
        motionFrame = window.requestAnimationFrame(updateMotion);
      }
    }

    var motionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var isScrollBar = entry.target.hasAttribute("data-scroll-bar");

        if (isScrollBar) {
          if (entry.isIntersecting) {
            activeScrollBars.add(entry.target);
            startMotionUpdates();
          } else {
            activeScrollBars.delete(entry.target);
          }
        }

        if (entry.target.hasAttribute("data-swipe-reveal")) {
          if (entry.isIntersecting) {
            activeSwipeReveals.add(entry.target);
            startMotionUpdates();
          } else {
            activeSwipeReveals.delete(entry.target);
          }
        }

        if (!activeScrollBars.size && !activeSwipeReveals.size && motionFrame !== null) {
          window.cancelAnimationFrame(motionFrame);
          motionFrame = null;
        }

        if (entry.isIntersecting && entry.target.hasAttribute("data-reveal")) {
          entry.target.classList.add("is-revealed");

          if (!isScrollBar) {
            motionObserver.unobserve(entry.target);
          }
        }
      });
    }, {
      rootMargin: "18% 0px 18% 0px",
      threshold: 0.08
    });

    Array.prototype.forEach.call(revealElements, function (element) {
      motionObserver.observe(element);
    });

    Array.prototype.forEach.call(scrollBarElements, function (element) {
      motionObserver.observe(element);
    });

    Array.prototype.forEach.call(swipeRevealTracks, function (element) {
      motionObserver.observe(element);
    });

    if (revealElements.length || swipeRevealTracks.length) {
      document.documentElement.classList.add("motion-ready");
    }
  }

  var menuToggle = document.querySelector(".menu-toggle");
  var siteNav = document.querySelector(".site-nav");

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      siteNav.classList.toggle("is-open", !isOpen);
    });

    siteNav.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        menuToggle.setAttribute("aria-expanded", "false");
        siteNav.classList.remove("is-open");
      }
    });
  }

  var modal = document.querySelector("[data-checkout-modal]");
  var checkoutForm = document.querySelector("[data-checkout-form]");
  var checkoutTriggers = document.querySelectorAll("[data-checkout-trigger]");
  var closeButtons = document.querySelectorAll("[data-checkout-close]");
  var selectionName = document.querySelector("[data-selection-name]");
  var selectionPrice = document.querySelector("[data-selection-price]");
  var confirmation = document.querySelector("[data-checkout-confirmation]");
  var checkoutFields = document.querySelector("[data-checkout-fields]");
  var lastTrigger = null;

  function openCheckout(trigger) {
    if (!modal) return;
    lastTrigger = trigger;
    selectionName.textContent = trigger.getAttribute("data-package") || "Selected option";
    selectionPrice.textContent = trigger.getAttribute("data-price") || "Price TBD";
    checkoutForm.reset();
    confirmation.classList.remove("is-visible");
    checkoutFields.hidden = false;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    modal.querySelector(".checkout-close").focus();
  }

  function closeCheckout() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastTrigger) lastTrigger.focus();
  }

  checkoutTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      openCheckout(trigger);
    });
  });

  closeButtons.forEach(function (button) {
    button.addEventListener("click", closeCheckout);
  });

  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeCheckout();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("is-open")) closeCheckout();
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (event) {
      event.preventDefault();
      checkoutFields.hidden = true;
      confirmation.classList.add("is-visible");
      confirmation.setAttribute("tabindex", "-1");
      confirmation.focus();
    });
  }

  var contactForm = document.querySelector("[data-contact-form]");
  var contactStatus = document.querySelector("[data-contact-status]");

  if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      contactForm.reset();
      contactStatus.classList.add("is-visible");
      contactStatus.setAttribute("tabindex", "-1");
      contactStatus.focus();
    });
  }

  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = new Date().getFullYear();
  });
})();
