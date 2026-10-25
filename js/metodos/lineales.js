// Unidad 3: solución de sistemas de ecuaciones lineales.
window.MN = window.MN || {};

(() => {
'use strict';

const { falla, copiar, identidad, multiplicar, multiplicarVector, restar, restarVec, sumar, escalar, normaInf, bloque, unirBloques, validarCuadrada, validarSistema, sustitucionRegresiva, resolver, invertir, esDiagonalDominante, redondearCifras } = MN.util;

const TOL_PIVOTE = 1e-12;

const vectorComoColumna = (v, nombre) => ({ nombre, datos: v.map((x) => [x]) });

function resumenSolucion(x, A, b) {
  const residuo = restarVec(b, multiplicarVector(A, x));
  return [
    ...x.map((v, i) => ({ etiqueta: `x${i + 1}`, valor: v })),
    { etiqueta: '‖b − Ax‖∞ (residuo)', valor: normaInf(residuo) },
  ];
}

/** 3.1.1 Inversión de matrices: Gauss-Jordan sobre [A | I]. */
function inversaGaussJordan({ A }) {
  validarCuadrada(A);
  const n = A.length;
  const M = A.map((fila, i) => [...fila, ...identidad(n)[i]]);
  const pasos = [{ titulo: 'Matriz aumentada [A | I]', matrices: [{ nombre: '[A | I]', datos: copiar(M), separador: n }] }];
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) < TOL_PIVOTE) falla('La matriz es singular (determinante cero): no tiene inversa.');
    const notas = [];
    if (p !== k) { [M[k], M[p]] = [M[p], M[k]]; notas.push(`F${k + 1} ↔ F${p + 1}`); }
    const piv = M[k][k];
    for (let j = 0; j < 2 * n; j++) M[k][j] /= piv;
    notas.push(`F${k + 1} ← F${k + 1} / ${piv.toPrecision(6)}`);
    for (let i = 0; i < n; i++) {
      if (i === k || M[i][k] === 0) continue;
      const m = M[i][k];
      for (let j = 0; j < 2 * n; j++) M[i][j] -= m * M[k][j];
      notas.push(`F${i + 1} ← F${i + 1} − (${m.toPrecision(6)})·F${k + 1}`);
    }
    pasos.push({ titulo: `Columna ${k + 1}`, nota: notas.join(';  '), matrices: [{ nombre: '[A | I]', datos: copiar(M), separador: n }] });
  }
  const inversa = M.map((fila) => fila.slice(n));
  pasos.push({
    titulo: 'Comprobación',
    matrices: [{ nombre: 'A⁻¹', datos: inversa }, { nombre: 'A · A⁻¹', datos: multiplicar(A, inversa) }],
  });
  return { convergio: true, resultado: [{ etiqueta: 'A⁻¹', valor: inversa }], pasos, avisos: [] };
}

/**
 * 3.1.2 Método de intercambio (pivoteo de Jordan).
 * Se parte de y = A·x. Cada intercambio despeja una x en lugar de una y; tras n intercambios
 * la tabla expresa x = A⁻¹·y, es decir, contiene la inversa.
 */
function metodoIntercambio({ A }) {
  validarCuadrada(A);
  const n = A.length;
  const T = copiar(A);
  const filas = A.map((_, i) => ({ tipo: 'y', i }));
  const cols = A.map((_, j) => ({ tipo: 'x', i: j }));
  const etiqueta = (e) => `${e.tipo}${e.i + 1}`;
  const pasos = [{
    titulo: 'Tabla inicial: y = A·x',
    nota: `Filas: ${filas.map(etiqueta).join(', ')} · Columnas: ${cols.map(etiqueta).join(', ')}`,
    matrices: [{ nombre: 'T', datos: copiar(T) }],
  }];

  for (let paso = 1; paso <= n; paso++) {
    let r = -1, c = -1;
    for (let i = 0; i < n; i++) {
      if (filas[i].tipo !== 'y') continue;
      for (let j = 0; j < n; j++) {
        if (cols[j].tipo !== 'x') continue;
        if (r < 0 || Math.abs(T[i][j]) > Math.abs(T[r][c])) { r = i; c = j; }
      }
    }
    const p = T[r][c];
    if (Math.abs(p) < TOL_PIVOTE) falla('No queda pivote distinto de cero: la matriz es singular.');
    const N = copiar(T);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === r && j === c) N[i][j] = 1 / p;
        else if (i === r) N[i][j] = -T[r][j] / p;
        else if (j === c) N[i][j] = T[i][c] / p;
        else N[i][j] = T[i][j] - (T[i][c] * T[r][j]) / p;
      }
    for (let i = 0; i < n; i++) T[i] = N[i];
    const saleY = filas[r], entraX = cols[c];
    filas[r] = entraX;
    cols[c] = saleY;
    pasos.push({
      titulo: `Intercambio ${paso}: pivote ${p.toPrecision(6)} en (${r + 1}, ${c + 1})`,
      nota: `Se despeja ${etiqueta(entraX)} a cambio de ${etiqueta(saleY)}. Filas: ${filas.map(etiqueta).join(', ')} · Columnas: ${cols.map(etiqueta).join(', ')}`,
      matrices: [{ nombre: 'T', datos: copiar(T) }],
    });
  }

  // Reordena: la fila etiquetada x_k y la columna etiquetada y_m dan la entrada (k, m) de A⁻¹.
  const inversa = identidad(n).map((f) => f.fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) inversa[filas[i].i][cols[j].i] = T[i][j];
  pasos.push({
    titulo: 'Reordenamiento y comprobación',
    matrices: [{ nombre: 'A⁻¹', datos: inversa }, { nombre: 'A · A⁻¹', datos: multiplicar(A, inversa) }],
  });
  return { convergio: true, resultado: [{ etiqueta: 'A⁻¹', valor: inversa }], pasos, avisos: [] };
}

/** 3.2.1 Eliminación gaussiana con pivoteo parcial y sustitución regresiva. */
function gaussPivoteoParcial({ A, b }) {
  validarSistema(A, b);
  const n = A.length;
  const M = A.map((fila, i) => [...fila, b[i]]);
  const pasos = [{ titulo: 'Matriz aumentada [A | b]', matrices: [{ nombre: '[A | b]', datos: copiar(M), separador: n }] }];
  for (let k = 0; k < n - 1; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) < TOL_PIVOTE) falla(`Toda la columna ${k + 1} es cero bajo la diagonal: el sistema no tiene solución única.`);
    const notas = [];
    if (p !== k) { [M[k], M[p]] = [M[p], M[k]]; notas.push(`Pivoteo: F${k + 1} ↔ F${p + 1}`); }
    for (let i = k + 1; i < n; i++) {
      const m = M[i][k] / M[k][k];
      if (m === 0) continue;
      for (let j = k; j <= n; j++) M[i][j] -= m * M[k][j];
      M[i][k] = 0;
      notas.push(`F${i + 1} ← F${i + 1} − (${m.toPrecision(6)})·F${k + 1}`);
    }
    pasos.push({ titulo: `Eliminación en la columna ${k + 1}`, nota: notas.join(';  ') || 'Sin cambios', matrices: [{ nombre: '[A | b]', datos: copiar(M), separador: n }] });
  }
  if (Math.abs(M[n - 1][n - 1]) < TOL_PIVOTE) falla('El último pivote es cero: el sistema no tiene solución única.');
  const x = sustitucionRegresiva(M.map((f) => f.slice(0, n)), M.map((f) => f[n]));
  pasos.push({ titulo: 'Sustitución regresiva', nota: 'x_i = (b_i − Σ_{j>i} a_ij·x_j) / a_ii, desde i = n hasta 1', matrices: [vectorComoColumna(x, 'x')] });
  return { convergio: true, resultado: resumenSolucion(x, A, b), pasos, avisos: [] };
}

/** 3.2.2 Gauss-Jordan con pivoteo total (busca el mayor elemento en toda la submatriz). */
function gaussJordanPivoteoTotal({ A, b }) {
  validarSistema(A, b);
  const n = A.length;
  const M = A.map((fila, i) => [...fila, b[i]]);
  const orden = A.map((_, j) => j); // orden[j] = variable que ocupa la columna j
  const encabezado = () => `Orden de columnas: ${orden.map((j) => `x${j + 1}`).join(', ')}`;
  const pasos = [{ titulo: 'Matriz aumentada [A | b]', nota: encabezado(), matrices: [{ nombre: '[A | b]', datos: copiar(M), separador: n }] }];
  for (let k = 0; k < n; k++) {
    let pf = k, pc = k;
    for (let i = k; i < n; i++)
      for (let j = k; j < n; j++) if (Math.abs(M[i][j]) > Math.abs(M[pf][pc])) { pf = i; pc = j; }
    if (Math.abs(M[pf][pc]) < TOL_PIVOTE) falla('No hay pivote distinto de cero: el sistema no tiene solución única.');
    const notas = [];
    if (pf !== k) { [M[k], M[pf]] = [M[pf], M[k]]; notas.push(`F${k + 1} ↔ F${pf + 1}`); }
    if (pc !== k) {
      for (const fila of M) [fila[k], fila[pc]] = [fila[pc], fila[k]];
      [orden[k], orden[pc]] = [orden[pc], orden[k]];
      notas.push(`C${k + 1} ↔ C${pc + 1}`);
    }
    const piv = M[k][k];
    for (let j = 0; j <= n; j++) M[k][j] /= piv;
    notas.push(`F${k + 1} ← F${k + 1} / ${piv.toPrecision(6)}`);
    for (let i = 0; i < n; i++) {
      if (i === k || M[i][k] === 0) continue;
      const m = M[i][k];
      for (let j = 0; j <= n; j++) M[i][j] -= m * M[k][j];
    }
    notas.push(`Se hacen ceros en la columna ${k + 1}`);
    pasos.push({ titulo: `Pivote ${k + 1}: ${piv.toPrecision(6)}`, nota: `${notas.join(';  ')}. ${encabezado()}`, matrices: [{ nombre: '[A | b]', datos: copiar(M), separador: n }] });
  }
  const x = new Array(n);
  for (let j = 0; j < n; j++) x[orden[j]] = M[j][n];
  pasos.push({ titulo: 'Se deshace el intercambio de columnas', matrices: [vectorComoColumna(x, 'x')] });
  return { convergio: true, resultado: resumenSolucion(x, A, b), pasos, avisos: [] };
}

/**
 * 3.2.3 Gauss-Jordan particionado: inversa por bloques con el complemento de Schur.
 * A = [[A11, A12], [A21, A22]] con A11 de tamaño p×p.
 */
function gaussJordanParticionado({ A, b, p }) {
  validarSistema(A, b);
  const n = A.length;
  if (n < 2) falla('Se necesita una matriz de al menos 2×2 para particionar.');
  if (!(Number.isInteger(p) && p >= 1 && p < n)) falla(`El tamaño del bloque p debe ser un entero entre 1 y ${n - 1}.`);
  const A11 = bloque(A, 0, p, 0, p), A12 = bloque(A, 0, p, p, n);
  const A21 = bloque(A, p, n, 0, p), A22 = bloque(A, p, n, p, n);
  let A11i;
  try { A11i = invertir(A11); } catch { falla('El bloque A11 es singular: prueba otro tamaño de partición p.'); }
  const S = restar(A22, multiplicar(multiplicar(A21, A11i), A12));
  let Si;
  try { Si = invertir(S); } catch { falla('El complemento de Schur S es singular: la matriz no tiene inversa.'); }
  const B12 = escalar(multiplicar(multiplicar(A11i, A12), Si), -1);
  const B21 = escalar(multiplicar(multiplicar(Si, A21), A11i), -1);
  const B11 = sumar(A11i, multiplicar(multiplicar(multiplicar(multiplicar(A11i, A12), Si), A21), A11i));
  const inversa = unirBloques(B11, B12, B21, Si);
  const x = multiplicarVector(inversa, b);
  const pasos = [
    { titulo: 'Partición de A', matrices: [{ nombre: 'A11', datos: A11 }, { nombre: 'A12', datos: A12 }, { nombre: 'A21', datos: A21 }, { nombre: 'A22', datos: A22 }] },
    { titulo: 'Inversa del bloque A11 (Gauss-Jordan)', matrices: [{ nombre: 'A11⁻¹', datos: A11i }] },
    { titulo: 'Complemento de Schur', nota: 'S = A22 − A21·A11⁻¹·A12', matrices: [{ nombre: 'S', datos: S }, { nombre: 'S⁻¹', datos: Si }] },
    {
      titulo: 'Bloques de la inversa',
      nota: 'B11 = A11⁻¹ + A11⁻¹A12·S⁻¹·A21A11⁻¹;  B12 = −A11⁻¹A12·S⁻¹;  B21 = −S⁻¹A21A11⁻¹;  B22 = S⁻¹',
      matrices: [{ nombre: 'B11', datos: B11 }, { nombre: 'B12', datos: B12 }, { nombre: 'B21', datos: B21 }, { nombre: 'B22', datos: Si }],
    },
    { titulo: 'Solución x = A⁻¹·b', matrices: [{ nombre: 'A⁻¹', datos: inversa }, vectorComoColumna(x, 'x')] },
  ];
  return { convergio: true, resultado: resumenSolucion(x, A, b), pasos, avisos: [] };
}

/**
 * 3.4.1 Mejoramiento iterativo. La solución inicial se calcula redondeando a `cifras`
 * dígitos significativos (simula una máquina de baja precisión); después se corrige con el residuo.
 */
function mejoramientoIterativo({ A, b, cifras, tol, maxIter }) {
  validarSistema(A, b);
  if (!(Number.isInteger(cifras) && cifras >= 1 && cifras <= 15)) falla('Las cifras significativas deben ser un entero entre 1 y 15.');
  const redondear = (v) => v.map((x) => redondearCifras(x, cifras));
  const Ar = A.map(redondear);
  let x = redondear(resolver(Ar, redondear(b)));
  const n = A.length;
  const columnas = ['k', ...A.map((_, i) => `x${i + 1}`), '‖r‖∞', '‖e‖∞'];
  const filas = [[0, ...x, normaInf(restarVec(b, multiplicarVector(A, x))), NaN]];
  let convergio = false;
  for (let k = 1; k <= maxIter; k++) {
    const r = restarVec(b, multiplicarVector(A, x)); // residuo en doble precisión
    const e = redondear(resolver(Ar, redondear(r)));
    x = x.map((xi, i) => xi + e[i]);
    const nr = normaInf(restarVec(b, multiplicarVector(A, x)));
    filas.push([k, ...x, nr, normaInf(e)]);
    if (normaInf(e) <= tol * Math.max(normaInf(x), 1)) { convergio = true; break; }
  }
  const avisos = convergio ? [] : ['Se alcanzó el máximo de iteraciones sin cumplir la tolerancia.'];
  return { convergio, resultado: resumenSolucion(x, A, b), columnas, filas, avisos, nota: `Solución inicial calculada con ${cifras} cifras significativas (n = ${n}).` };
}

function iterativo({ A, b, x0, tol, maxIter, omega }, nombre) {
  validarSistema(A, b);
  const n = A.length;
  if (!Array.isArray(x0) || x0.length !== n) falla('El vector inicial x0 debe tener n entradas.');
  if (A.some((fila, i) => fila[i] === 0)) falla('Hay un cero en la diagonal de A. Reordena las ecuaciones para que la diagonal no tenga ceros.');
  if (nombre === 'sor' && !(omega > 0 && omega < 2)) falla('El factor de relajación ω debe estar en el intervalo (0, 2).');
  const avisos = [];
  if (!esDiagonalDominante(A)) avisos.push('A no es estrictamente diagonal dominante: la convergencia no está garantizada.');

  const columnas = ['k', ...A.map((_, i) => `x${i + 1}`), 'Error ‖Δx‖∞/‖x‖∞'];
  let x = x0.slice();
  const filas = [[0, ...x, NaN]];
  for (let k = 1; k <= maxIter; k++) {
    const nuevo = x.slice();
    for (let i = 0; i < n; i++) {
      const fuente = nombre === 'jacobi' ? x : nuevo; // Gauss-Seidel y SOR usan los valores recién calculados
      let s = b[i];
      for (let j = 0; j < n; j++) if (j !== i) s -= A[i][j] * fuente[j];
      const gs = s / A[i][i];
      nuevo[i] = nombre === 'sor' ? (1 - omega) * x[i] + omega * gs : gs;
    }
    if (nuevo.some((v) => !Number.isFinite(v))) falla('Los valores crecieron sin límite: el método diverge para este sistema.');
    const err = normaInf(restarVec(nuevo, x)) / Math.max(normaInf(nuevo), 1e-300);
    x = nuevo;
    filas.push([k, ...x, err]);
    if (err < tol) return { convergio: true, resultado: resumenSolucion(x, A, b), columnas, filas, avisos };
  }
  avisos.push('Se alcanzó el máximo de iteraciones sin cumplir la tolerancia.');
  return { convergio: false, resultado: resumenSolucion(x, A, b), columnas, filas, avisos };
}

/** 3.4.2 Jacobi. */
const jacobi = (params) => iterativo(params, 'jacobi');
/** 3.4.3 Gauss-Seidel. */
const gaussSeidel = (params) => iterativo(params, 'seidel');
/** 3.4.4 Relajación (SOR). */
const relajacion = (params) => iterativo(params, 'sor');

MN.lineales = { inversaGaussJordan, metodoIntercambio, gaussPivoteoParcial, gaussJordanPivoteoTotal, gaussJordanParticionado, mejoramientoIterativo, jacobi, gaussSeidel, relajacion };
})();
