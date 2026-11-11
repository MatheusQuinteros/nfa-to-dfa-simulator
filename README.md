# Simulador AFN → AFD

Simulador de autômatos finitos não determinísticos (AFN, com transições ε) que executa palavras
convertendo o AFN em um autômato finito determinístico (AFD) pela **construção de subconjuntos**.
A interface, no estilo do JFLAP, roda inteiramente no navegador.

**▶ Acesse online: https://matheusquinteros.github.io/nfa-to-dfa-simulator/**

> Na primeira visita, a página leva alguns segundos para carregar o Python no navegador
> ("Carregando Python…"). O editor já pode ser usado enquanto isso.

## Funcionalidades

- **Editor visual de AFN**: crie estados, transições (inclusive ε e laços) e marque estados
  inicial e finais com o mouse.
- **AFD convertido**: grafo do AFD gerado, com o conjunto de estados do AFN que cada estado
  representa, o estado de erro (∅) e a tabela de transição.
- **Execução passo a passo**: avance e volte símbolo a símbolo, vendo ao mesmo tempo o estado
  atual do AFD e os estados ativos do AFN, até o veredito de aceita ou rejeitada.

## Como usar

| Ação | Como fazer |
| --- | --- |
| Criar estado | Modo **Estado** (`E`) e clique no espaço vazio |
| Criar transição | Modo **Transição** (`T`) e arraste de um estado até outro (ou até ele mesmo, para um laço) |
| Transição ε | Deixe o campo de símbolos vazio |
| Vários símbolos | Separe por vírgula: `a, b` |
| Estado inicial / final | Clique com o botão direito no estado e escolha **Inicial** ou **Final** |
| Renomear | Duplo clique no estado |
| Editar símbolos | Duplo clique na transição |
| Mover | Modo **Mover** (`M`) e arraste |
| Apagar | Modo **Apagar** (`X`) e clique no estado ou na transição |

Depois de montar o AFN, abra a aba **AFD convertido** para ver a conversão, ou digite uma palavra
no campo **Palavra** e clique em **Iniciar** para executá-la passo a passo (vazio = palavra ε).
O botão **Exemplo** carrega um AFN pronto para a linguagem `a*b ∪ ab*`.

## Como funciona

O núcleo é Python puro, sem dependências:

1. **Fecho-ε**: conjunto de estados alcançáveis só por transições ε.
2. **Mover**: estados alcançáveis lendo um símbolo a partir de um conjunto de estados.
3. **Construção de subconjuntos**: o estado inicial do AFD é o fecho-ε do estado inicial do AFN.
   Para cada estado `D` do AFD e cada símbolo `a`, o destino é `fecho-ε(mover(D, a))`.
   Um estado do AFD é final se contém algum estado final do AFN. O conjunto vazio vira um
   estado de erro explícito, deixando o AFD completo.
4. **Execução**: a palavra é lida no AFD, guardando o caminho de estados percorrido.

A interface é HTML, CSS e JavaScript sem frameworks nem etapa de build. O mesmo código Python do
backend é executado no navegador com o [Pyodide](https://pyodide.org/), por isso o site funciona
no GitHub Pages sem nenhum servidor.

## Estrutura

```
backend/             # lógica dos autômatos (Python puro)
  automato.py        # formatos de AFN e AFD
  validacao.py       # verificação do AFN
  operacoes.py       # fecho-ε e mover
  conversao.py       # AFN -> AFD (construção de subconjuntos)
  simulador.py       # execução de palavras
  __main__.py        # demonstração no terminal
gui/                 # interface web
  index.html
  css/estilo.css
  js/                # editor, desenho SVG, layout do AFD, execução, carregamento do Pyodide
  py/ponte.py        # adapta os dados da interface para o backend
index.html           # redireciona para gui/
```

## Rodando localmente

A página precisa ser servida por HTTP, porque baixa os arquivos `.py` do backend. Na raiz do
projeto:

```bash
python3 -m http.server 8080
```

Depois abra `http://localhost:8080/gui/`.

Para rodar só a demonstração do backend no terminal:

```bash
python3 -m backend
```

Exemplo de uso direto em Python:

```python
from backend import EPSILON, afn_para_afd, executar_afd

afn = {
    "estados": {"q0", "q1", "q2"},
    "alfabeto": {"a", "b"},
    "inicial": "q0",
    "finais": {"q1", "q2"},
    "transicoes": {
        "q0": {EPSILON: {"q1", "q2"}},
        "q1": {"a": {"q1"}},
        "q2": {"b": {"q2"}},
    },
}

afd = afn_para_afd(afn)
aceita, caminho = executar_afd(afd, "aaa")  # aceita == True
```
