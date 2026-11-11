// Liga as partes da interface: editor do AFN, visão do AFD e execução.

import { EditorAFN, EPSILON } from "./editor.js";
import { VisaoAFD } from "./afd.js";
import { Execucao } from "./execucao.js";
import { iniciarPython, converter, executar } from "./pyodide.js";
import { mostrarMensagem, esconderMensagem, fecharFlutuantes, mostrarMenu } from "./ui.js";

const $ = (id) => document.getElementById(id);

// L = a*b ∪ ab*
const EXEMPLO = {
  estados: [
    { nome: "q0", x: 110, y: 220, inicial: true, final: false },
    { nome: "q1", x: 290, y: 120, inicial: false, final: false },
    { nome: "q2", x: 480, y: 120, inicial: false, final: true },
    { nome: "q3", x: 290, y: 320, inicial: false, final: false },
    { nome: "q4", x: 480, y: 320, inicial: false, final: true },
  ],
  transicoes: [
    { de: "q0", para: "q1", simbolos: [EPSILON] },
    { de: "q0", para: "q3", simbolos: [EPSILON] },
    { de: "q1", para: "q1", simbolos: ["a"] },
    { de: "q1", para: "q2", simbolos: ["b"] },
    { de: "q3", para: "q4", simbolos: ["a"] },
    { de: "q4", para: "q4", simbolos: ["b"] },
  ],
};

let pythonPronto = false;
let afdDesatualizado = true;
let abaAtual = "afn";

const visaoAFD = new VisaoAFD($("tela-afd"), $("tabela-afd"));

const editor = new EditorAFN($("tela-afn"), {
  aoMudar() {
    afdDesatualizado = true;
    execucao.parar();
    if (abaAtual === "afd") atualizarAFD();
  },
});

const execucao = new Execucao({
  entrada: $("palavra"),
  iniciar: $("btn-iniciar"),
  voltar: $("btn-voltar"),
  avancar: $("btn-avancar"),
  reiniciar: $("btn-reiniciar"),
  fita: $("fita"),
  info: $("info-passo"),
  veredito: $("veredito"),
}, {
  executar(palavra) {
    if (!atualizarAFD()) return null;
    const resultado = executar(editor.modeloBackend(), palavra);
    if (resultado.erro) {
      mostrarMensagem(resultado.erro, "erro");
      return null;
    }
    esconderMensagem();
    return resultado;
  },
  aoPasso(passo) {
    editor.destacar(passo ? passo.afn : []);
    if (!afdDesatualizado) visaoAFD.destacar(passo ? passo.afd : null);
  },
});

// Converte de novo se o AFN mudou. Devolve false se houve erro.
function atualizarAFD() {
  if (!pythonPronto) return false;
  if (!afdDesatualizado) return true;

  const afd = converter(editor.modeloBackend());
  const vazio = $("afd-vazio");
  if (afd.erro) {
    mostrarMensagem(afd.erro, "erro");
    vazio.hidden = false;
    vazio.textContent = `Não foi possível converter: ${afd.erro}`;
    $("conteudo-afd").hidden = true;
    return false;
  }

  esconderMensagem();
  vazio.hidden = true;
  $("conteudo-afd").hidden = false;
  visaoAFD.mostrar(afd);
  afdDesatualizado = false;
  return true;
}

function trocarAba(aba) {
  fecharFlutuantes();
  abaAtual = aba;
  for (const botao of document.querySelectorAll("[data-aba]")) {
    const ativa = botao.dataset.aba === aba;
    botao.classList.toggle("ativa", ativa);
    botao.setAttribute("aria-selected", ativa);
  }
  $("painel-afn").hidden = aba !== "afn";
  $("painel-afd").hidden = aba !== "afd";
  if (aba === "afd") {
    const estava = afdDesatualizado;
    atualizarAFD();
    // uma execução em andamento continua destacada depois de converter
    if (estava && execucao.resultado) visaoAFD.destacar(execucao.resultado.passos[execucao.indice].afd);
  }
}

function definirModo(modo) {
  for (const botao of document.querySelectorAll("[data-modo]")) {
    botao.classList.toggle("ativa", botao.dataset.modo === modo);
    botao.setAttribute("aria-pressed", botao.dataset.modo === modo);
  }
  $("dica").textContent = editor.definirModo(modo);
}

// ---------- eventos ----------

for (const botao of document.querySelectorAll("[data-aba]")) {
  botao.onclick = () => trocarAba(botao.dataset.aba);
}
for (const botao of document.querySelectorAll("[data-modo]")) {
  botao.onclick = () => definirModo(botao.dataset.modo);
}
$("btn-exemplo").onclick = () => editor.carregar(EXEMPLO);
$("btn-limpar").onclick = (ev) => {
  if (!editor.estados.length) return;
  const caixa = ev.currentTarget.getBoundingClientRect();
  mostrarMenu([
    { rotulo: "Apagar todo o autômato", perigo: true, acao: () => editor.limpar() },
  ], caixa.left, caixa.bottom + 4);
};

document.addEventListener("keydown", (ev) => {
  if (ev.target.closest("input, textarea") || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const atalhos = { e: "estado", t: "transicao", m: "mover", x: "apagar" };
  if (atalhos[ev.key] && abaAtual === "afn") definirModo(atalhos[ev.key]);
});

// ---------- início ----------

definirModo("estado");
editor.carregar(EXEMPLO);
execucao.habilitar(false);

iniciarPython()
  .then(() => {
    pythonPronto = true;
    $("status-python").hidden = true;
    execucao.habilitar(true);
    if (abaAtual === "afd") atualizarAFD();
  })
  .catch((erro) => {
    console.error(erro);
    $("status-python").textContent = "Falha ao carregar o Python";
    $("status-python").classList.add("falha");
    mostrarMensagem(`Não foi possível carregar o Python: ${erro.message}`, "erro");
  });
