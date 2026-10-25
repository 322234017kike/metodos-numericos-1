// Unidad 5: cálculo de valores y vectores propios.
window.MN = window.MN || {};

(() => {
'use strict';

const { falla, copiar, identidad, multiplicar, multiplicarVector, transpuesta, validarCuadrada, normaInf, norma2, resolver, esSimetrica } = MN.util;

/** Elemento de mayor valor absoluto (conservando el signo). */
const mayorComponente = (v) => v.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0);

/**
 * 5.1 Método de potencias. Variante 'directa': valor propio dominante.
 * Variante 'inversa': valor propio más cercano al desplazamiento q, resolviendo (A − qI)·y = x.
 */
function potencias({ A, x0, tol, maxIter, variante = 'directa', q = 0 }) {
  validarCuadrada(A);
  const n = A.length;
  if (!Array.isArray(x0) || x0.length !== n) falla('El vector inicial debe tener n entradas.');
  if (normaInf(x0) === 0) falla('El vector inicial no puede ser el vector cero.');
  const B = variante === 'inversa' ? A.map((fila, i) => fila.map((a, j) => (i === j ? a - q : a))) : A;

  const columnas = ['k', ...A.map((_, i) => `x${i + 1}`), 'λ', 'Error |Δλ|'];
  let x = x0.map((v) => v / mayorComponente(x0));
  const filas = [[0, ...x, NaN, NaN]];
  let lambda = NaN;
  for (let k = 1; k <= maxIter; k++) {
    let y;
    if (variante === 'inversa') {
      try { y = resolver(B, x); } catch { falla(`A − qI es singular: q = ${q} ya es un valor propio exacto.`); }
    } else y = multiplicarVector(B, x);
    const mu = mayorComponente(y);
    if (mu === 0) falla('A·x dio el vector cero: elige otro vector inicial.');
    const nuevo = variante === 'inversa' ? q + 1 / mu : mu;
    x = y.map((v) => v / mu);
    const err = Math.abs(nuevo - lambda);
    lambda = nuevo;
    filas.push([k, ...x, lambda, k === 1 ? NaN : err]);
    if (k > 1 && err < tol * Math.max(1, Math.abs(lambda))) {
      return resumenPotencias(lambda, x, A, true, columnas, filas);
    }
  }
  return resumenPotencias(lambda, x, A, false, columnas, filas);
}

function resumenPotencias(lambda, x, A, convergio, columnas, filas) {
  const Ax = multiplicarVector(A, x);
  const residuo = normaInf(Ax.map((v, i) => v - lambda * x[i]));
  return {
    convergio,
    resultado: [
      { etiqueta: 'λ', valor: lambda },
      { etiqueta: 'Vector propio v', valor: x.map((v) => [v]) },
      { etiqueta: '‖Av − λv‖∞', valor: residuo },
    ],
    columnas,
    filas,
    avisos: convergio ? [] : ['Se alcanzó el máximo de iteraciones. Si dos valores propios tienen el mismo módulo, el método no converge.'],
  };
}

/**
 * 5.2 Transformación de Householder: reduce A a forma tridiagonal (si es simétrica)
 * o de Hessenberg (en general) mediante reflexiones H = I − 2·v·vᵀ, conservando los valores propios.
 */
function householder({ A }) {
  validarCuadrada(A);
  const n = A.length;
  if (n < 3) falla('Se necesita una matriz de al menos 3×3 (una de 2×2 ya es tridiagonal).');
  const simetrica = esSimetrica(A);
  let M = copiar(A);
  const pasos = [{ titulo: 'Matriz original', nota: simetrica ? 'A es simétrica: el resultado será tridiagonal.' : 'A no es simétrica: el resultado será de Hessenberg superior.', matrices: [{ nombre: 'A', datos: copiar(A) }] }];
  let Qacum = identidad(n);
  for (let k = 0; k < n - 2; k++) {
    const x = M.slice(k + 1).map((fila) => fila[k]);
    const nx = norma2(x);
    if (nx === 0 || x.slice(1).every((v) => Math.abs(v) < 1e-14)) {
      pasos.push({ titulo: `Paso ${k + 1}`, nota: 'La columna ya tiene ceros debajo de la subdiagonal: no se aplica reflexión.' });
      continue;
    }
    const alfa = -(x[0] >= 0 ? 1 : -1) * nx;
    const v = x.slice();
    v[0] -= alfa;
    const nv = norma2(v);
    const w = v.map((c) => c / nv);
    const H = identidad(n);
    for (let i = 0; i < w.length; i++)
      for (let j = 0; j < w.length; j++) H[k + 1 + i][k + 1 + j] -= 2 * w[i] * w[j];
    M = multiplicar(multiplicar(H, M), H);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (Math.abs(M[i][j]) < 1e-13) M[i][j] = 0;
    Qacum = multiplicar(Qacum, H);
    pasos.push({
      titulo: `Paso ${k + 1}: reflexión sobre la columna ${k + 1}`,
      nota: `α = −signo(x₁)·‖x‖ = ${alfa.toPrecision(6)};  v = x − α·e₁;  H = I − 2·v·vᵀ/(vᵀv);  A ← H·A·H`,
      matrices: [{ nombre: `H${k + 1}`, datos: H }, { nombre: `A${k + 1}`, datos: copiar(M) }],
    });
  }
  const traza = (B) => B.reduce((s, f, i) => s + f[i], 0);
  pasos.push({ titulo: 'Matriz ortogonal acumulada Q (A = Q·T·Qᵀ)', matrices: [{ nombre: 'Q', datos: Qacum }] });
  return {
    convergio: true,
    resultado: [
      { etiqueta: simetrica ? 'Matriz tridiagonal T' : 'Matriz de Hessenberg H', valor: M },
      { etiqueta: 'traza(A) = traza(T)', valor: `${traza(A).toPrecision(10)} = ${traza(M).toPrecision(10)}` },
    ],
    pasos,
    avisos: [],
  };
}

/** Factorización QR con Gram-Schmidt modificado. */
function factorizarQR(A) {
  const n = A.length;
  const V = transpuesta(A); // columnas de A como filas
  const Q = [];
  const R = identidad(n).map((f) => f.fill(0));
  for (let j = 0; j < n; j++) {
    const v = V[j].slice();
    for (let i = 0; i < j; i++) {
      R[i][j] = Q[i].reduce((s, qi, k) => s + qi * v[k], 0);
      for (let k = 0; k < n; k++) v[k] -= R[i][j] * Q[i][k];
    }
    R[j][j] = norma2(v);
    if (R[j][j] < 1e-14) falla('Las columnas de A son linealmente dependientes: A es singular. Aplica un desplazamiento.');
    Q.push(v.map((c) => c / R[j][j]));
  }
  return { Q: transpuesta(Q), R };
}

/** 5.3 Iteración QR: A_{k+1} = R_k·Q_k converge a una matriz triangular con los valores propios en la diagonal. */
function iteracionQR({ A, tol, maxIter }) {
  validarCuadrada(A);
  const n = A.length;
  let M = copiar(A);
  const columnas = ['k', ...A.map((_, i) => `a${i + 1}${i + 1}`), 'máx |subdiagonal|'];
  const subdiag = (B) => B.reduce((m, f, i) => (i > 0 ? Math.max(m, Math.abs(f[i - 1])) : m), 0);
  const filas = [[0, ...M.map((f, i) => f[i]), subdiag(M)]];
  const { Q: Q0, R: R0 } = factorizarQR(M);
  const pasos = [{ titulo: 'Primera factorización A₀ = Q₀·R₀ (Gram-Schmidt)', matrices: [{ nombre: 'Q₀', datos: Q0 }, { nombre: 'R₀', datos: R0 }, { nombre: 'A₁ = R₀·Q₀', datos: multiplicar(R0, Q0) }] }];
  let convergio = false;
  for (let k = 1; k <= maxIter; k++) {
    const { Q, R } = factorizarQR(M);
    M = multiplicar(R, Q);
    const sd = subdiag(M);
    filas.push([k, ...M.map((f, i) => f[i]), sd]);
    if (sd < tol) { convergio = true; break; }
  }
  pasos.push({ titulo: 'Matriz final', matrices: [{ nombre: 'A_k', datos: M }] });
  const avisos = convergio ? [] : ['La subdiagonal no llegó a cero: puede haber valores propios complejos o de igual módulo (aparecen bloques 2×2).'];
  return {
    convergio,
    resultado: M.map((f, i) => ({ etiqueta: `λ${i + 1}`, valor: f[i] })),
    columnas,
    filas,
    pasos,
    avisos,
  };
}

MN.propios = { potencias, householder, factorizarQR, iteracionQR };
})();
