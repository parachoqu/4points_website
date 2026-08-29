(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const backgroundDisabled = window.matchMedia("(max-width: 915px)");
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

  const smoothstep = (edge0, edge1, x) => {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  /* layout position, immune to the reveal transform (a client rect is not) */
  const docOffsetTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };

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

  /* ---------- Architectural relief field ----------

     One fixed surface behind the whole scroll. Not a scene per section: a
     continuous field of light and shadow that drifts and recolours as the page
     advances. The layers live in CSS; this only decides which chapter is being
     read, which tone that chapter wears, and how far the planes have travelled.

     It also carries the ink bridge. The typography reads --canvas-ink and its
     siblings, all of which resolve from three registered properties. Those used
     to be sampled off a rendered ground; here they are simply what the chapter's
     tone is, computed once from its hex. */

  const RELIEF_DARK_TONES = new Set(["navy", "navy-deep", "petrol"]);
  const RELIEF_TONE_CLASSES = [
    "tone-navy-deep", "tone-navy", "tone-petrol",
    "tone-paper", "tone-sand", "tone-ivory", "is-dark"
  ];

  /* Ground and accent are the section's own tokens, restated as hex because the
     luminance that decides polarity has to be computed, not read back. */
  const RELIEF_CHAPTERS = [
    { sel: ".hero", tone: "navy-deep", ground: "#071B2E", accent: "#1F6F8B" },
    { sel: ".standard", tone: "navy", ground: "#102A43", accent: "#1F6F8B" },
    { sel: ".services", tone: "navy", ground: "#102A43", accent: "#2A8EAA" },
    { sel: ".maintenance", tone: "paper", ground: "#FFFDF8", accent: "#1F6F8B" },
    { sel: ".floorcare", tone: "petrol", ground: "#12556B", accent: "#C8A96A", directional: true, champagne: true },
    { sel: ".beforeafter", tone: "sand", ground: "#F5EFEB", accent: "#1F6F8B", sage: true },
    { sel: ".residential", tone: "ivory", ground: "#F7F4EF", accent: "#8BAE8B", sage: true },
    { sel: ".impact", tone: "sand", ground: "#F5EFEB", accent: "#C8A96A", zones: true, champagne: true },
    { sel: ".areas", tone: "navy", ground: "#102A43", accent: "#1F6F8B" },
    { sel: ".testimonials", tone: "ivory", ground: "#F7F4EF", accent: "#C8A96A" },
    { sel: ".faq", tone: "paper", ground: "#FFFDF8", accent: "#1F6F8B" },
    { sel: ".quote", tone: "paper", ground: "#FFFDF8", accent: "#1F6F8B" },
    { sel: ".closing-scene", tone: "navy-deep", ground: "#071B2E", accent: "#2A8EAA" }
  ];

  /* The ground transition in CSS. Polarity lands at its midpoint. */
  const RELIEF_TONE_MS = 1800;

  const hexLuminance = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return relLuminance(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  };

  function initReliefBackground() {
    const root = document.documentElement;
    const bgRoot = document.getElementById("bgRoot");
    document.getElementById("loading")?.classList.add("hidden");
    if (!bgRoot) return;

    const layer = {
      a: document.getElementById("relief-a"),
      b: document.getElementById("relief-b"),
      c: document.getElementById("relief-c"),
      directional: document.getElementById("relief-directional"),
      zones: document.getElementById("relief-zones"),
      fogFar: document.getElementById("fog-far"),
      fogMid: document.getElementById("fog-mid"),
      fogNear: document.getElementById("fog-near"),
      champagne: document.getElementById("accent-champagne"),
      sage: document.getElementById("accent-sage")
    };
    if (Object.values(layer).some((el) => !el)) return;

    const chapters = RELIEF_CHAPTERS.map((definition) => {
      const lum = hexLuminance(definition.ground);
      /* Black and white ink overlap at 4.5:1 through the .175-.183 band; every
         ground here sits an order of magnitude clear of it on one side or the
         other, so a single threshold is enough and no hysteresis is needed. */
      return { ...definition, lum, pol: lum < .18 ? 1 : 0, element: null, start: 0, height: 1 };
    });

    const finePointer = window.matchMedia("(pointer: fine)");

    let mounted = false;
    let scrollFrame = 0;
    let fogFrame = 0;
    let polTimer = 0;
    let activeIndex = -1;
    let appliedPol = -1;
    let fogScrollY = 0;
    let pointerTX = 0, pointerTY = 0, pointerCX = 0, pointerCY = 0;
    let driftT = 0;

    /* offsetTop rather than a client rect: the reveal transforms would otherwise
       move a chapter's measured start as it animates in */
    const measure = () => {
      const viewHeight = window.innerHeight || 800;
      chapters.forEach((chapter, index) => {
        const element = document.querySelector(chapter.sel);
        chapter.element = element;
        chapter.start = element ? docOffsetTop(element) : index * viewHeight;
        chapter.height = Math.max(1, element?.offsetHeight || viewHeight);
      });
    };

    /* The chapter under the reading line, not merely the one on screen. With a
       single fixed ground the whole viewport is one tone at any instant, so the
       decision has to come from one point — and the eye sits just below centre. */
    const chapterAt = (scrollY) => {
      const probe = scrollY + (window.innerHeight || 800) * .52;
      for (let i = chapters.length - 1; i > 0; i -= 1) {
        if (probe >= chapters[i].start) return i;
      }
      return 0;
    };

    const applyChapter = (index) => {
      if (index === activeIndex) return;
      activeIndex = index;
      const chapter = chapters[index];

      RELIEF_TONE_CLASSES.forEach((name) => bgRoot.classList.remove(name));
      bgRoot.classList.add("tone-" + chapter.tone);
      if (RELIEF_DARK_TONES.has(chapter.tone)) bgRoot.classList.add("is-dark");

      layer.directional.style.opacity = chapter.directional ? "1" : "0";
      layer.directional.style.transform = chapter.directional
        ? "translate3d(0,0,0) scaleX(1)"
        : "translate3d(0,0,0) scaleX(1.3)";
      layer.zones.style.opacity = chapter.zones ? "1" : "0";
      layer.champagne.style.opacity = chapter.champagne ? ".6" : "0";
      layer.sage.style.opacity = chapter.sage ? ".5" : "0";

      /* Luminance and glow ease across on the ground's own curve, so the
         luminance-fed halo opens exactly while the ground is mid-crossing.
         Polarity is binary and cannot ease, so it lands at the midpoint of the
         crossing rather than at its start: flipping it on the first frame would
         put dark type on a still-dark ground for most of a second. */
      root.style.setProperty("--canvas-lum", chapter.lum.toFixed(3));
      root.style.setProperty("--canvas-glow", chapter.accent);

      window.clearTimeout(polTimer);
      polTimer = 0;
      if (chapter.pol === appliedPol) return;
      const writePol = () => {
        polTimer = 0;
        appliedPol = chapter.pol;
        root.style.setProperty("--canvas-pol", String(chapter.pol));
      };
      if (appliedPol === -1 || reducedMotion.matches) writePol();
      else polTimer = window.setTimeout(writePol, RELIEF_TONE_MS * .5);
    };

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const span = Math.max(1, (root.scrollHeight || 0) - (window.innerHeight || 800));
      const progress = clamp01(scrollY / span);

      /* Slow, continuous displacement — never abrupt, and never far enough for
         a plane to reveal where it ends. */
      if (!reducedMotion.matches) {
        layer.a.style.transform =
          `translate3d(${(-6 * progress).toFixed(2)}%, ${(4 * progress).toFixed(2)}%, 0) scale(1.05)`;
        layer.b.style.transform =
          `translate3d(${(5 * progress).toFixed(2)}%, ${(-5 * progress).toFixed(2)}%, 0) scale(1.08)`;
        layer.c.style.transform =
          `translate3d(${(-3 * progress).toFixed(2)}%, ${(3 * progress).toFixed(2)}%, 0)`;
        /* the fog carries its own, slower scroll offset: that difference in rate
           is the whole reason it reads as a more distant layer */
        fogScrollY = -3 * progress;
      }

      applyChapter(chapterAt(scrollY));
    };

    const requestScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; onScroll(); });
    };

    /* Cursor position smoothed by continuous interpolation, never followed
       directly. Three speeds read as three distances. On a coarse pointer the
       fog drifts on its own instead of standing still. */
    const fogLoop = () => {
      if (finePointer.matches) {
        pointerCX += (pointerTX - pointerCX) * .03;
        pointerCY += (pointerTY - pointerCY) * .03;
      } else {
        driftT += .0015;
        pointerCX = Math.sin(driftT) * .4;
        pointerCY = Math.cos(driftT * .7) * .3;
      }
      layer.fogFar.style.transform =
        `translate3d(${(pointerCX * 1.2).toFixed(3)}%, ${(pointerCY * .8 + fogScrollY * .6).toFixed(3)}%, 0) scale(1.1)`;
      layer.fogMid.style.transform =
        `translate3d(${(pointerCX * 2.2).toFixed(3)}%, ${(pointerCY * 1.6 + fogScrollY).toFixed(3)}%, 0) scale(1.12)`;
      layer.fogNear.style.transform =
        `translate3d(${(pointerCX * 3.4).toFixed(3)}%, ${(pointerCY * 2.4 + fogScrollY * 1.4).toFixed(3)}%, 0) scale(1.15)`;
      fogFrame = requestAnimationFrame(fogLoop);
    };

    const startFog = () => {
      if (fogFrame || reducedMotion.matches || document.hidden) return;
      fogFrame = requestAnimationFrame(fogLoop);
    };

    const stopFog = () => {
      if (fogFrame) cancelAnimationFrame(fogFrame);
      fogFrame = 0;
    };

    const onPointerMove = (event) => {
      pointerTX = (event.clientX / (window.innerWidth || 1200)) * 2 - 1;
      pointerTY = (event.clientY / (window.innerHeight || 800)) * 2 - 1;
    };

    const onResize = () => { measure(); requestScroll(); };

    const onVisibility = () => {
      if (!mounted) return;
      if (document.hidden) stopFog();
      else startFog();
    };

    const onMotionChange = () => {
      if (!mounted) return;
      stopFog();
      startFog();
      onScroll();
    };

    const mount = () => {
      if (mounted) return;
      mounted = true;
      measure();
      window.addEventListener("scroll", requestScroll, { passive: true });
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      window.addEventListener("load", onResize);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      onScroll();
      startFog();
      root.classList.remove("no-canvas");
      root.dataset.bgState = "ready";
    };

    /* Below 916px the field is not merely hidden, it is dismantled: the flat
       per-section grounds take over and nothing inline may survive to override
       the polarity they restate. */
    const unmount = () => {
      if (!mounted) return;
      mounted = false;
      window.removeEventListener("scroll", requestScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("load", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
      stopFog();
      window.clearTimeout(polTimer);
      polTimer = 0;
      activeIndex = -1;
      appliedPol = -1;
      root.style.removeProperty("--canvas-lum");
      root.style.removeProperty("--canvas-pol");
      root.style.removeProperty("--canvas-glow");
      RELIEF_TONE_CLASSES.forEach((name) => bgRoot.classList.remove(name));
      root.classList.add("no-canvas");
      root.dataset.bgState = "disabled";
    };

    const sync = () => { if (backgroundDisabled.matches) unmount(); else mount(); };

    backgroundDisabled.addEventListener?.("change", sync);
    reducedMotion.addEventListener?.("change", onMotionChange);
    sync();
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
    initReliefBackground();
    const yearEl = document.querySelector("[data-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
