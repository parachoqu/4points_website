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

  /* ---------- floor care: the photograph drifts behind the copy ---------- */
  function initFloorParallax() {
    const section = document.querySelector(".floorcare");
    if (!section) return;

    const update = () => {
      if (reducedMotion.matches || window.innerWidth < 900) {
        section.style.setProperty("--parallax", "0px");
        return;
      }
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      section.style.setProperty("--parallax", (offset * 46).toFixed(1) + "px");
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

    const setPosition = (percent) => {
      const clamped = Math.max(0, Math.min(100, percent));
      after.style.clipPath = `inset(0 0 0 ${clamped}%)`;
      handle.style.left = clamped + "%";
      range.value = String(clamped);
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
      navy:         new THREE.Color(0x102A43),
      navyDark:     new THREE.Color(0x071B2E),
      navy2:        new THREE.Color(0x173B5A),
      petrolDeep:   new THREE.Color(0x12556B),
      petrol:       new THREE.Color(0x1F6F8B),
      petrolLight:  new THREE.Color(0x2A8EAA),
      sage:         new THREE.Color(0x8BAE8B),
      sageSoft:     new THREE.Color(0xDDE8D8),
      champagne:    new THREE.Color(0xC8A96A),
      champagneDeep:new THREE.Color(0xA9894C),
      paper:        new THREE.Color(0xFFFDF8),
      ivory:        new THREE.Color(0xF7F4EF),
      sand:         new THREE.Color(0xF5EFEB),
      graphite:     new THREE.Color(0x2B2F32)
    };

    const isMobile = window.matchMedia("(max-width:767px)").matches;
    const isReduced = reducedMotion.matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(PALETTE.navyDark.getHex(), 40, 220);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
    camera.position.set(0, 0, 20);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(6, 10, 14);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(PALETTE.champagne.getHex(), 0.8, 60);
    rimLight.position.set(-8, 4, 6);
    scene.add(rimLight);

    const backdropGeo = new THREE.PlaneGeometry(220, 40, 1, 1);
    const backdropMat = new THREE.ShaderMaterial({
      uniforms: {
        uColorTop: { value: new THREE.Color(PALETTE.navyDark) },
        uColorBottom: { value: new THREE.Color(PALETTE.navy2) },
        uGlowColor: { value: new THREE.Color(PALETTE.petrolLight) },
        uGlowPos: { value: new THREE.Vector2(0.8, 0.7) },
        uGlowStrength: { value: 0.5 },
        uGrainTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;
        uniform vec3 uGlowColor;
        uniform vec2 uGlowPos;
        uniform float uGlowStrength;
        uniform float uGrainTime;

        float hash(vec2 p){
          return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
        }

        void main(){
          vec3 base = mix(uColorBottom, uColorTop, vUv.y);
          float d = distance(vUv, uGlowPos);
          float glow = smoothstep(0.75, 0.0, d) * uGlowStrength;
          vec3 col = base + uGlowColor * glow;
          float g = (hash(vUv * 800.0 + uGrainTime) - 0.5) * 0.02;
          col += g;
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

    function makeRing(radius, segments) {
      const pts = [];
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0));
      }
      return new THREE.BufferGeometry().setFromPoints(pts);
    }

    function makeAxis(length) {
      const pts = [ new THREE.Vector3(-length, -length * 0.4, 0), new THREE.Vector3(length, length * 0.4, 0) ];
      return new THREE.BufferGeometry().setFromPoints(pts);
    }

    function makeGrid(w, h, divs) {
      const pts = [];
      const stepX = w / divs, stepY = h / divs;
      for (let i = 0; i <= divs; i++) {
        pts.push(new THREE.Vector3(-w / 2 + i * stepX, -h / 2, 0));
        pts.push(new THREE.Vector3(-w / 2 + i * stepX,  h / 2, 0));
      }
      for (let j = 0; j <= divs; j++) {
        pts.push(new THREE.Vector3(-w / 2, -h / 2 + j * stepY, 0));
        pts.push(new THREE.Vector3( w / 2, -h / 2 + j * stepY, 0));
      }
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

    const stations = [
      { // 01 — NAVY DARK OPEN
        top: PALETTE.navyDark, bottom: PALETTE.navy, glow: PALETTE.petrolLight,
        glowPos: [0.85, 0.85], glowStrength: 0.55, label: "01", labelDark: true,
        fog: [PALETTE.navyDark.getHex(), 30, 140],
        build: (g) => {
          const ring = new THREE.LineLoop(makeRing(9, 64), lineMaterial(PALETTE.sand.getHex(), 0.05));
          ring.position.set(9, 3, 0); g.add(ring);
          const axis = new THREE.Line(makeAxis(14), lineMaterial(PALETTE.sand.getHex(), 0.05));
          axis.position.set(-2, -2, 2); g.add(axis);
          const dia = new THREE.LineLoop(makeDiamond(3), lineMaterial(PALETTE.champagne.getHex(), 0.18));
          dia.position.set(-6, -3, 3); g.add(dia);
          dia.children = [];
          [new THREE.Vector3(-6, 0, 3), new THREE.Vector3(-2, -6, 3)].forEach(p => {
            const m = makeMarker(PALETTE.champagne.getHex(), 0.4); m.position.copy(p); g.add(m);
          });
        }
      },
      { // 02 — NAVY → IVORY
        top: PALETTE.navy2, bottom: PALETTE.ivory, glow: PALETTE.navy,
        glowPos: [0.2, 0.9], glowStrength: 0.35, label: "02", labelDark: false,
        fog: [PALETTE.ivory.getHex(), 60, 180],
        build: (g) => {
          const dia = new THREE.LineLoop(makeDiamond(7), lineMaterial(PALETTE.navy.getHex(), 0.05));
          dia.position.set(-4, 4, -2); dia.rotation.z = 0.15; g.add(dia);
          const mark = new THREE.Group();
          const l1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(0.5, 0, 0)]), lineMaterial(PALETTE.navy.getHex(), 0.12));
          const l2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.5, 0)]), lineMaterial(PALETTE.navy.getHex(), 0.12));
          mark.add(l1, l2); mark.position.set(7, -3, 2); g.add(mark);
        }
      },
      { // 03 — IVORY + CHAMPAGNE WARMTH
        top: PALETTE.ivory, bottom: PALETTE.ivory, glow: PALETTE.champagne,
        glowPos: [0.85, 0.65], glowStrength: 0.5, label: "03", labelDark: false,
        fog: [PALETTE.ivory.getHex(), 60, 180],
        build: (g) => {
          const arc = new THREE.Line(makeRing(11, 48), lineMaterial(PALETTE.champagneDeep.getHex(), 0.1));
          arc.position.set(9, -2, -3); g.add(arc);
          const m1 = makeMarker(PALETTE.champagne.getHex(), 0.45); m1.position.set(-5, -4, 3); g.add(m1);
          const m2 = makeMarker(PALETTE.champagne.getHex(), 0.35); m2.position.set(4, 3, 2); g.add(m2);
          const ring2 = new THREE.LineLoop(makeRing(4, 48), lineMaterial(PALETTE.sage.getHex(), 0.1));
          ring2.position.set(-8, -6, -2); g.add(ring2);
        }
      },
      { // 04 — PAPER + PETROL ATMOSPHERIC
        top: PALETTE.paper, bottom: PALETTE.paper, glow: PALETTE.petrol,
        glowPos: [0.9, 0.4], glowStrength: 0.45, label: "04", labelDark: false,
        fog: [PALETTE.paper.getHex(), 60, 180],
        build: (g) => {
          const axis = new THREE.Line(makeAxis(18), lineMaterial(PALETTE.petrolDeep.getHex(), 0.08));
          axis.position.set(2, 0, -2); axis.rotation.z = 0.3; g.add(axis);
          const dia = new THREE.LineLoop(makeDiamond(5), lineMaterial(PALETTE.petrol.getHex(), 0.1));
          dia.position.set(8, 2, 3); g.add(dia);
          const grid = new THREE.LineSegments(makeGrid(3, 3, 3), lineMaterial(PALETTE.graphite.getHex(), 0.05));
          grid.position.set(-8, -5, 2); g.add(grid);
        }
      },
      { // 05 — NAVY DEEP
        top: PALETTE.navy, bottom: PALETTE.navyDark, glow: PALETTE.petrolLight,
        glowPos: [0.15, 0.1], glowStrength: 0.55, label: "05", labelDark: true,
        fog: [PALETTE.navyDark.getHex(), 30, 140],
        build: (g) => {
          const fp = new THREE.LineSegments(makeFourPoint(4), lineMaterial(PALETTE.sand.getHex(), 0.12));
          fp.position.set(6, 3, -2); g.add(fp);
          [new THREE.Vector3(6, 7, -2), new THREE.Vector3(6, -1, -2), new THREE.Vector3(2, 3, -2), new THREE.Vector3(10, 3, -2)].forEach(p => {
            const m = makeMarker(PALETTE.champagne.getHex(), 0.4); m.position.copy(p); g.add(m);
          });
          const r1 = new THREE.LineLoop(makeRing(5, 48), lineMaterial(PALETTE.petrolLight.getHex(), 0.15));
          r1.position.set(-6, -6, 3); g.add(r1);
          const r2 = new THREE.LineLoop(makeRing(7, 48), lineMaterial(PALETTE.petrolLight.getHex(), 0.09));
          r2.position.set(-6, -6, 3); g.add(r2);
        }
      },
      { // 06 — IVORY RETURN
        top: PALETTE.ivory, bottom: PALETTE.sand, glow: PALETTE.petrol,
        glowPos: [0.8, 0.75], glowStrength: 0.3, label: "06", labelDark: false,
        fog: [PALETTE.ivory.getHex(), 60, 180],
        build: (g) => {
          const grid = new THREE.LineSegments(makeGrid(6, 4, 4), lineMaterial(PALETTE.navy.getHex(), 0.06));
          grid.position.set(8, 4, -2); g.add(grid);
          const mark = new THREE.Group();
          const l1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.6, 0, 0), new THREE.Vector3(0.6, 0, 0)]), lineMaterial(PALETTE.navy.getHex(), 0.15));
          const l2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.6, 0), new THREE.Vector3(0, 0.6, 0)]), lineMaterial(PALETTE.navy.getHex(), 0.15));
          mark.add(l1, l2); mark.position.set(-7, -4, 3); g.add(mark);
          const arc = new THREE.Line(makeRing(13, 48), lineMaterial(PALETTE.petrol.getHex(), 0.08));
          arc.position.set(-4, -9, -3); g.add(arc);
        }
      },
      { // 07 — IVORY → SAGE
        top: PALETTE.ivory, bottom: PALETTE.sageSoft, glow: PALETTE.sage,
        glowPos: [0.3, 0.15], glowStrength: 0.45, label: "07", labelDark: false,
        fog: [PALETTE.ivory.getHex(), 60, 180],
        build: (g) => {
          const m1 = makeMarker(PALETTE.sage.getHex(), 0.5); m1.position.set(-6, 5, 2); g.add(m1);
          const m2 = makeMarker(PALETTE.sage.getHex(), 0.35); m2.position.set(-3, 7, 1); g.add(m2);
          const arc = new THREE.Line(makeRing(10, 64), lineMaterial(PALETTE.sage.getHex(), 0.1));
          arc.position.set(6, -8, -2); g.add(arc);
        }
      },
      { // 08 — SAGE PRESENT + four-point navy
        top: PALETTE.sand, bottom: PALETTE.sand, glow: PALETTE.sage,
        glowPos: [0.2, 0.7], glowStrength: 0.4, label: "08", labelDark: false,
        fog: [PALETTE.sand.getHex(), 60, 180],
        build: (g) => {
          const fp = new THREE.LineSegments(makeFourPoint(6), lineMaterial(PALETTE.navy.getHex(), 0.07));
          fp.position.set(7, 1, -3); g.add(fp);
          const diag = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(2.8, 2.8, 0), new THREE.Vector3(-2.8, -2.8, 0),
            new THREE.Vector3(-2.8, 2.8, 0), new THREE.Vector3(2.8, -2.8, 0)
          ]), lineMaterial(PALETTE.navy.getHex(), 0.04));
          diag.position.copy(fp.position); g.add(diag);
          [[0, 6], [0, -6], [-6, 0], [6, 0]].forEach(([dx, dy]) => {
            const m = makeMarker(PALETTE.navy.getHex(), 0.16);
            m.position.set(7 + dx, 1 + dy, -3); g.add(m);
          });
        }
      },
      { // 09 — PAPER LUMINOUS, quiet
        top: PALETTE.paper, bottom: PALETTE.paper, glow: PALETTE.champagne,
        glowPos: [0.5, 0.4], glowStrength: 0.35, label: "09", labelDark: false,
        fog: [PALETTE.paper.getHex(), 80, 200],
        build: (g) => {
          const m1 = makeMarker(PALETTE.champagne.getHex(), 0.3); m1.position.set(0, 1, 0); g.add(m1);
        }
      },
      { // 10 — IVORY COOL → PETROL/NAVY FINAL
        top: PALETTE.sand, bottom: PALETTE.navyDark, glow: PALETTE.petrolLight,
        glowPos: [0.5, 0.05], glowStrength: 0.5, label: "10", labelDark: true,
        fog: [PALETTE.navyDark.getHex(), 30, 140],
        build: (g) => {
          const grid = new THREE.LineSegments(makeGrid(10, 6, 6), lineMaterial(PALETTE.sand.getHex(), 0.05));
          grid.position.set(-6, -3, -3); g.add(grid);
          const fp = new THREE.LineSegments(makeFourPoint(4.5), lineMaterial(PALETTE.champagne.getHex(), 0.16));
          fp.position.set(8, 2, 2); g.add(fp);
          [[0, 4.5], [0, -4.5], [-4.5, 0], [4.5, 0]].forEach(([dx, dy]) => {
            const m = makeMarker(PALETTE.champagne.getHex(), 0.4);
            m.position.set(8 + dx, 2 + dy, 2); g.add(m);
          });
          const r1 = new THREE.LineLoop(makeRing(6, 48), lineMaterial(PALETTE.petrolLight.getHex(), 0.16));
          r1.position.set(0, -8, -2); g.add(r1);
          const r2 = new THREE.LineLoop(makeRing(9, 48), lineMaterial(PALETTE.petrolLight.getHex(), 0.09));
          r2.position.set(0, -8, -2); g.add(r2);
        }
      }
    ];

    stations.forEach((st, i) => {
      const g = new THREE.Group();
      g.position.z = -i * RAIL_STEP;
      st.build(g);
      geometryGroup.add(g);
    });

    let targetScroll = window.scrollY || 0;
    let smoothScroll = targetScroll;

    function onScroll() {
      targetScroll = window.scrollY || window.pageYOffset || 0;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    const labelEl = document.getElementById("surfaceLabel");
    const grainEl = document.getElementById("grainOverlay");
    const standardSection = document.querySelector(".standard");

    function updateFromScroll(progressPx) {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const stationFloat = Math.max(0, Math.min(stations.length - 1, (progressPx / maxScroll) * (stations.length - 1)));
      const idx = Math.max(0, Math.min(stations.length - 1, Math.floor(stationFloat)));
      const t = THREE.MathUtils.clamp(stationFloat - idx, 0, 1);
      const nextIdx = Math.min(stations.length - 1, idx + 1);

      const a = stations[idx];
      const b = stations[nextIdx];

      camera.position.z = 20 - stationFloat * RAIL_STEP;
      backdrop.position.z = camera.position.z - 30;

      backdropMat.uniforms.uColorTop.value.copy(a.top).lerp(b.top, t);
      backdropMat.uniforms.uColorBottom.value.copy(a.bottom).lerp(b.bottom, t);

      // Auto-contrast for .pillar-copy gradient text (4 Pillars section): derive
      // relative luminance from the same top/bottom colors just painted to the
      // backdrop this frame, so the text tracks what's actually rendered behind it.
      // Runs unconditionally (not gated by isReduced) — this is contrast
      // correctness, not decorative motion.
      if (standardSection) {
        const topC = backdropMat.uniforms.uColorTop.value;
        const bottomC = backdropMat.uniforms.uColorBottom.value;
        const topLum = 0.2126 * topC.r + 0.7152 * topC.g + 0.0722 * topC.b;
        const bottomLum = 0.2126 * bottomC.r + 0.7152 * bottomC.g + 0.0722 * bottomC.b;
        const bgLuminance = topLum * 0.5 + bottomLum * 0.5; // 0 = dark, 1 = light
        standardSection.style.setProperty("--pillar-contrast-pos", ((1 - bgLuminance) * 100).toFixed(2) + "%");
      }

      backdropMat.uniforms.uGlowColor.value.copy(a.glow).lerp(b.glow, t);
      backdropMat.uniforms.uGlowStrength.value = THREE.MathUtils.lerp(a.glowStrength, b.glowStrength, t);
      backdropMat.uniforms.uGlowPos.value.set(
        THREE.MathUtils.lerp(a.glowPos[0], b.glowPos[0], t),
        THREE.MathUtils.lerp(a.glowPos[1], b.glowPos[1], t)
      );

      const fogColorA = new THREE.Color(a.fog[0]);
      const fogColorB = new THREE.Color(b.fog[0]);
      scene.fog.color.copy(fogColorA).lerp(fogColorB, t);
      scene.fog.near = THREE.MathUtils.lerp(a.fog[1], b.fog[1], t);
      scene.fog.far  = THREE.MathUtils.lerp(a.fog[2], b.fog[2], t);

      rimLight.color.copy(backdropMat.uniforms.uGlowColor.value);

      if (labelEl) {
        labelEl.textContent = t < 0.5 ? a.label : b.label;
        const isDark = t < 0.5 ? a.labelDark : b.labelDark;
        labelEl.style.color = isDark ? "#F5EFEB" : "#102A43";
      }
      if (grainEl) {
        const isDark = t < 0.5 ? a.labelDark : b.labelDark;
        grainEl.classList.toggle("dark-grain", isDark);
      }

      if (!isReduced) {
        geometryGroup.position.x = Math.sin(stationFloat * 0.6) * 0.4;
        geometryGroup.position.y = Math.cos(stationFloat * 0.5) * 0.25;
      }
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    let grainTime = 0;
    function animate() {
      requestAnimationFrame(animate);
      smoothScroll += (targetScroll - smoothScroll) * (isReduced ? 1 : 0.08);
      updateFromScroll(smoothScroll);
      grainTime += 0.0015;
      backdropMat.uniforms.uGrainTime.value = grainTime;
      renderer.render(scene, camera);
    }

    onScroll();
    updateFromScroll(targetScroll);
    animate();

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
