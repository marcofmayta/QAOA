import numpy as np
from scipy.optimize import minimize

ARISTAS = [(0, 1), (1, 2), (2, 3), (3, 0)]
COSTOS = np.array([sum(((x >> i) & 1) != ((x >> j) & 1)
                      for i, j in ARISTAS) for x in range(16)])

def estado(parametros):
    psi = np.ones(16, dtype=complex) / 4
    for gamma, beta in np.asarray(parametros).reshape(-1, 2):
        psi *= np.exp(-1j * gamma * COSTOS)
        c, s = np.cos(beta), np.sin(beta)
        for q in range(4):
            for x in range(16):
                if x & (1 << q):
                    continue
                y = x | (1 << q)
                a, b = psi[x], psi[y]
                psi[x], psi[y] = c * a - 1j * s * b, c * b - 1j * s * a
    return psi

def corte(parametros):
    return float(np.abs(estado(parametros)) ** 2 @ COSTOS)

if __name__ == "__main__":
    resultado = minimize(lambda x: -corte(x), [0.5, 0.3],
                         method="COBYLA", options={"maxiter": 200})
    print("Corte esperado:", corte(resultado.x))
