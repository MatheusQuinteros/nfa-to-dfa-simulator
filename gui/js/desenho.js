// Renderização SVG de autômatos (usada tanto pelo AFN quanto pelo AFD).
//
// Modelo genérico:
//   estados: [{ id, nome, sub?, x, y, inicial, final, erro? }]
//   arestas: [{ id, de, para, rotulo }]   (de/para são ids de estados)

const NS = "http://www.w3.org/2000/svg";
export const RAIO = 24;

function el(tag, atributos, pai) {
  const no = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(atributos)) no.setAttribute(k, v);
  if (pai) pai.appendChild(no);
  return no;
}

function texto(conteudo, atributos, pai) {
  const no = el("text", atributos, pai);
  no.textContent = conteudo;
  return no;
}

// Ponto na borda do círculo de `estado`, na direção de (alvoX, alvoY).
function naBorda(estado, alvoX, alvoY) {
  const dx = alvoX - estado.x;
  const dy = alvoY - estado.y;
  const dist = Math.hypot(dx, dy) || 1;
  return [estado.x + (dx / dist) * RAIO, estado.y + (dy / dist) * RAIO];
}

// Direção (ângulo) mais livre para o laço de um estado: oposta à média
// das direções das outras transições ligadas a ele. Sem vizinhos, para cima.
function anguloDoLaco(estado, vizinhos) {
  let sx = 0;
  let sy = 0;
  for (const v of vizinhos) {
    const d = Math.hypot(v.x - estado.x, v.y - estado.y) || 1;
    sx += (v.x - estado.x) / d;
    sy += (v.y - estado.y) / d;
  }
  if (Math.hypot(sx, sy) < 0.3) return -Math.PI / 2;
  return Math.atan2(-sy, -sx);
}

function polar(estado, angulo, distancia) {
  return [estado.x + distancia * Math.cos(angulo), estado.y + distancia * Math.sin(angulo)];
}

function desenharAresta(pai, origem, destino, aresta, curvar, seta, anguloLaco) {
  const g = el("g", { class: "aresta", "data-aresta": aresta.id }, pai);
  let caminho, lx, ly;

  if (origem === destino) {
    const a = anguloLaco;
    const p1 = polar(origem, a - 0.55, RAIO);
    const p2 = polar(origem, a + 0.55, RAIO);
    const c1 = polar(origem, a - 0.38, RAIO + 58);
    const c2 = polar(origem, a + 0.38, RAIO + 58);
    caminho = `M ${p1} C ${c1}, ${c2}, ${p2}`;
    [lx, ly] = polar(origem, a, RAIO + 58);
    ly += 5;
  } else {
    const dx = destino.x - origem.x;
    const dy = destino.y - origem.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dy / dist;
    const ny = -dx / dist;
    const desvio = curvar ? 28 : 0;
    const cx = (origem.x + destino.x) / 2 + nx * desvio;
    const cy = (origem.y + destino.y) / 2 + ny * desvio;
    const ini = naBorda(origem, cx, cy);
    const fim = naBorda(destino, cx, cy);
    caminho = `M ${ini} Q ${cx} ${cy} ${fim}`;
    // ponto do meio da curva, afastado um pouco para o lado de fora
    const mx = 0.25 * ini[0] + 0.5 * cx + 0.25 * fim[0];
    const my = 0.25 * ini[1] + 0.5 * cy + 0.25 * fim[1];
    lx = mx + nx * 12;
    ly = my + ny * 12 + 4;
  }

  el("path", { d: caminho, class: "linha", "marker-end": `url(#${seta})` }, g);
  el("path", { d: caminho, class: "alvo" }, g);
  texto(aresta.rotulo, { x: lx, y: ly, class: "rotulo" }, g);
}

function desenharEstado(pai, estado, destacado, subAcima) {
  const classes = ["estado"];
  if (destacado) classes.push("ativo");
  if (estado.erro) classes.push("erro");

  const g = el("g", {
    class: classes.join(" "),
    "data-estado": estado.id,
    transform: `translate(${estado.x} ${estado.y})`,
  }, pai);

  if (estado.inicial) {
    el("polygon", {
      points: `${-RAIO},0 ${-RAIO - 18},-12 ${-RAIO - 18},12`,
      class: "inicial",
    }, g);
  }
  el("circle", { r: RAIO, class: "corpo" }, g);
  if (estado.final) el("circle", { r: RAIO - 4, class: "anel" }, g);
  texto(estado.nome, { y: 5, class: "nome" }, g);
  if (estado.sub !== undefined) {
    texto(estado.sub, { y: subAcima ? -RAIO - 8 : RAIO + 17, class: "sub" }, g);
  }
}

export function renderizar(svg, { estados, arestas }, opcoes = {}) {
  const { destacados = new Set(), rascunho = null } = opcoes;
  const seta = `${svg.id}-seta`;

  svg.replaceChildren();

  const defs = el("defs", {}, svg);
  const marcador = el("marker", {
    id: seta, viewBox: "0 0 10 10", refX: 10, refY: 5,
    markerWidth: 11, markerHeight: 11, markerUnits: "userSpaceOnUse",
    orient: "auto-start-reverse",
  }, defs);
  el("path", { d: "M0,0 L10,5 L0,10 z", class: "ponta" }, marcador);

  const porId = new Map(estados.map((e) => [e.id, e]));
  const pares = new Set(arestas.map((a) => `${a.de}->${a.para}`));

  const vizinhos = new Map(estados.map((e) => [e.id, []]));
  for (const a of arestas) {
    if (a.de === a.para || !porId.has(a.de) || !porId.has(a.para)) continue;
    vizinhos.get(a.de).push(porId.get(a.para));
    vizinhos.get(a.para).push(porId.get(a.de));
  }

  const camadaArestas = el("g", {}, svg);
  const camadaEstados = el("g", {}, svg);
  const lacoEmbaixo = new Set();

  for (const a of arestas) {
    const origem = porId.get(a.de);
    const destino = porId.get(a.para);
    if (!origem || !destino) continue;
    const curvar = a.de !== a.para && pares.has(`${a.para}->${a.de}`);
    const angulo = a.de === a.para ? anguloDoLaco(origem, vizinhos.get(a.de)) : 0;
    if (a.de === a.para && Math.sin(angulo) > 0.5) lacoEmbaixo.add(a.de);
    desenharAresta(camadaArestas, origem, destino, a, curvar, seta, angulo);
  }

  for (const e of estados) {
    desenharEstado(camadaEstados, e, destacados.has(e.id), lacoEmbaixo.has(e.id));
  }

  if (rascunho) {
    const [x1, y1] = naBorda(rascunho.de, rascunho.x, rascunho.y);
    el("line", {
      x1, y1, x2: rascunho.x, y2: rascunho.y,
      class: "rascunho", "marker-end": `url(#${seta})`,
    }, svg);
  }
}

// Utilitários compartilhados pelo editor e pela visão do AFD

export function pontoSvg(svg, evento) {
  const p = new DOMPoint(evento.clientX, evento.clientY);
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

export function estadoNoPonto(estados, x, y) {
  // último desenhado fica por cima, então procura de trás para frente
  for (let i = estados.length - 1; i >= 0; i--) {
    const e = estados[i];
    if (Math.hypot(e.x - x, e.y - y) <= RAIO) return e;
  }
  return null;
}
