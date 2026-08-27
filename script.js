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
      /* the figure is on its own plane: it travels against the photograph,
         which is the whole reason the two read as different distances */
      section.style.setProperty("--fc-figure", (offset * -26).toFixed(1) + "px");
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
    const currentLabel = carousel.querySelector("[data-t-current]");
    const rail = currentLabel?.parentElement;
    const prevBtn = carousel.querySelector("[data-t-prev]");
    const nextBtn = carousel.querySelector("[data-t-next]");
    let currentIndex = 0;

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
      if (currentLabel) currentLabel.textContent = String(currentIndex + 1).padStart(2, "0");
      if (rail) rail.style.setProperty("--p", String((currentIndex + 1) / slides.length));
      if (status) status.textContent = `Testimonial ${currentIndex + 1} of ${slides.length}`;
    };

    const next = () => show(currentIndex + 1, 1);
    const prev = () => show(currentIndex - 1, -1);

    nextBtn?.addEventListener("click", next);
    prevBtn?.addEventListener("click", prev);
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    });
    addSwipeNavigation(carousel, prev, next);
    show(0);
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

  /* ---------- Three.js continuous editorial world ---------- */
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
    const mobileQuery = window.matchMedia("(max-width:767px)");
    const tabletQuery = window.matchMedia("(max-width:1200px)");
    const getProfile = () => mobileQuery.matches ? "mobile" : tabletQuery.matches ? "tablet" : "desktop";
    const initialProfile = getProfile();
    const isMobile = initialProfile === "mobile";
    const compatibilityMode = rendererMode === "compatibility";
    const ringSegments = isMobile ? 48 : 96;
    const GROUND_SIZE = 2048;
    const WORLD_STEP = 24;
    const FOG_SCREEN_K = 38;

    const C = Object.fromEntries(
      Object.entries(WORLD_PALETTE).map(([key, value]) => [key, new THREE.Color(value)])
    );

    const chapterDefs = [
      { key: "hero", sel: ".hero", ground: [[0, C.navyDark], [1, C.navy]], fog: C.navy, density: .019, glow: C.petrol, glowPos: [.78, .72], glowStrength: .34, camera: [-.8, .25] },
      { key: "standard", sel: ".standard", ground: [[0, C.navyDark], [1, C.navy2]], fog: C.navy, density: .016, glow: C.petrol, glowPos: [.24, .76], glowStrength: .28, camera: [.7, -.1] },
      { key: "services", sel: ".services", ground: [[0, C.navy], [1, C.navyDark]], fog: C.navy2, density: .021, glow: C.petrolLight, glowPos: [.74, .28], glowStrength: .3, camera: [-1, .35] },
      { key: "maintenance", sel: ".maintenance", ground: [[0, C.paper], [1, C.ivory]], fog: C.ivory, density: .008, glow: C.petrol, glowPos: [.82, .52], glowStrength: .14, camera: [.5, -.2] },
      { key: "floorcare", sel: ".floorcare", ground: [[0, C.navyDark], [1, C.petrolDeep]], fog: C.navy, density: .023, glow: C.champagne, glowPos: [.56, .6], glowStrength: .3, camera: [-.9, .25] },
      { key: "beforeafter", sel: ".beforeafter", ground: [[0, C.paper], [1, C.sand]], fog: C.ivory, density: .007, glow: C.petrol, glowPos: [.72, .36], glowStrength: .12, camera: [.8, .05] },
      { key: "residential", sel: ".residential", ground: [[0, C.ivory], [1, C.sageSoft]], fog: C.ivory, density: .008, glow: C.sage, glowPos: [.28, .24], glowStrength: .13, camera: [-.5, -.15] },
      { key: "impact", sel: ".impact", ground: [[0, C.sand], [1, C.sand]], fog: C.sand, density: .008, glow: C.sage, glowPos: [.22, .68], glowStrength: .12, camera: [.7, .25] },
      { key: "areas", sel: ".areas", ground: [[0, C.navy], [1, C.navyDark]], fog: C.navy2, density: .022, glow: C.petrol, glowPos: [.7, .48], glowStrength: .3, camera: [-.9, .05] },
      { key: "testimonials", sel: ".testimonials", ground: [[0, C.paper], [1, C.ivory]], fog: C.ivory, density: .007, glow: C.champagne, glowPos: [.52, .42], glowStrength: .1, camera: [.4, -.15] },
      { key: "faq", sel: ".faq", ground: [[0, C.paper], [1, C.sand]], fog: C.sand, density: .008, glow: C.petrol, glowPos: [.76, .56], glowStrength: .11, camera: [-.6, .2] },
      { key: "quote", sel: ".quote", ground: [[0, C.paper], [1, C.paper]], fog: C.paper, density: .006, glow: C.petrol, glowPos: [.5, .18], glowStrength: .035, camera: [0, 0] },
      { key: "closing", sel: ".closing-scene", ground: [[0, C.petrol], [.55, C.navy], [1, C.navyDark]], fog: C.navy, density: .021, glow: C.petrolLight, glowPos: [.5, .28], glowStrength: .26, camera: [.7, .15] }
    ];

    const endState = {
      key: "footer-end",
      fog: C.navyDark,
      density: .024,
      glow: C.petrolDeep,
      glowPos: [.5, -.08],
      glowStrength: 0,
      camera: [0, 0]
    };

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: compatibilityMode ? false : !isMobile,
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
    const getPixelRatioCap = (width = window.innerWidth || 1200, height = window.innerHeight || 800) => {
      const profileCap = compatibilityMode
        ? 1
        : getProfile() === "mobile" ? 1.15 : getProfile() === "tablet" ? 1.25 : 1.5;
      const safeWidth = Math.max(1, width);
      const safeHeight = Math.max(1, height);
      const hardwareCap = Math.min(maxRenderbufferSize / safeWidth, maxRenderbufferSize / safeHeight);
      const pixelBudgetCap = Math.sqrt(9000000 / (safeWidth * safeHeight));
      return Math.min(profileCap, hardwareCap, pixelBudgetCap);
    };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, getPixelRatioCap()));
    renderer.setClearColor(C.navyDark, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C.navy.getHex(), chapterDefs[0].density);

    const camera = new THREE.PerspectiveCamera(isMobile ? 48 : 44, 1, .1, 130);
    scene.add(camera);

    const ambient = new THREE.AmbientLight(0xffffff, .34);
    const keyLight = new THREE.DirectionalLight(C.petrolLight.getHex(), .85);
    keyLight.position.set(8, 12, 8);
    scene.add(ambient, keyLight);

    const groundData = new Uint8Array(GROUND_SIZE * 4);
    const groundTexture = new THREE.DataTexture(
      groundData,
      GROUND_SIZE,
      1,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    groundTexture.minFilter = THREE.LinearFilter;
    groundTexture.magFilter = THREE.LinearFilter;
    groundTexture.wrapS = THREE.ClampToEdgeWrapping;
    groundTexture.wrapT = THREE.ClampToEdgeWrapping;
    groundTexture.generateMipmaps = false;

    const backdropMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uGroundMap: { value: groundTexture },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uViewportH: { value: window.innerHeight || 800 },
        uScrollY: { value: window.scrollY || 0 },
        uDocHeight: { value: 1 },
        uGlowColor: { value: C.petrol.clone() },
        uGlowPos: { value: new THREE.Vector2(.78, .72) },
        uGlowStrength: { value: .34 },
        uFogColor: { value: C.navy.clone() },
        uFogDensity: { value: chapterDefs[0].density }
      },
      vertexShader: `
        void main(){
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D uGroundMap;
        uniform vec2 uResolution;
        uniform float uViewportH;
        uniform float uScrollY;
        uniform float uDocHeight;
        uniform vec3 uGlowColor;
        uniform vec2 uGlowPos;
        uniform float uGlowStrength;
        uniform vec3 uFogColor;
        uniform float uFogDensity;

        float hash12(vec2 p){
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        void main(){
          vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
          float viewportY = (1.0 - uv.y) * uViewportH;
          float groundU = clamp((uScrollY + viewportY) / max(1.0, uDocHeight), 0.0, 1.0);
          vec3 base = texture2D(uGroundMap, vec2(groundU, .5)).rgb;
          base *= .96 + .04 * uv.y;

          float aspect = uResolution.x / max(1.0, uResolution.y);
          vec2 gd = (uv - uGlowPos) * vec2(aspect, 1.0);
          float glow = exp(-dot(gd, gd) / .18);
          vec3 col = base + uGlowColor * glow * uGlowStrength;

          float horizon = smoothstep(.42, 1.0, uv.y);
          float airDepth = .12 + horizon * horizon * 1.9;
          float fogDepth = uFogDensity * airDepth * ${FOG_SCREEN_K.toFixed(1)};
          float fogAmount = 1.0 - exp(-(fogDepth * fogDepth));
          col = mix(col, uFogColor, fogAmount);

          float grain = (hash12(gl_FragCoord.xy) - .5) * .012;
          float dither = (hash12(gl_FragCoord.xy + vec2(37.0, 17.0)) - .5) / 255.0;
          gl_FragColor = vec4(col + grain + dither, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
      fog: false
    });
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backdropMaterial);
    backdrop.position.z = -100;
    backdrop.renderOrder = -1000;
    backdrop.frustumCulled = false;
    camera.add(backdrop);

    const architecture = new THREE.Group();
    scene.add(architecture);

    const mainVertices = [];
    const accentVertices = [];
    const markers = [];
    const panels = [];

    const pushSegment = (bucket, a, b) => bucket.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const pointAt = (point, center, rotation) => point.clone().applyEuler(rotation).add(center);

    const addPolyline = (bucket, points, center, rotation = new THREE.Euler(), closed = false) => {
      const world = points.map((point) => pointAt(point, center, rotation));
      for (let i = 0; i < world.length - 1; i++) pushSegment(bucket, world[i], world[i + 1]);
      if (closed && world.length > 2) pushSegment(bucket, world[world.length - 1], world[0]);
    };

    const addDiamond = (bucket, center, size, rotation) => addPolyline(bucket, [
      new THREE.Vector3(0, size, 0),
      new THREE.Vector3(size, 0, 0),
      new THREE.Vector3(0, -size, 0),
      new THREE.Vector3(-size, 0, 0)
    ], center, rotation, true);

    const addFourPoint = (bucket, center, size, rotation) => {
      pushSegment(bucket, pointAt(new THREE.Vector3(0, -size, 0), center, rotation), pointAt(new THREE.Vector3(0, size, 0), center, rotation));
      pushSegment(bucket, pointAt(new THREE.Vector3(-size, 0, 0), center, rotation), pointAt(new THREE.Vector3(size, 0, 0), center, rotation));
    };

    const addRing = (bucket, center, radiusX, radiusY, rotation, start = 0, end = Math.PI * 2) => {
      const points = [];
      const count = Math.max(12, Math.round(ringSegments * Math.abs(end - start) / (Math.PI * 2)));
      for (let i = 0; i <= count; i++) {
        const angle = start + (end - start) * i / count;
        points.push(new THREE.Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, 0));
      }
      addPolyline(bucket, points, center, rotation, false);
    };

    const addFrame = (bucket, center, width, height, depth, rotation) => {
      const front = [
        new THREE.Vector3(-width, height, 0), new THREE.Vector3(width, height, 0),
        new THREE.Vector3(width, -height, 0), new THREE.Vector3(-width, -height, 0)
      ];
      const back = front.map((point) => point.clone().setZ(-depth));
      addPolyline(bucket, front, center, rotation, true);
      addPolyline(bucket, back, center, rotation, true);
      for (let i = 0; i < 4; i++) pushSegment(bucket, pointAt(front[i], center, rotation), pointAt(back[i], center, rotation));
    };

    /* Hero / Standard: one portal encountered from two viewpoints. */
    addDiamond(mainVertices, new THREE.Vector3(3, 0, -17), 14, new THREE.Euler(.12, .34, .08));
    addFourPoint(accentVertices, new THREE.Vector3(3, 0, -17), 10, new THREE.Euler(.12, .34, .08));
    [[3, 14], [17, 0], [3, -14], [-11, 0]].forEach(([x, y]) => markers.push([x, y, -17]));

    /* Services / Maintenance: architectural frames open into a light room. */
    addFrame(mainVertices, new THREE.Vector3(-7, 0, -46), 7, 12, 6, new THREE.Euler(0, -.3, 0));
    addFrame(mainVertices, new THREE.Vector3(7, 1, -58), 6, 10, 5, new THREE.Euler(.08, .28, 0));
    addFrame(accentVertices, new THREE.Vector3(0, -1, -68), 10, 7, 3, new THREE.Euler(0, .08, .04));
    panels.push([-7, 0, -47, .32, 8, 1.4, -.3], [7, 1, -59, .28, 7, 1.1, .28]);

    /* Floor Care / Before After / Residential: one ring moving through space. */
    addRing(mainVertices, new THREE.Vector3(5, -1, -109), 15, 15, new THREE.Euler(.36, .48, -.12));
    addRing(accentVertices, new THREE.Vector3(5, -1, -109), 12.5, 12.5, new THREE.Euler(.36, .48, -.12), -.25, Math.PI * 1.35);
    addFrame(accentVertices, new THREE.Vector3(-3, 0, -121), 11, 6.5, 2, new THREE.Euler(.08, -.22, 0));
    addRing(mainVertices, new THREE.Vector3(-7, 1, -140), 13, 8, new THREE.Euler(.52, -.25, .18), -.5, Math.PI * 1.1);

    /* Impact: five planes around one measured void. */
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 3.2;
      panels.push([x, (i % 2 ? 1 : -1) * .7, -166 - i * 1.6, 1.05, 5.8 - i * .35, .45, (i - 2) * .06]);
    }
    addDiamond(accentVertices, new THREE.Vector3(0, 0, -173), 5.5, new THREE.Euler(.2, .2, 0));

    /* Areas / Testimonials: reach rings, spatial rather than HUD-flat. */
    [0, 1, 2].forEach((index) => addRing(
      index === 1 ? accentVertices : mainVertices,
      new THREE.Vector3(4 - index * 2, 0, -197 - index * 5),
      6 + index * 4,
      6 + index * 4,
      new THREE.Euler(.55, .35 - index * .18, .1)
    ));
    [[-7, 4, -199], [7, 5, -203], [8, -5, -207], [-8, -4, -211]].forEach((marker) => markers.push(marker));

    /* FAQ / Quote: the mark arrives, then is already behind the reader. */
    addFourPoint(mainVertices, new THREE.Vector3(5, 0, -247), 14, new THREE.Euler(.14, -.3, .05));
    addDiamond(accentVertices, new THREE.Vector3(5, 0, -247), 14, new THREE.Euler(.14, -.3, .05));

    /* Closing: final gate, with no successor in the footer. */
    addDiamond(mainVertices, new THREE.Vector3(0, 0, -285), 16, new THREE.Euler(.2, .26, 0));
    addFrame(accentVertices, new THREE.Vector3(0, 0, -291), 13, 8, 4, new THREE.Euler(0, -.18, 0));

    const makeLineGeometry = (vertices) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.computeBoundingSphere();
      return geometry;
    };

    const mainLineOpacity = initialProfile === "desktop" ? .72 : .5;
    const accentLineOpacity = initialProfile === "desktop" ? .84 : .68;

    const mainLineMaterial = new THREE.LineBasicMaterial({
      color: C.paper,
      transparent: true,
      opacity: mainLineOpacity,
      depthWrite: false,
      fog: true
    });
    const accentLineMaterial = new THREE.LineBasicMaterial({
      color: C.petrolLight,
      transparent: true,
      opacity: accentLineOpacity,
      depthWrite: false,
      fog: true
    });
    architecture.add(
      new THREE.LineSegments(makeLineGeometry(mainVertices), mainLineMaterial),
      new THREE.LineSegments(makeLineGeometry(accentVertices), accentLineMaterial)
    );

    const panelGeometry = new THREE.BoxGeometry(1, 1, 1);
    const panelMaterial = new THREE.MeshLambertMaterial({
      color: C.petrolDeep,
      transparent: true,
      opacity: isMobile ? .1 : .14,
      depthWrite: false,
      fog: true
    });
    const panelInstances = isMobile ? panels.filter((_, index) => index % 2 === 0) : panels;
    const panelMesh = new THREE.InstancedMesh(panelGeometry, panelMaterial, panelInstances.length);
    panelMesh.frustumCulled = false;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    panelInstances.forEach(([x, y, z, sx, sy, sz, ry], index) => {
      quaternion.setFromEuler(new THREE.Euler(0, ry, 0));
      matrix.compose(new THREE.Vector3(x, y, z), quaternion, scale.set(sx, sy, sz));
      panelMesh.setMatrixAt(index, matrix);
    });
    panelMesh.instanceMatrix.needsUpdate = true;
    architecture.add(panelMesh);

    const markerLimit = isMobile ? Math.min(6, markers.length) : markers.length;
    const markerMaterial = new THREE.MeshLambertMaterial({
      color: C.champagne,
      transparent: true,
      opacity: 1,
      fog: true
    });
    const markerMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.16, 8, 6), markerMaterial, markerLimit);
    markerMesh.frustumCulled = false;
    for (let i = 0; i < markerLimit; i++) {
      matrix.makeTranslation(markers[i][0], markers[i][1], markers[i][2]);
      markerMesh.setMatrixAt(i, matrix);
    }
    markerMesh.instanceMatrix.needsUpdate = true;
    architecture.add(markerMesh);

    let chapters = [];
    let documentHeight = 1;
    let footerEnter = Infinity;
    let footerEnd = 1;
    let groundHint = 0;
    let viewWidth = window.innerWidth || 1200;
    let viewHeight = window.innerHeight || 800;
    let animationFrame = 0;
    let destroyed = false;
    let dirty = true;
    let measureQueued = false;
    let measureTimer = 0;
    let resizeObserver = null;
    let controllerApi = null;
    const textureColor = new THREE.Color();
    const groundScratch = new THREE.Color();
    const groundScratchB = new THREE.Color();
    const boundaryNext = new THREE.Color();
    const glowColor = new THREE.Color();
    const fogColor = new THREE.Color();
    const inkColor = new THREE.Color();
    const glowPosition = new THREE.Vector2();
    const lookTarget = new THREE.Vector3();

    const colorAtStops = (stops, progress, target) => {
      let left = stops[0];
      for (let i = 1; i < stops.length; i++) {
        const right = stops[i];
        if (progress <= right[0]) {
          const span = Math.max(.0001, right[0] - left[0]);
          return target.copy(left[1]).lerp(right[1], smoothstep(0, 1, (progress - left[0]) / span));
        }
        left = right;
      }
      return target.copy(stops[stops.length - 1][1]);
    };

    const sampleTimeline = (docY, target) => {
      if (!chapters.length) return target.copy(C.navyDark);
      let index = Math.max(0, Math.min(groundHint, chapters.length - 1));
      while (index < chapters.length - 1 && docY >= chapters[index + 1].start) index++;
      while (index > 0 && docY < chapters[index].start) index--;
      groundHint = index;

      const chapter = chapters[index];
      const local = clamp01((docY - chapter.start) / Math.max(1, chapter.height));
      colorAtStops(chapter.ground, local, target);

      let left = null;
      let right = null;
      let boundary = 0;
      let band = 0;
      if (index > 0) {
        left = chapters[index - 1];
        right = chapter;
        boundary = chapter.start;
        band = Math.max(72, Math.min(240, viewHeight * .28, Math.min(left.height, right.height) * .12));
        if (docY > boundary + band * .5) left = null;
      }
      if (!left && index < chapters.length - 1) {
        left = chapter;
        right = chapters[index + 1];
        boundary = right.start;
        band = Math.max(72, Math.min(240, viewHeight * .28, Math.min(left.height, right.height) * .12));
        if (docY < boundary - band * .5) left = null;
      }
      if (left) {
        colorAtStops(left.ground, 1, groundScratchB);
        colorAtStops(right.ground, 0, boundaryNext);
        target.copy(groundScratchB).lerp(
          boundaryNext,
          smootherstep(boundary - band * .5, boundary + band * .5, docY)
        );
      }
      return target;
    };

    const rebuildGroundTexture = () => {
      for (let i = 0; i < GROUND_SIZE; i++) {
        sampleTimeline(documentHeight * i / (GROUND_SIZE - 1), textureColor);
        const offset = i * 4;
        groundData[offset] = Math.round(clamp01(textureColor.r) * 255);
        groundData[offset + 1] = Math.round(clamp01(textureColor.g) * 255);
        groundData[offset + 2] = Math.round(clamp01(textureColor.b) * 255);
        groundData[offset + 3] = 255;
      }
      groundTexture.needsUpdate = true;
      backdropMaterial.uniforms.uDocHeight.value = documentHeight;
    };

    let inkTargets = [];
    const measureInkTargets = () => {
      inkTargets = [...document.querySelectorAll("[data-canvas-ink]")].map((element) => ({
        element,
        docY: docOffsetTop(element) + element.offsetHeight * .5,
        docX: docOffsetLeft(element) + element.offsetWidth * .5,
        lum: -1,
        pol: 1,
        glow: [-1, -1, -1]
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
      const maxScroll = Math.max(0, documentHeight - viewHeight);
      const footer = document.querySelector(".site-footer");
      const quoteStart = chapters.at(-2)?.start || 0;
      const naturalFooterEnter = footer ? docOffsetTop(footer) - viewHeight : maxScroll - viewHeight * .4;
      footerEnd = Math.max(1, maxScroll);
      const latestFooterEnter = footerEnd - Math.min(320, Math.max(120, viewHeight * .28));
      footerEnter = footerEnd > quoteStart + 1
        ? Math.max(quoteStart + 1, Math.min(latestFooterEnter, naturalFooterEnter))
        : Math.max(0, footerEnd - 1);
      groundHint = 0;
      rebuildGroundTexture();
      measureInkTargets();
      dirty = true;
    };

    const scheduleMeasure = () => {
      if (measureQueued || destroyed) return;
      measureQueued = true;
      measureTimer = window.setTimeout(() => {
        measureTimer = 0;
        measureQueued = false;
        measureChapters();
        requestFrame();
      }, 0);
    };

    const resize = () => {
      viewWidth = window.innerWidth || 1200;
      viewHeight = window.innerHeight || 800;
      camera.aspect = viewWidth / viewHeight;
      camera.fov = mobileQuery.matches ? 48 : 44;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, getPixelRatioCap(viewWidth, viewHeight)));
      renderer.setSize(viewWidth, viewHeight, false);
      const ratio = renderer.getPixelRatio();
      backdropMaterial.uniforms.uResolution.value.set(viewWidth * ratio, viewHeight * ratio);
      backdropMaterial.uniforms.uViewportH.value = viewHeight;
      const backdropHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * .5)) * 100;
      backdrop.scale.set(backdropHeight * camera.aspect, backdropHeight, 1);
      scheduleMeasure();
      dirty = true;
    };

    const resolveState = (scrollY) => {
      if (!chapters.length) return { from: chapterDefs[0], to: chapterDefs[0], t: 0, index: 0 };
      const lastIndex = chapters.length - 1;
      if (scrollY >= footerEnter) {
        return {
          from: chapters[lastIndex],
          to: endState,
          t: smootherstep(footerEnter, footerEnd, scrollY),
          index: lastIndex
        };
      }
      let index = 0;
      while (index < chapters.length - 1 && scrollY >= chapters[index + 1].start) index++;
      const from = chapters[index];
      if (index === lastIndex) return { from, to: from, t: 0, index };
      const to = chapters[index + 1];
      const nextStart = index === lastIndex - 1
        ? footerEnter
        : chapters[index + 1].start;
      const raw = clamp01((scrollY - from.start) / Math.max(1, nextStart - from.start));
      return { from, to, t: smootherstep(.12, .88, raw), index };
    };

    const sampleGround = (screenY, screenX, scrollY, target) => {
      sampleTimeline(scrollY + screenY, target);
      const fy = clamp01(1 - screenY / Math.max(1, viewHeight));
      const fx = clamp01(screenX / Math.max(1, viewWidth));
      const dx = (fx - glowPosition.x) * (viewWidth / Math.max(1, viewHeight));
      const dy = fy - glowPosition.y;
      const glow = Math.exp(-(dx * dx + dy * dy) / .18) * backdropMaterial.uniforms.uGlowStrength.value;
      target.r += glowColor.r * glow;
      target.g += glowColor.g * glow;
      target.b += glowColor.b * glow;
      const horizon = smoothstep(.42, 1, fy);
      const airDepth = .12 + horizon * horizon * 1.9;
      const fogDepth = backdropMaterial.uniforms.uFogDensity.value * airDepth * FOG_SCREEN_K;
      const fogAmount = 1 - Math.exp(-(fogDepth * fogDepth));
      target.lerp(fogColor, fogAmount);
      target.r = clamp01(target.r);
      target.g = clamp01(target.g);
      target.b = clamp01(target.b);
      return relLuminance(target.r, target.g, target.b);
    };

    const writeInk = (target, lum) => {
      const nextPol = target.pol
        ? (lum > .183 ? 0 : 1)
        : (lum < .175 ? 1 : 0);
      if (Math.abs(lum - target.lum) >= .012) {
        target.lum = lum;
        target.element.style.setProperty("--canvas-lum", lum.toFixed(3));
      }
      if (nextPol !== target.pol) {
        target.pol = nextPol;
        target.element.style.setProperty("--canvas-pol", String(nextPol));
      }
      const glowDelta = Math.max(
        Math.abs(glowColor.r - target.glow[0]),
        Math.abs(glowColor.g - target.glow[1]),
        Math.abs(glowColor.b - target.glow[2])
      );
      if (glowDelta >= .012) {
        target.glow[0] = glowColor.r;
        target.glow[1] = glowColor.g;
        target.glow[2] = glowColor.b;
        target.element.style.setProperty("--canvas-glow", `#${glowColor.getHexString()}`);
      }
    };

    const rootInk = { element: root, lum: -1, pol: 1, glow: [-1, -1, -1] };
    const publishInk = (scrollY) => {
      writeInk(rootInk, sampleGround(viewHeight * .5, viewWidth * .5, scrollY, inkColor));
      inkTargets.forEach((target) => {
        writeInk(
          target,
          sampleGround(target.docY - scrollY, target.docX, scrollY, inkColor)
        );
      });
    };

    const update = (now) => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const state = resolveState(scrollY);
      const { from, to, t, index } = state;
      const zA = 18 - index * WORLD_STEP;
      const zB = 18 - (index + 1) * WORLD_STEP;
      camera.position.set(
        THREE.MathUtils.lerp(from.camera[0], to.camera[0], t),
        THREE.MathUtils.lerp(from.camera[1], to.camera[1], t),
        THREE.MathUtils.lerp(zA, zB, t)
      );
      lookTarget.set(
        THREE.MathUtils.lerp(-from.camera[0] * .35, -to.camera[0] * .35, t),
        THREE.MathUtils.lerp(-from.camera[1] * .2, -to.camera[1] * .2, t),
        camera.position.z - 20
      );
      camera.lookAt(lookTarget);

      fogColor.copy(from.fog).lerp(to.fog, t);
      glowColor.copy(from.glow).lerp(to.glow, t);
      const density = THREE.MathUtils.lerp(from.density, to.density, t);
      const glowStrength = THREE.MathUtils.lerp(from.glowStrength, to.glowStrength, t);
      const idle = reducedMotion.matches ? 0 : now * .001;
      const idleScale = isMobile ? .55 : 1;
      glowPosition.set(
        THREE.MathUtils.lerp(from.glowPos[0], to.glowPos[0], t) + Math.sin(idle * .19) * .015 * idleScale,
        THREE.MathUtils.lerp(from.glowPos[1], to.glowPos[1], t) + Math.cos(idle * .16) * .012 * idleScale
      );

      scene.fog.color.copy(fogColor);
      scene.fog.density = density;
      backdropMaterial.uniforms.uScrollY.value = scrollY;
      backdropMaterial.uniforms.uGlowColor.value.copy(glowColor);
      backdropMaterial.uniforms.uGlowPos.value.copy(glowPosition);
      backdropMaterial.uniforms.uGlowStrength.value = glowStrength;
      backdropMaterial.uniforms.uFogColor.value.copy(fogColor);
      backdropMaterial.uniforms.uFogDensity.value = density;

      keyLight.color.copy(glowColor);
      keyLight.intensity = .55 + glowStrength;
      keyLight.position.set(8 - glowPosition.x * 6, 7 + glowPosition.y * 7, camera.position.z + 7);

      const centerLum = sampleGround(viewHeight * .5, viewWidth * .5, scrollY, groundScratch);
      if (centerLum < .24) {
        mainLineMaterial.color.copy(C.paper).lerp(glowColor, .28);
        panelMaterial.color.copy(C.petrolDeep).lerp(glowColor, .2);
      } else {
        mainLineMaterial.color.copy(C.navy);
        panelMaterial.color.copy(C.navy2);
      }
      accentLineMaterial.color.copy(glowColor);
      markerMaterial.color.copy(centerLum < .24 ? C.champagne : C.petrolDeep);

      const closingFade = index === chapters.length - 1 ? 1 - t : 1;
      mainLineMaterial.opacity = mainLineOpacity * closingFade;
      accentLineMaterial.opacity = accentLineOpacity * closingFade;
      panelMaterial.opacity = (isMobile ? .1 : .14) * closingFade;
      markerMaterial.opacity = closingFade;

      architecture.rotation.y = reducedMotion.matches ? 0 : Math.sin(now * .00002) * .012 * idleScale;
      architecture.rotation.x = reducedMotion.matches ? 0 : Math.cos(now * .000017) * .006 * idleScale;
      publishInk(scrollY);
    };

    function requestFrame() {
      if (destroyed || document.hidden || animationFrame) return;
      animationFrame = requestAnimationFrame(frame);
    }

    function frame(now) {
      animationFrame = 0;
      if (destroyed || document.hidden || (reducedMotion.matches && !dirty)) return;
      update(now);
      renderer.render(scene, camera);
      dirty = false;
      if (!reducedMotion.matches) requestFrame();
    }

    const onScroll = () => { dirty = true; requestFrame(); };
    const onMotionChange = () => { dirty = true; requestFrame(); };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
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
        throw makeWebGLError("frame", `The first WebGL frame returned error ${glError}`);
      }
    };

    const start = () => {
      resize();
      measureChapters();
      update(performance.now());
      renderer.render(scene, camera);
      validateFirstFrame();
      dirty = false;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", resize);
      window.addEventListener("orientationchange", scheduleMeasure);
      window.addEventListener("load", scheduleMeasure);
      document.addEventListener("visibilitychange", onVisibility);
      reducedMotion.addEventListener?.("change", onMotionChange);
      mobileQuery.addEventListener?.("change", onProfileChange);
      tabletQuery.addEventListener?.("change", onProfileChange);
      if (document.fonts?.ready) document.fonts.ready.then(scheduleMeasure);
      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(scheduleMeasure);
        [document.body, document.getElementById("main"), document.querySelector(".closing-scene")]
          .filter(Boolean)
          .forEach((element) => resizeObserver.observe(element));
      }
      if (!reducedMotion.matches && !document.hidden) requestFrame();
      document.getElementById("loading")?.classList.add("hidden");
    };

    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      clearTimeout(measureTimer);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", scheduleMeasure);
      window.removeEventListener("load", scheduleMeasure);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener?.("change", onMotionChange);
      mobileQuery.removeEventListener?.("change", onProfileChange);
      tabletQuery.removeEventListener?.("change", onProfileChange);
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
      groundTexture.dispose();
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
