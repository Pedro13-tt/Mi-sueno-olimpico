(() => {
  "use strict";

  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = document.getElementById("intro");
  const yesBtn = document.getElementById("intro-yes");
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  /* ---------- Pantalla de entrada ---------- */
  function enterSite() {
    const r = yesBtn.getBoundingClientRect();
    intro.style.setProperty("--x", `${r.left + r.width / 2}px`);
    intro.style.setProperty("--y", `${r.top + r.height / 2}px`);

    body.classList.remove("is-locked");
    body.classList.add("is-ready");
    intro.classList.add("is-leaving");

    const finish = () => {
      intro.classList.add("is-gone");
      document.getElementById("main").focus({ preventScroll: true });
    };

    if (reduceMotion) finish();
    else intro.addEventListener("transitionend", finish, { once: true });
  }

  yesBtn.addEventListener("click", enterSite);
  yesBtn.focus({ preventScroll: true });

  /* ---------- Menú ---------- */
  const onScroll = () => nav.classList.toggle("is-compact", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });

  navLinks.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Enlace activo ---------- */
  const sections = document.querySelectorAll("main section[id]");
  const navAnchors = Array.from(navLinks.querySelectorAll("a"));
  if ("IntersectionObserver" in window) {
    const activeIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => activeIO.observe(s));
  }

  /* ---------- Revelados escalonados ---------- */
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  document.querySelectorAll(".facts__grid, .days, .gallery, .sponsors, .about__list, .section__head").forEach((group) => {
    group.querySelectorAll(".reveal").forEach((el, i) => el.style.setProperty("--delay", `${i * 90}ms`));
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Contadores ---------- */
  const counters = Array.from(document.querySelectorAll("[data-count]"));
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const pad = Number(el.dataset.pad || String(target).length);
    if (reduceMotion) {
      el.textContent = String(target).padStart(pad, "0");
      return;
    }
    const start = performance.now();
    const duration = 1500;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased)).padStart(pad, "0");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          countIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => countIO.observe(el));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Visor de fotos ---------- */
  const dialog = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCaption = document.getElementById("lb-caption");
  const buttons = Array.from(document.querySelectorAll("#gallery button"));

  const photos = buttons.map((b) => {
    const img = b.querySelector("img");
    const caption = b.querySelector(".gallery__caption");
    return {
      src: img.getAttribute("src"),
      alt: img.getAttribute("alt"),
      caption: caption ? caption.innerText.replace(/\n+/g, " · ") : "",
    };
  });

  let current = 0;

  function show(i) {
    current = (i + photos.length) % photos.length;
    const p = photos[current];
    lbImg.style.animation = "none";
    void lbImg.offsetWidth;
    lbImg.style.animation = "";
    lbImg.src = p.src;
    lbImg.alt = p.alt;
    lbCaption.textContent = p.caption;
  }

  function open(i) {
    show(i);
    dialog.showModal();
  }

  function close() {
    dialog.close();
  }

  buttons.forEach((b) => b.addEventListener("click", () => open(Number(b.dataset.index))));

  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-prev").addEventListener("click", () => show(current - 1));
  document.getElementById("lb-next").addEventListener("click", () => show(current + 1));

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target.classList.contains("lightbox__figure")) close();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  let startX = null;
  dialog.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
