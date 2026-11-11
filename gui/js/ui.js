// Pequenos componentes de interface: mensagem, caixa de texto e menu de contexto.

const barra = () => document.getElementById("mensagem");
let temporizador = null;

export function mostrarMensagem(texto, tipo = "info") {
  const b = barra();
  b.textContent = texto;
  b.className = `mensagem ${tipo}`;
  b.hidden = false;
  clearTimeout(temporizador);
  if (tipo !== "erro") temporizador = setTimeout(esconderMensagem, 3500);
}

export function esconderMensagem() {
  barra().hidden = true;
}

function posicionar(caixa, x, y) {
  document.body.appendChild(caixa);
  const largura = caixa.offsetWidth;
  const altura = caixa.offsetHeight;
  caixa.style.left = `${Math.max(8, Math.min(x, innerWidth - largura - 8))}px`;
  caixa.style.top = `${Math.max(8, Math.min(y, innerHeight - altura - 8))}px`;
}

// Mostra uma caixa de texto flutuante. Resolve com o texto, ou null se cancelada.
export function pedirTexto({ titulo, dica = "", valor = "", x, y }) {
  fecharFlutuantes();
  return new Promise((resolver) => {
    const caixa = document.createElement("form");
    caixa.className = "flutuante caixa-texto";
    caixa.innerHTML = `
      <label>${titulo}<input type="text" autocomplete="off" spellcheck="false"></label>
      ${dica ? `<small>${dica}</small>` : ""}
      <div class="acoes">
        <button type="button" data-cancelar>Cancelar</button>
        <button type="submit" class="primario">OK</button>
      </div>`;
    const campo = caixa.querySelector("input");
    campo.value = valor;

    const terminar = (resultado) => {
      caixa.remove();
      document.removeEventListener("pointerdown", foraDaCaixa, true);
      resolver(resultado);
    };
    const foraDaCaixa = (ev) => {
      if (!caixa.contains(ev.target)) terminar(null);
    };

    caixa.addEventListener("submit", (ev) => {
      ev.preventDefault();
      terminar(campo.value);
    });
    caixa.querySelector("[data-cancelar]").onclick = () => terminar(null);
    caixa.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") terminar(null);
    });
    caixa.fechar = () => terminar(null);

    posicionar(caixa, x, y);
    campo.focus();
    campo.select();
    setTimeout(() => document.addEventListener("pointerdown", foraDaCaixa, true));
  });
}

// itens: [{ rotulo, acao, marcado? }]
export function mostrarMenu(itens, x, y) {
  fecharFlutuantes();
  const menu = document.createElement("div");
  menu.className = "flutuante menu";
  menu.setAttribute("role", "menu");

  const fechar = () => {
    menu.remove();
    document.removeEventListener("pointerdown", fora, true);
  };
  const fora = (ev) => {
    if (!menu.contains(ev.target)) fechar();
  };
  menu.fechar = fechar;

  for (const item of itens) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.setAttribute("role", "menuitem");
    botao.textContent = (item.marcado !== undefined ? (item.marcado ? "✓ " : "  ") : "") + item.rotulo;
    if (item.perigo) botao.classList.add("perigo");
    botao.onclick = () => {
      fechar();
      item.acao();
    };
    menu.appendChild(botao);
  }

  posicionar(menu, x, y);
  setTimeout(() => document.addEventListener("pointerdown", fora, true));
}

export function fecharFlutuantes() {
  document.querySelectorAll(".flutuante").forEach((f) => (f.fechar ? f.fechar() : f.remove()));
}
