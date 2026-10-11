(function () {
  "use strict";
  const root = document.documentElement;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let moving = !preference.matches;
  const motion = document.querySelector(".motion-toggle");
  function applyMotion() {
    root.dataset.motion = moving ? "on" : "off";
    if (motion) {
      motion.textContent = moving ? "Pausar animación" : "Activar animación";
      motion.setAttribute("aria-pressed", String(!moving));
    }
  }
  applyMotion();
  if (motion) motion.addEventListener("click", () => { moving = !moving; applyMotion(); });
  preference.addEventListener("change", event => { moving = !event.matches; applyMotion(); });
  const bar = document.querySelector(".reading-progress");
  if (bar) {
    let scheduled = false;
    function update() {
      const distance = root.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 1})`;
      scheduled = false;
    }
    window.addEventListener("scroll", () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
    }, {passive:true});
    window.addEventListener("resize", update); update();
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("reveal-item"); observer.unobserve(entry.target); }
    }), {threshold:0.08});
    document.querySelectorAll(".card,.exercise,.code-example,.milestones li").forEach(el => observer.observe(el));
  }
  const bits = [0,0,0,0], edges = [[0,1],[1,2],[2,3],[3,0]];
  const controls = document.querySelectorAll("[data-qubit]");
  function drawGraph() {
    let total = 0;
    edges.forEach(([i,j], k) => {
      const cut = bits[i] !== bits[j]; total += Number(cut);
      const line = document.querySelector(`[data-edge="${k}"]`);
      if (line) line.classList.toggle("is-cut",cut);
    });
    controls.forEach(button => {
      const i = Number(button.dataset.qubit);
      button.setAttribute("aria-pressed",String(Boolean(bits[i])));
      button.textContent = `Qubit ${i}: ${bits[i]}`;
      const text = document.getElementById(`graph-label-${i}`);
      if (text) text.textContent = `${i} · ${bits[i]}`;
    });
    const out = document.getElementById("cut-score");
    if (out) out.textContent = `Corte: ${total} / 4 · bits: ${bits.slice().reverse().join("")}`;
  }
  controls.forEach(button => button.addEventListener("click", () => {
    const i = Number(button.dataset.qubit); bits[i] = 1 - bits[i]; drawGraph();
  }));
  drawGraph();
  const gammaInput = document.getElementById("angle-gamma");
  const betaInput = document.getElementById("angle-beta");
  function updateAngles() {
    if (!gammaInput || !betaInput) return;
    const gamma = Number(gammaInput.value), beta = Number(betaInput.value);
    const value = 2 + Math.sin(4 * beta) * Math.sin(2 * gamma);
    document.getElementById("gamma-value").textContent = gamma.toFixed(3);
    document.getElementById("beta-value").textContent = beta.toFixed(3);
    document.getElementById("angle-result").textContent = `Corte esperado: ${value.toFixed(4)} / 4`;
    document.querySelector(".angle-meter span").style.width = `${100 * value / 4}%`;
  }
  if (gammaInput && betaInput) {
    gammaInput.addEventListener("input",updateAngles);
    betaInput.addEventListener("input",updateAngles);
    updateAngles();
    document.getElementById("angle-optimum").addEventListener("click", () => {
      gammaInput.value = String(Math.PI / 4); betaInput.value = String(Math.PI / 8); updateAngles();
    });
  }
  document.querySelectorAll(".copy-code").forEach(button => button.addEventListener("click", async () => {
    const panel = button.closest(".code-example"), status = panel.querySelector(".code-status");
    try {
      await navigator.clipboard.writeText(panel.querySelectorAll("pre code")[1].textContent);
      status.textContent = "Código copiado.";
    } catch (_) { status.textContent = "Selecciona el código para copiarlo; el navegador no permitió usar el portapapeles."; }
  }));
  document.querySelectorAll(".exercise .answer-check").forEach(button => button.addEventListener("click", () => {
    const exercise = button.closest(".exercise"), input = exercise.querySelector("input");
    const value = Number(input.value.replace(",",".")), answer = Number(button.dataset.answer);
    const valid = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(input.value.trim()) && Number.isFinite(value);
    const correct = valid && Math.abs(value - answer) < 0.001;
    exercise.classList.toggle("is-correct",correct);
    const score = document.getElementById("quiz-score");
    if (score) score.textContent = `${document.querySelectorAll(".exercise.is-correct").length} / ${document.querySelectorAll(".exercise .answer-check").length} ejercicios comprobados correctamente. Progreso de esta sesión.`;
    exercise.querySelector(".feedback").textContent = !valid ? "Introduce un número." :
      correct ? "Correcto. Abre la solución para revisar el razonamiento." : "Revisa el cálculo y vuelve a intentarlo. La solución incluye una pista.";
  }));
  const run = document.querySelector(".run-example");
  if (run) run.addEventListener("click", () => {
    const out = document.getElementById("js-result");
    run.disabled = true; out.textContent = "Calculando la malla…";
    requestAnimationFrame(() => setTimeout(() => {
      try {
        const best = window.QAOAEjemplo.buscar();
        out.textContent = `Corte esperado: ${best.valor.toFixed(6)} · γ=${best.gamma.toFixed(4)} · β=${best.beta.toFixed(4)}. Búsqueda discreta; no es una garantía para otros grafos.`;
      } catch (_) { out.textContent = "No se pudo ejecutar el ejemplo. Recarga la página."; }
      finally { run.disabled = false; }
    },0));
  });
})();
