(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const webGLDisabledOnMobile = window.matchMedia("(max-width: 915px)");
  const mobileNav = window.matchMedia("(max-width: 767px)");

  /* ---------- shared: minimal focus trap for the iOS-style overlays ---------- */
  const FOCUSABLE = 'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])';
  const trapFocus = (container, e) => {
    if (e.key !== "Tab") return;
    const items = [...container.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* ---------- shared: swipe navigation ---------- */
  const addSwipeNavigation = (element, onPrevious, onNext) => {
    let pointerId = null, startX = 0, startY = 0;
    element.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("a, button, input")) return;
      pointerId = e.pointerId; startX = e.clientX; startY = e.clientY;
      element.classList.add("is-dragging");
      element.setPointerCapture?.(pointerId);
    });
    element.addEventListener("pointerup", (e) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      pointerId = null; element.classList.remove("is-dragging");
      if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;
      dx < 0 ? onNext() : onPrevious();
    });
    element.addEventListener("pointercancel", () => { pointerId = null; element.classList.remove("is-dragging"); });
  };

  /* ---------- shared: rAF-throttled scroll handler ---------- */
  const onScrollFrame = (handler) => {
    let ticking = false;
    const run = () => { ticking = false; handler(); };
    return () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
  };

  /* ---------- shared: colour maths for the adaptive ink field ----------
     WCAG relative luminance needs linearised sRGB. Reading the raw channels
     overstates a dark navy by an order of magnitude, which puts the crossover
     between dark ink and light ink in the wrong place entirely. */
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const srgbToLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const relLuminance = (r, g, b) =>
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);

  /* GLSL smoothstep, reversed-edge form included: the backdrop shader uses it */
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  /* Quintic Hermite. Both the first and the second derivative vanish at the
     edges, so a ramp built on it has no knee at either end -- there is no frame
     where the eye can say "the change starts here". Cubic smoothstep leaves a
     discontinuity in curvature that reads, on a full-viewport colour field, as
     exactly the moment of the switch. The ground uses this one, in the shader
     and in the CPU sampler alike. */
  const smootherstep = (edge0, edge1, x) => {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  /* layout position, immune to the reveal transform (a client rect is not) */
  const docOffsetTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
  const docOffsetLeft = (el) => { let x = 0; for (let n = el; n; n = n.offsetParent) x += n.offsetLeft; return x; };

  /* ---------- header ---------- */
  function initHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const progress = header.querySelector("[data-header-progress]");
    const syncRenderedHeight = () => {
      document.documentElement.style.setProperty("--header-rendered-h", `${header.getBoundingClientRect().height}px`);
    };

    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
      syncRenderedHeight();
      if (!progress) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--progress", max > 0 ? String(Math.min(1, window.scrollY / max)) : "0");
    };

    const onScroll = onScrollFrame(update);
    if ("ResizeObserver" in window) {
      new ResizeObserver(syncRenderedHeight).observe(header);
    } else {
      header.addEventListener("transitionend", syncRenderedHeight);
    }
    document.fonts?.ready.then(syncRenderedHeight);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }

  /* ---------- scrollspy: the nav reports the current section ---------- */
  function initScrollSpy() {
    const links = [...document.querySelectorAll(".nav-desktop a[href^='#']")];
    if (!links.length || !("IntersectionObserver" in window)) return;

    const sections = new Map();
    links.forEach((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) sections.set(target, link);
    });
    if (!sections.size) return;

    const setCurrent = (link) => links.forEach((item) => {
      const active = item === link;
      item.classList.toggle("is-current", active);
      if (active) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setCurrent(sections.get(entry.target));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach((_, section) => observer.observe(section));
  }

  /* ---------- floor care: four planes, one scroll reading ----------
     The photograph, the registration figure, the arrival and the handover all
     come from a single measurement of how far the chapter has travelled through
     the frame. `--fc-enter` and `--fc-exit` are what let the section dissolve
     into the canvas instead of ending at a painted edge, so they are written
     even under reduced motion — they are not motion, they are the seam. */
  function initFloorParallax() {
    const section = document.querySelector(".floorcare");
    if (!section) return;

    const update = () => {
      const viewH = window.innerHeight || 800;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < -240 || rect.top > viewH + 240) return;

      const pass = clamp01((viewH - rect.top) / (viewH + rect.height));
      section.style.setProperty("--fc-enter", smoothstep(0.02, 0.30, pass).toFixed(3));
      section.style.setProperty("--fc-exit", smoothstep(0.58, 0.96, pass).toFixed(3));

      if (reducedMotion.matches || window.innerWidth < 900) {
        section.style.setProperty("--parallax", "0px");
        section.style.setProperty("--fc-figure", "0px");
        return;
      }
      const offset = (rect.top + rect.height / 2 - viewH / 2) / viewH;
      section.style.setProperty("--parallax", (offset * 46).toFixed(1) + "px");
      /* The photograph keeps its functional parallax on desktop. The legacy
         registration figure only travels in the <=915px edition. */
      section.style.setProperty(
        "--fc-figure",
        window.innerWidth <= 915 ? (offset * -26).toFixed(1) + "px" : "0px"
      );
    };

    const onScroll = onScrollFrame(update);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    reducedMotion.addEventListener?.("change", update);
  }

  /* ---------- mobile navigation ---------- */
  function initNavigation() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) return;
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    const open = () => {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    toggle.addEventListener("click", () => {
      toggle.getAttribute("aria-expanded") === "true" ? close() : open();
    });
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    /* the phone-width nav (tab bar + options sheet) replaces this overlay
       below 768px; if the window crosses that line while it's open, close it
       so it can't be left stranded, invisible but still holding scroll lock */
    mobileNav.addEventListener?.("change", (e) => { if (e.matches) close(); });
  }

  /* ---------- bottom tab bar (mobile only, hidden by CSS at >=768px) ---------- */
  function initTabBar() {
    const bar = document.querySelector("[data-tabbar]");
    if (!bar) return;
    const links = [...bar.querySelectorAll("[data-tabbar-link]")];
    const indicator = bar.querySelector(".m-tabbar-indicator");
    if (!links.length) return;

    const setCurrent = (link) => {
      if (!link) return;
      links.forEach((l) => {
        const active = l === link;
        l.classList.toggle("is-current", active);
        if (active) l.setAttribute("aria-current", "page");
        else l.removeAttribute("aria-current");
      });
      if (indicator) {
        indicator.style.width = link.offsetWidth + "px";
        indicator.style.transform = `translateX(${link.offsetLeft}px)`;
      }
    };

    links.forEach((link) => {
      link.addEventListener("click", () => {
        const target = link.dataset.tabbarTarget;
        const behavior = reducedMotion.matches ? "auto" : "smooth";
        if (target === "top") window.scrollTo({ top: 0, behavior });
        else document.querySelector(target)?.scrollIntoView({ behavior, block: "start" });
      });
    });

    /* a second, independent scrollspy: initScrollSpy() only ever watches
       .nav-desktop links, so this cannot fight it for the same elements */
    const targets = links
      .map((link) => {
        const sel = link.dataset.tabbarTarget;
        const el = sel === "top" ? document.querySelector(".hero") : document.querySelector(sel);
        return el ? { link, el } : null;
      })
      .filter(Boolean);

    if ("IntersectionObserver" in window && targets.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const match = targets.find((t) => t.el === entry.target);
          if (match) setCurrent(match.link);
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      targets.forEach((t) => observer.observe(t.el));
    }

    setCurrent(links[0]);
    window.addEventListener("resize", onScrollFrame(() => setCurrent(bar.querySelector(".is-current") || links[0])));
  }

  /* ---------- secondary-options bottom sheet (mobile only) ---------- */
  function initOptionsSheet() {
    const toggle = document.querySelector("[data-options-sheet-toggle]");
    const sheet = document.querySelector("[data-options-sheet]");
    const backdrop = document.querySelector("[data-options-sheet-backdrop]");
    if (!toggle || !sheet || !backdrop) return;
    let lastFocused = null;

    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      sheet.classList.remove("is-open");
      sheet.setAttribute("aria-hidden", "true");
      sheet.setAttribute("inert", "");
      backdrop.classList.remove("is-open");
      document.body.classList.remove("m-overlay-open");
      document.body.style.overflow = "";
      lastFocused?.focus();
    };
    const open = () => {
      lastFocused = document.activeElement;
      toggle.setAttribute("aria-expanded", "true");
      requestAnimationFrame(() => {
        sheet.classList.add("is-open");
        backdrop.classList.add("is-open");
      });
      sheet.setAttribute("aria-hidden", "false");
      sheet.removeAttribute("inert");
      document.body.classList.add("m-overlay-open");
      document.body.style.overflow = "hidden";
      sheet.querySelector("a, button")?.focus();
    };

    toggle.addEventListener("click", () => (sheet.classList.contains("is-open") ? close() : open()));
    backdrop.addEventListener("click", close);
    sheet.querySelectorAll("[data-options-sheet-link]").forEach((link) => link.addEventListener("click", close));
    window.addEventListener("keydown", (e) => {
      if (!sheet.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      trapFocus(sheet, e);
    });

    /* swipe-down to dismiss: addSwipeNavigation() is built for horizontal
       prev/next gestures and explicitly ignores vertical drags, so this is
       a small dedicated vertical handler rather than a forced reuse */
    let startY = null;
    sheet.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button")) return;
      startY = e.clientY;
    });
    sheet.addEventListener("pointermove", (e) => {
      if (startY === null) return;
      const dy = e.clientY - startY;
      if (dy > 0) sheet.style.transform = `translateY(${dy}px)`;
    });
    const endDrag = (e) => {
      if (startY === null) return;
      const dy = e.clientY - startY;
      sheet.style.transform = "";
      startY = null;
      if (dy > 80) close();
    };
    sheet.addEventListener("pointerup", endDrag);
    sheet.addEventListener("pointercancel", () => { startY = null; sheet.style.transform = ""; });
  }

  /* ---------- full-screen service cover layers (mobile only) ----------
     Replaces the inline accordion (initServiceInteractions) below 768px
     without editing that function: a capturing click listener on the card
     runs before the toggle/card-cta's own bubbling listeners, so it can
     intercept and stop them cleanly whenever the mobile breakpoint is live. */
  function initServiceCovers() {
    const covers = [...document.querySelectorAll("[data-service-cover]")];
    const cards = [...document.querySelectorAll("[data-service-card]")];
    if (!covers.length || !cards.length) return;

    const keyForCard = (card) => {
      if (card.classList.contains("is-commercial")) return "commercial";
      if (card.classList.contains("is-floor")) return "floor";
      if (card.classList.contains("is-residential")) return "residential";
      if (card.classList.contains("is-post-construction")) return "post-construction";
      return null;
    };
    const byKey = new Map(covers.map((cover) => [cover.dataset.serviceCover, cover]));
    let lastFocused = null, openCoverEl = null;
    /* a cover reads as a pushed screen, so the platform Back gesture has to
       reverse it instead of leaving the site. ownsEntry tracks whether the
       open cover is holding a history entry of its own; switching straight
       from one service to another replaces it rather than stacking, so Back
       is never more than one step deep however many covers were browsed. */
    let ownsEntry = false, focusOnHistoryClose = true;

    const dismiss = (returnFocus) => {
      if (!openCoverEl) return;
      openCoverEl.classList.remove("is-open");
      openCoverEl.setAttribute("aria-hidden", "true");
      openCoverEl.setAttribute("inert", "");
      document.body.classList.remove("m-overlay-open");
      document.body.style.overflow = "";
      openCoverEl = null;
      if (returnFocus) lastFocused?.focus();
    };

    const closeCover = (returnFocus = true) => {
      if (!openCoverEl) return;
      if (ownsEntry) {
        /* let popstate do the closing so the entry is consumed, otherwise the
           Back gesture would afterwards land on a screen that is already gone */
        focusOnHistoryClose = returnFocus;
        window.history.back();
        return;
      }
      dismiss(returnFocus);
    };

    const openCover = (key, trigger, fromHistory = false) => {
      const cover = byKey.get(key);
      if (!cover) return;
      const wasOpen = !!openCoverEl;
      dismiss(false);
      lastFocused = trigger || (wasOpen ? lastFocused : document.activeElement);
      cover.classList.add("is-open");
      cover.setAttribute("aria-hidden", "false");
      cover.removeAttribute("inert");
      document.body.classList.add("m-overlay-open");
      document.body.style.overflow = "hidden";
      cover.scrollTop = 0;
      openCoverEl = cover;
      cover.querySelector("[data-service-cover-close]")?.focus();

      if (fromHistory) { ownsEntry = true; return; }
      if (ownsEntry) window.history.replaceState({ cover: key }, "");
      else { window.history.pushState({ cover: key }, ""); ownsEntry = true; }
    };

    cards.forEach((card) => {
      const key = keyForCard(card);
      if (!key || !byKey.has(key)) return;
      card.addEventListener("click", (e) => {
        if (!mobileNav.matches) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        openCover(key, card);
      }, true);
    });

    covers.forEach((cover) => {
      cover.querySelectorAll("[data-service-cover-close]").forEach((btn) => {
        btn.addEventListener("click", () => {
          /* the quote CTA is a real anchor: it is about to push a #quote entry
             of its own, so the cover's entry is replaced rather than popped —
             going back from the form must not reopen the cover behind it */
          if (btn.tagName === "A") {
            if (ownsEntry) { window.history.replaceState({}, ""); ownsEntry = false; }
            dismiss(false);
            return;
          }
          closeCover(true);
        });
      });
    });

    window.addEventListener("popstate", (e) => {
      const key = e.state && e.state.cover;
      if (openCoverEl && !key) {
        ownsEntry = false;
        dismiss(focusOnHistoryClose);
        focusOnHistoryClose = true;
        return;
      }
      if (key && !openCoverEl && mobileNav.matches) openCover(key, null, true);
    });

    window.addEventListener("keydown", (e) => {
      if (!openCoverEl) return;
      if (e.key === "Escape") closeCover();
      trapFocus(openCoverEl, e);
    });

    /* a cover is phone-only furniture: if the viewport grows past the mobile
       breakpoint while one is open it would be hidden by CSS but still holding
       the scroll lock, exactly the stranded state initNavigation() guards for */
    mobileNav.addEventListener?.("change", (ev) => { if (!ev.matches) closeCover(false); });
  }

  /* ---------- hero slider ---------- */
  function initHeroSlider() {
    const hero = document.querySelector("[data-hero-slider]");
    if (!hero) return;
    const slides = [...hero.querySelectorAll("[data-hero-slide]")];
    let currentIndex = 0, autoplayId = null;

    /* on a phone the carousel has no arrows and swipe leaves no trace that
       two more slides exist: give it a count and a row of taps. The rail is
       built for every width and revealed by the mobile edition alone. */
    const rail = document.createElement("div");
    rail.className = "hero-rail";
    rail.innerHTML = '<span class="hero-rail-index"><b data-hero-rail-current>01</b> / '
      + String(slides.length).padStart(2, "0") + '</span><div class="hero-rail-ticks"></div>';
    const ticks = rail.querySelector(".hero-rail-ticks");
    const railCurrent = rail.querySelector("[data-hero-rail-current]");
    slides.forEach((_, i) => {
      const tick = document.createElement("button");
      tick.type = "button";
      tick.setAttribute("aria-label", `Show slide ${i + 1} of ${slides.length}`);
      tick.innerHTML = "<i></i>";
      tick.addEventListener("click", () => showSlide(i));
      ticks.appendChild(tick);
    });
    hero.appendChild(rail);

    const showSlide = (index, restart = true) => {
      currentIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === currentIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });
      railCurrent.textContent = String(currentIndex + 1).padStart(2, "0");
      [...ticks.children].forEach((tick, i) => tick.setAttribute("aria-current", String(i === currentIndex)));
      if (restart) startAutoplay();
    };

    const nextSlide = () => showSlide(currentIndex + 1);
    const previousSlide = () => showSlide(currentIndex - 1);

    const startAutoplay = () => {
      window.clearInterval(autoplayId);
      autoplayId = null;
      if (reducedMotion.matches || document.hidden) return;
      autoplayId = window.setInterval(() => showSlide(currentIndex + 1, false), 7000);
    };

    const refreshAutoplay = () => { startAutoplay(); };

    hero.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") previousSlide();
    });
    document.addEventListener("visibilitychange", refreshAutoplay);
    reducedMotion.addEventListener?.("change", refreshAutoplay);
    addSwipeNavigation(hero, previousSlide, nextSlide);
    showSlide(0);
  }

  /* ---------- scroll reveal ---------- */
  function initScrollReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-revealed"));
      return;
    }
    let staggerGroup = null, staggerCount = 0;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const parent = el.parentElement;
        if (parent !== staggerGroup) { staggerGroup = parent; staggerCount = 0; }
        /* a short viewport shows a whole group at once, so a long cascade
           reads as lag rather than as choreography */
        const narrow = window.innerWidth <= 767;
        const delay = Math.min(staggerCount * (narrow ? 70 : 90), narrow ? 240 : 360);
        staggerCount++;
        window.setTimeout(() => el.classList.add("is-revealed"), delay);
        observer.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => observer.observe(el));
  }

  /* ---------- service card interactions ---------- */
  function initServiceInteractions() {
    const cards = document.querySelectorAll("[data-service-card]");
    cards.forEach((card) => {
      const toggle = card.querySelector("[data-service-toggle]");
      const setActive = (val) => {
        card.classList.toggle("is-active", val);
        toggle?.setAttribute("aria-expanded", String(val));
      };
      toggle?.addEventListener("click", (e) => {
        e.stopPropagation();
        setActive(!card.classList.contains("is-active"));
      });
      /* the card's quote line is styled as a call to action and reads as one,
         so it has to behave like one: on a phone a dead link is a dead end */
      card.querySelector(".card-cta")?.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelector("#quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(!card.classList.contains("is-active")); }
        if (e.key === "Escape") setActive(false);
      });
    });
  }

  /* ---------- recurring maintenance selector ---------- */
  function initMaintenanceSelector() {
    const tabs = document.querySelectorAll("[data-freq]");
    const title = document.querySelector("[data-freq-title]");
    const list = document.querySelector("[data-freq-list]");
    const count = document.querySelector("[data-freq-count]");
    if (!tabs.length || !list) return;

    const iconCheck = '<svg class="icon" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>';
    const plans = {
      daily: { title: "Daily Plan", items: ["Restroom sanitization", "Trash removal", "Touchpoint disinfection", "Common area upkeep"] },
      weekly: { title: "Weekly Plan", items: ["Full restroom cleaning", "Break room detail", "Floor vacuuming & mopping", "Trash removal", "Touchpoint disinfection"] },
      biweekly: { title: "Bi-Weekly Plan", items: ["Deep restroom cleaning", "Common area detail", "Break room deep clean", "Floor care check", "Trash removal"] },
      monthly: { title: "Monthly Plan", items: ["Full facility deep clean", "Floor polishing check-in", "Interior glass & touchpoints", "Break room & restroom deep clean"] }
    };

    const render = (key) => {
      const plan = plans[key];
      if (!plan) return;
      if (title) title.textContent = plan.title;
      if (count) count.textContent = String(plan.items.length).padStart(2, "0");
      list.innerHTML = "";
      plan.items.forEach((item, i) => {
        const li = document.createElement("li");
        li.innerHTML = iconCheck + "<span>" + item + "</span>";
        list.appendChild(li);
        window.setTimeout(() => li.classList.add("is-in"), 60 * i);
      });
    };

    /* the mobile segmented control slides a single champagne indicator behind
       the active tab; publishing the index lets CSS animate it without the
       plan data or the list rendering above knowing anything about it */
    const tabList = tabs[0].parentElement;
    const setIndicator = (index) => tabList?.style.setProperty("--freq-i", String(index));

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        setIndicator(index);
        render(tab.dataset.freq);
      });
    });

    setIndicator(0);
    render("daily");
  }

  /* ---------- before / after comparison ---------- */
  function initBeforeAfter() {
    const frame = document.querySelector("[data-before-after]");
    if (!frame) return;
    const after = frame.querySelector("[data-ba-after]");
    const handle = frame.querySelector("[data-ba-handle]");
    const range = frame.querySelector("[data-ba-range]");
    /* the board is the thing that reads the gesture: the divider is a
       measurement, and a measurement belongs to the instrument around it */
    const board = frame.closest(".ba-board") || frame;
    const readout = board.querySelector("[data-ba-readout]");

    const setPosition = (percent) => {
      const clamped = Math.max(0, Math.min(100, percent));
      after.style.clipPath = `inset(0 0 0 ${clamped}%)`;
      handle.style.left = clamped + "%";
      range.value = String(clamped);
      board.style.setProperty("--ba-x", (clamped / 100).toFixed(4));
      board.style.setProperty("--ba-split", (1 - clamped / 100).toFixed(4));
      if (readout) readout.textContent = String(Math.round(clamped));
    };

    /* the invitation to drag retires as soon as the user takes it */
    const markTouched = () => frame.classList.add("is-touched");

    range.addEventListener("input", () => {
      setPosition(Number(range.value));
      markTouched();
    });

    /* The native range owns drag, touch and keyboard behavior. JavaScript only
       mirrors its lifecycle into the frame's visual states. */
    let activePointerId = null;
    range.addEventListener("pointerdown", (e) => {
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      activePointerId = e.pointerId;
      frame.classList.add("is-dragging");
      markTouched();
    });

    const finishDrag = (e) => {
      if (activePointerId === null || e.pointerId !== activePointerId) return;
      activePointerId = null;
      frame.classList.remove("is-dragging");
    };

    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    range.addEventListener("lostpointercapture", finishDrag);

    setPosition(Number(range.value));
  }

  /* ---------- testimonials ---------- */
  function initTestimonials() {
    const carousel = document.querySelector("[data-testimonial-carousel]");
    if (!carousel) return;
    const slides = [...carousel.querySelectorAll("[data-testimonial-slide]")];
    const track = carousel.querySelector("[data-testimonial-track]");
    const status = carousel.querySelector("[data-testimonial-status]");
    let currentIndex = 0, autoplayId = null;

    const show = (index, direction = 0) => {
      /* the quote enters from the side the reader asked for: the offset has
         to be committed before the class flips, or there is nothing to ease from */
      if (track && direction !== 0) {
        track.style.setProperty("--dx", direction > 0 ? "30px" : "-30px");
        void track.offsetWidth;
      }
      currentIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === currentIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });
      if (status) status.textContent = `Testimonial ${currentIndex + 1} of ${slides.length}`;
    };

    const startAutoplay = () => {
      window.clearInterval(autoplayId);
      autoplayId = null;
      if (reducedMotion.matches || document.hidden) return;
      autoplayId = window.setInterval(() => show(currentIndex + 1, 1), 6000);
    };
    const pauseAutoplay = () => window.clearInterval(autoplayId);
    const refreshAutoplay = () => startAutoplay();

    carousel.addEventListener("pointerenter", pauseAutoplay);
    carousel.addEventListener("pointerleave", startAutoplay);
    carousel.addEventListener("focusin", pauseAutoplay);
    carousel.addEventListener("focusout", startAutoplay);
    document.addEventListener("visibilitychange", refreshAutoplay);
    reducedMotion.addEventListener?.("change", refreshAutoplay);

    show(0);
    startAutoplay();
  }

  /* ---------- FAQ accordion ---------- */
  function initFAQ() {
    const buttons = [...document.querySelectorAll("[data-faq-button]")];
    if (!buttons.length) return;

    const panelOf = (button) => document.getElementById(button.getAttribute("aria-controls"));

    buttons.forEach((button) => {
      const panel = panelOf(button);
      if (!panel) return;
      button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";

        const faqList = button.closest(".faq-list");
        const listButtons = faqList
          ? [...faqList.querySelectorAll("[data-faq-button]")]
          : buttons;

        listButtons.forEach((otherButton) => {
          if (otherButton === button || otherButton.getAttribute("aria-expanded") !== "true") return;
          otherButton.setAttribute("aria-expanded", "false");
          otherButton.closest(".faq-item")?.classList.remove("is-open");
          const otherPanel = panelOf(otherButton);
          if (otherPanel) otherPanel.style.maxHeight = "0px";
        });

        button.setAttribute("aria-expanded", String(!expanded));
        button.closest(".faq-item")?.classList.toggle("is-open", !expanded);
        panel.style.maxHeight = expanded ? "0px" : panel.scrollHeight + "px";
      });
    });

    /* an open answer reflows when the viewport changes: re-measure it,
       otherwise a rotated phone crops the text */
    const remeasure = onScrollFrame(() => {
      buttons.forEach((button) => {
        if (button.getAttribute("aria-expanded") !== "true") return;
        const panel = panelOf(button);
        if (!panel) return;
        panel.style.maxHeight = "none";
        const height = panel.scrollHeight;
        panel.style.maxHeight = height + "px";
      });
    });
    window.addEventListener("resize", remeasure);
    window.addEventListener("orientationchange", remeasure);
  }

  /* ---------- quote form (multi-step) ---------- */
  function initQuoteForm() {
    const form = document.querySelector("[data-quote-form]");
    if (!form) return;
    const steps = [...form.querySelectorAll("[data-q-step]")];
    const progress = document.querySelectorAll("[data-quote-progress] span");
    const nextBtn = form.querySelector("[data-q-next]");
    const backBtn = form.querySelector("[data-q-back]");
    const success = form.querySelector("[data-q-success]");
    const nav = form.querySelector("[data-q-nav]");
    let current = 0;
    const answers = {};

    const updateProgress = () => {
      progress.forEach((span, i) => {
        span.classList.toggle("is-done", i < current);
        span.classList.toggle("is-current", i === current);
      });
    };

    const showStep = (index) => {
      steps.forEach((step, i) => step.classList.toggle("is-active", i === index));
      backBtn.disabled = index === 0;
      nextBtn.textContent = index === steps.length - 1 ? "Submit Request" : "Continue";
      updateProgress();
    };

    form.querySelectorAll("[data-q-group]").forEach((group) => {
      const key = group.dataset.qGroup;
      group.querySelectorAll("[data-q-value]").forEach((option) => {
        option.addEventListener("click", () => {
          group.querySelectorAll("[data-q-value]").forEach((o) => o.classList.remove("is-selected"));
          option.classList.add("is-selected");
          answers[key] = option.dataset.qValue;
        });
      });
    });

    nextBtn.addEventListener("click", () => {
      if (current < steps.length - 1) {
        current++;
        showStep(current);
      } else {
        form.querySelectorAll(".q-step").forEach((s) => (s.style.display = "none"));
        nav.style.display = "none";
        document.querySelector("[data-quote-progress]").style.display = "none";
        success.classList.add("is-active");
      }
    });

    backBtn.addEventListener("click", () => {
      if (current > 0) { current--; showStep(current); }
    });

    showStep(0);
  }

  /* ---------- social impact counter ---------- */
  function initCounters() {
    const el = document.querySelector("[data-impact-counter]");
    if (!el || !("IntersectionObserver" in window)) return;
    const value = el.querySelector("[data-impact-value]");
    const viz = document.querySelector("[data-impact-viz]");
    if (!value) return;
    const targetA = Number(el.dataset.targetA);
    const targetB = Number(el.dataset.targetB);

    const animate = () => {
      /* the ratio diagram fills in step with the number it illustrates */
      viz?.classList.add("is-counted");
      if (reducedMotion.matches) {
        value.textContent = `${targetA}:${targetB}`;
        return;
      }
      const duration = 1200;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const a = Math.round(targetA * eased);
        const b = Math.round(targetB * eased);
        value.textContent = `${a}:${b}`;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animate(); observer.disconnect(); }
      });
    }, { threshold: 0.5 });
    observer.observe(el);
  }

  /* ---------- Three.js Quiet Material Field ---------- */
  let threeWorld = null;
  let threeModule = null;
  let threeBooting = false;
  let restoreAttempted = false;
  let removeThreeContextRecovery = null;
  const THREE_MODULE_URL = new URL("./assets/vendor/three-r128.module.js", import.meta.url).href;
  const WEBGL_REASONS = new Set(["module", "renderer", "frame", "context"]);

  const WORLD_PALETTE = {
    navyDark: 0x071B2E,
    navy: 0x102A43,
    navy2: 0x173B5A,
    petrolDeep: 0x12556B,
    petrol: 0x1F6F8B,
    petrolLight: 0x2A8EAA,
    paper: 0xFFFDF8,
    ivory: 0xF7F4EF,
    sand: 0xF5EFEB,
    sage: 0x8BAE8B,
    sageSoft: 0xDDE8D8,
    champagne: 0xC8A96A
  };

  function setWebGLState(state, mode = "", reason = "") {
    const root = document.documentElement;
    root.dataset.webglState = state;
    if (mode) root.dataset.webglMode = mode;
    else delete root.dataset.webglMode;
    if (reason) root.dataset.webglReason = reason;
    else delete root.dataset.webglReason;
  }

  function makeWebGLError(reason, message) {
    const error = new Error(message);
    error.webglReason = reason;
    return error;
  }

  function classifyWebGLError(error, fallback = "renderer") {
    return WEBGL_REASONS.has(error?.webglReason) ? error.webglReason : fallback;
  }

  function replaceThreeCanvas(canvas = document.getElementById("canvas-fixed")) {
    if (!canvas) return null;
    removeThreeContextRecovery?.();
    removeThreeContextRecovery = null;
    const replacement = canvas.cloneNode(false);
    replacement.removeAttribute("width");
    replacement.removeAttribute("height");
    canvas.replaceWith(replacement);
    installThreeContextRecovery(replacement);
    return replacement;
  }

  function disableThreeForMobile() {
    const root = document.documentElement;
    const controller = threeWorld;
    threeWorld = null;
    controller?.destroy();
    removeThreeContextRecovery?.();
    removeThreeContextRecovery = null;
    root.classList.add("no-canvas");
    setWebGLState("disabled", "mobile");
    document.getElementById("loading")?.classList.add("hidden");
  }

  function syncThreeAvailability() {
    if (webGLDisabledOnMobile.matches) {
      disableThreeForMobile();
      return;
    }
    installThreeContextRecovery();
    void initThreeWorld();
  }

  function restartThreeWorld({ freshCanvas = false } = {}) {
    if (webGLDisabledOnMobile.matches) {
      disableThreeForMobile();
      return;
    }
    const root = document.documentElement;
    const controller = threeWorld;
    threeWorld = null;
    controller?.destroy();
    if (freshCanvas) replaceThreeCanvas();
    root.classList.add("no-canvas");
    setWebGLState("booting");
    void initThreeWorld();
  }

  async function initThreeWorld() {
    let canvas = document.getElementById("canvas-fixed");
    if (webGLDisabledOnMobile.matches) {
      disableThreeForMobile();
      return;
    }
    if (!canvas || threeBooting || threeWorld) return;
    threeBooting = true;
    setWebGLState("booting");

    try {
      try {
        threeModule ||= await import(THREE_MODULE_URL);
      } catch (error) {
        const moduleError = makeWebGLError("module", "Local Three.js module could not be loaded");
        moduleError.cause = error;
        throw moduleError;
      }
      if (String(threeModule.REVISION) !== "128") {
        throw makeWebGLError("module", `Unexpected Three.js revision ${threeModule.REVISION}`);
      }
      if (webGLDisabledOnMobile.matches) {
        disableThreeForMobile();
        return;
      }

      const modes = ["preferred", "compatibility"];
      let firstFailure = null;
      let lastError = null;
      let lastReason = "renderer";

      for (let attempt = 0; attempt < modes.length; attempt++) {
        if (webGLDisabledOnMobile.matches) {
          disableThreeForMobile();
          return;
        }
        const mode = modes[attempt];
        if (attempt > 0) canvas = replaceThreeCanvas(canvas);
        if (!canvas) throw makeWebGLError("renderer", "WebGL canvas is unavailable");
        setWebGLState("booting", mode);
        let controller = null;

        try {
          controller = createThreeWorld(threeModule, canvas, mode);
          threeWorld = controller;
          controller.start();
          if (threeWorld !== controller) throw makeWebGLError("context", "WebGL controller was interrupted during boot");
          document.documentElement.classList.remove("no-canvas");
          setWebGLState("ready", mode);
          if (mode === "compatibility" && firstFailure) {
            console.warn("[4Points WebGL] Preferred renderer failed; compatibility renderer is active.", firstFailure);
          }
          return;
        } catch (error) {
          controller?.destroy();
          if (threeWorld === controller) threeWorld = null;
          lastError = error;
          lastReason = classifyWebGLError(error);
          firstFailure ||= error;
        }
      }

      if (lastError) lastError.webglReason = lastReason;
      throw lastError || makeWebGLError("renderer", "WebGL renderer could not start");
    } catch (error) {
      const reason = classifyWebGLError(error);
      threeWorld = null;
      document.documentElement.classList.add("no-canvas");
      setWebGLState("fallback", "", reason);
      document.getElementById("loading")?.classList.add("hidden");
      console.error(`[4Points WebGL] ${reason} failure; CSS fallback is active.`, error);
    } finally {
      threeBooting = false;
    }
  }

  function installThreeContextRecovery(canvas = document.getElementById("canvas-fixed")) {
    removeThreeContextRecovery?.();
    removeThreeContextRecovery = null;
    if (!canvas || webGLDisabledOnMobile.matches) return;

    const onContextLost = (event) => {
      event.preventDefault();
      if (webGLDisabledOnMobile.matches) {
        disableThreeForMobile();
        return;
      }
      const mode = document.documentElement.dataset.webglMode || "";
      const controller = threeWorld;
      threeWorld = null;
      controller?.destroy();
      document.documentElement.classList.add("no-canvas");
      setWebGLState("lost", mode, "context");
    };

    const onContextRestored = () => {
      if (webGLDisabledOnMobile.matches) {
        disableThreeForMobile();
        return;
      }
      if (restoreAttempted) {
        setWebGLState("fallback", "", "context");
        return;
      }
      restoreAttempted = true;
      replaceThreeCanvas(canvas);
      setWebGLState("booting");
      void initThreeWorld();
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    removeThreeContextRecovery = () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
    };
  }

  function createThreeWorld(THREE, canvas, rendererMode = "preferred") {
    const root = document.documentElement;
    const compactQuery = window.matchMedia("(max-width:1200px)");
    const getProfile = () => compactQuery.matches ? "compact" : "wide";
    const initialProfile = getProfile();
    const compatibilityMode = rendererMode === "compatibility";
    const TRAVEL = 152;
    const TRACK_TARGET_SIZE = compatibilityMode ? 1024 : 2048;
    const PARAM_KEYS = [
      "relief", "freq", "order", "polish", "seam", "points", "five",
      "fog", "hfog", "amb", "key", "az", "el", "camY", "pitch"
    ];

    const C = Object.fromEntries(
      Object.entries(WORLD_PALETTE).map(([key, value]) => [key, new THREE.Color(value)])
    );
    const S = (...colors) => colors.map((color, index) => [
      colors.length === 1 ? 0 : index / (colors.length - 1),
      color
    ]);

    const chapterDefs = [
      {
        key: "hero", sel: ".hero",
        ground: S(C.navyDark, C.navy), deep: S(C.navyDark), high: S(C.navy2),
        skyLo: S(C.navyDark), skyHi: S(C.navy, C.navy2), fogCol: S(C.navyDark, C.navy),
        accent: S(C.petrol), relief: .48, freq: .27, order: .08, polish: .10, seam: 0,
        points: .28, five: 0, fog: .055, hfog: .55, amb: .23, key: .75,
        az: -1.05, el: .17, camY: 3.0, pitch: -.115
      },
      {
        key: "standard", sel: ".standard",
        ground: S(C.navy, C.navy2), deep: S(C.navyDark, C.navy), high: S(C.navy2, C.petrolDeep),
        skyLo: S(C.navyDark, C.navy), skyHi: S(C.navy2), fogCol: S(C.navy),
        accent: S(C.petrol), relief: .62, freq: .29, order: .18, polish: .14, seam: 0,
        points: .34, five: 0, fog: .052, hfog: .45, amb: .24, key: .76,
        az: -1.0, el: .175, camY: 2.9, pitch: -.11
      },
      {
        key: "services", sel: ".services",
        ground: S(C.navy, C.navyDark), deep: S(C.navyDark), high: S(C.navy2),
        skyLo: S(C.navyDark), skyHi: S(C.navy2, C.navy), fogCol: S(C.navy),
        accent: S(C.petrolLight), relief: .95, freq: .34, order: .54, polish: .18, seam: 0,
        points: .42, five: 0, fog: .05, hfog: .34, amb: .25, key: .79,
        az: -.92, el: .16, camY: 2.8, pitch: -.105
      },
      {
        key: "maintenance", sel: ".maintenance",
        ground: S(C.paper, C.ivory), deep: S(C.ivory, C.sand), high: S(C.paper),
        skyLo: S(C.ivory), skyHi: S(C.paper), fogCol: S(C.ivory),
        accent: S(C.petrol), relief: .88, freq: .36, order: .74, polish: .24, seam: .08,
        points: .30, five: 0, fog: .037, hfog: .08, amb: .57, key: .50,
        az: -.85, el: .15, camY: 2.7, pitch: -.10
      },
      {
        key: "floorcare", sel: ".floorcare",
        ground: S(C.navyDark, C.petrolDeep), deep: S(C.navyDark, C.petrolDeep), high: S(C.petrolDeep, C.petrol),
        skyLo: S(C.navyDark, C.petrolDeep), skyHi: S(C.navy, C.petrol), fogCol: S(C.navy, C.petrolDeep),
        accent: S(C.champagne), relief: .82, freq: .30, order: .86, polish: .93, seam: .92,
        points: .24, five: 0, fog: .044, hfog: .20, amb: .22, key: .84,
        az: -.62, el: .095, camY: 2.15, pitch: -.085
      },
      {
        key: "beforeafter", sel: ".beforeafter",
        ground: S(C.paper, C.sand), deep: S(C.sand, C.ivory), high: S(C.paper),
        skyLo: S(C.sand, C.ivory), skyHi: S(C.paper), fogCol: S(C.ivory, C.sand),
        accent: S(C.petrol), relief: .78, freq: .32, order: .60, polish: .52, seam: .34,
        points: .24, five: 0, fog: .039, hfog: .09, amb: .54, key: .54,
        az: -.75, el: .13, camY: 2.5, pitch: -.10
      },
      {
        key: "residential", sel: ".residential",
        ground: S(C.ivory, C.sageSoft), deep: S(C.ivory, C.sageSoft), high: S(C.paper),
        skyLo: S(C.ivory, C.sageSoft), skyHi: S(C.paper), fogCol: S(C.ivory, C.sageSoft),
        accent: S(C.sage), relief: .62, freq: .30, order: .40, polish: .28, seam: .08,
        points: .20, five: 0, fog: .034, hfog: .06, amb: .58, key: .48,
        az: -.85, el: .155, camY: 2.6, pitch: -.10
      },
      {
        key: "impact", sel: ".impact",
        ground: S(C.sand), deep: S(C.sand), high: S(C.paper),
        skyLo: S(C.sand), skyHi: S(C.paper), fogCol: S(C.sand),
        accent: S(C.champagne), relief: .90, freq: .26, order: .16, polish: .25, seam: 0,
        points: .10, five: 1, fog: .031, hfog: .05, amb: .60, key: .47,
        az: -1.0, el: .18, camY: 2.9, pitch: -.115
      },
      {
        key: "areas", sel: ".areas",
        ground: S(C.navy, C.navyDark), deep: S(C.navyDark), high: S(C.navy2),
        skyLo: S(C.navyDark), skyHi: S(C.navy2, C.navy), fogCol: S(C.navy),
        accent: S(C.petrol), relief: .76, freq: .28, order: .30, polish: .22, seam: 0,
        points: .20, five: 0, fog: .049, hfog: .34, amb: .25, key: .72,
        az: -.95, el: .17, camY: 2.8, pitch: -.105
      },
      {
        key: "testimonials", sel: ".testimonials",
        ground: S(C.paper, C.ivory), deep: S(C.ivory), high: S(C.paper),
        skyLo: S(C.ivory), skyHi: S(C.paper), fogCol: S(C.ivory),
        accent: S(C.champagne), relief: .52, freq: .28, order: .78, polish: .18, seam: .04,
        points: .12, five: 0, fog: .032, hfog: .05, amb: .60, key: .45,
        az: -.86, el: .16, camY: 2.65, pitch: -.10
      },
      {
        key: "faq", sel: ".faq",
        ground: S(C.paper, C.sand), deep: S(C.ivory, C.sand), high: S(C.paper),
        skyLo: S(C.ivory, C.sand), skyHi: S(C.paper), fogCol: S(C.sand),
        accent: S(C.petrol), relief: .68, freq: .30, order: .72, polish: .28, seam: .08,
        points: .16, five: 0, fog: .035, hfog: .06, amb: .57, key: .49,
        az: -.88, el: .15, camY: 2.7, pitch: -.10
      },
      {
        key: "quote", sel: ".quote",
        ground: S(C.paper), deep: S(C.ivory), high: S(C.paper),
        skyLo: S(C.ivory), skyHi: S(C.paper), fogCol: S(C.paper),
        accent: S(C.petrol), relief: .42, freq: .28, order: .92, polish: .30, seam: .04,
        points: .08, five: 0, fog: .030, hfog: .04, amb: .61, key: .43,
        az: -.80, el: .14, camY: 2.5, pitch: -.095
      },
      {
        key: "closing", sel: ".closing-scene",
        ground: S(C.petrol, C.navy, C.navyDark), deep: S(C.petrolDeep, C.navyDark), high: S(C.petrol, C.navy2),
        skyLo: S(C.petrolDeep, C.navyDark), skyHi: S(C.petrol, C.navy), fogCol: S(C.petrolDeep, C.navyDark),
        accent: S(C.petrolLight, C.champagne), relief: .44, freq: .26, order: .95, polish: .40, seam: 0,
        points: .14, five: 0, fog: .055, hfog: .46, amb: .23, key: .73,
        az: -.95, el: .165, camY: 2.4, pitch: -.09
      }
    ];

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: compatibilityMode ? "default" : "high-performance",
        failIfMajorPerformanceCaveat: false
      });
    } catch (error) {
      const rendererError = makeWebGLError("renderer", "WebGL renderer creation failed");
      rendererError.cause = error;
      throw rendererError;
    }

    const gl = renderer.getContext();
    if (!gl) throw makeWebGLError("renderer", "WebGL context creation returned no context");
    const maxRenderbufferSize = Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) || 4096;
    const maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 2048;
    const trackSize = Math.max(256, Math.min(TRACK_TARGET_SIZE, maxTextureSize));
    const qualityMin = compatibilityMode ? .40 : initialProfile === "compact" ? .44 : .48;
    const qualityMax = compatibilityMode ? .54 : initialProfile === "compact" ? .68 : .78;
    let qualityScale = compatibilityMode ? .46 : initialProfile === "compact" ? .54 : .62;
    renderer.setClearColor(C.navyDark, 1);

    const makeTrack = () => {
      const data = new Uint8Array(trackSize * 4);
      const texture = new THREE.DataTexture(data, trackSize, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = false;
      return { data, texture };
    };
    const trackKeys = ["ground", "deep", "high", "skyLo", "skyHi", "fogCol"];
    const tracks = Object.fromEntries(trackKeys.map((key) => [key, makeTrack()]));

    const vertexShader = "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }";
    const fragmentShader = [
      "precision highp float;",
      "uniform vec2 uRes;",
      "uniform float uScrollY, uViewportH, uDocHeight;",
      "uniform vec3 uRO, uFwd;",
      "uniform float uFocal, uTime, uSpin;",
      "uniform float uRelief, uFreq, uOrder, uPolish, uSeam, uPoints, uFive;",
      "uniform float uFog, uHFog, uAmb, uKey, uHMax;",
      "uniform vec2 uLight;",
      "uniform sampler2D uGroundMap, uDeepMap, uHighMap, uSkyLoMap, uSkyHiMap, uFogMap;",
      "const float TMAX = 62.0;",
      "float hash21(vec2 p){",
      "  vec3 p3 = fract(vec3(p.xyx) * 0.1031);",
      "  p3 += dot(p3, p3.yzx + 33.33);",
      "  return fract((p3.x + p3.y) * p3.z);",
      "}",
      "float vnoise(vec2 p){",
      "  vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f);",
      "  float a=hash21(i), b=hash21(i+vec2(1.0,0.0));",
      "  float c=hash21(i+vec2(0.0,1.0)), d=hash21(i+vec2(1.0,1.0));",
      "  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);",
      "}",
      "float fbm(vec2 p,float lod){",
      "  float s=0.0,a=0.5,w=0.0;",
      "  for(int i=0;i<5;i++){",
      "    float g=clamp(lod-float(i),0.0,1.0);",
      "    g=g*g*(3.0-2.0*g);",
      "    s+=a*g*vnoise(p); w+=a*g;",
      "    p=mat2(0.86,0.51,-0.51,0.86)*p*2.03+7.31; a*=0.52;",
      "  }",
      "  return w>0.0?s/w:0.5;",
      "}",
      "float bump(vec2 d,float w){ float k=max(0.0,1.0-dot(d,d)*w); return k*k*k; }",
      "float terrace(float h,float steps,float sharp){",
      "  float s=h*steps, i=floor(s), f=fract(s);",
      "  float k=clamp(sharp,0.03,0.99);",
      "  f=smoothstep(0.5-k*0.5,0.5+k*0.5,f);",
      "  return (i+f)/steps;",
      "}",
      "float fourPoints(vec2 q){",
      "  float P=12.0, cell=floor(q.y/P), zc=q.y-(cell+0.5)*P;",
      "  float ang=cell*0.73+uSpin, ca=cos(ang), sa=sin(ang);",
      "  vec2 lq=vec2(q.x,zc), a=vec2(ca,sa)*vec2(4.2,3.4), b=vec2(-sa,ca)*vec2(4.2,3.4);",
      "  float w=0.050;",
      "  float wells=bump(lq-a,w)+bump(lq+a,w)+bump(lq-b,w)+bump(lq+b,w);",
      "  float halo=bump(lq-a,w*0.26)+bump(lq+a,w*0.26)+bump(lq-b,w*0.26)+bump(lq+b,w*0.26);",
      "  float fade=1.0-smoothstep(P*0.30,P*0.50,abs(zc));",
      "  return (halo*0.34-wells*0.58)*fade;",
      "}",
      "float fivePresence(vec2 q){",
      "  float P=16.0, cell=floor(q.y/P), zc=q.y-(cell+0.5)*P;",
      "  float ang=cell*0.41, ca=cos(ang), sa=sin(ang);",
      "  vec2 lq=vec2(q.x,zc);",
      "  lq=vec2(lq.x*ca-lq.y*sa,lq.x*sa+lq.y*ca);",
      "  float acc=0.0;",
      "  for(int i=0;i<5;i++){",
      "    float a=float(i)*1.25663706+uSpin*0.35-1.5707963;",
      "    acc+=bump(lq-vec2(cos(a),sin(a))*vec2(5.4,4.6),0.052);",
      "  }",
      "  float centre=bump(lq,0.10);",
      "  float fade=1.0-smoothstep(P*0.28,P*0.50,abs(zc));",
      "  return (acc*0.40-centre*0.78)*fade*0.72;",
      "}",
      "vec2 heightF(vec2 q,float lod){",
      "  float n=fbm(q*uFreq*0.5,lod);",
      "  float broad=(n-0.5)*uRelief*1.6, h=broad;",
      "  if(uOrder>0.004){",
      "    float st=mix(1.6,4.2,uOrder), sp=mix(0.95,0.20,uOrder);",
      "    h=mix(h,terrace(h,st,sp),uOrder*0.85);",
      "  }",
      "  h+=fourPoints(q)*uPoints*0.9;",
      "  if(uFive>0.004) h+=fivePresence(q)*uFive;",
      "  if(uSeam>0.004){",
      "    float w=q.x*0.34+broad*0.55;",
      "    float seam=smoothstep(0.41,0.50,abs(fract(w)-0.5));",
      "    h-=seam*uSeam*0.085;",
      "  }",
      "  if(lod>2.05) h+=(fbm(q*3.1+5.0,lod)-0.5)*uRelief*0.10*clamp(lod-2.0,0.0,1.0);",
      "  return vec2(h,broad);",
      "}",
      "float hMarch(vec2 q){ return heightF(q,1.4).x; }",
      "vec3 decodeMap(sampler2D map,float u){ return pow(texture2D(map,vec2(u,0.5)).rgb,vec3(2.2)); }",
      "float shadow(vec3 P,vec3 L){",
      "  float s=1.0,t=0.07;",
      "  for(int i=0;i<16;i++){",
      "    vec3 q=P+L*t; float d=q.y-hMarch(q.xz);",
      "    s=min(s,clamp(d*7.0/t,0.0,1.0));",
      "    t+=clamp(d*0.85,0.06,0.95);",
      "    if(t>6.5) break;",
      "  }",
      "  return clamp(s,0.0,1.0);",
      "}",
      "void main(){",
      "  vec2 fragUV=gl_FragCoord.xy/max(uRes,vec2(1.0));",
      "  float viewportY=(1.0-fragUV.y)*uViewportH;",
      "  float trackU=clamp((uScrollY+viewportY)/max(uDocHeight,1.0),0.0,1.0);",
      "  vec3 floorCol=decodeMap(uGroundMap,trackU);",
      "  vec3 deep=decodeMap(uDeepMap,trackU), high=decodeMap(uHighMap,trackU);",
      "  vec3 skyLo=decodeMap(uSkyLoMap,trackU), skyHi=decodeMap(uSkyHiMap,trackU);",
      "  vec3 fogCol=decodeMap(uFogMap,trackU);",
      "  vec2 uv=(gl_FragCoord.xy-0.5*uRes)/uRes.y;",
      "  vec3 fwd=normalize(uFwd);",
      "  vec3 rgt=normalize(cross(fwd,vec3(0.0,1.0,0.0)));",
      "  vec3 up=cross(rgt,fwd);",
      "  vec3 rd=normalize(uv.x*rgt+uv.y*up+fwd*uFocal), ro=uRO;",
      "  float t=0.40,tPrev=t; bool hit=false;",
      "  for(int i=0;i<78;i++){",
      "    vec3 p=ro+rd*t;",
      "    if(t>TMAX) break;",
      "    if(rd.y>0.0&&p.y>uHMax) break;",
      "    float d=p.y-hMarch(p.xz);",
      "    if(d<0.0022*t){ hit=true; break; }",
      "    tPrev=t; t+=max(d*0.60,0.03+t*0.013);",
      "  }",
      "  vec3 col;",
      "  if(hit){",
      "    float a=tPrev,b=t;",
      "    for(int i=0;i<5;i++){",
      "      float m=0.5*(a+b); vec3 p=ro+rd*m;",
      "      if(p.y-hMarch(p.xz)>0.0) a=m; else b=m;",
      "    }",
      "    t=0.5*(a+b); vec3 P=ro+rd*t;",
      "    float lod=clamp(4.8-t*0.135,1.4,4.8), e=max(0.010,t*0.0038);",
      "    vec2 hc=heightF(P.xz,lod);",
      "    float hx=heightF(P.xz+vec2(e,0.0),lod).x;",
      "    float hz=heightF(P.xz+vec2(0.0,e),lod).x;",
      "    vec3 N=normalize(vec3(hc.x-hx,e,hc.x-hz));",
      "    vec3 L=normalize(vec3(cos(uLight.x)*cos(uLight.y),sin(uLight.y),sin(uLight.x)*cos(uLight.y)));",
      "    vec3 V=-rd;",
      "    float ao=clamp(0.58+(hc.x-hc.y)*1.35,0.24,1.0);",
      "    float diff=clamp((dot(N,L)+0.38)/1.38,0.0,1.0);",
      "    diff=diff*diff*(3.0-2.0*diff);",
      "    float sh=mix(1.0,shadow(P,L),0.72*(1.0-smoothstep(14.0,36.0,t)));",
      "    float hn=clamp(hc.x/(uRelief*1.7+0.001)*0.5+0.5,0.0,1.0);",
      "    vec3 alb=mix(deep,high,smoothstep(0.14,0.86,hn));",
      "    alb*=mix(0.945,1.055,fbm(P.xz*0.68+19.0,min(lod,2.6)));",
      "    vec3 Ns=normalize(N*vec3(1.0,1.0,mix(1.0,0.20,uPolish)));",
      "    vec3 H=normalize(L+V);",
      "    float spec=pow(max(dot(Ns,H),0.0),mix(18.0,760.0,uPolish));",
      "    float fres=pow(1.0-max(dot(N,V),0.0),5.0);",
      "    float sy=clamp(reflect(rd,N).y*0.5+0.5,0.0,1.0);",
      "    vec3 env=mix(skyLo,skyHi,smoothstep(0.34,0.96,sy));",
      "    col=alb*(uAmb*ao+uKey*diff*sh);",
      "    col+=env*(0.09+0.52*uPolish)*(0.035+fres*0.85)*ao;",
      "    col+=vec3(1.0)*spec*(0.045+0.50*uPolish)*sh*ao;",
      "    float fogA=1.0-exp(-uFog*t);",
      "    float pool=exp(-max(P.y+0.6,0.0)*1.1);",
      "    fogA=clamp(fogA*(1.0+uHFog*pool*0.9),0.0,1.0);",
      "    col=mix(col,fogCol,fogA);",
      "  }else{",
      "    float sy=clamp(rd.y*0.5+0.5,0.0,1.0);",
      "    col=mix(skyLo,skyHi,smoothstep(0.34,0.96,sy));",
      "    col=mix(col,fogCol,smoothstep(0.26,-0.03,rd.y));",
      "  }",
      "  col=mix(col,vec3(1.0)-exp(-col*1.25),0.30);",
      "  float floorLum=dot(floorCol,vec3(0.2126,0.7152,0.0722));",
      "  float lum=max(dot(col,vec3(0.2126,0.7152,0.0722)),0.0001);",
      "  if(floorLum<0.179&&lum>0.155) col*=0.155/lum;",
      "  if(floorLum>=0.179&&lum<0.230) col+=vec3(0.230-lum);",
      "  col=pow(max(col,vec3(0.0)),vec3(1.0/2.2));",
      "  col+=(hash21(gl_FragCoord.xy+fract(uTime)*71.3)-0.5)*0.0045;",
      "  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);",
      "}"
    ].join("\n");

    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uScrollY: { value: window.scrollY || 0 },
      uViewportH: { value: window.innerHeight || 800 },
      uDocHeight: { value: 1 },
      uRO: { value: new THREE.Vector3(0, 3, 0) },
      uFwd: { value: new THREE.Vector3(0, -.11, 1).normalize() },
      uFocal: { value: 1.42 },
      uTime: { value: 0 },
      uSpin: { value: 0 },
      uRelief: { value: chapterDefs[0].relief },
      uFreq: { value: chapterDefs[0].freq },
      uOrder: { value: chapterDefs[0].order },
      uPolish: { value: chapterDefs[0].polish },
      uSeam: { value: chapterDefs[0].seam },
      uPoints: { value: chapterDefs[0].points },
      uFive: { value: 0 },
      uFog: { value: chapterDefs[0].fog },
      uHFog: { value: chapterDefs[0].hfog },
      uAmb: { value: chapterDefs[0].amb },
      uKey: { value: chapterDefs[0].key },
      uHMax: { value: 2.3 },
      uLight: { value: new THREE.Vector2(chapterDefs[0].az, chapterDefs[0].el) },
      uGroundMap: { value: tracks.ground.texture },
      uDeepMap: { value: tracks.deep.texture },
      uHighMap: { value: tracks.high.texture },
      uSkyLoMap: { value: tracks.skyLo.texture },
      uSkyHiMap: { value: tracks.skyHi.texture },
      uFogMap: { value: tracks.fogCol.texture }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false
    });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    scene.add(quad);

    let chapters = [];
    let documentHeight = 1;
    let viewWidth = window.innerWidth || 1200;
    let viewHeight = window.innerHeight || 800;
    let animationFrame = 0;
    let destroyed = false;
    let dirty = true;
    let measureQueued = false;
    let measureTimer = 0;
    let resizeObserver = null;
    let controllerApi = null;
    let time = 0;
    let spin = 0;
    let cameraZ = 0;
    let scrollSpeed = 0;
    let lastScrollY = window.scrollY || 0;
    let lastFrameTime = 0;
    let qualityFrames = 0;
    let qualityTime = 0;
    let qualityCooldown = 45;
    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    const colorScratchA = new THREE.Color();
    const colorScratchB = new THREE.Color();
    const colorScratchC = new THREE.Color();
    const bufferSize = new THREE.Vector2();
    const current = {};
    const target = {};
    PARAM_KEYS.forEach((key) => {
      current[key] = chapterDefs[0][key];
      target[key] = chapterDefs[0][key];
    });

    const colorAtStops = (stops, progress, out) => {
      let left = stops[0];
      for (let index = 1; index < stops.length; index++) {
        const right = stops[index];
        if (progress <= right[0]) {
          const span = Math.max(.0001, right[0] - left[0]);
          return out.copy(left[1]).lerp(right[1], smoothstep(0, 1, (progress - left[0]) / span));
        }
        left = right;
      }
      return out.copy(stops[stops.length - 1][1]);
    };

    const chapterIndexAt = (docY) => {
      let index = 0;
      while (index < chapters.length - 1 && docY >= chapters[index + 1].start) index++;
      return index;
    };

    const sampleTrackColor = (docY, key, out) => {
      if (!chapters.length) return colorAtStops(chapterDefs[0][key], 0, out);
      for (let index = 1; index < chapters.length; index++) {
        const left = chapters[index - 1];
        const right = chapters[index];
        const band = Math.max(72, Math.min(240, viewHeight * .28, Math.min(left.height, right.height) * .12));
        if (Math.abs(docY - right.start) <= band * .5) {
          colorAtStops(left[key], 1, colorScratchA);
          colorAtStops(right[key], 0, colorScratchB);
          return out.copy(colorScratchA).lerp(
            colorScratchB,
            smootherstep(right.start - band * .5, right.start + band * .5, docY)
          );
        }
      }
      const chapter = chapters[chapterIndexAt(docY)];
      const local = clamp01((docY - chapter.start) / Math.max(1, chapter.height));
      return colorAtStops(chapter[key], local, out);
    };

    const sampleMaterial = (docY, out) => {
      if (!chapters.length) {
        PARAM_KEYS.forEach((key) => { out[key] = chapterDefs[0][key]; });
        return out;
      }
      let left = chapters[0];
      let right = left;
      const firstCenter = left.start + left.height * .5;
      if (docY > firstCenter) {
        for (let index = 1; index < chapters.length; index++) {
          right = chapters[index];
          const rightCenter = right.start + right.height * .5;
          if (docY <= rightCenter) break;
          left = right;
        }
      }
      const leftCenter = left.start + left.height * .5;
      const rightCenter = right.start + right.height * .5;
      const mixValue = left === right ? 0 : smootherstep(leftCenter, rightCenter, docY);
      PARAM_KEYS.forEach((key) => {
        out[key] = THREE.MathUtils.lerp(left[key], right[key], mixValue);
      });
      const impact = chapters.find((chapter) => chapter.key === "impact");
      if (impact) {
        const edge = Math.max(80, Math.min(impact.height * .22, viewHeight * .34));
        const enter = smootherstep(impact.start, impact.start + edge, docY);
        const exit = 1 - smootherstep(impact.end - edge, impact.end, docY);
        out.five = Math.max(0, enter * exit);
      } else {
        out.five = 0;
      }
      return out;
    };

    const rebuildTracks = () => {
      trackKeys.forEach((key) => {
        const track = tracks[key];
        for (let index = 0; index < trackSize; index++) {
          const docY = documentHeight * index / Math.max(1, trackSize - 1);
          sampleTrackColor(docY, key, colorScratchC);
          const offset = index * 4;
          track.data[offset] = Math.round(clamp01(colorScratchC.r) * 255);
          track.data[offset + 1] = Math.round(clamp01(colorScratchC.g) * 255);
          track.data[offset + 2] = Math.round(clamp01(colorScratchC.b) * 255);
          track.data[offset + 3] = 255;
        }
        track.texture.needsUpdate = true;
      });
      uniforms.uDocHeight.value = documentHeight;
    };

    let inkTargets = [];
    const measureInkTargets = () => {
      inkTargets = [...document.querySelectorAll("[data-canvas-ink]")].map((element) => ({
        element,
        docY: docOffsetTop(element) + element.offsetHeight * .5,
        lum: -1,
        pol: 1,
        accent: [-1, -1, -1]
      }));
    };

    const measureChapters = () => {
      viewWidth = window.innerWidth || 1200;
      viewHeight = window.innerHeight || 800;
      documentHeight = Math.max(
        document.documentElement.scrollHeight || 0,
        document.body?.scrollHeight || 0,
        viewHeight
      );
      chapters = chapterDefs.map((definition, index) => {
        const element = document.querySelector(definition.sel);
        const start = element ? docOffsetTop(element) : index * viewHeight;
        const height = Math.max(1, element?.offsetHeight || viewHeight);
        return { ...definition, index, element, start, height, end: start + height };
      });
      rebuildTracks();
      measureInkTargets();
      dirty = true;
    };

    const getEffectiveScale = () => {
      const hardwareCap = Math.min(
        maxRenderbufferSize / Math.max(1, viewWidth),
        maxRenderbufferSize / Math.max(1, viewHeight)
      );
      const pixelBudgetCap = Math.sqrt(3200000 / Math.max(1, viewWidth * viewHeight));
      return Math.max(.25, Math.min(qualityScale, window.devicePixelRatio || 1, hardwareCap, pixelBudgetCap));
    };

    const resizeRenderer = (remeasure = true) => {
      viewWidth = window.innerWidth || 1200;
      viewHeight = window.innerHeight || 800;
      renderer.setPixelRatio(getEffectiveScale());
      renderer.setSize(viewWidth, viewHeight, false);
      renderer.getDrawingBufferSize(bufferSize);
      uniforms.uRes.value.copy(bufferSize);
      uniforms.uViewportH.value = viewHeight;
      if (remeasure) scheduleMeasure();
      dirty = true;
    };

    function requestFrame() {
      if (destroyed || document.hidden || animationFrame) return;
      animationFrame = requestAnimationFrame(frame);
    }

    const scheduleMeasure = () => {
      if (measureQueued || destroyed) return;
      measureQueued = true;
      measureTimer = window.setTimeout(() => {
        measureTimer = 0;
        measureQueued = false;
        measureChapters();
        requestFrame();
      }, 16);
    };

    const writeInk = (entry, docY) => {
      sampleTrackColor(docY, "ground", colorScratchA);
      const lum = relLuminance(colorScratchA.r, colorScratchA.g, colorScratchA.b);
      const nextPol = entry.pol ? (lum > .183 ? 0 : 1) : (lum < .175 ? 1 : 0);
      if (Math.abs(lum - entry.lum) >= .008) {
        entry.lum = lum;
        entry.element.style.setProperty("--canvas-lum", lum.toFixed(3));
      }
      if (nextPol !== entry.pol) {
        entry.pol = nextPol;
        entry.element.style.setProperty("--canvas-pol", String(nextPol));
      }
      sampleTrackColor(docY, "accent", colorScratchB);
      const delta = Math.max(
        Math.abs(colorScratchB.r - entry.accent[0]),
        Math.abs(colorScratchB.g - entry.accent[1]),
        Math.abs(colorScratchB.b - entry.accent[2])
      );
      if (delta >= .008) {
        entry.accent[0] = colorScratchB.r;
        entry.accent[1] = colorScratchB.g;
        entry.accent[2] = colorScratchB.b;
        entry.element.style.setProperty("--canvas-glow", "#" + colorScratchB.getHexString());
      }
    };

    const rootInk = { element: root, lum: -1, pol: 1, accent: [-1, -1, -1] };
    const publishInk = (scrollY) => {
      writeInk(rootInk, scrollY + viewHeight * .5);
      inkTargets.forEach((entry) => writeInk(entry, entry.docY));
    };

    const applyUniforms = (scrollY) => {
      uniforms.uScrollY.value = scrollY;
      uniforms.uTime.value = time;
      uniforms.uSpin.value = spin;
      uniforms.uRelief.value = current.relief;
      uniforms.uFreq.value = current.freq;
      uniforms.uOrder.value = current.order;
      uniforms.uPolish.value = current.polish;
      uniforms.uSeam.value = current.seam;
      uniforms.uPoints.value = current.points;
      uniforms.uFive.value = current.five;
      uniforms.uFog.value = current.fog;
      uniforms.uHFog.value = current.hfog;
      uniforms.uAmb.value = current.amb;
      uniforms.uKey.value = current.key;
      uniforms.uHMax.value = current.relief * 1.9 + 1.3;
      uniforms.uLight.value.set(current.az, current.el);
      const pitch = current.pitch + pointer.y * .016;
      const yaw = pointer.x * .030;
      const cp = Math.cos(pitch);
      uniforms.uFwd.value.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);
      uniforms.uRO.value.set(pointer.x * .55, current.camY + pointer.y * .22, cameraZ);
    };

    const update = (now) => {
      const rawDt = lastFrameTime ? (now - lastFrameTime) / 1000 : 1 / 60;
      const dt = Math.min(.05, Math.max(1 / 240, rawDt));
      lastFrameTime = now;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const instantSpeed = Math.abs(scrollY - lastScrollY) / Math.max(1, viewHeight) / dt;
      lastScrollY = scrollY;
      const speedMix = 1 - Math.exp(-8 * dt);
      scrollSpeed += (instantSpeed - scrollSpeed) * speedMix;
      sampleMaterial(scrollY + viewHeight * .52, target);
      const maxScroll = Math.max(1, documentHeight - viewHeight);
      const targetCameraZ = clamp01(scrollY / maxScroll) * TRAVEL;
      let maxDelta = 0;

      if (reducedMotion.matches) {
        PARAM_KEYS.forEach((key) => { current[key] = target[key]; });
        pointer.set(0, 0);
        pointerTarget.set(0, 0);
        cameraZ = targetCameraZ;
        scrollSpeed = 0;
      } else {
        const materialMix = 1 - Math.exp(-7 * dt);
        PARAM_KEYS.forEach((key) => {
          if (key === "five") {
            current.five = target.five;
            return;
          }
          const delta = target[key] - current[key];
          maxDelta = Math.max(maxDelta, Math.abs(delta));
          current[key] += delta * materialMix;
          if (Math.abs(delta) < .0001) current[key] = target[key];
        });
        const pointerMix = 1 - Math.exp(-5 * dt);
        pointer.lerp(pointerTarget, pointerMix);
        if (pointer.distanceToSquared(pointerTarget) < .0000002) pointer.copy(pointerTarget);
        cameraZ += (targetCameraZ - cameraZ) * (1 - Math.exp(-8 * dt));
        if (Math.abs(targetCameraZ - cameraZ) < .002) cameraZ = targetCameraZ;
        const motion = Math.min(1, scrollSpeed * 1.15);
        time += dt * motion * .55;
        spin += dt * motion * .22;
      }

      applyUniforms(scrollY);
      publishInk(scrollY);
      const pointerDelta = pointer.distanceToSquared(pointerTarget);
      const cameraDelta = Math.abs(targetCameraZ - cameraZ);
      return !reducedMotion.matches && (
        scrollSpeed > .002 || maxDelta > .0005 || pointerDelta > .0000002 || cameraDelta > .01
      );
    };

    const gradeQuality = (frameMs) => {
      if (frameMs <= 0 || frameMs >= 80) return;
      if (qualityCooldown > 0) {
        qualityCooldown--;
        return;
      }
      qualityTime += frameMs;
      qualityFrames++;
      if (qualityFrames < 45) return;
      const average = qualityTime / qualityFrames;
      qualityTime = 0;
      qualityFrames = 0;
      if (average > 24 && qualityScale > qualityMin) {
        qualityScale = Math.max(qualityMin, qualityScale - .08);
        resizeRenderer(false);
        qualityCooldown = 55;
      } else if (average < 14 && qualityScale < qualityMax) {
        qualityScale = Math.min(qualityMax, qualityScale + .05);
        resizeRenderer(false);
        qualityCooldown = 55;
      }
    };

    function frame(now) {
      animationFrame = 0;
      if (destroyed || document.hidden) return;
      const previousTime = lastFrameTime;
      const keepMoving = update(now);
      renderer.render(scene, camera);
      dirty = false;
      if (previousTime && now - previousTime < 80) gradeQuality(now - previousTime);
      if (keepMoving) requestFrame();
      else {
        scrollSpeed = 0;
        lastFrameTime = 0;
      }
    }

    const onScroll = () => { dirty = true; requestFrame(); };
    const onPointerMove = (event) => {
      if (reducedMotion.matches || event.pointerType === "touch") return;
      pointerTarget.set(
        (event.clientX / Math.max(1, viewWidth) - .5) * 2,
        (event.clientY / Math.max(1, viewHeight) - .5) * 2
      );
      dirty = true;
      requestFrame();
    };
    const onMotionChange = () => {
      if (reducedMotion.matches) {
        pointer.set(0, 0);
        pointerTarget.set(0, 0);
      }
      dirty = true;
      requestFrame();
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        lastFrameTime = 0;
        return;
      }
      dirty = true;
      requestFrame();
    };
    const onProfileChange = () => {
      if (getProfile() === initialProfile || !controllerApi || threeWorld !== controllerApi) return;
      restartThreeWorld({ freshCanvas: true });
    };

    const validateFirstFrame = () => {
      const context = renderer.getContext();
      if (!context || context.isContextLost()) {
        throw makeWebGLError("context", "WebGL context was lost during the first frame");
      }
      if (context.drawingBufferWidth < 1 || context.drawingBufferHeight < 1) {
        throw makeWebGLError("frame", "WebGL drawing buffer is empty");
      }
      if (renderer.info.programs?.some((program) => program.diagnostics?.runnable === false)) {
        throw makeWebGLError("frame", "A WebGL shader program is not runnable");
      }
      if (renderer.info.render.calls < 1) {
        throw makeWebGLError("frame", "The first WebGL frame produced no draw calls");
      }
      const glError = context.getError();
      if (glError !== context.NO_ERROR) {
        throw makeWebGLError("frame", "The first WebGL frame returned error " + glError);
      }
    };

    const start = () => {
      resizeRenderer(false);
      measureChapters();
      update(performance.now());
      renderer.render(scene, camera);
      validateFirstFrame();
      dirty = false;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("resize", resizeRenderer);
      window.addEventListener("orientationchange", scheduleMeasure);
      window.addEventListener("load", scheduleMeasure);
      document.addEventListener("visibilitychange", onVisibility);
      reducedMotion.addEventListener?.("change", onMotionChange);
      compactQuery.addEventListener?.("change", onProfileChange);
      if (document.fonts?.ready) document.fonts.ready.then(scheduleMeasure);
      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(scheduleMeasure);
        [
          document.body,
          document.getElementById("main"),
          ...chapters.map((chapter) => chapter.element),
          document.querySelector(".closing-scene")
        ].filter(Boolean).forEach((element) => resizeObserver.observe(element));
      }
      document.getElementById("loading")?.classList.add("hidden");
    };

    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      clearTimeout(measureTimer);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resizeRenderer);
      window.removeEventListener("orientationchange", scheduleMeasure);
      window.removeEventListener("load", scheduleMeasure);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener?.("change", onMotionChange);
      compactQuery.removeEventListener?.("change", onProfileChange);
      quad.geometry.dispose();
      material.dispose();
      Object.values(tracks).forEach((track) => track.texture.dispose());
      renderer.dispose();
    };

    controllerApi = { start, destroy };
    return controllerApi;
  }
  function initApp() {
    initHeader();
    initScrollSpy();
    initNavigation();
    initTabBar();
    initOptionsSheet();
    initServiceCovers();
    initHeroSlider();
    initScrollReveal();
    initFloorParallax();
    initServiceInteractions();
    initMaintenanceSelector();
    initBeforeAfter();
    initTestimonials();
    initFAQ();
    initQuoteForm();
    initCounters();
    webGLDisabledOnMobile.addEventListener?.("change", syncThreeAvailability);
    syncThreeAvailability();
    const yearEl = document.querySelector("[data-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
