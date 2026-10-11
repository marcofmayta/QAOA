

(function () {
  "use strict";

  const THEME_KEY = "qaoa-theme";
  const root = document.documentElement;
  const themeBtn = document.querySelector(".theme-toggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeBtn) {
      themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
      themeBtn.setAttribute(
        "aria-label",
        theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"
      );
    }
  }

  let savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (_) {}
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    });
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    mainNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  const tocEl = document.querySelector(".toc");
  const article = document.querySelector(".content article");
  if (tocEl && article) {
    const headings = article.querySelectorAll("h2[id], h3[id]");
    if (headings.length) {
      const ul = document.createElement("ul");
      headings.forEach((h) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        if (h.tagName === "H3") li.classList.add("lvl-3");
        li.appendChild(a);
        ul.appendChild(li);
      });
      tocEl.appendChild(ul);
    } else {
      tocEl.style.display = "none";
    }
  }

  const tocLinks = document.querySelectorAll(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    const targets = Array.from(tocLinks).map((a) =>
      document.getElementById(a.getAttribute("href").slice(1))
    );
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tocLinks.forEach((a) =>
              a.classList.toggle("active", a.getAttribute("href") === "#" + id)
            );
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    targets.forEach((t) => t && spy.observe(t));
  }

  const backBtn = document.querySelector(".back-to-top");
  if (backBtn) {
    const onScroll = () => {
      backBtn.classList.toggle("visible", window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    backBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  const faders = document.querySelectorAll(
    ".content article > section, .card, .interactive"
  );
  if ("IntersectionObserver" in window && faders.length) {
    faders.forEach((el) => el.classList.add("fade-in"));
    const fo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            fo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    faders.forEach((el) => fo.observe(el));
  }

  window.addEventListener("load", () => {
    if (window.Prism && typeof window.Prism.highlightAll === "function") {
      window.Prism.highlightAll();
    }
  });
})();
