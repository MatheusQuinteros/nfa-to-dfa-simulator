"""
Definição das estruturas de AFN e AFD usadas no projeto.

Este módulo só descreve o formato dos autômatos. A lógica
(mover, fecho-ε, conversão, execução) fica nos outros módulos.

Formato do AFN:
    {
        "estados":    {"q0", "q1", ...},
        "alfabeto":   {"a", "b", ...},          # NÃO inclui EPSILON
        "inicial":    "q0",
        "finais":     {"q1", ...},
        "transicoes": {
            "q0": {"a": {"q0", "q1"}, EPSILON: {"q2"}},
            "q1": {},                             # pode ser omitido
            ...
        },
    }

Formato do AFD:
    Igual ao AFN, mas:
      - cada estado é um frozenset de estados do AFN;
      - cada transição leva a UM estado (frozenset), não a um conjunto;
      - não existem transições por EPSILON.
"""

from typing import Dict, FrozenSet, Set, TypedDict

# Símbolo usado para representar a transição vazia (ε).
# Todos os módulos devem importar daqui, nunca escrever "" na mão.
EPSILON = ""

# Apelidos para deixar as assinaturas das funções mais legíveis
Estado = str
Simbolo = str
EstadoAFD = FrozenSet[Estado]


class AFN(TypedDict):
    estados: Set[Estado]
    alfabeto: Set[Simbolo]
    inicial: Estado
    finais: Set[Estado]
    transicoes: Dict[Estado, Dict[Simbolo, Set[Estado]]]


class AFD(TypedDict):
    estados: Set[EstadoAFD]
    alfabeto: Set[Simbolo]
    inicial: EstadoAFD
    finais: Set[EstadoAFD]
    transicoes: Dict[EstadoAFD, Dict[Simbolo, EstadoAFD]]

