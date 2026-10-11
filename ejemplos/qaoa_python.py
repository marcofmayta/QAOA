import numpy as np
from scipy.optimize import minimize
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

aristas = [(0, 1), (1, 2), (2, 3), (3, 0)]
costos = np.array([sum(((x >> i) & 1) != ((x >> j) & 1)
                       for i, j in aristas) for x in range(16)])

def circuito(parametros):
    gamma, beta = parametros  
    qc = QuantumCircuit(4)
    qc.h(range(4))
    for i, j in aristas:
        qc.rzz(-gamma, i, j)  
    qc.rx(2 * beta, range(4))
    return qc

def objetivo(parametros):
    probabilidades = Statevector.from_instruction(circuito(parametros)).probabilities()
    return -float(probabilidades @ costos)  

if __name__ == "__main__":
    resultado = minimize(objetivo, [0.5, 0.3], method="COBYLA",
                         options={"maxiter": 200})
    print("Corte esperado:", -resultado.fun)
    estado = Statevector.from_instruction(circuito(resultado.x))
    estado.seed(42)
    muestras = estado.sample_counts(1024)
    mejor = max(muestras, key=lambda bits: costos[int(bits, 2)])
    print("Mejor partición muestreada:", mejor, "corte:", costos[int(mejor, 2)])
