import numpy as np
import pennylane as qml
from scipy.optimize import minimize

ARISTAS = [(0, 1), (1, 2), (2, 3), (3, 0)]
dispositivo = qml.device("default.qubit", wires=4, shots=None)

@qml.qnode(dispositivo)
def correlaciones(parametros):
    for i in range(4):
        qml.Hadamard(wires=i)
    for gamma, beta in np.asarray(parametros).reshape(-1, 2):
        for i, j in ARISTAS:
            qml.IsingZZ(-gamma, wires=[i, j])
        for i in range(4):
            qml.RX(2 * beta, wires=i)
    return tuple(qml.expval(qml.PauliZ(i) @ qml.PauliZ(j))
                 for i, j in ARISTAS)

def corte(parametros):
    return float(sum((1 - zz) / 2 for zz in correlaciones(parametros)))

if __name__ == "__main__":
    resultado = minimize(lambda x: -corte(x), [0.5, 0.3],
                         method="COBYLA", options={"maxiter": 200})
    print("Corte esperado:", corte(resultado.x))
