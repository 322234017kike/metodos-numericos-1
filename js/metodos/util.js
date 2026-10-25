// Utilidades compartidas por los métodos numéricos.
window.MN = window.MN || {};

(() => {
'use strict';

class ErrorMetodo extends Error {}

function falla(mensaje) {
  throw new ErrorMetodo(mensaje);
}

const copiar = (M) => M.map((fila) => fila.slice());

const identidad = (n) =>
  Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));

const ceros = (n, m = n) => Array.from({ length: n }, () => new Array(m).fill(0));

function multiplicar(A, B) {
  const n = A.length, m = B[0].length, p = B.length;
  const C = ceros(n, m);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let k = 0; k < p; k++) s += A[i][k] * B[k][j];
      C[i][j] = s;
    }
  return C;
}

const multiplicarVector = (A, x) => A.map((fila) => fila.reduce((s, a, j) => s + a * x[j], 0));

const transpuesta = (A) => A[0].map((_, j) => A.map((fila) => fila[j]));

const restar = (A, B) => A.map((fila, i) => fila.map((a, j) => a - B[i][j]));

const sumar = (A, B) => A.map((fila, i) => fila.map((a, j) => a + B[i][j]));

const escalar = (A, c) => A.map((fila) => fila.map((a) => a * c));

const normaInf = (v) => v.reduce((m, x) => Math.max(m, Math.abs(x)), 0);

const norma2 = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));

const restarVec = (a, b) => a.map((x, i) => x - b[i]);

/** Submatriz de las filas [f0, f1) y columnas [c0, c1). */
const bloque = (A, f0, f1, c0, c1) => A.slice(f0, f1).map((fila) => fila.slice(c0, c1));

/** Une cuatro bloques [[A, B], [C, D]] en una sola matriz. */
function unirBloques(A, B, C, D) {
  return [...A.map((f, i) => [...f, ...B[i]]), ...C.map((f, i) => [...f, ...D[i]])];
}

function validarCuadrada(A, nombre = 'A') {
  if (!Array.isArray(A) || A.length === 0) falla(`La matriz ${nombre} está vacía.`);
  if (A.some((fila) => fila.length !== A.length)) falla(`La matriz ${nombre} debe ser cuadrada.`);
  if (A.flat().some((x) => !Number.isFinite(x))) falla(`La matriz ${nombre} contiene valores no numéricos.`);
}

function validarSistema(A, b) {
  validarCuadrada(A);
  if (!Array.isArray(b) || b.length !== A.length) falla('El vector b debe tener tantas entradas como filas tiene A.');
  if (b.some((x) => !Number.isFinite(x))) falla('El vector b contiene valores no numéricos.');
}

function validarFinito(valor, contexto) {
  if (!Number.isFinite(valor)) falla(`Se obtuvo un valor no finito al evaluar ${contexto}. Revisa la función o los datos.`);
  return valor;
}

/** Sustitución regresiva para U triangular superior. */
function sustitucionRegresiva(U, y) {
  const n = U.length;
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let j = i + 1; j < n; j++) s -= U[i][j] * x[j];
    if (Math.abs(U[i][i]) < 1e-14) falla(`Pivote nulo en la fila ${i + 1}: el sistema no tiene solución única.`);
    x[i] = s / U[i][i];
  }
  return x;
}

/** Sustitución progresiva para L triangular inferior. */
function sustitucionProgresiva(L, b) {
  const n = L.length;
  const y = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let j = 0; j < i; j++) s -= L[i][j] * y[j];
    if (Math.abs(L[i][i]) < 1e-14) falla(`Pivote nulo en la fila ${i + 1}.`);
    y[i] = s / L[i][i];
  }
  return y;
}

/** Resuelve Ax = b con eliminación gaussiana y pivoteo parcial (uso interno). */
function resolver(A, b) {
  const n = A.length;
  const M = A.map((fila, i) => [...fila, b[i]]);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) < 1e-14) falla('La matriz es singular: no existe solución única.');
    [M[k], M[p]] = [M[p], M[k]];
    for (let i = k + 1; i < n; i++) {
      const m = M[i][k] / M[k][k];
      for (let j = k; j <= n; j++) M[i][j] -= m * M[k][j];
    }
  }
  return sustitucionRegresiva(M.map((f) => f.slice(0, n)), M.map((f) => f[n]));
}

/** Inversa con Gauss-Jordan y pivoteo parcial (uso interno). */
function invertir(A) {
  const n = A.length;
  return transpuesta(identidad(n).map((e) => resolver(A, e)));
}

const esSimetrica = (A, tol = 1e-10) => A.every((fila, i) => fila.every((a, j) => Math.abs(a - A[j][i]) <= tol));

function esDiagonalDominante(A) {
  return A.every((fila, i) => Math.abs(fila[i]) > fila.reduce((s, a, j) => (j === i ? s : s + Math.abs(a)), 0));
}

/** Redondea a d cifras significativas (simula aritmética de baja precisión). */
function redondearCifras(x, d) {
  if (x === 0 || !Number.isFinite(x)) return x;
  return Number(x.toPrecision(d));
}

MN.util = { ErrorMetodo, falla, copiar, identidad, ceros, multiplicar, multiplicarVector, transpuesta, restar, sumar, escalar, normaInf, norma2, restarVec, bloque, unirBloques, validarCuadrada, validarSistema, validarFinito, sustitucionRegresiva, sustitucionProgresiva, resolver, invertir, esSimetrica, esDiagonalDominante, redondearCifras };
})();
