"""
Demonstração rápida no terminal: python3 -m backend
"""

from .automato import AFN, EPSILON
from .conversao import afn_para_afd, nomes_afd
from .simulador import executar_afd

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
