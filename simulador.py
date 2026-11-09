"""
Execução de palavras: no AFD diretamente, ou no AFN via conversão para AFD.
"""

from typing import List, Tuple

from automato import AFD, AFN, EPSILON, EstadoAFD
from conversao import afn_para_afd, nomes_afd


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


if __name__ == "__main__":
    # L = a*b  ∪  ab*
    exemplo: AFN = {
        "estados": {"q0", "q1", "q2", "q3", "q4"},
        "alfabeto": {"a", "b"},
        "inicial": "q0",
        "finais": {"q2", "q4"},
        "transicoes": {
            "q0": {EPSILON: {"q1", "q3"}},
            "q1": {"a": {"q1"}, "b": {"q2"}},
            "q3": {"a": {"q4"}},
            "q4": {"b": {"q4"}},
        },
    }

    afd = afn_para_afd(exemplo)
    nomes = nomes_afd(afd)

    for palavra in ["", "a", "b", "ab", "aab", "abb", "ba", "aaba"]:
        aceita, caminho = executar_afd(afd, palavra)
        trajeto = " -> ".join(nomes[d] for d in caminho)
        print(f"{palavra!r:8} {'ACEITA' if aceita else 'rejeita':8} {trajeto}")
