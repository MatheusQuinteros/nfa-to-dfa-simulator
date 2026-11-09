"""
Validação de AFNs antes da conversão.

Detecta erros de definição cedo, com mensagens claras, em vez de
deixar estourar um KeyError no meio da conversão.
"""

from automato import AFN, EPSILON


def validar_afn(afn: AFN) -> None:
    """Levanta ValueError se o AFN não estiver bem formado."""
    estados = afn["estados"]
    alfabeto = afn["alfabeto"]

    if EPSILON in alfabeto:
        raise ValueError("O alfabeto não pode conter EPSILON.")

    if afn["inicial"] not in estados:
        raise ValueError(f"Estado inicial {afn['inicial']!r} não está em estados.")

    fora = afn["finais"] - estados
    if fora:
        raise ValueError(f"Estados finais fora de estados: {sorted(fora)}.")

    for origem, por_simbolo in afn["transicoes"].items():
        if origem not in estados:
            raise ValueError(f"Transição a partir de estado inexistente: {origem!r}.")

        for simbolo, destinos in por_simbolo.items():
            if simbolo != EPSILON and simbolo not in alfabeto:
                raise ValueError(
                    f"Símbolo {simbolo!r} em {origem!r} não pertence ao alfabeto."
                )

            fora = destinos - estados
            if fora:
                raise ValueError(
                    f"Transição {origem!r} --{simbolo!r}--> leva a estados "
                    f"inexistentes: {sorted(fora)}."
                )
