

(function () {
  "use strict";

  function renderMath() {
    if (typeof window.renderMathInElement !== "function") {

      document.querySelectorAll("body *").forEach((el) => {
        if (el.children.length === 0 && /\\\(|\\\)|\$\$/.test(el.textContent || "")) {
          el.classList.add("katex-error");
        }
      });
      console.warn(
        "[QAOA] KaTeX no disponible (CDN bloqueado o sin conexión). " +
        "Las fórmulas se muestran como texto plano."
      );
      return;
    }

    try {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],

        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
        throwOnError: false,
        errorColor: "#c0392b"
      });
    } catch (e) {
      console.warn("[QAOA] Error al renderizar KaTeX:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMath);
  } else {
    renderMath();
  }
})();