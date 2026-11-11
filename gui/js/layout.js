// Posiciona automaticamente os estados do AFD (que não têm coordenadas):
// uma coluna por nível da busca em largura a partir do estado inicial.

const ESPACO_X = 170;
const ESPACO_Y = 130;
const MARGEM = 90;

export function posicionar(estados, transicoes) {
  const vizinhos = new Map(estados.map((e) => [e.nome, []]));
  for (const t of transicoes) vizinhos.get(t.de).push(t.para);

  const inicial = estados.find((e) => e.inicial);
  const nivel = new Map([[inicial.nome, 0]]);
  const fila = [inicial.nome];

  while (fila.length) {
    const atual = fila.shift();
    for (const proximo of vizinhos.get(atual)) {
      if (!nivel.has(proximo)) {
        nivel.set(proximo, nivel.get(atual) + 1);
        fila.push(proximo);
      }
    }
  }

  const colunas = [];
  for (const e of estados) {
    const n = nivel.get(e.nome) ?? 0;
    (colunas[n] ??= []).push(e);
  }

  const maiorColuna = Math.max(...colunas.map((c) => c.length));
  const posicoes = new Map();

  colunas.forEach((coluna, i) => {
    const deslocamento = ((maiorColuna - coluna.length) * ESPACO_Y) / 2;
    coluna.forEach((e, j) => {
      posicoes.set(e.nome, {
        x: MARGEM + i * ESPACO_X,
        y: MARGEM + deslocamento + j * ESPACO_Y,
      });
    });
  });

  return posicoes;
}
