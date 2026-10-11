import numpy as np
import cirq
from scipy.optimize import minimize

ARISTAS = [(0, 1), (1, 2), (2, 3), (3, 0)]
qubits = cirq.LineQubit.range(4)
simulador = cirq.Simulator(dtype=np.complex128)

def circuito(parametros):
    qc = cirq.Circuit(cirq.H.on_each(*qubits))
    for gamma, beta in np.asarray(parametros).reshape(-1, 2):
        for i, j in ARISTAS:
            qc.append(cirq.CNOT(qubits[i], qubits[j]))
            qc.append(cirq.rz(-gamma)(qubits[j]))
            qc.append(cirq.CNOT(qubits[i], qubits[j]))
        qc.append(cirq.rx(2 * beta).on_each(*qubits))
    return qc

def corte(parametros):
    observables = [cirq.Z(qubits[i]) * cirq.Z(qubits[j]) for i, j in ARISTAS]
    valores = simulador.simulate_expectation_values(
        circuito(parametros), observables, qubit_order=qubits)
    return float(sum((1 - zz.real) / 2 for zz in valores))

if __name__ == "__main__":
    resultado = minimize(lambda x: -corte(x), [0.5, 0.3],
                         method="COBYLA", options={"maxiter": 200})
    print("Corte esperado:", corte(resultado.x))
