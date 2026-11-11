// Execução passo a passo de uma palavra.
//
// Recebe a lista de passos de executar() e avança/volta por ela,
// avisando o app (aoPasso) para destacar os estados no AFN e no AFD.

export class Execucao {
  constructor(elementos, { executar, aoPasso }) {
    this.el = elementos;
    this.executar = executar;
    this.aoPasso = aoPasso;
    this.resultado = null;
    this.indice = 0;

    const { entrada, iniciar, voltar, avancar, reiniciar } = elementos;
    iniciar.onclick = () => this.iniciar();
    voltar.onclick = () => this.ir(this.indice - 1);
    avancar.onclick = () => this.ir(this.indice + 1);
    reiniciar.onclick = () => this.parar();
    entrada.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") this.iniciar();
    });
    this.parar();
  }

  get palavra() {
    return this.el.entrada.value;
  }

  iniciar() {
    const resultado = this.executar(this.palavra);
    if (!resultado) return;
    this.resultado = resultado;
    this.palavraAtual = [...this.palavra];
    this.ir(0);
  }

  parar() {
    this.resultado = null;
    this.indice = 0;
    this.el.fita.replaceChildren();
    this.el.info.textContent = "Digite uma palavra e clique em Iniciar (vazio = palavra ε).";
    this.el.veredito.hidden = true;
    this.atualizarBotoes();
    this.aoPasso(null);
  }

  ir(indice) {
    const passos = this.resultado.passos;
    this.indice = Math.max(0, Math.min(indice, passos.length - 1));
    const passo = passos[this.indice];
    const fim = this.indice === passos.length - 1;

    this.desenharFita();
    const conjunto = passo.afn.length ? `{${passo.afn.join(", ")}}` : "∅";
    const lido = passo.lido === null ? "início" : `leu "${passo.lido}"`;
    this.el.info.textContent =
      `Passo ${this.indice} de ${passos.length - 1} (${lido}): AFD em ${passo.afd} = ${conjunto} do AFN`;

    this.el.veredito.hidden = !fim;
    if (fim) {
      const aceita = this.resultado.aceita;
      this.el.veredito.textContent = aceita ? "ACEITA" : "REJEITADA";
      this.el.veredito.className = `veredito ${aceita ? "aceita" : "rejeita"}`;
    }

    this.atualizarBotoes();
    this.aoPasso(passo);
  }

  desenharFita() {
    const simbolos = this.palavraAtual.length ? this.palavraAtual : ["ε"];
    this.el.fita.replaceChildren(...simbolos.map((s, i) => {
      const celula = document.createElement("span");
      celula.textContent = s;
      if (!this.palavraAtual.length) celula.className = "vazia";
      else if (i < this.indice) celula.className = "lido";
      else if (i === this.indice) celula.className = "atual";
      return celula;
    }));
  }

  atualizarBotoes() {
    const ativo = this.resultado !== null;
    const ultimo = ativo ? this.resultado.passos.length - 1 : 0;
    this.el.voltar.disabled = !ativo || this.indice === 0;
    this.el.avancar.disabled = !ativo || this.indice === ultimo;
    this.el.reiniciar.disabled = !ativo;
  }

  habilitar(pronto) {
    this.el.iniciar.disabled = !pronto;
  }
}
