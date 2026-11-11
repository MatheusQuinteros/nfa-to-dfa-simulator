// Editor visual de AFN, no estilo do JFLAP.
//
// Modelo interno:
//   estados:    [{ id, nome, x, y, inicial, final }]
//   transicoes: [{ id, de, para, simbolos: ["a", "ε", ...] }]  (um item por par de estados)

import { renderizar, pontoSvg, estadoNoPonto } from "./desenho.js";
import { pedirTexto, mostrarMenu, mostrarMensagem } from "./ui.js";

export const EPSILON = "ε";

const DICAS = {
  estado: "Clique no espaço vazio para criar um estado. Arraste para mover.",
  transicao: "Arraste de um estado até outro (ou até ele mesmo) para criar uma transição.",
  mover: "Arraste os estados para reorganizar. Duplo clique renomeia; clique direito abre opções.",
  apagar: "Clique em um estado ou transição para apagá-lo.",
};

// Lê "a, b, " → ["a", "b"]; vazio → ["ε"]. Cada símbolo deve ter um caractere.
function lerSimbolos(texto) {
  const partes = texto.split(",").map((s) => s.trim()).filter(Boolean);
  if (!partes.length) return [EPSILON];
  const invalido = partes.find((s) => s !== EPSILON && [...s].length !== 1);
  if (invalido) throw new Error(`"${invalido}" não é um símbolo: use um caractere por símbolo.`);
  return [...new Set(partes)];
}

export class EditorAFN {
  constructor(svg, { aoMudar }) {
    this.svg = svg;
    this.aoMudar = aoMudar;
    this.estados = [];
    this.transicoes = [];
    this.modo = "estado";
    this.destacados = new Set();
    this.proximoId = 1;
    this.arraste = null;
    this.rascunho = null;

    svg.addEventListener("pointerdown", (ev) => this.aoPressionar(ev));
    svg.addEventListener("pointermove", (ev) => this.aoMover(ev));
    svg.addEventListener("pointerup", (ev) => this.aoSoltar(ev));
    svg.addEventListener("dblclick", (ev) => this.aoDuploClique(ev));
    svg.addEventListener("contextmenu", (ev) => this.aoMenu(ev));
  }

  // ---------- modelo ----------

  modeloBackend() {
    const nome = new Map(this.estados.map((e) => [e.id, e.nome]));
    return {
      estados: this.estados.map((e) => e.nome),
      inicial: this.estados.find((e) => e.inicial)?.nome ?? null,
      finais: this.estados.filter((e) => e.final).map((e) => e.nome),
      transicoes: this.transicoes.flatMap((t) =>
        t.simbolos.map((simbolo) => ({ de: nome.get(t.de), para: nome.get(t.para), simbolo })),
      ),
    };
  }

  // estados: [{nome, x, y, inicial, final}], transicoes: [{de, para, simbolos}] (por nome)
  carregar({ estados, transicoes }) {
    this.estados = [];
    this.transicoes = [];
    const id = new Map();
    for (const e of estados) {
      const novo = { ...e, id: this.proximoId++ };
      id.set(e.nome, novo.id);
      this.estados.push(novo);
    }
    for (const t of transicoes) {
      this.transicoes.push({ id: this.proximoId++, de: id.get(t.de), para: id.get(t.para), simbolos: [...t.simbolos] });
    }
    this.mudou();
  }

  limpar() {
    this.carregar({ estados: [], transicoes: [] });
  }

  definirModo(modo) {
    this.modo = modo;
    this.svg.dataset.modo = modo;
    return DICAS[modo];
  }

  destacar(nomes) {
    const set = new Set(nomes);
    this.destacados = new Set(this.estados.filter((e) => set.has(e.nome)).map((e) => e.id));
    this.desenhar();
  }

  desenhar() {
    renderizar(this.svg, {
      estados: this.estados,
      arestas: this.transicoes.map((t) => ({ ...t, rotulo: t.simbolos.join(", ") })),
    }, { destacados: this.destacados, rascunho: this.rascunho });
  }

  mudou() {
    this.destacados = new Set();
    this.desenhar();
    this.aoMudar();
  }

  novoNome() {
    const usados = new Set(this.estados.map((e) => e.nome));
    let i = 0;
    while (usados.has(`q${i}`)) i++;
    return `q${i}`;
  }

  criarEstado(x, y) {
    this.estados.push({
      id: this.proximoId++,
      nome: this.novoNome(),
      x, y,
      inicial: this.estados.length === 0,
      final: false,
    });
    this.mudou();
  }

  apagarEstado(estado) {
    this.estados = this.estados.filter((e) => e !== estado);
    this.transicoes = this.transicoes.filter((t) => t.de !== estado.id && t.para !== estado.id);
    this.mudou();
  }

  apagarTransicao(id) {
    this.transicoes = this.transicoes.filter((t) => t.id !== id);
    this.mudou();
  }

  alternarInicial(estado) {
    const valor = !estado.inicial;
    for (const e of this.estados) e.inicial = false;
    estado.inicial = valor;
    this.mudou();
  }

  alternarFinal(estado) {
    estado.final = !estado.final;
    this.mudou();
  }

  async renomear(estado, x, y) {
    const nome = (await pedirTexto({ titulo: "Nome do estado", valor: estado.nome, x, y }))?.trim();
    if (!nome || nome === estado.nome) return;
    if (this.estados.some((e) => e.nome === nome)) {
      mostrarMensagem(`Já existe um estado chamado ${nome}.`, "erro");
      return;
    }
    estado.nome = nome;
    this.mudou();
  }

  async pedirSimbolos(valor, x, y) {
    const texto = await pedirTexto({
      titulo: "Símbolos da transição",
      dica: "Separe por vírgula. Deixe vazio para ε.",
      valor, x, y,
    });
    if (texto === null) return null;
    try {
      return lerSimbolos(texto);
    } catch (erro) {
      mostrarMensagem(erro.message, "erro");
      return null;
    }
  }

  async criarTransicao(de, para, x, y) {
    const simbolos = await this.pedirSimbolos("", x, y);
    if (!simbolos) return;
    const existente = this.transicoes.find((t) => t.de === de.id && t.para === para.id);
    if (existente) {
      existente.simbolos = [...new Set([...existente.simbolos, ...simbolos])];
    } else {
      this.transicoes.push({ id: this.proximoId++, de: de.id, para: para.id, simbolos });
    }
    this.mudou();
  }

  async editarTransicao(id, x, y) {
    const t = this.transicoes.find((t) => t.id === id);
    const simbolos = await this.pedirSimbolos(t.simbolos.filter((s) => s !== EPSILON).join(", "), x, y);
    if (!simbolos) return;
    t.simbolos = simbolos;
    this.mudou();
  }

  // ---------- mouse ----------

  alvo(ev) {
    const p = pontoSvg(this.svg, ev);
    const arestaEl = ev.target.closest?.("[data-aresta]");
    return {
      p,
      estado: estadoNoPonto(this.estados, p.x, p.y),
      aresta: arestaEl ? Number(arestaEl.dataset.aresta) : null,
    };
  }

  aoPressionar(ev) {
    if (ev.button !== 0) return;
    const { p, estado, aresta } = this.alvo(ev);

    if (this.modo === "apagar") {
      if (estado) this.apagarEstado(estado);
      else if (aresta !== null) this.apagarTransicao(aresta);
      return;
    }

    if (this.modo === "transicao") {
      if (estado) {
        this.rascunho = { de: estado, x: p.x, y: p.y };
        this.svg.setPointerCapture(ev.pointerId);
      }
      return;
    }

    if (estado) {
      this.arraste = { estado, dx: estado.x - p.x, dy: estado.y - p.y };
      this.svg.setPointerCapture(ev.pointerId);
    } else if (this.modo === "estado" && aresta === null) {
      this.criarEstado(p.x, p.y);
    }
  }

  aoMover(ev) {
    if (!this.arraste && !this.rascunho) return;
    const p = pontoSvg(this.svg, ev);
    if (this.arraste) {
      this.arraste.estado.x = p.x + this.arraste.dx;
      this.arraste.estado.y = p.y + this.arraste.dy;
    } else {
      this.rascunho.x = p.x;
      this.rascunho.y = p.y;
    }
    this.desenhar();
  }

  aoSoltar(ev) {
    if (this.arraste) {
      this.arraste = null;
      return;
    }
    if (this.rascunho) {
      const { de } = this.rascunho;
      const p = pontoSvg(this.svg, ev);
      const para = estadoNoPonto(this.estados, p.x, p.y);
      this.rascunho = null;
      this.desenhar();
      if (para) this.criarTransicao(de, para, ev.clientX, ev.clientY);
    }
  }

  aoDuploClique(ev) {
    if (this.modo === "apagar") return;
    const { estado, aresta } = this.alvo(ev);
    if (estado) this.renomear(estado, ev.clientX, ev.clientY);
    else if (aresta !== null) this.editarTransicao(aresta, ev.clientX, ev.clientY);
  }

  aoMenu(ev) {
    const { estado, aresta } = this.alvo(ev);
    if (!estado && aresta === null) return;
    ev.preventDefault();
    const { clientX: x, clientY: y } = ev;

    if (estado) {
      mostrarMenu([
        { rotulo: "Inicial", marcado: estado.inicial, acao: () => this.alternarInicial(estado) },
        { rotulo: "Final", marcado: estado.final, acao: () => this.alternarFinal(estado) },
        { rotulo: "Renomear…", acao: () => this.renomear(estado, x, y) },
        { rotulo: "Apagar estado", perigo: true, acao: () => this.apagarEstado(estado) },
      ], x, y);
    } else {
      mostrarMenu([
        { rotulo: "Editar símbolos…", acao: () => this.editarTransicao(aresta, x, y) },
        { rotulo: "Apagar transição", perigo: true, acao: () => this.apagarTransicao(aresta) },
      ], x, y);
    }
  }
}
