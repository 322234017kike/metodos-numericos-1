// Unidad 2: solución numérica de ecuaciones de una sola variable.
window.MN = window.MN || {};

(() => {
'use strict';

const { falla, validarFinito } = MN.util;

function validarParametros(tol, maxIter) {
  if (!(tol > 0)) falla('La tolerancia debe ser un número positivo.');
  if (!(Number.isInteger(maxIter) && maxIter > 0)) falla('El número máximo de iteraciones debe ser un entero positivo.');
}

const errorRelativo = (nuevo, anterior) => (nuevo !== 0 ? Math.abs((nuevo - anterior) / nuevo) : Math.abs(nuevo - anterior));

function cerrar(raiz, f, iteraciones, convergio, filas, columnas, avisos = []) {
  if (!convergio) avisos.push('Se alcanzó el máximo de iteraciones sin cumplir la tolerancia.');
  return {
    convergio,
    resultado: [
      { etiqueta: 'Raíz aproximada', valor: raiz },
      { etiqueta: 'f(raíz)', valor: f(raiz) },
      { etiqueta: 'Iteraciones', valor: iteraciones },
    ],
    columnas,
    filas,
    avisos,
  };
}

/** 2.1 Bisección: parte el intervalo [a, b] a la mitad conservando el cambio de signo. */
function biseccion({ f, a, b, tol, maxIter }) {
  validarParametros(tol, maxIter);
  if (!(a < b)) falla('Se requiere a < b.');
  let fa = validarFinito(f(a), 'f(a)');
  const fb = validarFinito(f(b), 'f(b)');
  if (fa === 0) return cerrar(a, f, 0, true, [], [], ['a ya es una raíz exacta.']);
  if (fb === 0) return cerrar(b, f, 0, true, [], [], ['b ya es una raíz exacta.']);
  if (fa * fb > 0) falla('f(a) y f(b) tienen el mismo signo: el intervalo no garantiza una raíz (teorema de Bolzano).');

  const columnas = ['n', 'a', 'b', 'xr = (a+b)/2', 'f(a)', 'f(xr)', 'f(a)·f(xr)', 'Error rel.'];
  const filas = [];
  let xr = a, anterior = NaN;
  for (let n = 1; n <= maxIter; n++) {
    anterior = xr;
    xr = (a + b) / 2;
    const fxr = validarFinito(f(xr), `f(${xr})`);
    const err = n === 1 ? NaN : errorRelativo(xr, anterior);
    filas.push([n, a, b, xr, fa, fxr, fa * fxr, err]);
    if (fxr === 0 || (n > 1 && err < tol)) return cerrar(xr, f, n, true, filas, columnas);
    if (fa * fxr < 0) b = xr;
    else { a = xr; fa = fxr; }
  }
  return cerrar(xr, f, maxIter, false, filas, columnas);
}

/** 2.2 Falsa posición: la nueva aproximación es la intersección de la secante con el eje x. */
function falsaPosicion({ f, a, b, tol, maxIter }) {
  validarParametros(tol, maxIter);
  if (!(a < b)) falla('Se requiere a < b.');
  let fa = validarFinito(f(a), 'f(a)');
  let fb = validarFinito(f(b), 'f(b)');
  if (fa === 0) return cerrar(a, f, 0, true, [], [], ['a ya es una raíz exacta.']);
  if (fb === 0) return cerrar(b, f, 0, true, [], [], ['b ya es una raíz exacta.']);
  if (fa * fb > 0) falla('f(a) y f(b) tienen el mismo signo: el intervalo no garantiza una raíz.');

  const columnas = ['n', 'a', 'b', 'f(a)', 'f(b)', 'xr', 'f(xr)', 'Error rel.'];
  const filas = [];
  let xr = a;
  for (let n = 1; n <= maxIter; n++) {
    const anterior = xr;
    xr = b - (fb * (a - b)) / (fa - fb);
    const fxr = validarFinito(f(xr), `f(${xr})`);
    const err = n === 1 ? NaN : errorRelativo(xr, anterior);
    filas.push([n, a, b, fa, fb, xr, fxr, err]);
    if (fxr === 0 || (n > 1 && err < tol)) return cerrar(xr, f, n, true, filas, columnas);
    if (fa * fxr < 0) { b = xr; fb = fxr; }
    else { a = xr; fa = fxr; }
  }
  return cerrar(xr, f, maxIter, false, filas, columnas);
}

/** 2.3 Newton-Raphson: x_{n+1} = x_n - f(x_n)/f'(x_n). */
function newton({ f, df, x0, tol, maxIter }) {
  validarParametros(tol, maxIter);
  const columnas = ['n', 'xn', 'f(xn)', "f'(xn)", 'xn+1', 'Error rel.'];
  const filas = [];
  let x = x0;
  for (let n = 0; n < maxIter; n++) {
    const fx = validarFinito(f(x), `f(${x})`);
    const dfx = validarFinito(df(x), `f'(${x})`);
    if (dfx === 0) falla(`La derivada se anula en x = ${x}: Newton no puede continuar. Prueba otro valor inicial.`);
    const siguiente = x - fx / dfx;
    const err = errorRelativo(siguiente, x);
    filas.push([n, x, fx, dfx, siguiente, err]);
    x = siguiente;
    if (err < tol || f(x) === 0) return cerrar(x, f, n + 1, true, filas, columnas);
  }
  return cerrar(x, f, maxIter, false, filas, columnas);
}

/** 2.4 Secante: Newton con la derivada aproximada por dos puntos. */
function secante({ f, x0, x1, tol, maxIter }) {
  validarParametros(tol, maxIter);
  if (x0 === x1) falla('x0 y x1 deben ser distintos.');
  const columnas = ['n', 'xn-1', 'xn', 'f(xn-1)', 'f(xn)', 'xn+1', 'Error rel.'];
  const filas = [];
  let anterior = x0, x = x1;
  for (let n = 1; n <= maxIter; n++) {
    const fa = validarFinito(f(anterior), `f(${anterior})`);
    const fx = validarFinito(f(x), `f(${x})`);
    if (fx === fa) falla('f(xn) = f(xn-1): la secante es horizontal y el método no puede continuar.');
    const siguiente = x - (fx * (anterior - x)) / (fa - fx);
    const err = errorRelativo(siguiente, x);
    filas.push([n, anterior, x, fa, fx, siguiente, err]);
    anterior = x;
    x = siguiente;
    if (err < tol || f(x) === 0) return cerrar(x, f, n, true, filas, columnas);
  }
  return cerrar(x, f, maxIter, false, filas, columnas);
}

/** Raíces de x² - r·x - s = 0 (pueden ser complejas). */
function raicesCuadratica(r, s) {
  const disc = r * r + 4 * s;
  if (disc >= 0) return [{ re: (r + Math.sqrt(disc)) / 2, im: 0 }, { re: (r - Math.sqrt(disc)) / 2, im: 0 }];
  return [{ re: r / 2, im: Math.sqrt(-disc) / 2 }, { re: r / 2, im: -Math.sqrt(-disc) / 2 }];
}

/**
 * 2.5 Bairstow: extrae factores cuadráticos x² - r·x - s del polinomio.
 * `coeficientes` va del grado mayor al término independiente.
 */
function bairstow({ coeficientes, r, s, tol, maxIter }) {
  validarParametros(tol, maxIter);
  let a = coeficientes.slice();
  while (a.length && a[0] === 0) a.shift();
  if (a.length < 2) falla('Captura un polinomio de grado 1 o mayor.');
  if (a.some((c) => !Number.isFinite(c))) falla('Los coeficientes deben ser numéricos.');
  // Orden ascendente: a[i] multiplica a x^i.
  a = a.reverse();

  const columnas = ['Factor', 'Iter.', 'r', 's', 'Δr', 'Δs', '|Δr/r|', '|Δs/s|'];
  const filas = [];
  const raices = [];
  const factores = [];
  const avisos = [];
  let convergioTodo = true;

  while (a.length - 1 >= 3) {
    const n = a.length - 1;
    const b = new Array(n + 1).fill(0);
    const c = new Array(n + 1).fill(0);
    let convergio = false;
    for (let it = 1; it <= maxIter; it++) {
      b[n] = a[n];
      b[n - 1] = a[n - 1] + r * b[n];
      for (let i = n - 2; i >= 0; i--) b[i] = a[i] + r * b[i + 1] + s * b[i + 2];
      c[n] = b[n];
      c[n - 1] = b[n - 1] + r * c[n];
      for (let i = n - 2; i >= 1; i--) c[i] = b[i] + r * c[i + 1] + s * c[i + 2];
      const det = c[2] * c[2] - c[3] * c[1];
      if (det === 0) falla('El determinante del sistema de corrección es cero. Cambia los valores iniciales r y s.');
      const dr = (-b[1] * c[2] + b[0] * c[3]) / det;
      const ds = (-b[0] * c[2] + b[1] * c[1]) / det;
      r += dr;
      s += ds;
      const er = r !== 0 ? Math.abs(dr / r) : Math.abs(dr);
      const es = s !== 0 ? Math.abs(ds / s) : Math.abs(ds);
      filas.push([factores.length + 1, it, r, s, dr, ds, er, es]);
      validarFinito(r + s, 'la corrección de r y s');
      if (er < tol && es < tol) { convergio = true; break; }
    }
    if (!convergio) convergioTodo = false;
    factores.push(`x² ${r >= 0 ? '−' : '+'} ${Math.abs(r).toPrecision(8)}x ${s >= 0 ? '−' : '+'} ${Math.abs(s).toPrecision(8)}`);
    raices.push(...raicesCuadratica(r, s));
    // Deflación: el cociente son los coeficientes b2..bn.
    a = b.slice(2);
  }

  const n = a.length - 1;
  if (n === 2) {
    const [a0, a1, a2] = a;
    raices.push(...raicesCuadratica(-a1 / a2, -a0 / a2));
    factores.push('Cociente cuadrático resuelto con la fórmula general');
  } else if (n === 1) {
    raices.push({ re: -a[0] / a[1], im: 0 });
    factores.push('Cociente lineal');
  }
  if (!convergioTodo) avisos.push('Algún factor no alcanzó la tolerancia: prueba con otros r y s iniciales.');

  return {
    convergio: convergioTodo,
    resultado: [
      ...raices.map((z, i) => ({ etiqueta: `x${i + 1}`, valor: z })),
      ...factores.map((f, i) => ({ etiqueta: `Factor ${i + 1}`, valor: f })),
    ],
    columnas,
    filas,
    avisos,
  };
}

MN.raices = { biseccion, falsaPosicion, newton, secante, bairstow };
})();
