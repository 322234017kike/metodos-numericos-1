// Unidad 5: cálculo de valores y vectores propios.
window.MN = window.MN || {};

(() => {
'use strict';

const { falla, copiar, identidad, multiplicar, multiplicarVector, transpuesta, validarCuadrada, normaInf, norma2, resolver, esSimetrica } = MN.util;

/** Elemento de mayor valor absoluto (conservando el signo). */
const mayorComponente = (v) => v.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0);

/**
 * 5.1 Método de potencias. Variante 'directa': valor propio dominante (máximo |λ|).
 * Variante 'inversa': valor propio más cercano al desplazamiento q (con q = 0, el mínimo |λ|),
 * resolviendo (A − qI)·y = x en cada paso.
 */
function potencias({ A, x0, tol, maxIter, variante = 'directa', q = 0 }) {
  validarCuadrada(A);
  const n = A.length;
  if (!Array.isArray(x0) || x0.length !== n) falla('El vector inicial debe tener n entradas.');
  if (normaInf(x0) === 0) falla('El vector inicial no puede ser el vector cero.');
  const inversa = variante === 'inversa';
  const B = inversa ? A.map((fila, i) => fila.map((a, j) => (i === j ? a - q : a))) : A;

  const columnas = ['k', ...A.map((_, i) => `x${i + 1}`), 'λ', 'Error |Δλ|', 'Cambio ‖Δx‖∞'];
  // λ converge más rápido que el vector, así que también se exige que el vector se estabilice.
  const tolVector = Math.sqrt(tol) / 10;
  let x = x0.map((v) => v / mayorComponente(x0));
  const filas = [[0, ...x, NaN, NaN, NaN]];
  const pasos = []; // { k, x (anterior), y, mu, lambda, err } para mostrar el desarrollo
  let lambda = NaN;
  let convergio = false;
  for (let k = 1; k <= maxIter; k++) {
    let y;
    if (inversa) {
      try { y = resolver(B, x); } catch { falla(q === 0 ? 'A es singular: λ = 0 es un valor propio, así que no tiene inversa.' : `A − qI es singular: q = ${q} ya es un valor propio exacto.`); }
    } else y = multiplicarVector(B, x);
    const mu = mayorComponente(y);
    if (mu === 0) falla('A·x dio el vector cero: elige otro vector inicial.');
    const nuevo = inversa ? q + 1 / mu : mu;
    const anterior = x;
    x = y.map((v) => v / mu);
    const err = Math.abs(nuevo - lambda);
    const cambio = normaInf(x.map((v, i) => v - anterior[i]));
    lambda = nuevo;
    filas.push([k, ...x, lambda, k === 1 ? NaN : err, cambio]);
    pasos.push({ k, x: anterior, y, mu, lambda, err: k === 1 ? NaN : err });
    if (k > 1 && err < tol * Math.max(1, Math.abs(lambda)) && cambio < tolVector) { convergio = true; break; }
  }

  const residuo = normaInf(multiplicarVector(A, x).map((v, i) => v - lambda * x[i]));
  const comprobacion = comprobarConPolinomio(A, lambda, inversa && q === 0 ? 'menor' : inversa ? 'cercano' : 'mayor', q);
  const avisos = convergio ? [] : ['Se alcanzó el máximo de iteraciones. Si dos valores propios tienen el mismo módulo, el método no converge.'];
  if (!comprobacion.coincide) avisos.push('El valor obtenido no coincide con el del polinomio característico: revisa la convergencia o el vector inicial.');
  return {
    convergio,
    resultado: [
      { etiqueta: 'λ', valor: lambda },
      { etiqueta: 'Vector propio v', valor: x.map((v) => [v]) },
      { etiqueta: '‖Av − λv‖∞', valor: residuo },
    ],
    columnas,
    filas,
    avisos,
    potencia: { variante, q, tol, A, lambda, vector: x, x0, pasos, residuo, comprobacion },
  };
}

// ---------------- Comprobación con el polinomio característico ----------------

/**
 * Coeficientes de det(A − λI), del grado mayor al término independiente,
 * con el algoritmo de Faddeev–LeVerrier (exacto para matrices de enteros pequeñas).
 */
function polinomioCaracteristico(A) {
  const n = A.length;
  const c = new Array(n + 1).fill(0); // c[i] multiplica a λ^i en det(λI − A)
  c[n] = 1;
  let M = identidad(n).map((f) => f.fill(0));
  for (let k = 1; k <= n; k++) {
    const AM = multiplicar(A, M);
    M = AM.map((fila, i) => fila.map((v, j) => (i === j ? v + c[n - k + 1] : v)));
    const AMk = multiplicar(A, M);
    c[n - k] = -AMk.reduce((s, f, i) => s + f[i], 0) / k;
  }
  // det(A − λI) = (−1)^n · det(λI − A); se limpian los casi enteros.
  const signo = n % 2 === 0 ? 1 : -1;
  return c.slice().reverse().map((v) => {
    const s = signo * v;
    const r = Math.round(s);
    return Math.abs(s - r) < 1e-9 * Math.max(1, Math.abs(s)) ? r : s;
  });
}

// Aritmética compleja mínima para hallar las raíces.
const cMul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cSub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });
const cDiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; };

/** Raíces de un polinomio (coeficientes del grado mayor al menor) con el método de Durand–Kerner. */
function raicesPolinomio(coef) {
  const n = coef.length - 1;
  const monico = coef.map((v) => v / coef[0]);
  const evaluar = (z) => monico.reduce((acc, a) => ({ re: acc.re * z.re - acc.im * z.im + a, im: acc.re * z.im + acc.im * z.re }), { re: 0, im: 0 });
  let z = Array.from({ length: n }, (_, k) => {
    let p = { re: 1, im: 0 };
    for (let i = 0; i < k; i++) p = cMul(p, { re: 0.4, im: 0.9 });
    return p;
  });
  for (let it = 0; it < 1000; it++) {
    let cambio = 0;
    z = z.map((zi, i) => {
      let den = { re: 1, im: 0 };
      z.forEach((zj, j) => { if (j !== i) den = cMul(den, cSub(zi, zj)); });
      const nuevo = cSub(zi, cDiv(evaluar(zi), den));
      cambio = Math.max(cambio, Math.hypot(nuevo.re - zi.re, nuevo.im - zi.im));
      return nuevo;
    });
    if (cambio < 1e-14) break;
  }
  const limpio = (v) => { const r = Math.round(v); return Math.abs(v - r) < 1e-8 ? r : v; };
  return z
    .map(({ re, im }) => ({ re: limpio(re), im: Math.abs(im) < 1e-8 ? 0 : im }))
    .sort((a, b) => Math.hypot(b.re, b.im) - Math.hypot(a.re, a.im) || b.re - a.re);
}

/** Compara el λ del método de potencias con el que predice el polinomio característico. */
function comprobarConPolinomio(A, lambda, criterio, q = 0) {
  const coef = polinomioCaracteristico(A);
  const raices = raicesPolinomio(coef);
  const distancia = (z, c) => Math.hypot(z.re - c, z.im);
  let esperado;
  if (criterio === 'mayor') esperado = raices[0];
  else if (criterio === 'menor') esperado = raices[raices.length - 1];
  else esperado = raices.reduce((m, z) => (distancia(z, q) < distancia(m, q) ? z : m));
  const coincide = Math.abs(esperado.im) < 1e-8 && Math.abs(esperado.re - lambda) <= 1e-5 * Math.max(1, Math.abs(lambda));
  return { coef, raices, esperado, coincide, criterio };
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

MN.propios = { potencias, polinomioCaracteristico, raicesPolinomio, householder, factorizarQR, iteracionQR };
})();
