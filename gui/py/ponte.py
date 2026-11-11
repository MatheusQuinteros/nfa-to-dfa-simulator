"""
Ponte entre a GUI (JavaScript) e o backend.

Única parte do projeto que conhece o formato usado pela interface.
Os dados atravessam a fronteira JS <-> Python como texto JSON, só
porque é o jeito mais simples de converter objetos entre as linguagens.

Formato do AFN vindo da GUI:
    {
        "estados":    ["q0", "q1", ...],
        "inicial":    "q0" ou null,
        "finais":     ["q1", ...],
        "transicoes": [{"de": "q0", "para": "q1", "simbolo": "a"}, ...],
    }
O símbolo "ε" (ou "") representa a transição vazia.
"""

import json
from typing import Dict, List

from backend import AFN, EPSILON, afn_para_afd, executar_afd, nomes_afd

SIMBOLOS_EPSILON = {"ε", ""}


def _para_afn(dados: dict) -> AFN:
    if not dados["estados"]:
        raise ValueError("Crie pelo menos um estado.")
    if not dados["inicial"]:
        raise ValueError("Defina um estado inicial (clique direito no estado).")

    transicoes: Dict[str, Dict[str, set]] = {q: {} for q in dados["estados"]}
    alfabeto = set()

    for t in dados["transicoes"]:
        simbolo = EPSILON if t["simbolo"] in SIMBOLOS_EPSILON else t["simbolo"]
        if simbolo != EPSILON:
            alfabeto.add(simbolo)
        transicoes[t["de"]].setdefault(simbolo, set()).add(t["para"])

    return {
        "estados": set(dados["estados"]),
        "alfabeto": alfabeto,
        "inicial": dados["inicial"],
        "finais": set(dados["finais"]),
        "transicoes": transicoes,
    }


def _ordenado(conjunto) -> List[str]:
    return sorted(conjunto)


def converter(texto: str) -> str:
    """Converte o AFN da GUI em AFD, já com nomes D0, D1, ..."""
    try:
        afd = afn_para_afd(_para_afn(json.loads(texto)))
    except ValueError as erro:
        return json.dumps({"erro": str(erro)})

    nomes = nomes_afd(afd)
    estados = sorted(afd["estados"], key=lambda d: int(nomes[d][1:]))

    return json.dumps({
        "alfabeto": sorted(afd["alfabeto"]),
        "estados": [
            {
                "nome": nomes[d],
                "conjunto": _ordenado(d),
                "inicial": d == afd["inicial"],
                "final": d in afd["finais"],
                "erro": not d,
            }
            for d in estados
        ],
        "transicoes": [
            {"de": nomes[d], "para": nomes[destino], "simbolo": simbolo}
            for d in estados
            for simbolo, destino in sorted(afd["transicoes"][d].items())
        ],
    })


def executar(texto: str, palavra: str) -> str:
    """Executa a palavra no AFD equivalente e devolve cada passo."""
    try:
        afd = afn_para_afd(_para_afn(json.loads(texto)))
        aceita, caminho = executar_afd(afd, palavra)
    except ValueError as erro:
        return json.dumps({"erro": str(erro)})

    nomes = nomes_afd(afd)
    lidos = [None] + list(palavra)

    return json.dumps({
        "aceita": aceita,
        "passos": [
            {"afd": nomes[d], "afn": _ordenado(d), "lido": lido}
            for d, lido in zip(caminho, lidos)
        ],
    })
