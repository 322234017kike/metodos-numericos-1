// Convierte el texto que captura el usuario en funciones y números.
// Usa math.js si está cargado; si no (sin internet), un evaluador con Math como respaldo.
window.MN = window.MN || {};

(() => {
'use strict';

const { falla } = MN.util;

const hayMathJs = () => typeof window !== 'undefined' && window.math && typeof window.math.compile === 'function';

function respaldo(expr, variables) {
  const js = expr.replace(/\^/g, '**').replace(/\bln\(/g, 'log(');
  // eslint-disable-next-line no-new-func
  return new Function(...variables, `with (Math) { return (${js}); }`);
}

/** Compila una expresión en x, por ejemplo "x^3 - 2*x - 5" o "exp(-x) - x". */
function compilarFuncion(expr) {
  const texto = String(expr ?? '').trim();
  if (!texto) falla('Escribe la función f(x).');
  let f;
  try {
    if (hayMathJs()) {
      const codigo = window.math.compile(texto);
      f = (x) => Number(codigo.evaluate({ x }));
    } else {
      const g = respaldo(texto, ['x']);
      f = (x) => Number(g(x));
    }
    f(1.2345);
  } catch {
    falla(`No se entiende la función "${texto}". Usa x como variable, por ejemplo: x^3 - 2*x - 5`);
  }
  return f;
}

/** Derivada simbólica con math.js; si no está disponible, diferencia central. */
function derivar(expr) {
  const texto = String(expr).trim();
  if (hayMathJs()) {
    try {
      const d = window.math.derivative(texto, 'x');
      const codigo = d.compile();
      return { df: (x) => Number(codigo.evaluate({ x })), texto: d.toString() };
    } catch { /* se usa el respaldo numérico */ }
  }
  const f = compilarFuncion(texto);
  const h = 1e-6;
  return { df: (x) => (f(x + h) - f(x - h)) / (2 * h), texto: 'derivada numérica (diferencia central)' };
}

/** Evalúa un número que puede escribirse como expresión: "1e-6", "pi/4", "sqrt(2)". */
function evaluarNumero(texto, nombre) {
  const t = String(texto ?? '').trim();
  if (t === '') falla(`Falta el valor de ${nombre}.`);
  let v;
  try {
    v = hayMathJs() ? Number(window.math.evaluate(t)) : Number(respaldo(t, [])());
  } catch {
    v = NaN;
  }
  if (!Number.isFinite(v)) falla(`El valor de ${nombre} ("${t}") no es un número válido.`);
  return v;
}

/** Lista de números separados por comas o espacios. */
function evaluarLista(texto, nombre) {
  const partes = String(texto ?? '').split(/[,;\s]+/).filter(Boolean);
  if (partes.length === 0) falla(`Captura los valores de ${nombre}.`);
  return partes.map((p, i) => evaluarNumero(p, `${nombre} (posición ${i + 1})`));
}

MN.expresiones = { compilarFuncion, derivar, evaluarNumero, evaluarLista };
})();
