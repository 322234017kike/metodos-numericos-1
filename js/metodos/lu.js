// Unidad 4: factorización LU y sus aplicaciones.
window.MN = window.MN || {};

(() => {
'use strict';

const { falla, copiar, ceros, identidad, multiplicar, transpuesta, validarSistema, esSimetrica, sustitucionProgresiva, sustitucionRegresiva } = MN.util;

const TOL_PIVOTE = 1e-12;

function solucionYResumen(L, U, A, b, pasos, nombres = ['L', 'U']) {
  const y = sustitucionProgresiva(L, b);
  const x = sustitucionRegresiva(U, y);
  pasos.push({
    titulo: `Comprobación: ${nombres[0]}·${nombres[1]} = A`,
    matrices: [{ nombre: `${nombres[0]}·${nombres[1]}`, datos: multiplicar(L, U) }],
  });
  pasos.push({
    titulo: `Solución: ${nombres[0]}·y = b (progresiva), ${nombres[1]}·x = y (regresiva)`,
    matrices: [{ nombre: 'y', datos: y.map((v) => [v]) }, { nombre: 'x', datos: x.map((v) => [v]) }],
  });
  const det = U.reduce((p, f, i) => p * f[i], 1) * L.reduce((p, f, i) => p * f[i], 1);
  return {
    convergio: true,
    resultado: [
      ...x.map((v, i) => ({ etiqueta: `x${i + 1}`, valor: v })),
      { etiqueta: 'det(A) = Π l_ii · Π u_ii', valor: det },
    ],
    pasos,
    avisos: [],
  };
}

/** 4.1 Fundamentos: LU a partir de la eliminación gaussiana (los multiplicadores forman L). */
function fundamentosLU({ A, b }) {
  validarSistema(A, b);
  const n = A.length;
  const U = copiar(A);
  const L = identidad(n);
  const pasos = [{ titulo: 'Matriz original', matrices: [{ nombre: 'A', datos: copiar(A) }] }];
  for (let k = 0; k < n - 1; k++) {
    if (Math.abs(U[k][k]) < TOL_PIVOTE)
      falla(`Pivote cero en la posición (${k + 1}, ${k + 1}): A no admite LU sin intercambiar filas (se requeriría PA = LU).`);
    const notas = [];
    for (let i = k + 1; i < n; i++) {
      const m = U[i][k] / U[k][k];
      L[i][k] = m;
      for (let j = k; j < n; j++) U[i][j] -= m * U[k][j];
      U[i][k] = 0;
      notas.push(`m${i + 1}${k + 1} = ${m.toPrecision(6)}`);
    }
    pasos.push({
      titulo: `Paso ${k + 1}: eliminación en la columna ${k + 1}`,
      nota: `Multiplicadores guardados en L: ${notas.join(', ')}`,
      matrices: [{ nombre: 'L', datos: copiar(L) }, { nombre: 'U', datos: copiar(U) }],
    });
  }
  if (Math.abs(U[n - 1][n - 1]) < TOL_PIVOTE) falla('El último pivote es cero: A es singular.');
  return solucionYResumen(L, U, A, b, pasos);
}

/** 4.2 Cholesky: A = L·Lᵀ para A simétrica definida positiva. */
function cholesky({ A, b }) {
  validarSistema(A, b);
  if (!esSimetrica(A)) falla('Cholesky requiere una matriz simétrica (A = Aᵀ).');
  const n = A.length;
  const L = ceros(n);
  const pasos = [];
  for (let j = 0; j < n; j++) {
    let s = A[j][j];
    for (let k = 0; k < j; k++) s -= L[j][k] ** 2;
    if (s <= 0) falla(`a${j + 1}${j + 1} − Σ l²${j + 1}k = ${s.toPrecision(6)} ≤ 0: A no es definida positiva.`);
    L[j][j] = Math.sqrt(s);
    for (let i = j + 1; i < n; i++) {
      let t = A[i][j];
      for (let k = 0; k < j; k++) t -= L[i][k] * L[j][k];
      L[i][j] = t / L[j][j];
    }
    pasos.push({
      titulo: `Columna ${j + 1}`,
      nota: `l${j + 1}${j + 1} = √(a${j + 1}${j + 1} − Σ l²${j + 1}k) = ${L[j][j].toPrecision(6)};  l_i${j + 1} = (a_i${j + 1} − Σ l_ik·l${j + 1}k) / l${j + 1}${j + 1}`,
      matrices: [{ nombre: 'L', datos: copiar(L) }],
    });
  }
  return solucionYResumen(L, transpuesta(L), A, b, pasos, ['L', 'Lᵀ']);
}

/** 4.3 Doolittle: L con unos en la diagonal; se calcula una fila de U y una columna de L por paso. */
function doolittle({ A, b }) {
  validarSistema(A, b);
  const n = A.length;
  const L = identidad(n);
  const U = ceros(n);
  const pasos = [];
  for (let k = 0; k < n; k++) {
    for (let j = k; j < n; j++) {
      let s = A[k][j];
      for (let m = 0; m < k; m++) s -= L[k][m] * U[m][j];
      U[k][j] = s;
    }
    if (Math.abs(U[k][k]) < TOL_PIVOTE) falla(`u${k + 1}${k + 1} = 0: A no admite factorización de Doolittle sin pivoteo.`);
    for (let i = k + 1; i < n; i++) {
      let s = A[i][k];
      for (let m = 0; m < k; m++) s -= L[i][m] * U[m][k];
      L[i][k] = s / U[k][k];
    }
    pasos.push({
      titulo: `Paso ${k + 1}: fila ${k + 1} de U y columna ${k + 1} de L`,
      nota: `u${k + 1}j = a${k + 1}j − Σ l${k + 1}m·u_mj;  l_i${k + 1} = (a_i${k + 1} − Σ l_im·u_m${k + 1}) / u${k + 1}${k + 1}`,
      matrices: [{ nombre: 'L', datos: copiar(L) }, { nombre: 'U', datos: copiar(U) }],
    });
  }
  return solucionYResumen(L, U, A, b, pasos);
}

/** Anchos de banda inferior (p) y superior (q) de A. */
function anchoDeBanda(A) {
  let p = 0, q = 0;
  A.forEach((fila, i) => fila.forEach((a, j) => {
    if (a !== 0) { p = Math.max(p, i - j); q = Math.max(q, j - i); }
  }));
  return { p, q };
}

/**
 * 4.4 Crout para sistemas bandados: U con unos en la diagonal. Sin pivoteo, L conserva el
 * ancho de banda inferior y U el superior, así que solo se calculan los elementos de la banda.
 */
function croutBandado({ A, b }) {
  validarSistema(A, b);
  const n = A.length;
  const { p, q } = anchoDeBanda(A);
  const L = ceros(n);
  const U = identidad(n);
  let operaciones = 0;
  const filas = [];
  for (let k = 0; k < n; k++) {
    for (let i = k; i <= Math.min(n - 1, k + p); i++) {
      let s = A[i][k];
      for (let m = Math.max(0, i - p, k - q); m < k; m++) { s -= L[i][m] * U[m][k]; operaciones++; }
      L[i][k] = s;
    }
    if (Math.abs(L[k][k]) < TOL_PIVOTE) falla(`l${k + 1}${k + 1} = 0: el método de Crout no puede continuar sin pivoteo.`);
    for (let j = k + 1; j <= Math.min(n - 1, k + q); j++) {
      let s = A[k][j];
      for (let m = Math.max(0, k - p, j - q); m < k; m++) { s -= L[k][m] * U[m][j]; operaciones++; }
      U[k][j] = s / L[k][k];
      operaciones++;
    }
    filas.push([k + 1, k > 0 ? L[k][k - 1] : NaN, L[k][k], k < n - 1 ? U[k][k + 1] : NaN]);
  }
  const y = sustitucionProgresiva(L, b);
  const x = sustitucionRegresiva(U, y);
  filas.forEach((f, i) => f.push(y[i], x[i]));
  const completas = (n * (n - 1) * (2 * n - 1)) / 6 + (n * (n - 1)) / 2;
  const pasos = [
    {
      titulo: `Ancho de banda: inferior p = ${p}, superior q = ${q}${p === 1 && q === 1 ? ' (matriz tridiagonal)' : ''}`,
      nota: `Operaciones en la factorización: ${operaciones} (sin aprovechar la banda serían ≈ ${Math.round(completas)}).`,
      matrices: [{ nombre: 'L', datos: L }, { nombre: 'U', datos: U }],
    },
    { titulo: 'Comprobación: L·U = A', matrices: [{ nombre: 'L·U', datos: multiplicar(L, U) }] },
  ];
  return {
    convergio: true,
    resultado: x.map((v, i) => ({ etiqueta: `x${i + 1}`, valor: v })),
    columnas: ['i', 'l(i,i−1)', 'l(i,i)', 'u(i,i+1)', 'z_i (L·z = b)', 'x_i'],
    filas,
    pasos,
    avisos: [],
  };
}

MN.lu = { fundamentosLU, cholesky, doolittle, croutBandado };
})();
