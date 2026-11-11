"""
Backend do simulador: AFN -> AFD pela construção de subconjuntos.

Python puro, sem nenhuma dependência de interface.
"""

from .automato import AFD, AFN, EPSILON
from .conversao import afn_para_afd, nomes_afd
from .simulador import executar_afd, simular_afn
from .validacao import validar_afn

__all__ = [
    "AFD", "AFN", "EPSILON",
    "afn_para_afd", "nomes_afd",
    "executar_afd", "simular_afn",
    "validar_afn",
]
