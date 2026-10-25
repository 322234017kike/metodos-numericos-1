// Pruebas de los métodos numéricos. Se ejecutan abriendo tests/pruebas.html en el navegador.
window.MN = window.MN || {};

(() => {
'use strict';

const raices = MN.raices;
const lineales = MN.lineales;
const lu = MN.lu;
const propios = MN.propios;
const errores = MN.error;
const { multiplicar, ErrorMetodo } = MN.util;

const resultados = [];

function prueba(nombre, fn) {
  try { fn(); resultados.push({ nombre, ok: true }); }
  catch (e) { resultados.push({ nombre, ok: false, detalle: e.message }); }
}

function cerca(obtenido, esperado, tol = 1e-6, que = '') {
  if (!(Math.abs(obtenido - esperado) <= tol)) throw new Error(`${que} esperado ${esperado}, obtenido ${obtenido}`);
}

function vectorCerca(v, w, tol = 1e-6) { w.forEach((x, i) => cerca(v[i], x, tol, `x${i + 1}:`)); }

function matrizCerca(A, B, tol = 1e-6) { B.forEach((f, i) => f.forEach((x, j) => cerca(A[i][j], x, tol, `(${i + 1},${j + 1}):`))); }

function lanza(fn) {
  try { fn(); } catch (e) { if (e instanceof ErrorMetodo) return; throw e; }
  throw new Error('Se esperaba un error del método');
}

const valor = (r, etiqueta) => r.resultado.find((x) => x.etiqueta === etiqueta).valor;
const solucion = (r) => r.resultado.filter((x) => /^x\d+$/.test(x.etiqueta)).map((x) => x.valor);

// ---- Unidad 2 ----
const f = (x) => x ** 3 - 2 * x - 5;
const df = (x) => 3 * x ** 2 - 2;
const RAIZ = 2.0945514815423265;

prueba('Bisección', () => cerca(valor(raices.biseccion({ f, a: 2, b: 3, tol: 1e-8, maxIter: 100 }), 'Raíz aproximada'), RAIZ, 1e-7));
prueba('Bisección sin cambio de signo lanza error', () => lanza(() => raices.biseccion({ f, a: 3, b: 4, tol: 1e-6, maxIter: 50 })));
prueba('Falsa posición', () => cerca(valor(raices.falsaPosicion({ f, a: 2, b: 3, tol: 1e-10, maxIter: 100 }), 'Raíz aproximada'), RAIZ, 1e-8));
prueba('Newton', () => {
  const r = raices.newton({ f, df, x0: 2, tol: 1e-12, maxIter: 50 });
  cerca(valor(r, 'Raíz aproximada'), RAIZ, 1e-12);
  if (r.filas.length > 6) throw new Error('Newton debería converger en pocas iteraciones');
});
prueba('Newton con derivada cero lanza error', () => lanza(() => raices.newton({ f: (x) => x * x + 1, df: (x) => 2 * x, x0: 0, tol: 1e-6, maxIter: 10 })));
prueba('Secante', () => cerca(valor(raices.secante({ f, x0: 2, x1: 3, tol: 1e-12, maxIter: 50 }), 'Raíz aproximada'), RAIZ, 1e-10));
prueba('Bairstow (raíces reales y complejas)', () => {
  // (x−1)(x−2)(x−3)(x²+1) = x⁵ − 6x⁴ + 12x³ − 12x² + 11x − 6
  const r = raices.bairstow({ coeficientes: [1, -6, 12, -12, 11, -6], r: -1, s: -1, tol: 1e-12, maxIter: 200 });
  const zs = r.resultado.filter((x) => /^x\d+$/.test(x.etiqueta)).map((x) => x.valor);
  if (zs.length !== 5) throw new Error(`Se esperaban 5 raíces, hay ${zs.length}`);
  const reales = zs.filter((z) => Math.abs(z.im) < 1e-8).map((z) => z.re).sort((a, b) => a - b);
  vectorCerca(reales, [1, 2, 3], 1e-8);
  const complejas = zs.filter((z) => Math.abs(z.im) >= 1e-8);
  complejas.forEach((z) => { cerca(z.re, 0, 1e-8); cerca(Math.abs(z.im), 1, 1e-8); });
});

// ---- Unidad 3 ----
const A = [[4, -1, 1], [4, -8, 1], [-2, 1, 5]];
const b = [7, -21, 15];
const X = [2, 4, 3];

prueba('Inversa por Gauss-Jordan', () => {
  const inv = valor(lineales.inversaGaussJordan({ A }), 'A⁻¹');
  matrizCerca(multiplicar(A, inv), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], 1e-12);
});
prueba('Método de intercambio', () => {
  const B = [[0, 2, 1], [1, 1, 0], [3, 0, 1]];
  const inv = valor(lineales.metodoIntercambio({ A: B }), 'A⁻¹');
  matrizCerca(multiplicar(B, inv), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], 1e-12);
});
prueba('Matriz singular lanza error', () => lanza(() => lineales.inversaGaussJordan({ A: [[1, 2], [2, 4]] })));
prueba('Gauss con pivoteo parcial', () => vectorCerca(solucion(lineales.gaussPivoteoParcial({ A, b })), X, 1e-12));
prueba('Gauss con pivote inicial cero', () => vectorCerca(solucion(lineales.gaussPivoteoParcial({ A: [[0, 1], [1, 1]], b: [1, 3] })), [2, 1], 1e-12));
prueba('Gauss-Jordan pivoteo total', () => vectorCerca(solucion(lineales.gaussJordanPivoteoTotal({ A, b })), X, 1e-12));
prueba('Gauss-Jordan particionado', () => {
  const M = [[4, 1, 0, 1], [1, 5, 2, 0], [0, 2, 6, 1], [1, 0, 1, 3]];
  const x = [1, -1, 2, 0.5];
  const bb = M.map((fila) => fila.reduce((s, a, j) => s + a * x[j], 0));
  vectorCerca(solucion(lineales.gaussJordanParticionado({ A: M, b: bb, p: 2 })), x, 1e-10);
});
prueba('Mejoramiento iterativo', () => vectorCerca(solucion(lineales.mejoramientoIterativo({ A, b, cifras: 3, tol: 1e-12, maxIter: 30 })), X, 1e-9));
prueba('Jacobi', () => vectorCerca(solucion(lineales.jacobi({ A, b, x0: [1, 2, 2], tol: 1e-10, maxIter: 200 })), X, 1e-8));
prueba('Gauss-Seidel', () => {
  const r = lineales.gaussSeidel({ A, b, x0: [1, 2, 2], tol: 1e-10, maxIter: 200 });
  vectorCerca(solucion(r), X, 1e-8);
  const j = lineales.jacobi({ A, b, x0: [1, 2, 2], tol: 1e-10, maxIter: 200 });
  if (r.filas.length >= j.filas.length) throw new Error('Gauss-Seidel debería requerir menos iteraciones que Jacobi');
});
prueba('Relajación (SOR)', () => vectorCerca(solucion(lineales.relajacion({ A, b, x0: [0, 0, 0], tol: 1e-10, maxIter: 200, omega: 1.1 })), X, 1e-8));

// ---- Unidad 4 ----
const S = [[4, 12, -16], [12, 37, -43], [-16, -43, 98]];
const bs = [1, 2, 3];
const xs = [28.583333333333332, -7.666666666666667, 1.3333333333333333];

prueba('Fundamentos LU', () => vectorCerca(solucion(lu.fundamentosLU({ A, b })), X, 1e-12));
prueba('LU con pivote cero lanza error', () => lanza(() => lu.fundamentosLU({ A: [[0, 1], [1, 1]], b: [1, 2] })));
prueba('Cholesky', () => {
  const r = lu.cholesky({ A: S, b: bs });
  vectorCerca(solucion(r), xs, 1e-9);
  cerca(valor(r, 'det(A) = Π l_ii · Π u_ii'), 36, 1e-9);
});
prueba('Cholesky no definida positiva lanza error', () => lanza(() => lu.cholesky({ A: [[1, 2], [2, 1]], b: [1, 1] })));
prueba('Doolittle', () => vectorCerca(solucion(lu.doolittle({ A, b })), X, 1e-12));
prueba('Crout bandado (tridiagonal)', () => {
  const T = [[2, -1, 0, 0], [-1, 2, -1, 0], [0, -1, 2, -1], [0, 0, -1, 2]];
  vectorCerca(solucion(lu.croutBandado({ A: T, b: [1, 0, 0, 1] })), [1, 1, 1, 1], 1e-12);
});

// ---- Unidad 5 ----
const P = [[2, 0, 0], [0, 3, 4], [0, 4, 9]]; // valores propios 11, 2, 1

prueba('Potencias directa', () => cerca(valor(propios.potencias({ A: P, x0: [1, 1, 1], tol: 1e-12, maxIter: 500 }), 'λ'), 11, 1e-8));
prueba('Potencias inversa con desplazamiento', () => cerca(valor(propios.potencias({ A: P, x0: [1, 1, 1], tol: 1e-12, maxIter: 500, variante: 'inversa', q: 0.8 }), 'λ'), 1, 1e-8));
prueba('Householder conserva traza y tridiagonaliza', () => {
  const M = [[4, 1, -2, 2], [1, 2, 0, 1], [-2, 0, 3, -2], [2, 1, -2, -1]];
  const T = valor(propios.householder({ A: M }), 'Matriz tridiagonal T');
  cerca(T.reduce((s, f, i) => s + f[i], 0), 8, 1e-10);
  T.forEach((fila, i) => fila.forEach((a, j) => { if (Math.abs(i - j) > 1) cerca(a, 0, 1e-10, `T(${i + 1},${j + 1})`); }));
});
prueba('Iteración QR', () => {
  const ls = propios.iteracionQR({ A: P, tol: 1e-12, maxIter: 500 }).resultado.map((x) => x.valor).sort((a, b) => b - a);
  vectorCerca(ls, [11, 2, 1], 1e-8);
});

// ---- Unidad 1 ----
prueba('Error absoluto y relativo', () => {
  const r = errores.erroresAbsRel({ real: Math.PI, aprox: 3.1416 });
  cerca(valor(r, 'Error absoluto Ea = |p − p*|'), 7.346410206832132e-6, 1e-15);
  // Burden: t es el mayor entero con Er ≤ 5·10^(−t); Er ≈ 2.34e−6 → t = 6
  if (valor(r, 'Cifras significativas correctas') !== 6) throw new Error('Se esperaban 6 cifras significativas');
});
prueba('Épsilon de máquina', () => cerca(valor(errores.epsilonMaquina({ base: 2 }), 'Épsilon de máquina calculado'), Number.EPSILON, 0));
prueba('Truncamiento de Taylor', () => cerca(valor(errores.truncamientoTaylor({ x: 1, terminos: 15 }), 'Aproximación con 15 términos'), Math.E, 1e-10));
prueba('Propagación', () => { if (errores.propagacion({ x: 2, ex: 0.01, y: 3, ey: 0.01 }).filas.length !== 4) throw new Error('Faltan operaciones'); });
prueba('Orden de convergencia de Newton ≈ 2', () => {
  const r = raices.newton({ f: (x) => x * x - 2, df: (x) => 2 * x, x0: 1, tol: 1e-15, maxIter: 6 });
  const suc = [1, ...r.filas.map((fila) => fila[4])].slice(0, 5);
  cerca(valor(errores.ordenConvergencia({ sucesion: suc, limite: Math.SQRT2 }), 'Orden estimado p'), 2, 0.15);
});

// ---- Intérprete de expresiones ----
const ex = MN.expresiones;

prueba('Evalúa funciones', () => {
  cerca(ex.compilarFuncion('x^3 - 2*x - 5')(2), -1, 1e-15);
  cerca(ex.compilarFuncion('2x + 3(x - 1)')(2), 7, 1e-15, 'multiplicación implícita:');
  cerca(ex.compilarFuncion('-x^2')(3), -9, 1e-15, 'precedencia de −x²:');
  cerca(ex.compilarFuncion('2^3^2')(0), 512, 1e-12, 'potencia asociativa a la derecha:');
  cerca(ex.compilarFuncion('exp(-x) - x')(0), 1, 1e-15);
  cerca(ex.compilarFuncion('ln(e) + log10(100) + sqrt(16) + abs(-2) + cos(pi)')(0), 1 + 2 + 4 + 2 - 1, 1e-12);
});
prueba('Evalúa números', () => {
  cerca(ex.evaluarNumero('pi/4', 'n'), Math.PI / 4, 1e-15);
  cerca(ex.evaluarNumero('1e-6', 'n'), 1e-6, 0);
  vectorCerca(ex.evaluarLista('1, -3.5, pi / 2', 'lista'), [1, -3.5, Math.PI / 2], 1e-15);
});
prueba('Derivada simbólica', () => {
  const d = ex.derivar('x^3 - 2*x - 5');
  if (d.texto !== '3 * x^2 - 2') throw new Error(`texto: ${d.texto}`);
  cerca(d.df(2), 10, 1e-12);
  cerca(ex.derivar('sin(x) * exp(x)').df(0), 1, 1e-12, "(sin·exp)'(0):");
  cerca(ex.derivar('x^x').df(1), 1, 1e-12, "(x^x)'(1):");
  cerca(ex.derivar('ln(x^2 + 1)').df(1), 1, 1e-12, "(ln(x²+1))'(1):");
  cerca(ex.derivar('sqrt(x) / x').df(4), -1 / 16, 1e-12, "(√x/x)'(4):");
  cerca(ex.derivar('2^x').df(0), Math.LN2, 1e-12, "(2^x)'(0):");
});
prueba('Seguridad: se rechaza código en lugar de matemáticas', () => {
  const ataques = ['alert(1)', 'constructor', '__proto__', 'this', 'window.location', 'x; fetch("http://a")',
    '`x`', 'x[0]', 'x=1', '"x"', 'Function("return 1")()', 'x => x', 'eval(x)', 'process', 'document.cookie'];
  for (const a of ataques) {
    let rechazado = false;
    try { ex.compilarFuncion(a); } catch (e) { rechazado = e instanceof ErrorMetodo; }
    if (!rechazado) throw new Error(`No se rechazó: ${a}`);
    rechazado = false;
    try { ex.evaluarNumero(a, 'n'); } catch (e) { rechazado = e instanceof ErrorMetodo; }
    if (!rechazado) throw new Error(`No se rechazó como número: ${a}`);
  }
});
prueba('Seguridad: entradas enormes se rechazan sin congelar la página', () => {
  lanza(() => ex.compilarFuncion('x+'.repeat(200) + 'x'));
  lanza(() => ex.compilarFuncion('('.repeat(100) + 'x' + ')'.repeat(100)));
  lanza(() => ex.evaluarLista(Array(60).fill('1').join(','), 'lista'));
});

MN.pruebas = resultados;

})();
