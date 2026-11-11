// Visão do AFD convertido: grafo (com estados arrastáveis) e tabela de transição.

import { renderizar, pontoSvg, estadoNoPonto, RAIO } from "./desenho.js";
import { posicionar } from "./layout.js";

const MARGEM = 90;

function conjunto(nomes) {
  return nomes.length ? `{${nomes.join(", ")}}` : "∅";
}

export class VisaoAFD {
  constructor(svg, tabela) {
    this.svg = svg;
    this.tabela = tabela;
    this.estados = [];
    this.arestas = [];
    this.destacado = null;
    this.arraste = null;

    svg.addEventListener("pointerdown", (ev) => {
      const p = pontoSvg(svg, ev);
      const estado = estadoNoPonto(this.estados, p.x, p.y);
      if (!estado) return;
      this.arraste = { estado, dx: estado.x - p.x, dy: estado.y - p.y };
      svg.setPointerCapture(ev.pointerId);
    });
    svg.addEventListener("pointermove", (ev) => {
      if (!this.arraste) return;
      const p = pontoSvg(svg, ev);
      this.arraste.estado.x = p.x + this.arraste.dx;
      this.arraste.estado.y = p.y + this.arraste.dy;
      this.desenhar();
    });
    svg.addEventListener("pointerup", () => {
      this.arraste = null;
    });
  }

  // afd: resultado de converter() — { alfabeto, estados, transicoes }
  mostrar(afd) {
    const posicoes = posicionar(afd.estados, afd.transicoes);

    this.estados = afd.estados.map((e) => ({
      id: e.nome,
      nome: e.nome,
      sub: conjunto(e.conjunto),
      inicial: e.inicial,
      final: e.final,
      erro: e.erro,
      ...posicoes.get(e.nome),
    }));

    // agrupa símbolos com o mesmo par (de, para) num rótulo só
    const grupos = new Map();
    for (const t of afd.transicoes) {
      const chave = `${t.de}->${t.para}`;
      if (!grupos.has(chave)) grupos.set(chave, { id: chave, de: t.de, para: t.para, simbolos: [] });
      grupos.get(chave).simbolos.push(t.simbolo);
    }
    this.arestas = [...grupos.values()].map((g) => ({ ...g, rotulo: g.simbolos.join(", ") }));

    this.destacado = null;
    this.ajustarVisao();
    this.desenhar();
    this.montarTabela(afd);
  }

  ajustarVisao() {
    const xs = this.estados.map((e) => e.x);
    const ys = this.estados.map((e) => e.y);
    const x0 = Math.min(...xs) - RAIO - MARGEM;
    const y0 = Math.min(...ys) - RAIO - MARGEM;
    const largura = Math.max(...xs) - x0 + RAIO + MARGEM;
    const altura = Math.max(...ys) - y0 + RAIO + MARGEM;
    this.svg.setAttribute("viewBox", `${x0} ${y0} ${largura} ${altura}`);
  }

  destacar(nome) {
    this.destacado = nome;
    this.desenhar();
    for (const linha of this.tabela.querySelectorAll("tbody tr")) {
      linha.classList.toggle("ativo", linha.dataset.estado === nome);
    }
  }

  desenhar() {
    renderizar(this.svg, { estados: this.estados, arestas: this.arestas }, {
      destacados: new Set(this.destacado ? [this.destacado] : []),
    });
  }

  montarTabela(afd) {
    const destino = new Map(afd.transicoes.map((t) => [`${t.de}|${t.simbolo}`, t.para]));
    const cab = afd.alfabeto.map((s) => `<th scope="col">${s}</th>`).join("");

    const linhas = afd.estados.map((e) => {
      const marca = `${e.inicial ? "→" : ""}${e.final ? "*" : ""}`;
      const celulas = afd.alfabeto.map((s) => `<td>${destino.get(`${e.nome}|${s}`)}</td>`).join("");
      return `<tr data-estado="${e.nome}"${e.erro ? ' class="erro"' : ""}>
        <td class="marca">${marca}</td>
        <th scope="row">${e.nome}</th>
        <td class="conjunto">${conjunto(e.conjunto)}</td>${celulas}</tr>`;
    }).join("");

    this.tabela.innerHTML = `
      <thead><tr><th></th><th scope="col">AFD</th><th scope="col">Estados do AFN</th>${cab}</tr></thead>
      <tbody>${linhas}</tbody>`;
  }
}
