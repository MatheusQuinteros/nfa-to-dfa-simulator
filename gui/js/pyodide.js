// Carrega o Pyodide, copia o backend Python para dentro dele
// e expõe converter() / executar() para o resto da GUI.

const ARQUIVOS_BACKEND = [
  "__init__.py", "automato.py", "validacao.py",
  "operacoes.py", "conversao.py", "simulador.py",
];

let ponte = null;

async function baixar(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) throw new Error(`Não consegui baixar ${caminho}`);
  return resposta.text();
}

export async function iniciarPython() {
  const pyodide = await loadPyodide();
  const fs = pyodide.FS;
  const raiz = "/home/pyodide";

  fs.mkdirTree(`${raiz}/backend`);
  for (const nome of ARQUIVOS_BACKEND) {
    fs.writeFile(`${raiz}/backend/${nome}`, await baixar(`../backend/${nome}`));
  }
  fs.writeFile(`${raiz}/ponte.py`, await baixar("py/ponte.py"));

  pyodide.runPython(`import sys\nif "${raiz}" not in sys.path: sys.path.insert(0, "${raiz}")`);
  ponte = pyodide.pyimport("ponte");
}

export function converter(modelo) {
  return JSON.parse(ponte.converter(JSON.stringify(modelo)));
}

export function executar(modelo, palavra) {
  return JSON.parse(ponte.executar(JSON.stringify(modelo), palavra));
}
