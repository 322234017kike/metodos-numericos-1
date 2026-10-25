// Convierte el texto que captura el usuario en funciones y números.
// Usa un intérprete propio que solo entiende matemáticas: el texto nunca se ejecuta como código,
// así que escribir algo como "alert(1)" o "fetch(...)" simplemente se rechaza.
window.MN = window.MN || {};

(() => {
'use strict';

const { falla } = MN.util;

const LONGITUD_MAX = 300;
const PROFUNDIDAD_MAX = 60;

const CONSTANTES = { pi: Math.PI, e: Math.E };

// Solo estas funciones existen; cualquier otro nombre es un error.
const FUNCIONES = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, ln: Math.log, log: Math.log, log10: Math.log10, log2: Math.log2,
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
};

// ---------------- Análisis léxico ----------------

function separar(texto) {
  const fichas = [];
  const re = /\s*(?:(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([A-Za-zπ][A-Za-z0-9_]*)|(\*\*|[-+*/^(),]))/y;
  let i = 0;
  while (i < texto.length) {
    if (/^\s*$/.test(texto.slice(i))) break;
    re.lastIndex = i;
    const m = re.exec(texto);
    if (!m) falla(`Carácter no permitido: "${texto.slice(i).trim()[0]}". Solo se aceptan números, x, operaciones (+ − * / ^), paréntesis y funciones matemáticas.`);
    if (m[1] !== undefined) fichas.push({ tipo: 'num', valor: Number(m[1]) });
    else if (m[2] !== undefined) fichas.push({ tipo: 'nombre', valor: m[2] === 'π' ? 'pi' : m[2].toLowerCase() });
    else fichas.push({ tipo: 'op', valor: m[3] === '**' ? '^' : m[3] });
    i = re.lastIndex;
  }
  return fichas;
}

// ---------------- Análisis sintáctico (descenso recursivo) ----------------
// expr := term (('+'|'-') term)*
// term := unario (('*'|'/') unario | unario implícito)*
// unario := ('-'|'+') unario | potencia
// potencia := primario ('^' unario)?
// primario := número | constante | variable | función '(' expr ')' | '(' expr ')'

function analizar(texto, variables = []) {
  const t = String(texto ?? '').trim();
  if (!t) falla('La expresión está vacía.');
  if (t.length > LONGITUD_MAX) falla(`La expresión es demasiado larga (máximo ${LONGITUD_MAX} caracteres).`);
  const fichas = separar(t);
  let pos = 0;
  let profundidad = 0;

  const ver = () => fichas[pos];
  const esOp = (v) => ver()?.tipo === 'op' && ver().valor === v;
  const esperar = (v) => {
    if (!esOp(v)) falla(v === ')' ? 'Falta cerrar un paréntesis ")".' : `Se esperaba "${v}".`);
    pos++;
  };
  const entrar = () => { if (++profundidad > PROFUNDIDAD_MAX) falla('La expresión tiene demasiados niveles anidados.'); };

  function expr() {
    entrar();
    let nodo = term();
    while (esOp('+') || esOp('-')) {
      const op = fichas[pos++].valor;
      nodo = { t: 'op', op, a: nodo, b: term() };
    }
    profundidad--;
    return nodo;
  }

  function term() {
    let nodo = unario();
    for (;;) {
      if (esOp('*') || esOp('/')) {
        const op = fichas[pos++].valor;
        nodo = { t: 'op', op, a: nodo, b: unario() };
      } else if (ver() && (ver().tipo !== 'op' || ver().valor === '(')) {
        nodo = { t: 'op', op: '*', a: nodo, b: unario() }; // multiplicación implícita: 2x, 3(x+1)
      } else return nodo;
    }
  }

  function unario() {
    if (esOp('-')) { pos++; entrar(); const a = unario(); profundidad--; return { t: 'neg', a }; }
    if (esOp('+')) { pos++; return unario(); }
    return potencia();
  }

  function potencia() {
    const base = primario();
    if (esOp('^')) { pos++; entrar(); const exp = unario(); profundidad--; return { t: 'op', op: '^', a: base, b: exp }; }
    return base;
  }

  function primario() {
    const f = ver();
    if (!f) falla('La expresión está incompleta.');
    if (f.tipo === 'num') { pos++; return { t: 'num', v: f.valor }; }
    if (f.tipo === 'op' && f.valor === '(') {
      pos++;
      const nodo = expr();
      esperar(')');
      return nodo;
    }
    if (f.tipo === 'nombre') {
      pos++;
      if (Object.hasOwn(FUNCIONES, f.valor)) {
        if (!esOp('(')) falla(`La función ${f.valor} necesita paréntesis, por ejemplo ${f.valor}(x).`);
        pos++;
        const a = expr();
        esperar(')');
        return { t: 'fn', f: f.valor, a };
      }
      if (Object.hasOwn(CONSTANTES, f.valor)) return { t: 'const', n: f.valor, v: CONSTANTES[f.valor] };
      if (variables.includes(f.valor)) return { t: 'var', n: f.valor };
      falla(variables.length
        ? `"${f.valor}" no es una función ni una variable válida. Usa x como variable y funciones como sin, cos, exp, ln, sqrt.`
        : `"${f.valor}" no es un número válido. Puedes usar pi, e y funciones como sqrt(2).`);
    }
    falla(`Símbolo inesperado "${f.valor}".`);
  }

  const arbol = expr();
  if (pos < fichas.length) falla(esOp(')') ? 'Sobra un paréntesis ")".' : `Sobra "${ver().valor}" al final de la expresión.`);
  return arbol;
}

// ---------------- Evaluación ----------------

function evaluar(nodo, x) {
  switch (nodo.t) {
    case 'num':
    case 'const': return nodo.v;
    case 'var': return x;
    case 'neg': return -evaluar(nodo.a, x);
    case 'fn': return FUNCIONES[nodo.f](evaluar(nodo.a, x));
    case 'op': {
      const a = evaluar(nodo.a, x), b = evaluar(nodo.b, x);
      switch (nodo.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        default: return a ** b;
      }
    }
    default: return NaN;
  }
}

// ---------------- Derivación simbólica ----------------

const num = (v) => ({ t: 'num', v });
const esNum = (n, v) => n.t === 'num' && (v === undefined || n.v === v);
const contieneX = (n) => n.t === 'var' || (n.a && contieneX(n.a)) || (n.b && contieneX(n.b));

// Constructores que simplifican lo obvio (0 + a = a, 1·a = a, constantes numéricas, ...).
const sumar = (a, b) => (esNum(a, 0) ? b : esNum(b, 0) ? a : esNum(a) && esNum(b) ? num(a.v + b.v) : { t: 'op', op: '+', a, b });
const restar = (a, b) => (esNum(b, 0) ? a : esNum(a, 0) ? negar(b) : esNum(a) && esNum(b) ? num(a.v - b.v) : { t: 'op', op: '-', a, b });
const negar = (a) => (esNum(a) ? num(-a.v) : a.t === 'neg' ? a.a : { t: 'neg', a });
function multiplicar(a, b) {
  if (esNum(a, 0) || esNum(b, 0)) return num(0);
  if (esNum(a, 1)) return b;
  if (esNum(b, 1)) return a;
  if (esNum(a) && esNum(b)) return num(a.v * b.v);
  if (esNum(b)) return multiplicar(b, a); // el número va adelante: 3·x
  if (a.t === 'neg') return negar(multiplicar(a.a, b));
  if (b.t === 'neg') return negar(multiplicar(a, b.a));
  return { t: 'op', op: '*', a, b };
}
const dividir = (a, b) => (esNum(a, 0) ? num(0) : esNum(b, 1) ? a : { t: 'op', op: '/', a, b });
const elevar = (a, b) => (esNum(b, 0) ? num(1) : esNum(b, 1) ? a : esNum(a) && esNum(b) ? num(a.v ** b.v) : { t: 'op', op: '^', a, b });
const fn = (f, a) => ({ t: 'fn', f, a });

function derivada(n) {
  switch (n.t) {
    case 'num':
    case 'const': return num(0);
    case 'var': return num(1);
    case 'neg': return negar(derivada(n.a));
    case 'fn': {
      const u = n.a, du = derivada(u);
      if (esNum(du, 0)) return num(0);
      const interna = {
        sin: () => fn('cos', u),
        cos: () => negar(fn('sin', u)),
        tan: () => dividir(num(1), elevar(fn('cos', u), num(2))),
        asin: () => dividir(num(1), fn('sqrt', restar(num(1), elevar(u, num(2))))),
        acos: () => negar(dividir(num(1), fn('sqrt', restar(num(1), elevar(u, num(2)))))),
        atan: () => dividir(num(1), sumar(num(1), elevar(u, num(2)))),
        sinh: () => fn('cosh', u),
        cosh: () => fn('sinh', u),
        tanh: () => dividir(num(1), elevar(fn('cosh', u), num(2))),
        exp: () => fn('exp', u),
        ln: () => dividir(num(1), u),
        log: () => dividir(num(1), u),
        log10: () => dividir(num(1), multiplicar(u, fn('ln', num(10)))),
        log2: () => dividir(num(1), multiplicar(u, fn('ln', num(2)))),
        sqrt: () => dividir(num(1), multiplicar(num(2), fn('sqrt', u))),
        cbrt: () => dividir(num(1), multiplicar(num(3), elevar(fn('cbrt', u), num(2)))),
        abs: () => dividir(u, fn('abs', u)),
      }[n.f]();
      return multiplicar(interna, du);
    }
    case 'op': {
      const { a, b } = n;
      switch (n.op) {
        case '+': return sumar(derivada(a), derivada(b));
        case '-': return restar(derivada(a), derivada(b));
        case '*': return sumar(multiplicar(derivada(a), b), multiplicar(a, derivada(b)));
        case '/': return dividir(restar(multiplicar(derivada(a), b), multiplicar(a, derivada(b))), elevar(b, num(2)));
        default: {
          if (!contieneX(b)) {
            // (u^c)' = c·u^(c−1)·u'
            const c = esNum(b) ? num(b.v - 1) : restar(b, num(1));
            return multiplicar(multiplicar(b, elevar(a, c)), derivada(a));
          }
          if (!contieneX(a)) return multiplicar(multiplicar(n, fn('ln', a)), derivada(b)); // (c^v)' = c^v·ln(c)·v'
          // (u^v)' = u^v·(v'·ln u + v·u'/u)
          return multiplicar(n, sumar(multiplicar(derivada(b), fn('ln', a)), dividir(multiplicar(b, derivada(a)), a)));
        }
      }
    }
    default: return num(0);
  }
}

// ---------------- Texto de una expresión ----------------

const PRECEDENCIA = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 };

function aTexto(n, padre = 0) {
  const envolver = (s, p) => (p < padre ? `(${s})` : s);
  switch (n.t) {
    case 'num': return n.v < 0 ? envolver(String(n.v), PRECEDENCIA.neg) : String(n.v);
    case 'const': return n.n;
    case 'var': return n.n;
    case 'fn': return `${n.f}(${aTexto(n.a)})`;
    case 'neg': return envolver(`-${aTexto(n.a, PRECEDENCIA.neg)}`, PRECEDENCIA.neg);
    case 'op': {
      const p = PRECEDENCIA[n.op];
      if (n.op === '^') return envolver(`${aTexto(n.a, p + 1)}^${aTexto(n.b, p)}`, p);
      const der = aTexto(n.b, n.op === '-' || n.op === '/' ? p + 1 : p);
      return envolver(`${aTexto(n.a, p)} ${n.op} ${der}`, p);
    }
    default: return '?';
  }
}

// ---------------- Interfaz pública ----------------

/** Compila una expresión en x, por ejemplo "x^3 - 2*x - 5" o "exp(-x) - x". */
function compilarFuncion(expr) {
  const texto = String(expr ?? '').trim();
  if (!texto) falla('Escribe la función f(x).');
  let arbol;
  try {
    arbol = analizar(texto, ['x']);
  } catch (e) {
    falla(`No se entiende la función "${texto.slice(0, 60)}": ${e.message}`);
  }
  return (x) => evaluar(arbol, x);
}

/** Derivada simbólica de la expresión, junto con su texto simplificado. */
function derivar(expr) {
  const d = derivada(analizar(expr, ['x']));
  return { df: (x) => evaluar(d, x), texto: aTexto(d) };
}

/** Evalúa un número que puede escribirse como expresión: "1e-6", "pi/4", "sqrt(2)". */
function evaluarNumero(texto, nombre) {
  const t = String(texto ?? '').trim();
  if (t === '') falla(`Falta el valor de ${nombre}.`);
  let v;
  try {
    v = evaluar(analizar(t, []), 0);
  } catch (e) {
    falla(`El valor de ${nombre} ("${t.slice(0, 40)}") no es válido: ${e.message}`);
  }
  if (!Number.isFinite(v)) falla(`El valor de ${nombre} ("${t.slice(0, 40)}") no es un número finito.`);
  return v;
}

const ELEMENTOS_MAX = 50;

/** Lista de números separados por comas, punto y coma o espacios. */
function evaluarLista(texto, nombre) {
  const t = String(texto ?? '');
  // Con comas o punto y coma se separa por ellos (así "pi / 4" es un solo valor); si no, por espacios.
  const partes = t.split(/[,;]/.test(t) ? /[,;]/ : /\s+/).map((p) => p.trim()).filter(Boolean);
  if (partes.length === 0) falla(`Captura los valores de ${nombre}.`);
  if (partes.length > ELEMENTOS_MAX) falla(`${nombre} admite como máximo ${ELEMENTOS_MAX} valores.`);
  return partes.map((p, i) => evaluarNumero(p, `${nombre} (posición ${i + 1})`));
}

MN.expresiones = { analizar, aTexto, compilarFuncion, derivar, evaluarNumero, evaluarLista };
})();
