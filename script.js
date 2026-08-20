import * as THREE from "three";

(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
  const contrastRatio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

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

  /* Septic Hermite. The quintic above already lands with zero slope and zero
     curvature; this one also lands with zero jerk, and what that buys is the
     tails. A tenth of the way into a ramp the quintic has already moved 0.86%
     of the distance and this has moved 0.27% — so a colour begins and ends
     arriving three times more gently, and the change is carried by the middle
     of the band instead of by its edges.

     The midpoint is identical (both are 0.5 at 0.5), which is what keeps this
     safe: luminance is linear in the mix, so where the ground crosses the ink's
     flip point barely moves. The ground field uses this one, in the shader and
     in the CPU sampler alike; everything else stays on the quintic. */
  const softstep = (edge0, edge1, x) => {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * t * t * (35 + t * (-84 + t * (70 - 20 * t)));
  };

  /* ---------- shared: frame-rate independent motion ----------
     `value += (target - value) * k` is a fixed fraction *per frame*, so the same
     code settles in half the time on a 120Hz panel and stutters through a frame
     hitch. Both helpers below are expressed in seconds instead: `halfLife` is
     the time it takes to close half the remaining distance, whatever the
     refresh rate is doing. Neither can overshoot, so nothing bounces. */
  const dampTo = (current, target, halfLife, dt) =>
    halfLife <= 0 ? target : target + (current - target) * Math.pow(2, -dt / halfLife);

  /* A critically damped spring, integrated implicitly. Unlike the exponential
     above it carries velocity, so it leaves and arrives smoothly instead of
     jumping to full speed the instant the target moves -- which is the
     difference between light that has mass and a value being interpolated.
     Implicit Euler keeps it unconditionally stable at any dt, and critical
     damping means it approaches the target without ever passing it. */
  const springStep = (ch, target, dt) => {
    if (ch.omega <= 0) { ch.x = target; ch.v = 0; return; }
    const w = ch.omega;
    const d = (1 + w * dt) * (1 + w * dt);
    ch.v = (ch.v + dt * w * w * (target - ch.x)) / d;
    ch.x += dt * ch.v;
  };

  /* layout position, immune to the reveal transform (a client rect is not) */
  const docOffsetTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
  const docOffsetLeft = (el) => { let x = 0; for (let n = el; n; n = n.offsetParent) x += n.offsetLeft; return x; };

  /* ---------- header ---------- */
  function initHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const progress = header.querySelector("[data-header-progress]");

    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
      if (!progress) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--progress", max > 0 ? String(Math.min(1, window.scrollY / max)) : "0");
    };

    const onScroll = onScrollFrame(update);
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

  /* ---------- desktop scroll snap: fragment navigation ----------
     The snapping itself is entirely the browser's: nothing here listens to
     wheel, trackpad or keys, and nothing calls preventDefault. The one thing
     mandatory snapping plus `scroll-snap-stop: always` does interfere with is
     a jump to a fragment, which can be halted at the first snap position it
     passes over. So a fragment jump — a header link, Back to top, the skip
     link — releases snapping for exactly as long as that scroll lasts. When
     it is restored the browser re-snaps to the nearest position, which is the
     top of the chapter the scroll just landed on: the destination still
     obeys the snap. Inert below the desktop scene breakpoint. */
  function initSnapAnchors() {
    const desktop = window.matchMedia("(min-width:1201px) and (min-height:640px)");
    const root = document.documentElement;
    let restoreId = null;

    const restore = () => {
      window.clearTimeout(restoreId);
      restoreId = null;
      root.classList.remove("is-snap-released");
    };

    const release = () => {
      if (!desktop.matches) return;
      root.classList.add("is-snap-released");
      window.clearTimeout(restoreId);
      /* Safari has no scrollend yet, and a smooth jump across the whole
         document is the longest scroll this page can start */
      restoreId = window.setTimeout(restore, 1400);
    };

    document.addEventListener("click", (e) => {
      const link = e.target.closest?.('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute("href");
      if (!hash || hash === "#" || !document.querySelector(hash)) return;
      release();
    });

    window.addEventListener("hashchange", release);
    window.addEventListener("scrollend", () => {
      if (restoreId !== null) restore();
    });
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

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        render(tab.dataset.freq);
      });
    });

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

    range.addEventListener("input", () => { setPosition(Number(range.value)); markTouched(); });

    let dragging = false;
    const posFromEvent = (clientX) => {
      const rect = frame.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    };
    frame.addEventListener("pointerdown", (e) => {
      frame.classList.add("is-dragging");
      markTouched();
      if (e.target.closest("input")) return;
      dragging = true;
      setPosition(posFromEvent(e.clientX));
    });
    window.addEventListener("pointermove", (e) => { if (dragging) setPosition(posFromEvent(e.clientX)); });
    window.addEventListener("pointerup", () => { dragging = false; frame.classList.remove("is-dragging"); });
    window.addEventListener("pointercancel", () => { dragging = false; frame.classList.remove("is-dragging"); });

    setPosition(50);
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

  /* ---------- Three.js continuous editorial canvas ---------- */
  function initThreeBackground() {
    const canvas = document.getElementById("canvas-fixed");
    if (!canvas) return;

    const PALETTE = {
      navy: new THREE.Color(0x102A43),
      navyDark: new THREE.Color(0x071B2E),
      navy2: new THREE.Color(0x173B5A),
      petrolDeep: new THREE.Color(0x12556B),
      petrol: new THREE.Color(0x1F6F8B),
      petrolLight: new THREE.Color(0x2A8EAA),
      sage: new THREE.Color(0x8BAE8B),
      sageSoft: new THREE.Color(0xDDE8D8),
      champagne: new THREE.Color(0xC8A96A),
      champagneDeep: new THREE.Color(0xA9894C),
      paper: new THREE.Color(0xFFFDF8),
      ivory: new THREE.Color(0xF7F4EF),
      sand: new THREE.Color(0xF5EFEB),
      graphite: new THREE.Color(0x2B2F32),
      /* navy pulled part of the way to petrol: the handover atmosphere. Petrol
         itself, used as a full-frame ground, is a brand colour turned into a
         background, and the page stops being this page. */
      haze: new THREE.Color(0x114159)
    };

    const isMobile = window.matchMedia("(max-width:767px)").matches;
    const isReduced = reducedMotion.matches;

    /* The sections no longer paint their own ground — this canvas is the page's
       atmosphere. So a context that never arrives is not a missing flourish, it
       is a missing floor: hand the page back to a set of solid CSS fallbacks. */
    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch (err) {
      renderer = null;
    }
    if (!renderer) {
      document.documentElement.classList.add("no-canvas");
      document.getElementById("loading")?.classList.add("hidden");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    /* NO COLOUR MANAGEMENT HERE, ON PURPOSE. The importmap pins three r128,
       which predates the whole ColorManagement overhaul — it exports no
       SRGBColorSpace, no outputColorSpace and no ColorManagement at all, so
       `new THREE.Color(0x102A43)` keeps the raw sRGB channels and this shader
       writes them out untouched.

       That passthrough is what makes PALETTE.navy on screen byte-identical to
       --navy: #102A43 in the stylesheet, which is the entire reason the canvas
       ground and the CSS fallbacks can be the same page. relLuminance() does
       the linearisation where linearisation is actually needed — when measuring
       contrast — and nowhere else. Do not "fix" this, and do not raise the
       three version without re-deriving every ground colour. */

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
    camera.position.set(0, 0, 20);

    /* There are no lights. Every material in this scene is a Basic one — lines
       and markers — and Basic materials do not answer to lighting, so the
       ambient, key and rim lights that used to stand here were three objects
       and a per-frame colour copy that could not reach a single pixel. */

    /* The uniform array is not the timeline any more, it is the window of it
       that the current viewport can reach (see uploadGroundWindow). Sixteen is
       already far more than a viewport plus its padding can contain — that would
       take eight chapters visible at once — and the smaller bound is a smaller
       upload and a shorter loop for the shader compiler to reason about.
       Keep this in step with the #define in the fragment shader below. */
    const MAX_GROUND_STOPS = 16;
    const groundStopUniforms = Array.from(
      { length: MAX_GROUND_STOPS },
      () => new THREE.Vector4(0, PALETTE.navyDark.r, PALETTE.navyDark.g, PALETTE.navyDark.b)
    );

    const backdropGeo = new THREE.PlaneGeometry(220, 40, 1, 1);
    const backdropMat = new THREE.ShaderMaterial({
      uniforms: {
        uResolution: { value: new THREE.Vector2(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio()) },
        uViewportH: { value: window.innerHeight || 800 },
        uScrollY: { value: window.scrollY || 0 },
        uGroundStopCount: { value: 1 },
        uGroundStops: { value: groundStopUniforms },
        /* how far the document-space field is raked across the width of the
           frame, in document pixels. Zero when the page is settled: a chapter
           at rest stands on a level floor. */
        uGroundSkew: { value: 0 },
        /* the chapter's own light */
        uGlowColor: { value: new THREE.Color(PALETTE.petrolLight) },
        uGlowPos: { value: new THREE.Vector2(0.8, 0.7) },
        uGlowStrength: { value: 0.5 },
        /* a second, weaker source: a chapter can hold the memory of the one it
           just left and the anticipation of the next one in the same frame */
        uGlow2Color: { value: new THREE.Color(PALETTE.champagne) },
        uGlow2Pos: { value: new THREE.Vector2(0.5, 0.5) },
        uGlow2Strength: { value: 0 },

        /* ---------- THE SURFACE ----------
           The light is not a lamp in a room, it is a raking highlight on a
           floor, and these are the terms of that highlight. uSheenAcross and
           uSheenAlong are the two half-widths of an elliptical Gaussian — the
           same pair Ward calls alphaX and alphaY. Their ratio is the finish:
           a matte surface scatters almost isotropically, a polished one
           scatters along the direction it was worked in.

           They are driven, not authored: see uFinish in updateFromScroll.

           There is no uAspect uniform on purpose — the shader derives it from
           uResolution and the CPU sampler from the cached viewport, and those
           are the same ratio by construction. A third copy is a third thing
           that can fall out of step. */
        uRakeAngle: { value: -0.32 },
        uSheenAcross: { value: 0.42 },
        uSheenAlong: { value: 0.46 },
        uSheen2Across: { value: 0.63 },
        uSheen2Along: { value: 0.55 },
        /* the tooling marks the raking light reveals. Zero-mean, capped, and
           gated by the highlight itself — a surface only shows its grain where
           the light actually rakes it. Off on mobile and reduced motion. */
        uMicro: { value: 0.03 },
        uMicroScale: { value: 5.5 }
      },
      vertexShader: `
        void main(){
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        /* Explicit, because the cost of getting it wrong here is visible. The
           ground is a gradient between two navies a handful of 8-bit steps
           apart, stretched over a whole viewport — exactly the case mediump
           turns into stripes. three defaults to highp already; this says so. */
        precision highp float;

        #define MAX_GROUND_STOPS 16

        uniform vec2 uResolution;
        uniform float uViewportH;
        uniform float uScrollY;
        uniform int uGroundStopCount;
        uniform vec4 uGroundStops[MAX_GROUND_STOPS];
        uniform float uGroundSkew;
        uniform vec3 uGlowColor;
        uniform vec2 uGlowPos;
        uniform float uGlowStrength;
        uniform vec3 uGlow2Color;
        uniform vec2 uGlow2Pos;
        uniform float uGlow2Strength;
        uniform float uRakeAngle;
        uniform float uSheenAcross;
        uniform float uSheenAlong;
        uniform float uSheen2Across;
        uniform float uSheen2Along;
        uniform float uMicro;
        uniform float uMicroScale;

        /* Hash without Sine (Dave Hoskins). The usual fract(sin(dot(..))*43758.5)
           is not portable: sin at a large argument is implementation-defined, so
           the same grain comes out different per driver and can band on mobile.
           This is integer-ish arithmetic and gives the same field everywhere. */
        float hash12(vec2 p){
          vec3 p3 = fract(vec3(p.xyx) * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        float vnoise(vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash12(i),                  hash12(i + vec2(1.0, 0.0)), f.x),
                     mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
        }

        /* Two octaves, amplitudes summing to one so the result stays in [0,1].
           The second is what keeps the streaks from reading as a regular comb. */
        float grain(vec2 p){
          return vnoise(p) * 0.667 + vnoise(p * 2.17 + 31.4) * 0.333;
        }

        /* Interleaved gradient noise (Jorge Jimenez). Used only as a dither
           source, anchored to gl_FragCoord so it is fixed in screen space and
           cannot shimmer as the page scrolls under it. */
        float ign(vec2 p){
          return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
        }

        vec3 sampleGroundField(float docY){
          vec4 prevStop = uGroundStops[0];
          vec3 col = prevStop.yzw;

          for(int i = 1; i < MAX_GROUND_STOPS; i++){
            if(i >= uGroundStopCount) break;
            vec4 nextStop = uGroundStops[i];

            if(docY <= nextStop.x){
              float span = max(1.0, nextStop.x - prevStop.x);
              float t = clamp((docY - prevStop.x) / span, 0.0, 1.0);
              /* septic Hermite -- MUST match softstep() in the CPU sampler */
              t = t * t * t * t * (35.0 + t * (-84.0 + t * (70.0 - 20.0 * t)));
              return mix(prevStop.yzw, nextStop.yzw, t);
            }

            prevStop = nextStop;
            col = prevStop.yzw;
          }

          return col;
        }

        void main(){
          float viewportY = (1.0 - gl_FragCoord.y / max(1.0, uResolution.y)) * uViewportH;
          /* the rake. The field stays document-space -- this only asks which
             document pixel a given column of the frame is standing on, so the
             arriving ground crosses the viewport diagonally instead of the
             whole frame changing colour at once. */
          float sx = gl_FragCoord.x / max(1.0, uResolution.x);
          float docY = uScrollY + viewportY + (sx - 0.5) * uGroundSkew;
          vec3 base = sampleGroundField(docY);

          /* ---------- THE RAKING LIGHT ----------
             Frame space, y up, which is the convention glowPos is authored in
             ("the light rises from the floor of the frame" is y = 0.06). The
             backdrop plane's own uv is deliberately not used: the plane is 220
             units wide and the viewport covers about a tenth of it, so uv space
             put every authored position far outside the visible frame and left
             only the tail of the falloff on screen. In frame space a station
             that says the light stands at 0.85, 0.85 gets the light there.

             The highlight is an elliptical Gaussian in coordinates local to the
             rake axis. That is Ward's anisotropic lobe with the geometry terms
             dropped — there are no normals here — and what survives is the part
             that carries the anisotropy: an exponential of two independently
             scaled squared projections. uSheenAcross and uSheenAlong are Ward's
             alphaX and alphaY, and their ratio is the finish of the surface. */
          vec2 fragUV = gl_FragCoord.xy / max(vec2(1.0), uResolution);
          float aspect = uResolution.x / max(1.0, uResolution.y);

          vec2 A = vec2(cos(uRakeAngle), sin(uRakeAngle));   /* along the rake */
          vec2 N = vec2(-A.y, A.x);                          /* across it */

          vec2 p1 = (fragUV - uGlowPos) * vec2(aspect, 1.0);
          float across = dot(p1, N);
          float along  = dot(p1, A);
          float sheen = exp(-((across * across) / (uSheenAcross * uSheenAcross)
                            + (along  * along ) / (uSheenAlong  * uSheenAlong )));

          vec2 p2 = (fragUV - uGlow2Pos) * vec2(aspect, 1.0);
          float across2 = dot(p2, N);
          float along2  = dot(p2, A);
          float sheen2 = exp(-((across2 * across2) / (uSheen2Across * uSheen2Across)
                             + (along2  * along2 ) / (uSheen2Along  * uSheen2Along )));

          vec3 col = base
                   + uGlowColor  * (sheen  * uGlowStrength)
                   + uGlow2Color * (sheen2 * uGlow2Strength);

          /* ---------- THE FLANKS ----------
             Adding light to Paper does nothing: the channels are already at the
             ceiling and the highlight clips to white. Seven of the fourteen
             chapters stand on a light ground, so a purely additive sheen would
             mean the surface has no finish across half the page.

             It is also not how a raking highlight reads on a pale floor. There
             the band is not brighter than white — the surround is deeper. So on
             a light ground the same ellipse carves instead of adding: a second,
             broader lobe on the same axis, subtracted where it exceeds the core
             and therefore exactly zero along the centreline. It multiplies the
             ground rather than a fixed colour, so it deepens the surface it is
             on instead of tinting it.

             uCarve is 0 on navy and 1 on paper, and it is measured against the
             ground BEFORE the light — mirrored term for term in sampleGround. */
          float lum = dot(base, vec3(0.2126, 0.7152, 0.0722));
          float carve = smoothstep(0.35, 0.85, lum);
          if (carve > 0.0) {
            float wF = uSheenAcross * 2.6;
            float flank = exp(-((across * across) / (wF * wF)
                              + (along  * along ) / (uSheenAlong * uSheenAlong)));
            col -= base * (0.10 * carve * max(0.0, flank - sheen));
          }

          /* ---------- WHAT THE RAKE REVEALS ----------
             Slow along the axis, fast across it: the noise resolves into marks
             running with the direction the surface was worked in. Gated by the
             highlight, because a surface only shows its grain where light
             actually rakes it, and zero-mean so it can shift no reading the CPU
             sampler takes. Off entirely on mobile and reduced motion. */
          if (uMicro > 0.0) {
            float g = grain(vec2(along * 0.30, across * 16.0) * uMicroScale);
            col += (g - 0.5) * 2.0 * uMicro * sheen;
          }

          /* ---------- DITHER ----------
             navy-dark to navy across a viewport is nine 8-bit steps in red and
             twenty-one in blue: textbook banding, and until now it was the CSS
             grain overlay that happened to be hiding it. Two IGN samples summed
             give a triangular distribution at one LSB, which is the shape that
             removes the banding without the noise itself becoming visible. */
          col += (ign(gl_FragCoord.xy) + ign(gl_FragCoord.xy + vec2(37.0, 17.0)) - 1.0) / 255.0;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthWrite: false
    });
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
    backdrop.position.set(0, 0, -30);
    scene.add(backdrop);

    function lineMaterial(color, opacity) {
      return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    }

    function makeDiamond(size) {
      const pts = [
        new THREE.Vector3(0, size, 0),
        new THREE.Vector3(size, 0, 0),
        new THREE.Vector3(0, -size, 0),
        new THREE.Vector3(-size, 0, 0),
        new THREE.Vector3(0, size, 0)
      ];
      return new THREE.BufferGeometry().setFromPoints(pts);
    }

    function makeFourPoint(size) {
      const pts = [
        new THREE.Vector3(0, -size, 0), new THREE.Vector3(0, size, 0),
        new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0)
      ];
      return new THREE.BufferGeometry().setFromPoints(pts);
    }

    const markerGeo = new THREE.SphereGeometry(0.05, 8, 8);
    function makeMarker(color, opacity) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Mesh(markerGeo, mat);
    }

    const RAIL_STEP = 16;
    const geometryGroup = new THREE.Group();
    scene.add(geometryGroup);

    /* =========================================================
       DOCUMENT-SPACE GROUND FIELD
       ---------------------------------------------------------
       The DOM does not paint the page ground. It only tells the WebGL canvas
       where each chapter exists. The field below is measured in document
       pixels and sampled per fragment as scrollY + viewportY, so the top and
       bottom of one viewport can belong to different chapters in the same
       frame.

       Ground and atmosphere are deliberately two systems: this field is the
       only page-ground author (deterministic, one colour per document
       pixel); the station rail below moves glow, fog and technical geometry
       on top of it and is allowed to diverge from it where the design calls
       for anticipation. DOM sections never paint their own ground — every
       .scroll-snap-section wrapper in style.css ships background:transparent
       unconditionally; this file is the only place page-ground colour is
       decided.
       ========================================================= */
    const residentialGround = new THREE.Color(PALETTE.ivory).lerp(PALETTE.sageSoft, 0.16);

    /* ---------- THREE GROUNDS RETUNED FOR THE RAKING LIGHT ----------
       Every value here is an approved token or a mix of two of them; no new
       colour enters the palette. What changed is only where the ground gives
       the light room to be read.

       floorcare — the chapter the finish actually turns on. The haze loses a
         little more density towards Navy Dark so the highlight has somewhere to
         concentrate against while it collapses from round to a band. Still the
         deep desaturated blue the chapter was authored as, one step deeper.

       beforeafter — LEFT ALONE, and worth recording why. Deepening its lower
         ground to Sand Warm did give the polished run more to sit against, but
         .ba-caption is set in --muted (#627D98) and reads the canvas at its own
         position: on Sand it measures 3.76:1, and Sand Warm took it to 3.50:1.
         Both are under 4.5, so the token was already failing there — but there
         was no reason to make it worse for an effect the carve below already
         produces without any help from the ground.

       impact — the only chapter on the page whose ground did not move at all,
         top and bottom both Sand. It drifts towards Sage Soft, which is the
         accent this chapter already uses for its own type, by exactly the
         technique residentialGround above uses. A frame that never changes is
         a frame the eye stops reading. */
    const floorcareGround = new THREE.Color(PALETTE.haze).lerp(PALETTE.navyDark, 0.14);
    const impactGround = new THREE.Color(PALETTE.sand).lerp(PALETTE.sageSoft, 0.14);

    const groundChapters = [
      { key: "hero", sel: ".hero", top: PALETTE.navyDark, bottom: PALETTE.navy, enter: 0, exit: 0.06 },
      { key: "standard", sel: ".standard", top: PALETTE.navyDark, bottom: PALETTE.navy2, enter: 0.08, exit: 0.12 },
      { key: "services", sel: ".services", top: PALETTE.navy, bottom: PALETTE.navyDark, enter: 0.10, exit: 0.10 },
      { key: "maintenance", sel: ".maintenance", top: PALETTE.paper, bottom: PALETTE.ivory, enter: 0.14, exit: 0.08 },
      { key: "floorcare", sel: ".floorcare", top: PALETTE.navyDark, bottom: floorcareGround, enter: 0.10, exit: 0 },
      { key: "beforeafter", sel: ".beforeafter", top: PALETTE.paper, bottom: PALETTE.sand, enter: 0.14, exit: 0.10 },
      { key: "residential", sel: ".residential", top: PALETTE.ivory, bottom: residentialGround, enter: 0.12, exit: 0.10 },
      { key: "impact", sel: ".impact", top: PALETTE.sand, bottom: impactGround, enter: 0.10, exit: 0.10 },
      { key: "areas", sel: ".areas", top: PALETTE.navy, bottom: PALETTE.navyDark, enter: 0.12, exit: 0.12 },
      { key: "testimonials", sel: ".testimonials", top: PALETTE.paper, bottom: PALETTE.ivory, enter: 0.12, exit: 0.10 },
      { key: "faq", sel: ".faq", top: PALETTE.paper, bottom: PALETTE.sand, enter: 0.08, exit: 0 },
      { key: "quote", sel: ".quote", top: PALETTE.paper, bottom: PALETTE.paper, enter: 0, exit: 0 },
      {
        key: "final-cta", sel: ".final-cta", enter: 0.10, exit: 0.04,
        stops: [
          { at: 0, color: PALETTE.petrolDeep },
          { at: 0.48, color: PALETTE.petrol },
          { at: 1, color: PALETTE.navyDark }
        ]
      },
      { key: "footer", sel: ".site-footer", top: PALETTE.navyDark, bottom: PALETTE.navyDark, enter: 0.04, exit: 0 }
    ];

    let groundTimeline = [];
    let groundDocH = -1;
    const groundColorScratch = new THREE.Color();
    const groundColorScratchB = new THREE.Color();

    const colorDistanceSq = (a, b) => {
      const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
      return dr * dr + dg * dg + db * db;
    };

    function chapterGroundColor(chapter, t, target) {
      const stops = chapter.stops;
      if (!stops || !stops.length) {
        return target.copy(chapter.top).lerp(chapter.bottom, smoothstep(0, 1, t));
      }

      let prev = stops[0];
      for (let i = 1; i < stops.length; i++) {
        const next = stops[i];
        if (t <= next.at) {
          const span = Math.max(0.001, next.at - prev.at);
          return target.copy(prev.color).lerp(next.color, smoothstep(0, 1, (t - prev.at) / span));
        }
        prev = next;
      }
      return target.copy(stops[stops.length - 1].color);
    }

    /* =========================================================
       HOW WIDE A GROUND CROSSING IS ALLOWED TO BE
       ---------------------------------------------------------
       The authored enter/exit ratios are not decoration. Almost every chapter
       states its own ink in the stylesheet rather than reading the canvas —
       .hero, .services, .floorcare, .areas, .final-cta and .site-footer pin
       white; .maintenance, .impact and .quote pin navy-dark — and those ratios
       are what keeps each of them standing on its own polarity for the whole
       time its type is on screen. What matters is therefore not how wide a
       crossing is but where inside it the ground passes the ink's flip point.

       Because luminance is linear in the mix and the septic tails are so flat,
       those two come apart. Widening a navy-to-paper crossing by a third and
       moving it onto the septic curve puts the flip 19.5px above the section
       boundary, against 20.1px before: the ground still turns over in the same
       place, and the extra width is spent entirely on the two tails, where the
       colour is barely moving. So every crossing gets room to breathe now, not
       only the ones with nothing to protect.

       Same-polarity crossings still get more of it. Both grounds there take the
       same ink, so nothing is being protected at all, and they are the ones
       that read as three backgrounds being swapped rather than as three
       temperatures of one material.
       ========================================================= */
    const GROUND_LEVEL_GAIN = 1.75;
    const GROUND_CROSS_GAIN = 1.3;
    const GROUND_MIN_RAMP = 72;

    function groundBand(chapter, height, side, viewH, level) {
      const ratio = chapter[side];
      if (!ratio || ratio <= 0 || height <= 2) return 0;
      const ceiling = level ? (chapter.maxBand || 460) : (chapter.maxBand || 300);
      const maxBand = Math.min(ceiling, viewH * (level ? 0.5 : 0.32), height * 0.42);
      if (maxBand <= 0) return 0;
      const minBand = Math.min(chapter.minBand || 42, maxBand);
      const gain = level ? GROUND_LEVEL_GAIN : GROUND_CROSS_GAIN;
      return Math.min(maxBand, Math.max(minBand, height * ratio * gain));
    }

    function pushGroundStop(stops, y, color, docLimit) {
      if (!Number.isFinite(y)) return;
      let stopY = Math.max(0, Math.min(docLimit, y));
      const last = stops[stops.length - 1];

      if (last) {
        if (colorDistanceSq(last.color, color) < 0.000001 && Math.abs(stopY - last.y) < 2) {
          last.y = stopY;
          return;
        }
        if (stopY <= last.y) stopY = last.y + 1;
      }

      stops.push({ y: stopY, color: color.clone() });
    }

    function measureGroundField() {
      const viewH = window.innerHeight || 800;
      const docH = Math.max(document.documentElement.scrollHeight || 0, document.body?.scrollHeight || 0, viewH);
      const docLimit = docH + viewH;

      const measured = groundChapters
        .map((chapter) => {
          const el = document.querySelector(chapter.sel);
          if (!el) return null;
          const start = docOffsetTop(el);
          const end = start + Math.max(1, el.offsetHeight);
          return { ...chapter, start, end, height: end - start };
        })
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);

      /* Which ink each chapter's own two edges call for, read off the authored
         colours rather than declared anywhere. A boundary is "level" when the
         ground on both sides of it takes the same ink. */
      const edges = measured.map((chapter) => {
        chapterGroundColor(chapter, 0, groundColorScratch);
        const top = relLuminance(groundColorScratch.r, groundColorScratch.g, groundColorScratch.b) < 0.2;
        chapterGroundColor(chapter, 1, groundColorScratch);
        const bottom = relLuminance(groundColorScratch.r, groundColorScratch.g, groundColorScratch.b) < 0.2;
        return { top, bottom };
      });
      const levelAt = (i) =>
        i >= 0 && i < measured.length - 1 && edges[i].bottom === edges[i + 1].top;

      const bands = measured.map((chapter, index) => ({
        enter: index === 0 ? 0 : groundBand(chapter, chapter.height, "enter", viewH, levelAt(index - 1)),
        exit: index === measured.length - 1 ? 0 : groundBand(chapter, chapter.height, "exit", viewH, levelAt(index))
      }));

      /* No colour change may resolve in less space than this. The FAQ exits at 0
         and the Quote enters at 0, so their stops land on the same document
         pixel and pushGroundStop() has to prise them apart by one — a sand to
         paper edge one pixel tall, sweeping up the screen as a hard line. Only
         level boundaries are widened, so the floor can never carry a pinned ink
         onto a ground of the opposite polarity. */
      for (let i = 0; i < measured.length - 1; i++) {
        if (!levelAt(i)) continue;
        const total = bands[i].exit + bands[i + 1].enter;
        if (total >= GROUND_MIN_RAMP) continue;
        const half = (GROUND_MIN_RAMP - total) * 0.5;
        bands[i].exit = Math.min(bands[i].exit + half, measured[i].height * 0.42);
        bands[i + 1].enter = Math.min(bands[i + 1].enter + half, measured[i + 1].height * 0.42);
      }

      const stops = [];
      measured.forEach((chapter, index) => {
        const enter = bands[index].enter;
        const exit = bands[index].exit;
        const holdStart = Math.min(chapter.end, chapter.start + enter);
        const holdEnd = Math.max(holdStart + 1, chapter.end - exit);

        chapterGroundColor(chapter, 0, groundColorScratch);
        if (index === 0) pushGroundStop(stops, 0, groundColorScratch, docLimit);
        pushGroundStop(stops, holdStart, groundColorScratch, docLimit);

        chapterGroundColor(chapter, 0.5, groundColorScratchB);
        if (chapter.stops && holdEnd - holdStart > Math.max(150, chapter.height * 0.28)) {
          pushGroundStop(stops, (holdStart + holdEnd) * 0.5, groundColorScratchB, docLimit);
        }

        chapterGroundColor(chapter, 1, groundColorScratch);
        pushGroundStop(stops, holdEnd, groundColorScratch, docLimit);
        if (index === measured.length - 1) pushGroundStop(stops, docLimit, groundColorScratch, docLimit);
      });

      if (!stops.length) {
        pushGroundStop(stops, 0, PALETTE.navyDark, docLimit);
        pushGroundStop(stops, docLimit, PALETTE.navyDark, docLimit);
      }

      groundTimeline = stops;
      groundHint = 0;
      groundWindowFrom = -1;
      groundWindowTo = -1;

      groundDocH = docH;
    }

    /* =========================================================
       WHAT THE GPU IS SHOWN — one viewport's worth of the field
       ---------------------------------------------------------
       The shader walks the stop list per fragment, so the length of that list
       is a per-pixel cost across a full-screen quad. The whole page is around
       thirty stops; the two or three that bracket the current viewport are the
       only ones any fragment can land on. So the uniform array carries a window
       rather than the timeline, re-indexed from zero, and the loop runs a couple
       of times instead of fifteen.

       The CPU sampler keeps reading the complete timeline. The two agree across
       every document pixel the GPU actually draws, which is the only place they
       are required to agree — and the padding is wide enough that the rake
       cannot reach past the window's edge.
       ========================================================= */
    const GROUND_WINDOW_PAD = 200;
    let groundWindowFrom = -1;
    let groundWindowTo = -1;

    function uploadGroundWindow(scrollPx, viewH) {
      const n = groundTimeline.length;
      if (!n) return;

      const lo = scrollPx - GROUND_WINDOW_PAD;
      const hi = scrollPx + viewH + GROUND_WINDOW_PAD;

      let from = 0;
      while (from < n - 1 && groundTimeline[from + 1].y < lo) from++;
      let to = from;
      while (to < n - 1 && groundTimeline[to].y < hi) to++;
      if (to - from + 1 > MAX_GROUND_STOPS) to = from + MAX_GROUND_STOPS - 1;

      if (from === groundWindowFrom && to === groundWindowTo) return;
      groundWindowFrom = from;
      groundWindowTo = to;

      const count = to - from + 1;
      for (let i = 0; i < count; i++) {
        const stop = groundTimeline[from + i];
        groundStopUniforms[i].set(stop.y, stop.color.r, stop.color.g, stop.color.b);
      }
      backdropMat.uniforms.uGroundStopCount.value = count;
    }

    /* The bracket search starts from wherever the last call landed. A frame's
       samples walk down the screen in order, so the answer is almost always the
       same bracket or the next one. */
    let groundHint = 0;

    function sampleGroundField(docY, target) {
      const n = groundTimeline.length;
      if (!n) return target.copy(PALETTE.navyDark);
      if (docY <= groundTimeline[0].y) return target.copy(groundTimeline[0].color);

      let i = groundHint;
      if (i > n - 2) i = n - 2;
      if (i < 0) i = 0;
      while (i > 0 && docY <= groundTimeline[i].y) i--;
      while (i < n - 2 && docY > groundTimeline[i + 1].y) i++;
      groundHint = i;

      const prev = groundTimeline[i];
      const next = groundTimeline[i + 1];
      if (docY > next.y) return target.copy(next.color);

      const span = Math.max(1, next.y - prev.y);
      /* septic Hermite -- MUST match sampleGroundField() in the shader */
      return target.copy(prev.color).lerp(next.color, softstep(0, 1, (docY - prev.y) / span));
    }

    measureGroundField();

    /* =========================================================
       ATMOSPHERE STATIONS — where the raking light stands
       ---------------------------------------------------------
       These are not the page ground. They carry the light and the surface id
       along the same scroll rail while the measured document-space field above
       owns the surface behind the DOM.

       `at`   where in the section the station sits (0 = top, 1 = bottom)
       `seam` the cinematic window, inside the interval that starts here, where
              the atmosphere migrates to the next station.

       There is no `fog` field any more, and no `build`. Fog only ever modulated
       line objects thin enough to be subliminal, and spanFade() already does
       distance falloff per object and does it better. What each station still
       authors is the light itself: where it stands in the frame, how strong it
       is, and what colour it is. The *shape* that light takes is not authored
       here — it comes from uFinish, which is the surface's own state.
       ========================================================= */
    const stations = [
      {
        key: "hero", sel: ".hero", at: 0.34, seam: [0.25, 0.85],
        glow: PALETTE.petrolLight,
        glowPos: [0.85, 0.85], glowStrength: 0.55, label: "01", labelDark: true
      },
      { // the Standard reads its ink off this ground: leave its light alone
        key: "standard", sel: ".standard", at: 0.5, seam: [0.3, 0.9],
        glow: PALETTE.petrol,
        glowPos: [0.2, 0.85], glowStrength: 0.3, label: "02", labelDark: true
      },
      {
        key: "services", sel: ".services", at: 0.5, seam: [0.15, 0.7],
        glow: PALETTE.petrolDeep,
        glowPos: [0.75, 0.2], glowStrength: 0.34, label: "03", labelDark: true
      },
      { // paper, and the last third already losing temperature
        key: "maintenance", sel: ".maintenance", at: 0.45, seam: [0.1, 0.62],
        glow: PALETTE.petrol,
        glowPos: [0.86, 0.42], glowStrength: 0.42, label: "04", labelDark: false
      },
      { // FLOOR CARE, entering: the champagne sits behind the photograph
        key: "floorcare-in", sel: ".floorcare", at: 0.26, seam: [0, 1],
        glow: PALETTE.champagne,
        glowPos: [0.56, 0.6], glowStrength: 0.42, label: "05", labelDark: true
      },
      { // FLOOR CARE, handing over.
        //
        // A haze is dark and cool. A saturated petrol field at full strength is
        // a brand colour used as a background, which is a different site
        // altogether — so the navy loses density towards a deep, desaturated
        // blue and the light that rises from the floor of the frame is weak.
        //
        // The window is deliberately late. This chapter's type is white and is
        // pinned white, because it sits on a photograph rather than on this
        // canvas: it cannot be allowed to find itself over paper. So the
        // migration to the light ground does not begin until the Floor Care's
        // content box has left the frame — by which point the Before/After's
        // heading, which *does* read the canvas, is carrying the crossing.
        key: "floorcare-out", sel: ".floorcare", at: 1, seam: [0.62, 1],
        glow: PALETTE.petrol,
        glowPos: [0.5, 0.08], glowStrength: 0.26, label: "05", labelDark: true
      },
      { // BEFORE / AFTER — the technical board, and the coolest light on the page
        key: "beforeafter", sel: ".beforeafter", at: 0.44, seam: [0.3, 0.9],
        glow: PALETTE.petrol,
        glowPos: [0.74, 0.34], glowStrength: 0.2, label: "06", labelDark: false
      },
      {
        key: "residential", sel: ".residential", at: 0.5, seam: [0.3, 0.9],
        glow: PALETTE.sage,
        glowPos: [0.3, 0.15], glowStrength: 0.42, label: "07", labelDark: false
      },
      {
        key: "impact", sel: ".impact", at: 0.5, seam: [0.25, 0.8],
        glow: PALETTE.sage,
        glowPos: [0.2, 0.7], glowStrength: 0.38, label: "08", labelDark: false
      },
      {
        key: "areas", sel: ".areas", at: 0.5, seam: [0.2, 0.75],
        glow: PALETTE.petrol,
        glowPos: [0.72, 0.5], glowStrength: 0.44, label: "09", labelDark: true
      },
      {
        key: "testimonials", sel: ".testimonials", at: 0.5, seam: [0.25, 0.85],
        glow: PALETTE.champagne,
        glowPos: [0.5, 0.4], glowStrength: 0.32, label: "10", labelDark: false
      },
      { // FAQ — the most graphic light ground on the site
        key: "faq-in", sel: ".faq", at: 0.32, seam: [0.35, 1],
        glow: PALETTE.petrol,
        glowPos: [0.78, 0.56], glowStrength: 0.28, label: "11", labelDark: false
      },
      { // The questions are still being read and the air is already closing.
        // The light goes cold and rises from the floor of the frame; the ground
        // itself stays light, because a reader is still on it. Petrol adds
        // light here — it does not take it away. The navy arrives next.
        key: "faq-out", sel: ".faq", at: 0.94, seam: [0.1, 0.72],
        glow: PALETTE.petrol,
        glowPos: [0.5, 0.06], glowStrength: 0.52, label: "11", labelDark: false
      },
      { // The closing navy is anchored deep inside the Quote on purpose. The
        // FAQ paints no ground of its own, so navy arriving while a question is
        // still on screen would put navy type on navy. By the time this station
        // is reached the Quote's own paper is covering the canvas, and the
        // handover is read through the strip where that paper fades in.
        key: "close", sel: ".quote", at: 0.75, seam: [0.35, 0.9],
        glow: PALETTE.petrolLight,
        glowPos: [0.5, 0.05], glowStrength: 0.5, label: "13", labelDark: true
      },
      { // The Closing Scene is one scene, and a scene the camera stops moving
        // through is two. Without this the rail saturated at "close" — which is
        // anchored inside the Quote — and the dolly stood still for the whole of
        // the Final CTA and the Footer while the reader kept descending.
        //
        // So the travel continues, and what it carries is a decrease: the light
        // is the same petrol, weaker and lower in the frame, and it sinks below
        // the floor of the frame. The page ends on a stable Navy Dark instead of
        // on a frozen one. It answers to "13" like the station before it — the
        // surface id reads one closing chapter.
        key: "footer", sel: ".site-footer", at: 0.5, seam: [0.15, 0.8],
        glow: PALETTE.petrolDeep,
        glowPos: [0.5, -0.08], glowStrength: 0.2, label: "13", labelDark: true
      }
    ];

    /* =========================================================
       THE STRUCTURE — one object, at a weight the eye reaches
       ---------------------------------------------------------
       There used to be four spans here and a scatter of per-station wireframes
       on top of them, every one between .05 and .16 opacity: fifteen objects
       nobody ever saw, kept alive by a fog that existed to modulate them.

       This is the one that survived, and it survived because it is the mark
       itself — the four-point registration figure, drawn larger than the
       viewport so it reads as structure rather than as a logo dropped into the
       background. It sits at an absolute depth on the rail and the camera keeps
       travelling towards it. Nothing animates: the scale is the dolly, and the
       dolly is the scroll.

       What is new is that it no longer carries a colour of its own. It takes
       the colour of the light currently crossing the page, which is the whole
       difference between an object in the room and an object the light finds.
       ========================================================= */
    /* Quintic at both ends: the object has to emerge from the depth and be lost
       to it again without a frame where it can be said to have appeared. This is
       now the only distance falloff on the page, and it is the better of the two
       that used to exist — per object rather than per scene. */
    const spanFade = (d, dIn, dHold, dOut, dGone) =>
      (1 - smootherstep(dHold, dIn, d)) * smootherstep(dGone, dOut, d);

    const spans = [];

    /* FOURPOINT-C — the registration mark, larger than the viewport. Sits at
       z -184, which the dolly reaches across the FAQ and the Quote. */
    {
      const fp = new THREE.LineSegments(makeFourPoint(13), lineMaterial(PALETTE.navy.getHex(), 0.18));
      fp.position.set(5.5, 0.5, -184);
      geometryGroup.add(fp);
      const dia = new THREE.LineLoop(makeDiamond(13), lineMaterial(PALETTE.navy.getHex(), 0.14));
      dia.position.copy(fp.position);
      geometryGroup.add(dia);
      [[0, 13], [0, -13], [-13, 0], [13, 0]].forEach(([dx, dy]) => {
        const m = makeMarker(PALETTE.petrol.getHex(), 0.5);
        m.position.set(5.5 + dx, 0.5 + dy, -184);
        geometryGroup.add(m);
        spans.push({ obj: m, base: 0.5, dIn: 58, dHold: 34, dOut: 12, dGone: 3, lit: 0.5 });
      });
      spans.push({ obj: fp, base: 0.18, dIn: 66, dHold: 40, dOut: 12, dGone: 3, lit: 0.6 });
      spans.push({ obj: dia, base: 0.14, dIn: 66, dHold: 40, dOut: 12, dGone: 3, lit: 0.6 });
    }

    const spanColor = new THREE.Color();
    /* what the structure is before any light reaches it */
    const SPAN_UNLIT = PALETTE.navy;

    function updateSpans(camZ, litColor) {
      spans.forEach((s) => {
        const d = camZ - s.obj.position.z;
        s.obj.material.opacity = s.base * spanFade(d, s.dIn, s.dHold, s.dOut, s.dGone);
        s.obj.visible = s.obj.material.opacity > 0.002;
        /* only while it is on screen — tinting an invisible object is a colour
           conversion per frame for nobody */
        if (s.obj.visible && s.lit) {
          spanColor.copy(SPAN_UNLIT).lerp(litColor, s.lit);
          s.obj.material.color.copy(spanColor);
        }
      });
    }

    /* =========================================================
       THE RAIL — two readings of the same anchors
       ---------------------------------------------------------
       The rail used to be one function: anchors, then the seam easing, then the
       result fed to everything at once. That conflated two different jobs.

       railLinear() is where the page *is* on the rail. It is strictly
       proportional to the scroll between two anchors, so the dolly crosses the
       depth of the scene at an even pace and an object placed at a fixed z is
       approached at a readable speed. Nothing about it stalls.

       railEase() is where the *atmosphere* is. It applies the authored seam
       window — the cinematic decision about which part of a chapter's travel
       carries the handover — with a quintic ramp, and it deliberately holds at
       both ends: a chapter the scroll has settled on gets a composition that has
       finished arriving, not one frozen halfway through a crossing.

       Each atmospheric channel reads railEase() through its own window, offset
       by a few percent, which is what puts the light, the fog and the geometry
       on different clocks across the same boundary.
       ========================================================= */
    let railDocH = -1;

    /* the hold. However narrow an authored seam is, a settled chapter keeps a
       band at each end where the atmosphere is not moving at all. */
    const RAIL_HOLD_IN = 0.07;
    const RAIL_HOLD_OUT = 0.07;
    const RAIL_MIN_WINDOW = 0.08;

    /* How far ahead of the ground each channel runs, in units of the interval,
       per kind of crossing. Ground colour is document-space and cannot be led or
       lagged — it is the fixed reference all three of these are measured against.

       dark -> light : the light enters first, the finish follows behind it, the
                       structure crosses last. Reads as illumination arriving.
       light -> dark : the surface changes first, the light answers, the
                       structure crosses last. Reads as the material turning
                       before the lamp does.
       same polarity : almost nothing. Paper, Ivory and Sand are three
                       temperatures of one material, not three backgrounds. */
    const CHANNEL_LEAD = {
      toLight: { light: 0.09, surface: 0.03, depth: -0.06, widen: 0.05 },
      toDark: { light: 0.02, surface: 0.09, depth: -0.06, widen: 0.05 },
      level: { light: 0.03, surface: 0, depth: -0.03, widen: 0 }
    };

    const railScratch = new THREE.Color();

    function stationWindow(seam, lead, widen) {
      let lo = seam[0] - lead - widen;
      let hi = seam[1] - lead + widen;
      lo = Math.max(RAIL_HOLD_IN, Math.min(lo, 1 - RAIL_HOLD_OUT - RAIL_MIN_WINDOW));
      hi = Math.min(1 - RAIL_HOLD_OUT, Math.max(hi, lo + RAIL_MIN_WINDOW));
      return [lo, hi];
    }

    function measureRail() {
      const viewH = window.innerHeight || 800;
      let last = -1;
      stations.forEach((st) => {
        const el = st.sel ? document.querySelector(st.sel) : null;
        let y = el ? docOffsetTop(el) + st.at * el.offsetHeight - viewH * 0.5 : last + viewH * 0.6;
        if (y <= last) y = last + 1;   /* the rail must stay strictly increasing */
        st.y = y;
        last = y;
      });

      /* The final anchor has to be somewhere the page can actually be scrolled
         to. The footer is shorter than the viewport, so its own midpoint sits
         past the last reachable scroll position — without this the closing
         atmosphere would be left permanently half-arrived. */
      const n = stations.length;
      if (n > 1) {
        const maxScroll = Math.max(0, (document.documentElement.scrollHeight || 0) - viewH);
        if (maxScroll > stations[n - 2].y) stations[n - 1].y = Math.min(stations[n - 1].y, maxScroll);
      }

      /* Polarity is not authored — it is read back off the ground field each
         station stands on, so the two systems can never disagree about what kind
         of crossing this is. Requires measureGroundField() to have run, which
         remeasureCanvas() and the boot sequence both guarantee.

         The windows are per boundary, so they are resolved once here rather than
         re-derived for three channels on every frame. */
      stations.forEach((st) => {
        sampleGroundField(st.y + viewH * 0.5, railScratch);
        st.lum = relLuminance(railScratch.r, railScratch.g, railScratch.b);
        st.dark = st.lum < 0.2;
      });

      stations.forEach((st, i) => {
        const next = stations[i + 1] || st;
        const kind = st.dark === next.dark ? "level" : (st.dark ? "toLight" : "toDark");
        const lead = CHANNEL_LEAD[kind];
        const seam = st.seam || [0.2, 0.8];
        st.kind = kind;
        st.win = {
          light: stationWindow(seam, lead.light, lead.widen),
          surface: stationWindow(seam, lead.surface, lead.widen),
          depth: stationWindow(seam, lead.depth, lead.widen)
        };
      });

      railDocH = document.documentElement.scrollHeight;
    }

    /* WHERE THE PAGE IS — no easing, no plateau, no lag */
    function railLinear(scrollPx) {
      const n = stations.length;
      if (scrollPx <= stations[0].y) return 0;
      if (scrollPx >= stations[n - 1].y) return n - 1;
      let i = 0;
      while (i < n - 2 && scrollPx >= stations[i + 1].y) i++;
      const span = stations[i + 1].y - stations[i].y;
      return i + (span > 0 ? (scrollPx - stations[i].y) / span : 0);
    }

    /* WHERE THE ATMOSPHERE IS — the authored window, quintic, held at both ends */
    function railEase(u, channel) {
      const n = stations.length;
      if (u <= 0) return 0;
      if (u >= n - 1) return n - 1;
      const i = Math.min(n - 2, Math.floor(u));
      const win = stations[i].win ? stations[i].win[channel] : [0.2, 0.8];
      return i + smootherstep(win[0], win[1], u - i);
    }

    /* the pair this channel is currently between, and how far across it is.
       Every channel resolves its own index, so a channel that is a few frames
       behind another is still continuous with itself at the boundary. */
    function blendAt(u) {
      const idx = Math.max(0, Math.min(stations.length - 2, Math.floor(u)));
      return { a: stations[idx], b: stations[idx + 1], t: clamp01(u - idx), idx };
    }

    measureRail();

    /* =========================================================
       THE SAMPLER — the shader, re-run on the CPU for a few points
       ---------------------------------------------------------
       Every term here mirrors a term in the fragment shader. When one changes
       the other has to change with it, or the page ends up measuring a light it
       is not standing in — and the adaptive ink would put mid-grey type on a
       mid-grey ground, which is the exact failure it exists to prevent.
       ========================================================= */
    /* The frame's own geometry. It does not depend on the scroll, only on the
       viewport, so it is cached rather than recomputed inside a function called
       two dozen times a frame.

       This used to also carry the half-extents of the backdrop plane and a
       tangent of the camera fov, because the old glow lived in the plane's uv
       space and the sampler had to reconstruct that mapping. The light is in
       frame space now, so the mapping is screenX/viewW — the sampler and the
       shader can no longer disagree about where a pixel is. */
    let viewHCache = window.innerHeight || 800;
    let viewWCache = window.innerWidth || 1200;

    function cacheViewMetrics() {
      viewHCache = window.innerHeight || 800;
      viewWCache = window.innerWidth || 1200;
    }
    cacheViewMetrics();

    /* The shader's elliptical Gaussian, term for term. `pos` is in frame space
       with y up, exactly as glowPos is authored; `fx`/`fy` are the fragment in
       the same space. The sign of (fragUV - pos) matters and is the same on both
       sides — get it backwards and the highlight is mirrored through the centre
       of the frame, which the eye would forgive and the ink would not. */
    function sheenAt(fx, fy, aspect, ca, sa, pos, wAcross, wAlong) {
      const dx = (fx - pos.x) * aspect;
      const dy = fy - pos.y;
      const across = -dx * sa + dy * ca;   /* dot(p, N), N = (-sin, cos) */
      const along = dx * ca + dy * sa;     /* dot(p, A), A = ( cos, sin) */
      return Math.exp(-(
        (across * across) / (wAcross * wAcross) +
        (along * along) / (wAlong * wAlong)
      ));
    }

    function sampleGround(screenY, screenX) {
      const u = backdropMat.uniforms;

      /* the shader's rake: which document pixel this column of the frame stands
         on. Unchanged — the ground field was always in frame terms. */
      const sx = clamp01(screenX / viewWCache);
      const docY = u.uScrollY.value + screenY + (sx - 0.5) * u.uGroundSkew.value;
      const base = sampleGroundField(docY, groundColorScratch);

      /* frame space, y up. screenY arrives measured from the top of the
         viewport, gl_FragCoord.y counts from the bottom: hence the 1 -. */
      const fx = sx;
      const fy = clamp01(1 - screenY / viewHCache);
      const aspect = viewWCache / viewHCache;
      const ca = Math.cos(u.uRakeAngle.value);
      const sa = Math.sin(u.uRakeAngle.value);

      const glowC = u.uGlowColor.value, g2C = u.uGlow2Color.value;
      const core = sheenAt(fx, fy, aspect, ca, sa, u.uGlowPos.value,
        u.uSheenAcross.value, u.uSheenAlong.value);
      const sheen = core * u.uGlowStrength.value;
      const sheen2 = sheenAt(fx, fy, aspect, ca, sa, u.uGlow2Pos.value,
        u.uSheen2Across.value, u.uSheen2Along.value) * u.uGlow2Strength.value;

      /* the flanks, mirrored. Note this uses the RAW channel dot product, not
         relLuminance — the shader has no linearisation and the two have to
         agree on the number, not on which one is more correct. */
      const lum = 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b;
      const carve = smoothstep(0.35, 0.85, lum);
      let deepen = 0;
      if (carve > 0) {
        const flank = sheenAt(fx, fy, aspect, ca, sa, u.uGlowPos.value,
          u.uSheenAcross.value * 2.6, u.uSheenAlong.value);
        deepen = 0.10 * carve * Math.max(0, flank - core);
      }

      /* THE TWO TERMS DELIBERATELY NOT MIRRORED, and why that is sound rather
         than an omission: the micro grain and the dither are both zero-mean by
         construction — (g - 0.5) and (d1 + d2 - 1) — and both are capped, the
         grain at 0.03 in colour units and the dither at one 8-bit step. Their
         expected contribution to luminance is zero, and neither has the
         amplitude to move a reading across the polarity threshold on its own.
         Anything added here that is NOT zero-mean must be mirrored. */
      return relLuminance(
        clamp01(base.r * (1 - deepen) + glowC.r * sheen + g2C.r * sheen2),
        clamp01(base.g * (1 - deepen) + glowC.g * sheen + g2C.g * sheen2),
        clamp01(base.b * (1 - deepen) + glowC.b * sheen + g2C.b * sheen2)
      );
    }

    /* =========================================================
       CANVAS -> CSS — the atmosphere the DOM inherits
       ---------------------------------------------------------
       The Standard section owns the full treatment: a terminator, a material,
       an incident light. The refined chapters need far less than that and must
       not imitate it. What they take is the reading itself — how light the
       ground is, which way the ink has to go, what colour the light is — so a
       hairline in the Before/After board and a label in the FAQ belong to the
       same lamp as the type two chapters above them.
       ========================================================= */
    const rootEl = document.documentElement;
    const canvasStore = { pol: 1 };
    let lastGlowHex = "";

    /* Now that the ground is locked to the raw scroll, a reader resting a finger
       on a trackpad can jitter a few pixels either side of the crossover and
       flip the ink back and forth. The old spatial smoothing hid that; nothing
       should hide it by being late, so the decision itself carries a band. It is
       narrow — a fifth of a stop — and it never delays the first flip, only the
       flip back. Reading is the one thing that does not get to wait. */
    const POL_TO_DARK = 0.185;
    const POL_TO_LIGHT = 0.215;
    const polarityOf = (previous, lum) => (lum < (previous ? POL_TO_LIGHT : POL_TO_DARK) ? 1 : 0);

    /* Blocks that sit directly on the canvas and have to answer to it locally.
       One centre sample describes the page, not a heading near the bottom of
       the frame during a crossing — and that heading is exactly where a section
       that paints no ground of its own can lose its reader. Same idea as the
       Standard's ink, reduced to the one reading these blocks need. */
    const inkTargets = [...document.querySelectorAll("[data-canvas-ink]")]
      .map((el) => ({ el, store: {}, mid: 0, cx: 0, on: false, pol: 0 }));

    function measureInkTargets() {
      inkTargets.forEach((t) => {
        t.mid = docOffsetTop(t.el) + t.el.offsetHeight / 2;
        t.cx = docOffsetLeft(t.el) + t.el.offsetWidth / 2;
      });
    }
    measureInkTargets();

    if ("IntersectionObserver" in window && inkTargets.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const t = inkTargets.find((x) => x.el === e.target);
          if (t) t.on = e.isIntersecting;
        });
      }, { rootMargin: "260px 0px" });
      inkTargets.forEach((t) => io.observe(t.el));
    } else {
      inkTargets.forEach((t) => { t.on = true; });
    }

    function publishAtmosphere() {
      const viewH = window.innerHeight || 800;
      const scrollY = window.scrollY || 0;

      const lum = sampleGround(viewH * 0.5, (window.innerWidth || 1200) * 0.5);
      canvasStore.pol = polarityOf(canvasStore.pol, lum);
      writeInkVar(rootEl, canvasStore, "--canvas-lum", lum, 0.015);
      writeInkVar(rootEl, canvasStore, "--canvas-pol", canvasStore.pol, 0.5);

      inkTargets.forEach((t) => {
        if (!t.on) return;
        const L = sampleGround(t.mid - scrollY, t.cx);
        t.pol = polarityOf(t.pol, L);
        writeInkVar(t.el, t.store, "--canvas-lum", L, 0.015);
        writeInkVar(t.el, t.store, "--canvas-pol", t.pol, 0.5);
      });

      const gh = "#" + backdropMat.uniforms.uGlowColor.value.getHexString();
      if (gh !== lastGlowHex) {
        lastGlowHex = gh;
        rootEl.style.setProperty("--canvas-glow", gh);
      }
    }

    let grainDark = false;

    function publishGrain(dark) {
      /* a blend mode cannot interpolate, so it is switched at the one moment
         the grain is thinnest -- where the eye is least able to catch it. The
         band around the switch keeps a reading that hovers on the threshold
         from toggling the mode back and forth inside that dip. */
      const dip = 1 - 0.6 * Math.exp(-Math.pow((dark - 0.5) * 4.5, 2));
      /* One step down from the .035–.075 this used to run at. Two of the three
         jobs this layer was doing have moved into the shader, where they belong:
         the ground is dithered at the source now, so the grain no longer has to
         hide the banding between two navies, and the surface carries its own
         directional marks inside the raking light. What is left for this layer
         is the one thing it is actually good at — a fine, even film over the
         whole frame, DOM included, which the canvas cannot reach. Any heavier
         and the uniform grain and the directional grain sum into mush. */
      writeInkVar(rootEl, canvasStore, "--grain-o", (0.024 + 0.030 * dark) * dip, 0.004);
      grainDark = grainDark ? dark > 0.44 : dark > 0.56;
      if (grainEl) grainEl.classList.toggle("dark-grain", grainDark);
    }

    const labelEl = document.getElementById("surfaceLabel");
    const grainEl = document.getElementById("grainOverlay");

    /* =========================================================
       ADAPTIVE EDITORIAL INK — the Standard section
       ---------------------------------------------------------
       That section paints no ground of its own: its type sits straight on this
       canvas. The ground is now sampled in document space, so the heading and
       pillar 04 can be standing on different chapter surfaces in the same
       frame. One averaged luminance describes none of that. Each text block
       samples the light painted at its own screen position and answers locally,
       while the section keeps a single shared light column and a single
       temperature, so the four paragraphs never read as four presets.
       ========================================================= */
    const standardSection = document.querySelector(".standard");
    const pillarsEl = standardSection && standardSection.querySelector(".pillars");
    const inkBlocks = [];
    const inkStore = {};

    /* Where the ground crosses this, dark ink and light ink are equally legible
       (about 4.1:1 each) -- and equally near their limit. So the ink never
       blends across it: the
       change travels as a terminator, a line of light moving over the surface,
       and every pixel stays fully one ink or fully the other. A dissolve would
       put mid-grey type on a mid-grey ground, which is the exact failure this
       section had. */
    const INK_FLIP = 0.20;
    const INK_L_DARK = 0.0113;   /* --navy-dark */
    const INK_L_LIGHT = 0.9770;  /* --paper */
    const INK_L_DARK_MAT = 0.045;  /* the same ink once the material is on it */
    const INK_L_LIGHT_MAT = 0.900;
    const ACCENT_L = 0.4559;       /* --champagne */
    const ACCENT_BASE_CR = 1.85;   /* champagne on the approved ivory ground */

    let inkOnScreen = !("IntersectionObserver" in window);
    let inkTemp = 0.5;
    let inkSectionTop = 0;
    let inkSectionH = 1;
    let inkLastTravel = null;
    let inkLastFront = null;
    let inkLastDocH = -1;
    let inkCRTarget = 5.2;

    if (standardSection) {
      /* the section itself is sampled too: the watermark and the top rule sit
         outside the head and the pillars, and still belong to the same light */
      inkBlocks.push({ el: standardSection, copy: null, mid: 0, cx: 0, last: inkStore, pol: 1 });
      const head = standardSection.querySelector(".standard-head");
      if (head) inkBlocks.push({ el: head, copy: null, mid: 0, cx: 0, last: {}, pol: 1 });
      standardSection.querySelectorAll(".pillar").forEach((el) => {
        inkBlocks.push({ el, copy: el.querySelector(".pillar-copy"), mid: 0, cx: 0, last: {}, pol: 1 });
      });
    }

    /* every element painted through the shared field, and its own offset in it */
    const inkPainted = standardSection
      ? [...standardSection.querySelectorAll(".standard-head h2, .pillar-title, .pillar-copy")]
      : [];

    /* Writes are quantised: the smoothness comes from transitions on registered
       custom properties, not from repainting the section every frame. */
    function writeInkVar(el, store, name, value, epsilon) {
      const prev = store[name];
      if (prev !== undefined && Math.abs(prev - value) < epsilon) return;
      store[name] = value;
      el.style.setProperty(name, value.toFixed(3));
    }

    /* geometry is read on layout changes only, never per frame */
    function measureInk() {
      inkLastDocH = document.documentElement.scrollHeight;
      if (!inkBlocks.length) return;

      inkCRTarget = window.matchMedia("(max-width:767px)").matches ? 6 : 5.2;
      inkSectionTop = docOffsetTop(standardSection);
      inkSectionH = Math.max(1, standardSection.offsetHeight);

      inkBlocks.forEach((b) => {
        b.mid = docOffsetTop(b.el) + b.el.offsetHeight / 2;
        b.cx = docOffsetLeft(b.el) + b.el.offsetWidth / 2;
      });

      /* One surface, several windows: the field is the whole section, and each
         block carries its own offset into it. The terminator, the atmosphere
         and the incident light are therefore the same event everywhere -- not
         four gradients that happen to look alike. */
      standardSection.style.setProperty("--field-h", inkSectionH + "px");
      inkPainted.forEach((el) => {
        el.style.setProperty("--field-y", -Math.round(docOffsetTop(el) - inkSectionTop) + "px");
      });
    }

    /* Temperature runs on the longest clock in the file and is written in coarse
       steps, so it can still be drifting when everything else has arrived. The
       rest metric has to know about it, or the loop goes to sleep holding the
       ink at a temperature it was only passing through. */
    let inkTempRest = 0;

    function updateStandardInk(dt) {
      if (!inkBlocks.length || !inkOnScreen) { inkTempRest = 0; return; }

      const viewH = window.innerHeight || 800;
      const scrollY = window.scrollY || 0;

      const groundAt = sampleGround;
      const glowC = backdropMat.uniforms.uGlowColor.value;

      /* Temperature is the atmosphere's own warmth, and it lags well behind the
         tone. Tone has to move; temperature keeps drifting long after it
         settled, and that lag is what reads as light moving over the page
         rather than a script repainting the text. */
      const warmth = clamp01(0.5 + (glowC.r - glowC.b) * 1.6);
      inkTemp = dampTo(inkTemp, warmth, isReduced ? 0 : 1.2, dt);
      /* THE TAIL THAT KEPT THE PAGE AWAKE. dampTo closes a fraction of the gap
         per second and never actually arrives, and this residue is weighted 25x
         in the rest sum — so a settled page went on redrawing for another ten
         seconds while a number crept towards a target it could not reach.

         0.02 is not a tolerance picked to make the problem go away: it is the
         exact epsilon writeInkVar publishes this property at, one line below.
         Once the remaining gap is under it, no further frame can put a
         different value on the page, so the frame really is finished. The
         1.2s half-life above is untouched — how the temperature drifts is an
         authored decision; how long the renderer believes it is still moving
         was an accounting error. */
      if (Math.abs(warmth - inkTemp) < 0.02) inkTemp = warmth;
      inkTempRest = Math.abs(warmth - inkTemp);
      writeInkVar(standardSection, inkStore, "--ink-temp", inkTemp, 0.02);

      /* walk the light down the screen and find where it crosses the flip */
      const cx = inkBlocks[0].cx;
      const STEPS = 18;
      const polOf = (L) => (L < INK_FLIP ? 1 : 0);
      let prevY = 0;
      let prevL = groundAt(0, cx);
      const polTop = polOf(prevL);
      let polBottom = polTop;
      let front = null;
      let nearest = Infinity;

      for (let i = 1; i <= STEPS; i++) {
        const y = (viewH * i) / STEPS;
        const L = groundAt(y, cx);
        if (polOf(L) !== polOf(prevL)) {
          const cy = prevY + (y - prevY) * ((INK_FLIP - prevL) / (L - prevL));
          const d = Math.abs(cy - viewH * 0.5);
          if (d < nearest) { nearest = d; front = cy; }
        }
        polBottom = polOf(L);
        prevY = y;
        prevL = L;
      }

      writeInkVar(standardSection, inkStore, "--pol-t", polTop, 0.5);
      writeInkVar(standardSection, inkStore, "--pol-b", polBottom, 0.5);

      /* the terminator lives in the field's own coordinates, so the four
         paragraphs and the two headings all report the same line of light */
      const frontField = front === null
        ? (polTop ? -9999 : inkSectionH + 9999)
        : front + scrollY - inkSectionTop;
      if (inkLastFront === null || Math.abs(frontField - inkLastFront) >= 2) {
        inkLastFront = frontField;
        standardSection.style.setProperty("--ink-front", Math.round(frontField) + "px");
      }

      inkBlocks.forEach((b) => {
        const y = b.mid - scrollY;
        const L = groundAt(y, b.cx);

        /* continuous, for the hairlines and the halo's own colour */
        writeInkVar(b.el, b.last, "--ink-mix", 1 - smoothstep(0.13, 0.28, L), 0.02);
        /* snapped, for the two accents that cannot be painted through the field
           (their rules and ticks are drawn in currentColor). Banded, because a
           block resting exactly on the crossover must not strobe. */
        b.pol = polarityOf(b.pol, L);
        writeInkVar(b.el, b.last, "--ink-pol", b.pol, 0.5);

        /* The envelope answers the contrast the block actually has while wearing
           everything it is wearing -- the atmosphere and the incident light lift
           a dark ink several times in luminance, so measuring the bare colour
           would report a comfort the reader never gets. One refinement step:
           the envelope retracts the material, which in turn raises the ink. */
        /* the envelope has to answer for the ink that is actually on the page,
           which is the banded reading, not the bare threshold */
        const pol = b.pol;
        const inkPure = pol ? INK_L_LIGHT : INK_L_DARK;
        const inkFull = pol ? INK_L_LIGHT_MAT : INK_L_DARK_MAT;
        const first = clamp01((inkCRTarget - contrastRatio(inkFull, L)) / 2.6);
        const inkEff = inkPure + (inkFull - inkPure) * (1 - first);
        writeInkVar(b.el, b.last, "--envelope", clamp01((inkCRTarget - contrastRatio(inkEff, L)) / 2.6), 0.02);

        /* how far the champagne numeral has to be pushed out of the ground's
           own luminance, and in which direction. Zero wherever it can stay. */
        if (b.copy) {
          const accentCR = contrastRatio(ACCENT_L, L);
          /* champagne on the approved ivory ground already reads at 1.85:1 --
             that is the client's own baseline for this numeral, so the push
             only fires below it. On a lit ground it is exactly zero and the
             accent stays the approved colour. */
          const push = clamp01((ACCENT_BASE_CR - accentCR) / 0.35);
          const toShadow = contrastRatio(0.06, L) > contrastRatio(0.70, L);
          /* on a dark ground the numeral is lifted well past plain champagne --
             it is a register mark and it should carry, not merely survive */
          const lift = Math.max(toShadow ? 0 : push, pol * 0.62);
          writeInkVar(b.el, b.last, "--accent-dark", toShadow ? push : 0, 0.03);
          writeInkVar(b.el, b.last, "--accent-light", lift, 0.03);

          const off = (y - viewH * 0.42) / (viewH * 0.42);
          writeInkVar(b.el, b.last, "--focus", Math.exp(-off * off * 1.35), 0.03);
        }
      });

      if (isReduced) return;
      /* the incident light is fixed in the room, so scrolling walks it down the
         page: 01 -> 02 -> 03 -> 04, one event crossing four windows */
      const progress = clamp01((viewH - (inkSectionTop - scrollY)) / (viewH + inkSectionH));
      const travel = (progress - 0.5) * inkSectionH * 0.9;
      if (inkLastTravel === null || Math.abs(travel - inkLastTravel) >= 1) {
        inkLastTravel = travel;
        standardSection.style.setProperty("--light-travel", Math.round(travel) + "px");
      }
    }

    if (standardSection) {
      measureInk();
      window.addEventListener("load", measureInk);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureInk);
      if ("ResizeObserver" in window && pillarsEl) new ResizeObserver(measureInk).observe(pillarsEl);
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
          inkOnScreen = entries[0].isIntersecting;
          if (inkOnScreen) updateStandardInk(1 / 60);
        }, { rootMargin: "240px 0px" }).observe(standardSection);
      }
    }

    const glowMix = new THREE.Color();
    const skewScratch = new THREE.Color();

    /* =========================================================
       THE TWO CLOCKS
       ---------------------------------------------------------
       STRUCTURAL state is the raw scroll and everything measured from it. It is
       never damped, never eased and never a frame behind: the ground field, the
       document position the sampler reads, the dolly and the objects standing in
       the depth all belong to the page's real position. If the DOM has arrived,
       the space has arrived.

       ATMOSPHERIC state is three critically damped followers of that same
       scroll, running at different rates. Light is quick, the surface sits
       behind it, depth trails both. None of them decides where anything *is* —
       they decide what the light and the material are doing, which is the one
       thing allowed to have inertia.

       The middle channel used to drive the fog. Fog is gone, but the channel
       stayed, because what replaced it wants exactly that rate: the finish of
       the surface. A floor does not change state as fast as the light moving
       over it, and it does not lag as far behind as the structures in the
       depth. Same clock, honest new job.

       The result is the separation the whole refactor exists for: the space does
       not lag, and the light can breathe.
       ========================================================= */
    let camRail = railLinear(window.scrollY || 0);
    const atmLight = { x: window.scrollY || 0, v: 0, omega: isReduced ? 0 : 16 };
    const atmSurface = { x: window.scrollY || 0, v: 0, omega: isReduced ? 0 : 10 };
    const atmDepth = { x: window.scrollY || 0, v: 0, omega: isReduced ? 0 : 6.5 };

    /* ---------- THE FINISH ----------
       Matte at the top of the page, polished from the Before/After board down.
       The ramp is placed on the rail, not on a clock: 3.4 is the tail of the
       Maintenance chapter and 6 is the Before/After station, so the surface is
       worked during the two Floor Care stations — the chapter that is about
       exactly this — and is never worked again. A restored floor stays restored.

       WORN and POLISHED are Ward's alphaX/alphaY at the two ends. At WORN the
       ratio is near 1:1, which is a round highlight: deliberately close to the
       radial glow this canvas shipped with, so the hero the client approved is
       still the hero, and the new behaviour is earned rather than announced. */
    const FINISH_FROM = 3.4;
    const FINISH_TO = 6.0;
    const SHEEN_ACROSS_WORN = 0.42, SHEEN_ACROSS_POLISHED = 0.060;
    const SHEEN_ALONG_WORN = 0.46, SHEEN_ALONG_POLISHED = 0.660;
    const MICRO_WORN = 0.030, MICRO_POLISHED = 0.006;
    /* the memory is always the broader, softer of the two */
    const MEMORY_ACROSS_K = 1.5, MEMORY_ALONG_K = 1.2;
    /* a grazing angle. Forty-five degrees is the diamond's own diagonal and
       reads as a decorative stripe; this reads as light on a floor. */
    const RAKE_REST = -0.32;
    const RAKE_SKEW_K = 0.12;
    /* the peak the highlight may not exceed once it has collapsed into a band */
    const SHEEN_CEILING = 0.58;

    let scrollVel = 0;
    let lastScrollPx = window.scrollY || 0;

    /* Light mixed in the working space desaturates through the middle of a
       crossing: petrol to champagne passes through something closer to mud than
       to either. This restores the chroma the midpoint loses, around the mix's
       own luminance so the approved brightness is untouched, and it is exactly
       zero at both ends — the two authored colours are never altered. */
    function mixGlow(from, to, t, out) {
      out.copy(from).lerp(to, t);
      const k = 0.72 * t * (1 - t);
      if (k <= 0.0001) return out;
      const l = 0.2126 * out.r + 0.7152 * out.g + 0.0722 * out.b;
      out.r = clamp01(out.r + (out.r - l) * k);
      out.g = clamp01(out.g + (out.g - l) * k);
      out.b = clamp01(out.b + (out.b - l) * k);
      return out;
    }

    /* How much the ground is actually changing across the height of the frame
       right now, read off the field itself rather than inferred from the rail.
       Near zero on a settled chapter, near one across a dark/light handover. */
    function groundEnergy(scrollPx, viewH) {
      sampleGroundField(scrollPx, skewScratch);
      const top = relLuminance(skewScratch.r, skewScratch.g, skewScratch.b);
      sampleGroundField(scrollPx + viewH, skewScratch);
      const bottom = relLuminance(skewScratch.r, skewScratch.g, skewScratch.b);
      return clamp01(Math.abs(top - bottom) * 3);
    }

    /* Reading scrollHeight forces the browser to flush the style and layout the
       previous frame just dirtied with several dozen custom properties. Doing it
       twice a frame bought nothing the ResizeObservers on body, #main and the
       closing scene were not already reporting, so this is a slow safety net
       rather than a per-frame poll. */
    const DOC_POLL_MS = 260;
    let lastDocPoll = 0;

    function pollDocumentHeight(now) {
      if (now - lastDocPoll < DOC_POLL_MS) return false;
      lastDocPoll = now;
      const currentDocH = document.documentElement.scrollHeight;
      let changed = false;
      if (currentDocH !== railDocH || currentDocH !== groundDocH) {
        remeasureCanvas();
        changed = true;
      }
      if (standardSection && currentDocH !== inkLastDocH) {
        measureInk();
        changed = true;
      }
      return changed;
    }

    function updateFromScroll(scrollPx, dt, settle) {
      const viewH = viewHCache;
      const viewW = viewWCache;

      /* ---------- STRUCTURAL ---------- */
      backdropMat.uniforms.uScrollY.value = scrollPx;
      uploadGroundWindow(scrollPx, viewH);

      const structRail = railLinear(scrollPx);
      /* the only damping on the structural side, and it is not lag: a hair of
         rounding on the corner where two intervals of different length meet, so
         the dolly changes pace without a step. Far too short to read as delay. */
      camRail = settle ? structRail : dampTo(camRail, structRail, isReduced ? 0 : 0.055, dt);
      camera.position.z = 20 - camRail * RAIL_STEP;
      backdrop.position.z = camera.position.z - 30;

      /* ---------- ATMOSPHERIC ---------- */
      if (settle) {
        atmLight.x = atmSurface.x = atmDepth.x = scrollPx;
        atmLight.v = atmSurface.v = atmDepth.v = 0;
      } else {
        springStep(atmLight, scrollPx, dt);
        springStep(atmSurface, scrollPx, dt);
        springStep(atmDepth, scrollPx, dt);
      }

      /* velocity is enrichment only: it never reaches the ground, the rail or
         uScrollY, and it is damped so a flick does not read as an event */
      const previousScroll = lastScrollPx;
      const instant = dt > 0 ? Math.abs(scrollPx - previousScroll) / dt : 0;
      lastScrollPx = scrollPx;
      scrollVel = settle ? 0 : dampTo(scrollVel, instant, isReduced ? 0 : 0.3, dt);
      const speedK = clamp01(scrollVel / 2600);

      const L = blendAt(railEase(railLinear(atmLight.x), "light"));
      const surfaceRail = railEase(railLinear(atmSurface.x), "surface");
      const depthRail = railEase(railLinear(atmDepth.x), "depth");

      /* ---------- THE SURFACE ----------
         Resolved before the light, because the light's own ceiling depends on
         how concentrated the highlight is about to be. */
      const finish = isReduced ? 1 : smootherstep(FINISH_FROM, FINISH_TO, surfaceRail);

      const sheenAcross = THREE.MathUtils.lerp(SHEEN_ACROSS_WORN, SHEEN_ACROSS_POLISHED, finish);
      const sheenAlong = THREE.MathUtils.lerp(SHEEN_ALONG_WORN, SHEEN_ALONG_POLISHED, finish);
      backdropMat.uniforms.uSheenAcross.value = sheenAcross;
      backdropMat.uniforms.uSheenAlong.value = sheenAlong;
      backdropMat.uniforms.uSheen2Across.value = sheenAcross * MEMORY_ACROSS_K;
      backdropMat.uniforms.uSheen2Along.value = sheenAlong * MEMORY_ALONG_K;
      backdropMat.uniforms.uMicro.value = (isMobile || isReduced)
        ? 0
        : THREE.MathUtils.lerp(MICRO_WORN, MICRO_POLISHED, finish);

      const a = L.a, b = L.b, t = L.t;
      const crossing = Math.sin(Math.PI * t);   /* 0 held, 1 mid-handover */

      /* ---------- THE RAKE ----------
         Resolved before the light, because the light is now organised around
         this axis and needs to know where it lies.

         The field is document-space, so the bottom of the frame already stands
         on the arriving chapter while the top still holds the last one. This
         tilts that line: the handover crosses the viewport diagonally instead of
         the whole frame turning over at once. Its amplitude is the ground's own
         energy — full across a dark/light handover, a fraction of the crossing
         on a same-polarity one — and it is damped to nothing on a held chapter,
         because a settled composition stands level. */
      const energy = isReduced ? 0 : Math.max(groundEnergy(scrollPx, viewH), 0.35 * crossing);
      const skewMax = Math.min(90, viewH * 0.09) * (1 + 0.25 * speedK);
      const skewTarget = energy * skewMax;
      const skewPrev = backdropMat.uniforms.uGroundSkew.value;
      const skew = settle || isReduced ? skewTarget : dampTo(skewPrev, skewTarget, 0.18, dt);
      backdropMat.uniforms.uGroundSkew.value = skew;

      /* The light lies down on the same slope the ground is arriving on, so a
         crossing has one horizon rather than two opinions about where it is. */
      const rakeAngle = RAKE_REST + RAKE_SKEW_K * clamp01(skew / 90);
      backdropMat.uniforms.uRakeAngle.value = rakeAngle;

      /* ---------- THE LIGHT ---------- */
      mixGlow(a.glow, b.glow, t, glowMix);
      backdropMat.uniforms.uGlowColor.value.copy(glowMix);

      /* THE CEILING. The authored strengths were set against a highlight the
         width of the frame. As the ellipse collapses towards a band, the same
         number is spread over a fraction of the area and the peak climbs with
         it — which is how a chapter that reads its own ink off this canvas ends
         up with its ground pushed across the polarity threshold while the type
         is still on screen. The taper holds the highlight's *energy* roughly
         constant instead of its amplitude, and the clamp is the hard stop. */
      backdropMat.uniforms.uGlowStrength.value = Math.min(
        THREE.MathUtils.lerp(a.glowStrength, b.glowStrength, t) * (1 - 0.28 * finish),
        SHEEN_CEILING
      );

      /* A straight line between two authored positions reads as a value being
         interpolated. The light travels on an arc instead — a perpendicular
         bow that is zero at both anchors, alternating side by station so no two
         consecutive crossings sweep the same way — plus a slow lateral drift
         driven by the rail, which means it keeps easing while the snap settles
         and then stops, rather than idling on a clock forever. */
      const ax = a.glowPos[0], ay = a.glowPos[1];
      const bx = b.glowPos[0], by = b.glowPos[1];
      const arc = isReduced ? 0 : crossing * 0.17 * (L.idx % 2 ? -1 : 1);
      const rail = L.idx + t;
      const drift = isReduced ? 0 : 1;
      backdropMat.uniforms.uGlowPos.value.set(
        ax + (bx - ax) * t - (by - ay) * arc + Math.sin(rail * 0.83) * 0.018 * drift,
        ay + (by - ay) * t + (bx - ax) * arc + Math.cos(rail * 0.61) * 0.014 * drift
      );
      /* ATMOSPHERIC MEMORY — the light the page is leaving does not switch off
         at the boundary, and it does not switch on either. It is already there,
         it takes the first fifth of the crossing to reach full weight, and then
         it spends the whole remainder losing intensity and opening outwards
         until there is nothing left to dissolve. Fast scrolling lets the tail
         run a little longer; stopping brings it home.

         The ceiling depends on where the page is going, not where it came from:
         a champagne memory at full strength over Paper is chromatic pollution,
         and over a dark ground it is a hole. */
      const memRise = smootherstep(0, 0.2, t);
      const memFall = 1 - smootherstep(0.24, 1 + 0.25 * speedK, t);
      backdropMat.uniforms.uGlow2Color.value.copy(a.glow);
      /* It retreats ALONG the rake rather than swelling away from the centre of
         the frame. A band that slides back down its own axis has a direction and
         reads as the light having moved on; a blob that inflates has none. */
      backdropMat.uniforms.uGlow2Pos.value.set(
        ax - Math.cos(rakeAngle) * 0.16 * t,
        ay - Math.sin(rakeAngle) * 0.16 * t
      );
      backdropMat.uniforms.uGlow2Strength.value =
        a.glowStrength * (b.dark ? 0.46 : 0.34) * memRise * memFall;

      /* every uniform for this frame is now set: the ink can read the light */
      if (standardSection) updateStandardInk(dt);

      /* The structure takes the colour of the light that is currently crossing
         the page. It is read after the light has been resolved for this frame,
         so the mark and the highlight can never disagree about what colour the
         lamp is. */
      updateSpans(camera.position.z, backdropMat.uniforms.uGlowColor.value);

      const centerLum = sampleGround(viewH * 0.5, viewW * 0.5);
      const dark = 1 - smoothstep(0.16, 0.32, centerLum);
      if (labelEl) {
        const S = blendAt(structRail);
        labelEl.textContent = S.t < 0.5 ? S.a.label : S.b.label;
        labelEl.style.color = dark > 0.5 ? "#F5EFEB" : "#102A43";
      }
      publishGrain(dark);
      publishAtmosphere();

      if (!isReduced) {
        /* the slowest channel: the structures keep settling for a moment after
           the scroll has stopped, which is what makes them read as mass */
        geometryGroup.position.x = Math.sin(depthRail * 0.6) * 0.4;
        geometryGroup.position.y = Math.cos(depthRail * 0.5) * 0.25;
      }

      /* HOW FAR THIS FRAME IS FROM STANDING STILL.
         Everything that can still be moving, in the units it moves in: document
         pixels for the scroll and the three channels, world units for the dolly,
         document pixels again for the rake. When the sum is below a pixel the
         next frame would be a copy of this one, and drawing it again is work
         nobody sees.

         The finish, the two half-widths and the rake angle are all pure
         functions of atmSurface.x and the rake, both of which are already
         accounted for below — none of them is on a clock, so none of them can
         keep the page awake on its own. That is deliberate: a fixed full-screen
         WebGL layer that never sleeps costs a frame forever. */
      return Math.abs(scrollPx - previousScroll)
        + Math.abs(camRail - structRail) * RAIL_STEP
        + Math.abs(atmLight.x - scrollPx)
        + Math.abs(atmSurface.x - scrollPx)
        + Math.abs(atmDepth.x - scrollPx)
        + Math.abs(backdropMat.uniforms.uGroundSkew.value - skewTarget)
        + inkTempRest * 25;
    }

    /* =========================================================
       WAKING
       ---------------------------------------------------------
       Once the scroll has stopped and every damped value has arrived, each
       further frame is a copy of the one before it — the glow's drift is driven
       by the rail rather than by a clock, so a settled chapter really is still.
       The loop then stops computing and stops drawing until something says
       otherwise, which on a fixed full-screen WebGL layer is the difference
       between a chapter costing nothing to sit on and costing a full frame
       forever.

       Everything that can invalidate the frame calls wake(). The scroll listener
       is the important one, and it does exactly one thing: raise the flag. It
       reads nothing, cancels nothing and preventDefaults nothing — the frame
       still takes its position from window.scrollY, and the browser still owns
       the scroll entirely.
       ========================================================= */
    let awake = true;
    let framesAtRest = 0;

    function wake() {
      awake = true;
      framesAtRest = 0;
    }

    window.addEventListener("scroll", wake, { passive: true });

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      const pixelRatio = renderer.getPixelRatio();
      backdropMat.uniforms.uResolution.value.set(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
      backdropMat.uniforms.uViewportH.value = window.innerHeight || 800;
      cacheViewMetrics();
      remeasureCanvas();
      measureInk();
      wake();
    }

    function remeasureCanvas() {
      measureGroundField();
      measureRail();
      measureInkTargets();
      wake();
    }

    const requestCanvasMeasure = onScrollFrame(remeasureCanvas);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", requestCanvasMeasure);
    window.addEventListener("load", remeasureCanvas);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasureCanvas);
    if ("ResizeObserver" in window) {
      const measureObserver = new ResizeObserver(requestCanvasMeasure);
      [document.body, document.getElementById("main"), document.querySelector(".final-cta"), document.querySelector(".site-footer")]
        .filter(Boolean)
        .forEach((el) => measureObserver.observe(el));
    }

    /* A tab that has been in the background has not been rendering, so its
       atmosphere is stale by however long the reader was away. Converging it
       over a fifth of a second on return would be a visible sweep of light for
       no reason, so the first frame back is settled outright — the change
       happens in the frame the reader has not seen yet. */
    let resumed = false;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      resumed = true;
      wake();
    });

    let lastFrameT = performance.now();

    /* A frame this still is a frame already on screen. Two of them in a row,
       because the first one is what puts the settled state there. */
    const REST_EPSILON = 0.35;

    function animate(now) {
      requestAnimationFrame(animate);

      /* Real elapsed time, clamped. A frame hitch, a breakpoint or a devtools
         pause must not be handed to the integrators as a single enormous step —
         and the clamp is what keeps the page from lurching when it resumes.
         The clock keeps running through skipped frames, or the first frame back
         would arrive with a delta large enough to look like a resume. */
      const elapsed = (now - lastFrameT) / 1000;
      lastFrameT = now;

      if (pollDocumentHeight(now)) wake();
      if (!awake) return;

      const dt = elapsed > 0 ? Math.min(elapsed, 1 / 30) : 1 / 60;
      const settle = resumed || elapsed > 0.5;
      resumed = false;

      /* read at the top of the frame, before anything writes: this is the
         page's real position and nothing downstream of it is allowed to lag */
      const rest = updateFromScroll(window.scrollY || window.pageYOffset || 0, dt, settle);
      renderer.render(scene, camera);

      if (rest > REST_EPSILON) framesAtRest = 0;
      else if (++framesAtRest >= 2) awake = false;
    }

    updateFromScroll(window.scrollY || window.pageYOffset || 0, 1 / 60, true);
    requestAnimationFrame(animate);

    const loadingEl = document.getElementById("loading");
    if (loadingEl) {
      window.requestAnimationFrame(() => {
        loadingEl.classList.add("hidden");
      });
    }
  }

  function initApp() {
    initThreeBackground();
    initHeader();
    initScrollSpy();
    initSnapAnchors();
    initNavigation();
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
    const yearEl = document.querySelector("[data-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
