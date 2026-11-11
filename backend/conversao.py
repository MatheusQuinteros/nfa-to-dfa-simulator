"""
Conversão de AFN para AFD pela construção de subconjuntos.

Cada estado do AFD é um frozenset de estados do AFN. O conjunto
vazio aparece como estado de erro (poço), deixando o AFD completo.
"""

from collections import deque
from typing import Dict

from .automato import AFD, AFN, EstadoAFD
from .operacoes import fecho_epsilon, mover
from .validacao import validar_afn


def afn_para_afd(afn: AFN) -> AFD:
    """Converte um AFN (com ou sem transições ε) em um AFD equivalente."""
    validar_afn(afn)

    simbolos = sorted(afn["alfabeto"])
    inicial = fecho_epsilon(afn, {afn["inicial"]})

    estados = {inicial}
    transicoes: Dict[EstadoAFD, Dict[str, EstadoAFD]] = {}
    fila = deque([inicial])

    while fila:
        atual = fila.popleft()
        transicoes[atual] = {}

        for simbolo in simbolos:
            destino = fecho_epsilon(afn, mover(afn, atual, simbolo))
            transicoes[atual][simbolo] = destino

            if destino not in estados:
                estados.add(destino)
                fila.append(destino)

    return {
        "estados": estados,
        "alfabeto": set(afn["alfabeto"]),
        "inicial": inicial,
        "finais": {d for d in estados if d & afn["finais"]},
        "transicoes": transicoes,
    }


def nomes_afd(afd: AFD) -> Dict[EstadoAFD, str]:
    """
    Dá nomes curtos (D0, D1, ...) aos estados do AFD, na ordem em que
    são alcançados a partir do inicial. Serve só para exibição.
    """
    simbolos = sorted(afd["alfabeto"])
    nomes = {afd["inicial"]: "D0"}
    fila = deque([afd["inicial"]])

    while fila:
        atual = fila.popleft()
        for simbolo in simbolos:
            destino = afd["transicoes"][atual][simbolo]
            if destino not in nomes:
                nomes[destino] = f"D{len(nomes)}"
                fila.append(destino)

    return nomes
