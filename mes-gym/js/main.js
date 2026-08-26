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
  var ribbonDrawElements = document.querySelectorAll("[data-ribbon-draw]");
  var crossroadsSplitElements = document.querySelectorAll("[data-crossroads-split]");
  var facilityStackElements = document.querySelectorAll("[data-facility-stack]");
  var statRiseElements = document.querySelectorAll("[data-stat-rise]");
  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var supportsIntersectionObserver = "IntersectionObserver" in window;
  var hasMotionElements = revealElements.length || scrollBarElements.length || swipeRevealTracks.length || ribbonDrawElements.length || crossroadsSplitElements.length || facilityStackElements.length || statRiseElements.length;

  if (!reduceMotionQuery.matches && supportsIntersectionObserver && hasMotionElements) {
    var activeScrollBars = new Set();
    var activeSwipeReveals = new Set();
    var activeRibbonDraws = new Set();
    var activeCrossroadsSplits = new Set();
    var activeFacilityStacks = new Set();
    var activeStatRises = new Set();
    var motionFrame = null;

    function resolveProgress(raw) {
      var clamped = Math.max(0, Math.min(1, raw));
      /* One easing curve keeps every scrubbed module moving with the same cadence. */
      return clamped * clamped * (3 - 2 * clamped);
    }

    function getSectionRawProgress(element, viewportH) {
      var bounds = element.getBoundingClientRect();
      var start = viewportH * 0.9;
      var travel = viewportH * 0.68 + bounds.height * 0.55;

      return (start - bounds.top) / Math.max(1, travel);
    }

    function getStaggeredProgress(raw, index, count) {
      var stagger = 0.12;
      var available = 1 - stagger * Math.max(0, count - 1);

      return resolveProgress((raw - index * stagger) / Math.max(0.01, available));
    }

    function hasActiveMotion() {
      return activeScrollBars.size || activeSwipeReveals.size || activeRibbonDraws.size || activeCrossroadsSplits.size || activeFacilityStacks.size || activeStatRises.size;
    }

    function updateMotion() {
      motionFrame = null;

      if (!hasActiveMotion()) return;

      var viewportH = window.innerHeight;

      activeScrollBars.forEach(function (element) {
        var bounds = element.getBoundingClientRect();
        var elementCenter = bounds.top + bounds.height / 2;
        var raw = (viewportH - elementCenter) / (viewportH / 2);
        var progress = resolveProgress(raw);
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
        var progress = resolveProgress(raw);
        var clipRight = 100 - progress * 100;

        track.style.setProperty("--swipe-progress", progress.toFixed(3));
        track.style.setProperty("--swipe-clip", clipRight.toFixed(3) + "%");
      });

      activeRibbonDraws.forEach(function (element) {
        var raw = getSectionRawProgress(element, viewportH);
        var mustardProgress = resolveProgress(raw);
        var lightProgress = resolveProgress((raw - 0.12) / 0.88);

        element.style.setProperty("--ribbon-mustard-offset", (1000 * (1 - mustardProgress)).toFixed(2));
        element.style.setProperty("--ribbon-light-offset", (1000 * (1 - lightProgress)).toFixed(2));
      });

      activeCrossroadsSplits.forEach(function (element) {
        var progress = resolveProgress(getSectionRawProgress(element, viewportH));

        element.style.setProperty("--crossroads-progress", progress.toFixed(3));
      });

      activeFacilityStacks.forEach(function (element) {
        var cards = element.querySelectorAll("[data-facility-card]");
        var raw = getSectionRawProgress(element, viewportH);

        Array.prototype.forEach.call(cards, function (card, index) {
          var progress = getStaggeredProgress(raw, index, cards.length);
          var translate = (1 - progress) * (34 + index * 6);
          var opacity = 0.18 + progress * 0.82;

          card.style.setProperty("--facility-translate", translate.toFixed(2) + "px");
          card.style.setProperty("--facility-opacity", opacity.toFixed(3));
        });
      });

      activeStatRises.forEach(function (element) {
        var cards = element.querySelectorAll(".link-card");
        var raw = getSectionRawProgress(element, viewportH);

        Array.prototype.forEach.call(cards, function (card, index) {
          var progress = getStaggeredProgress(raw, index, cards.length);
          var translate = (1 - progress) * 26;
          var opacity = 0.2 + progress * 0.8;

          card.style.setProperty("--stat-translate", translate.toFixed(2) + "px");
          card.style.setProperty("--stat-opacity", opacity.toFixed(3));
          card.style.setProperty("--stat-accent", progress.toFixed(3));
        });
      });

      motionFrame = window.requestAnimationFrame(updateMotion);
    }

    function startMotionUpdates() {
      if (hasActiveMotion() && motionFrame === null) {
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

        if (entry.target.hasAttribute("data-ribbon-draw")) {
          if (entry.isIntersecting) {
            activeRibbonDraws.add(entry.target);
            startMotionUpdates();
          } else {
            activeRibbonDraws.delete(entry.target);
          }
        }

        if (entry.target.hasAttribute("data-crossroads-split")) {
          if (entry.isIntersecting) {
            activeCrossroadsSplits.add(entry.target);
            startMotionUpdates();
          } else {
            activeCrossroadsSplits.delete(entry.target);
          }
        }

        if (entry.target.hasAttribute("data-facility-stack")) {
          if (entry.isIntersecting) {
            activeFacilityStacks.add(entry.target);
            startMotionUpdates();
          } else {
            activeFacilityStacks.delete(entry.target);
          }
        }

        if (entry.target.hasAttribute("data-stat-rise")) {
          if (entry.isIntersecting) {
            activeStatRises.add(entry.target);
            startMotionUpdates();
          } else {
            activeStatRises.delete(entry.target);
          }
        }

        if (!hasActiveMotion() && motionFrame !== null) {
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

    Array.prototype.forEach.call(ribbonDrawElements, function (element) {
      motionObserver.observe(element);
    });

    Array.prototype.forEach.call(crossroadsSplitElements, function (element) {
      motionObserver.observe(element);
    });

    Array.prototype.forEach.call(facilityStackElements, function (element) {
      motionObserver.observe(element);
    });

    Array.prototype.forEach.call(statRiseElements, function (element) {
      motionObserver.observe(element);
    });

    document.documentElement.classList.add("motion-ready");
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
