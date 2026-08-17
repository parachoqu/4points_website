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

      document.addEventListener("DOMContentLoaded", () => {
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
      });
    })();
