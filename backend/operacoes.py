"""
Operações básicas sobre AFN: fecho-ε e mover.

São as duas peças usadas pela construção de subconjuntos.
"""

from typing import FrozenSet, Iterable

from .automato import AFN, EPSILON, Estado, EstadoAFD, Simbolo


def fecho_epsilon(afn: AFN, estados: Iterable[Estado]) -> EstadoAFD:
    """
    Retorna todos os estados alcançáveis a partir de `estados`
    usando apenas transições por EPSILON (incluindo os próprios estados).
    """
    fecho = set(estados)
    pilha = list(fecho)

    while pilha:
        q = pilha.pop()
        for p in afn["transicoes"].get(q, {}).get(EPSILON, set()):
            if p not in fecho:
                fecho.add(p)
                pilha.append(p)

    return frozenset(fecho)


def mover(afn: AFN, estados: Iterable[Estado], simbolo: Simbolo) -> FrozenSet[Estado]:
    """Retorna os estados alcançáveis a partir de `estados` lendo `simbolo` uma vez."""
    destino: set = set()
    for q in estados:
        destino |= afn["transicoes"].get(q, {}).get(simbolo, set())
    return frozenset(destino)
