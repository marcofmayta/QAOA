
(function (global) {
  "use strict";
  const aristas = [[0, 1], [1, 2], [2, 3], [3, 0]];
  const costos = Array.from({length: 16}, (_, x) =>
    aristas.reduce((c, [i, j]) => c + (((x >> i) & 1) !== ((x >> j) & 1)), 0));
  function corte(gamma, beta) {
    const re = new Float64Array(16), im = new Float64Array(16);
    for (let x = 0; x < 16; x++) {
      re[x] = Math.cos(gamma * costos[x]) / 4;
      im[x] = -Math.sin(gamma * costos[x]) / 4;
    }
    const c = Math.cos(beta), s = Math.sin(beta);
    for (let q = 0; q < 4; q++) for (let x = 0; x < 16; x++) {
      if (x & (1 << q)) continue;
      const y = x | (1 << q), ar = re[x], ai = im[x], br = re[y], bi = im[y];
      re[x] = c * ar + s * bi; im[x] = c * ai - s * br;
      re[y] = c * br + s * ai; im[y] = c * bi - s * ar;
    }
    return costos.reduce((total, costo, x) => total + costo * (re[x] ** 2 + im[x] ** 2), 0);
  }
  function buscar(pasos = 80) {
    if (!Number.isInteger(pasos) || pasos < 2 || pasos > 500) throw new RangeError("Usa entre 2 y 500 pasos");
    let mejor = {valor: -Infinity, gamma: 0, beta: 0};
    for (let i = 0; i < pasos; i++) for (let j = 0; j < pasos; j++) {
      const gamma = 2 * Math.PI * i / pasos, beta = Math.PI * j / pasos;
      const valor = corte(gamma, beta);
      if (valor > mejor.valor) mejor = {valor, gamma, beta};
    }
    return mejor;
  }
  global.QAOAEjemplo = {corte, buscar};
  if (typeof module !== "undefined") module.exports = global.QAOAEjemplo;
})(globalThis);
