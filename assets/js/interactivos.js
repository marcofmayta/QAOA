

(function () {
  "use strict";

  const EDGES = [[0,1],[1,2],[2,3],[3,0]];
  const N_QUBITS = 4;
  const DIM = 1 << N_QUBITS; // 16 amplitudes

  function cost(x) {
    let c = 0;
    for (let k = 0; k < EDGES.length; k++) {
      const i = EDGES[k][0], j = EDGES[k][1];
      const zi = ((x >> i) & 1) ? -1 : 1;
      const zj = ((x >> j) & 1) ? -1 : 1;
      c += 0.5 * (1 - zi * zj);
    }
    return c;
  }

  const COSTS = new Float64Array(DIM);
  for (let x = 0; x < DIM; x++) COSTS[x] = cost(x);

  function applyCost(re, im, gamma) {
    for (let x = 0; x < DIM; x++) {
      const c = COSTS[x];
      const cosg = Math.cos(gamma * c);
      const sing = Math.sin(gamma * c);
      const ar = re[x], ai = im[x];
      re[x] = cosg * ar + sing * ai;
      im[x] = -sing * ar + cosg * ai;
    }
  }

  function applyMixer(re, im, beta) {
    const cosb = Math.cos(beta);
    const sinb = Math.sin(beta);
    for (let q = 0; q < N_QUBITS; q++) {
      const mask = 1 << q;
      for (let x = 0; x < DIM; x++) {
        if (x & mask) continue;
        const x0 = x;
        const x1 = x | mask;
        const a0r = re[x0], a0i = im[x0];
        const a1r = re[x1], a1i = im[x1];

        re[x0] = cosb * a0r + sinb * a1i;
        im[x0] = cosb * a0i - sinb * a1r;
        re[x1] = sinb * a0i + cosb * a1r;
        im[x1] = -sinb * a0r + cosb * a1i;
      }
    }
  }

  function energy(gamma, beta, p) {
    const re = new Float64Array(DIM);
    const im = new Float64Array(DIM);
    const amp = 1 / Math.sqrt(DIM);
    for (let x = 0; x < DIM; x++) re[x] = amp;

    for (let layer = 0; layer < p; layer++) {
      applyCost(re, im, gamma);
      applyMixer(re, im, beta);
    }
    let e = 0;
    for (let x = 0; x < DIM; x++) {
      e += (re[x] * re[x] + im[x] * im[x]) * COSTS[x];
    }
    return e;
  }

  function initVisualizer() {
    const canvas = document.getElementById("viz-canvas");
    const slider = document.getElementById("viz-p");
    const pVal = document.getElementById("viz-p-val");
    if (!canvas || !slider) return;

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    function colorFor(t) {

      const hue = 220 + 120 * t; // de 220 (azul) a -20 (rojo)
      return `hsl(${hue}, 70%, 55%)`;
    }

    function draw(p) {
      const NX = 80, NY = 60;

      const energies = new Float64Array(NX * NY);
      let emin = Infinity, emax = -Infinity;
      for (let iy = 0; iy < NY; iy++) {
        for (let ix = 0; ix < NX; ix++) {
          const gamma = (ix / (NX - 1)) * 2 * Math.PI;
          const beta = (iy / (NY - 1)) * Math.PI;
          const e = energy(gamma, beta, p);
          energies[iy * NX + ix] = e;
          if (e < emin) emin = e;
          if (e > emax) emax = e;
        }
      }
      const range = emax - emin || 1;

      const cw = W / NX, ch = H / NY;
      for (let iy = 0; iy < NY; iy++) {
        for (let ix = 0; ix < NX; ix++) {
          const e = energies[iy * NX + ix];
          const t = (e - emin) / range;
          ctx.fillStyle = colorFor(t);

          ctx.fillRect(ix * cw, H - (iy + 1) * ch, cw + 1, ch + 1);
        }
      }

      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.font = "12px sans-serif";
      ctx.fillText("γ →  0", 6, H - 6);
      ctx.fillText("2π", W - 24, H - 6);
      ctx.save();
      ctx.translate(12, 18);
      ctx.fillText("β ↑ π", 0, 0);
      ctx.restore();

      let bestIx = 0, bestIy = 0, bestE = -Infinity;
      for (let iy = 0; iy < NY; iy++) {
        for (let ix = 0; ix < NX; ix++) {
          const e = energies[iy * NX + ix];
          if (e > bestE) { bestE = e; bestIx = ix; bestIy = iy; }
        }
      }
      const bestGamma = (bestIx / (NX - 1)) * 2 * Math.PI;
      const bestBeta  = (bestIy / (NY - 1)) * Math.PI;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 1.5;
      const cx = bestIx * cw + cw / 2;
      const cy = H - (bestIy + 0.5) * ch;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(6, 6, 210, 46);
      ctx.fillStyle = "#fff";
      ctx.font = "11px monospace";
      ctx.fillText(`Corte máximo ≈ ${bestE.toFixed(4)}`, 12, 22);
      ctx.fillText(`γ* ≈ ${bestGamma.toFixed(3)}, β* ≈ ${bestBeta.toFixed(3)}`, 12, 38);
    }

    function update() {
      const p = parseInt(slider.value, 10);
      pVal.textContent = String(p);
      draw(p);
    }
    slider.addEventListener("input", update);
    update();
  }

  function computeDepth(n, topo, p) {
    const E = (n * (n - 1)) / 2; // aristas de K_n
    let avgDist;
    if (topo === "all") avgDist = 1;
    else if (topo === "linear") avgDist = (n + 1) / 3;
    else avgDist = Math.max(1, 2 * Math.sqrt(n) / 3); // grid

    const costPerEdge = topo === "all" ? 2 : 3 * avgDist - 1;
    const twoQubitPerLayer = E * costPerEdge;

    const parallelPairs = Math.max(1, Math.floor(n / 2));
    const costDepthPerLayer = Math.ceil(E / parallelPairs) * (3 * avgDist);
    const mixerDepthPerLayer = 1;
    const depthPerLayer = costDepthPerLayer + mixerDepthPerLayer;

    return {
      edges: E,
      twoQubitGates: Math.round(twoQubitPerLayer * p),
      depth: Math.round(depthPerLayer * p),
      avgDist
    };
  }

  function initCalculator() {
    const btn = document.getElementById("calc-run");
    const out = document.getElementById("calc-out");
    if (!btn || !out) return;

    btn.addEventListener("click", () => {
      const n = Math.max(2, Math.min(200, parseInt(document.getElementById("calc-n").value, 10) || 8));
      const topo = document.getElementById("calc-topo").value;
      const p = Math.max(1, Math.min(20, parseInt(document.getElementById("calc-p").value, 10) || 1));

      const r = computeDepth(n, topo, p);
      out.textContent =
        `n = ${n} qubits · topología = ${{all: "completa", linear: "lineal", grid: "cuadrícula 2D"}[topo]} · p = ${p}\n` +
        `Aristas de K_n: ${r.edges}\n` +
        `Distancia media (aprox): ${r.avgDist.toFixed(2)}\n` +
        `Compuertas de 2 qubits (aprox): ${r.twoQubitGates.toLocaleString()}\n` +
        `Profundidad total (aprox): ${r.depth.toLocaleString()}`;
    });
    btn.click(); // cálculo inicial
  }

  function initTableFilter() {
    const table = document.getElementById("compare-table");
    if (!table) return;
    const buttons = document.querySelectorAll(".filter-bar button");
    const rows = table.querySelectorAll("tbody tr");

    buttons.forEach((b) => {
      b.addEventListener("click", () => {
        buttons.forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        const filter = b.getAttribute("data-filter");
        rows.forEach((r) => {
          const cat = r.getAttribute("data-cat");
          r.classList.toggle("hidden", !(filter === "all" || cat === filter));
        });
      });
    });
  }

  function init() {
    try { initVisualizer(); } catch (e) { console.warn("Visualizador:", e); }
    try { initCalculator(); } catch (e) { console.warn("Calculadora:", e); }
    try { initTableFilter(); } catch (e) { console.warn("Filtro tabla:", e); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();