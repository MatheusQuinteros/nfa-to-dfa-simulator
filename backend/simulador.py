"""
Execução de palavras: no AFD diretamente, ou no AFN via conversão para AFD.
"""

from typing import List, Tuple

from .automato import AFD, AFN, EstadoAFD
from .conversao import afn_para_afd


def executar_afd(afd: AFD, palavra: str) -> Tuple[bool, List[EstadoAFD]]:
    """
    Executa `palavra` no AFD, um caractere por símbolo.

    Retorna (aceita, caminho), onde caminho tem os estados visitados,
    começando pelo inicial (len(caminho) == len(palavra) + 1).
    """
    atual = afd["inicial"]
    caminho = [atual]

    for simbolo in palavra:
        if simbolo not in afd["alfabeto"]:
            raise ValueError(f"Símbolo {simbolo!r} não pertence ao alfabeto.")
        atual = afd["transicoes"][atual][simbolo]
        caminho.append(atual)

    return atual in afd["finais"], caminho


def simular_afn(afn: AFN, palavra: str) -> Tuple[bool, List[EstadoAFD]]:
    """Simula o AFN convertendo-o para AFD e executando a palavra nele."""
    return executar_afd(afn_para_afd(afn), palavra)

