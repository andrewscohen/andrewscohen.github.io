(function () {
  "use strict";

  var root = document.documentElement;
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var revealObserver = null;

  function setupNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");

    if (!toggle || !nav) {
      return;
    }

    var closeMenu = function () {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      nav.dataset.open = "false";
    };

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
      nav.dataset.open = String(!isOpen);
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 720) {
        closeMenu();
      }
    });
  }

  function setupReveals() {
    var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    var groups = document.querySelectorAll("[data-stagger]");

    groups.forEach(function (group) {
      var children = group.querySelectorAll(":scope > .reveal");
      children.forEach(function (child, index) {
        child.style.setProperty("--reveal-delay", String(index * 80) + "ms");
      });
    });

    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (element) {
        element.classList.add("is-visible");
      });
      return;
    }

    revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12
      }
    );

    reveals.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  function enableMotion() {
    if (motionQuery.matches || root.classList.contains("js-motion")) {
      return;
    }

    root.classList.replace("no-js", "js-motion");
    setupReveals();
  }

  function disableMotion() {
    root.classList.replace("js-motion", "no-js");

    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    document.querySelectorAll(".reveal").forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  setupNavigation();

  var year = document.querySelector("[data-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  if (!motionQuery.matches) {
    enableMotion();
  }

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", function () {
      if (motionQuery.matches) {
        disableMotion();
      } else {
        enableMotion();
      }
    });
  }
})();
