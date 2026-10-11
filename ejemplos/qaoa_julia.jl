const ARISTAS = [(0, 1), (1, 2), (2, 3), (3, 0)]
const COSTOS = [sum(((x >> i) & 1) != ((x >> j) & 1)
                    for (i, j) in ARISTAS) for x in 0:15]

function corte(gamma, beta)
    psi = ComplexF64[exp(-im * gamma * costo) / 4 for costo in COSTOS]
    c, s = cos(beta), sin(beta)
    for q in 0:3, x in 0:15
        (x & (1 << q)) != 0 && continue
        y = x | (1 << q)
        a, b = psi[x + 1], psi[y + 1]
        psi[x + 1] = c * a - im * s * b
        psi[y + 1] = c * b - im * s * a
    end
    return sum(abs2.(psi) .* COSTOS)
end

function buscar(pasos=80)
    mejor = (valor=-Inf, gamma=0.0, beta=0.0)
    for i in 0:pasos-1, j in 0:pasos-1
        gamma, beta = 2pi * i / pasos, pi * j / pasos
        valor = corte(gamma, beta)
        if valor > mejor.valor
            mejor = (valor=valor, gamma=gamma, beta=beta)
        end
    end
    return mejor
end

if abspath(PROGRAM_FILE) == @__FILE__
    println(buscar())
end
