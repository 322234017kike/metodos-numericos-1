// Unidad 1: análisis de error.
window.MN = window.MN || {};

(() => {
'use strict';

const { falla } = MN.util;

/** 1.2 Error absoluto, relativo y cifras significativas correctas. */
function erroresAbsRel({ real, aprox }) {
  if (!Number.isFinite(real) || !Number.isFinite(aprox)) falla('Captura valores numéricos.');
  if (real === 0) falla('El valor real no puede ser cero para calcular el error relativo.');
  const ea = Math.abs(real - aprox);
  const er = ea / Math.abs(real);
  // Cifras significativas: la mayor n tal que er < 5·10^(−n)  (criterio de Scarborough).
  const cifras = er === 0 ? Infinity : Math.max(0, Math.floor(Math.log10(5 / er)));
  return {
    convergio: true,
    resultado: [
      { etiqueta: 'Error absoluto Ea = |p − p*|', valor: ea },
      { etiqueta: 'Error relativo Er = Ea / |p|', valor: er },
      { etiqueta: 'Error relativo porcentual', valor: `${(er * 100).toPrecision(6)} %` },
      { etiqueta: 'Cifras significativas correctas', valor: cifras === Infinity ? 'todas (valor exacto)' : cifras },
    ],
    avisos: [],
  };
}

/** 1.2 Épsilon de máquina: el menor ε tal que 1 + ε > 1 en punto flotante. */
function epsilonMaquina({ base = 2 }) {
  if (!(Number.isInteger(base) && base >= 2)) falla('La base debe ser un entero mayor o igual a 2.');
  const columnas = ['k', 'ε = base^(−k)', '1 + ε', '¿1 + ε > 1?'];
  const filas = [];
  let eps = 1, ultimo = 1;
  for (let k = 0; k < 2000; k++) {
    const mayor = 1 + eps > 1;
    filas.push([k, eps, 1 + eps, mayor ? 'sí' : 'no']);
    if (!mayor) break;
    ultimo = eps;
    eps /= base;
  }
  return {
    convergio: true,
    resultado: [
      { etiqueta: 'Épsilon de máquina calculado', valor: ultimo },
      { etiqueta: 'Number.EPSILON (IEEE 754 doble)', valor: Number.EPSILON },
      { etiqueta: 'Precisión aproximada', valor: `${Math.floor(-Math.log10(Number.EPSILON))} dígitos decimales` },
    ],
    columnas,
    filas,
    avisos: [],
  };
}

const factorial = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };

/** 1.2 Error de truncamiento: serie de Maclaurin de eˣ cortada en n términos. */
function truncamientoTaylor({ x, terminos }) {
  if (!Number.isFinite(x)) falla('x debe ser numérico.');
  if (!(Number.isInteger(terminos) && terminos >= 1 && terminos <= 100)) falla('El número de términos debe ser un entero entre 1 y 100.');
  const real = Math.exp(x);
  const columnas = ['n', 'Término xⁿ/n!', 'Suma parcial', 'Error verdadero Et %', 'Error aproximado Ea %'];
  const filas = [];
  let suma = 0, anterior = NaN;
  for (let n = 0; n < terminos; n++) {
    const termino = x ** n / factorial(n);
    suma += termino;
    filas.push([n, termino, suma, (Math.abs(real - suma) / Math.abs(real)) * 100, n === 0 ? NaN : (Math.abs(suma - anterior) / Math.abs(suma)) * 100]);
    anterior = suma;
  }
  return {
    convergio: true,
    resultado: [
      { etiqueta: `e^${x} (valor real)`, valor: real },
      { etiqueta: `Aproximación con ${terminos} términos`, valor: suma },
      { etiqueta: 'Error de truncamiento', valor: Math.abs(real - suma) },
    ],
    columnas,
    filas,
    avisos: [],
  };
}

/** 1.3 Propagación del error en las cuatro operaciones (cotas de primer orden). */
function propagacion({ x, ex, y, ey }) {
  if (![x, ex, y, ey].every(Number.isFinite)) falla('Captura valores numéricos.');
  if (ex < 0 || ey < 0) falla('Las cotas de error deben ser no negativas.');
  const rx = x !== 0 ? ex / Math.abs(x) : Infinity;
  const ry = y !== 0 ? ey / Math.abs(y) : Infinity;
  const fila = (op, valor, absoluto, regla) => [op, valor, absoluto, valor !== 0 ? absoluto / Math.abs(valor) : NaN, regla];
  const filas = [
    fila('x + y', x + y, ex + ey, 'Δ(x+y) ≈ Δx + Δy'),
    fila('x − y', x - y, ex + ey, 'Δ(x−y) ≈ Δx + Δy'),
    fila('x · y', x * y, Math.abs(x * y) * (rx + ry), 'δ(xy) ≈ δx + δy'),
  ];
  const avisos = [];
  if (y !== 0) filas.push(fila('x / y', x / y, Math.abs(x / y) * (rx + ry), 'δ(x/y) ≈ δx + δy'));
  else avisos.push('y = 0: no se calcula el cociente.');
  const resta = filas[1];
  if (resta[3] > 10 * Math.max(rx, ry)) avisos.push('La resta de números cercanos amplificó el error relativo: es una cancelación catastrófica.');
  return {
    convergio: true,
    resultado: [
      { etiqueta: 'Error relativo de x', valor: rx },
      { etiqueta: 'Error relativo de y', valor: ry },
    ],
    columnas: ['Operación', 'Resultado', 'Cota de error absoluto', 'Cota de error relativo', 'Regla'],
    filas,
    avisos,
  };
}

/** 1.3 Cancelación catastrófica: √(x+1) − √x frente a la forma racionalizada 1/(√(x+1) + √x). */
function cancelacion({ potenciaMax }) {
  if (!(Number.isInteger(potenciaMax) && potenciaMax >= 1 && potenciaMax <= 20)) falla('La potencia máxima debe ser un entero entre 1 y 20.');
  const filas = [];
  for (let k = 1; k <= potenciaMax; k++) {
    const x = 10 ** k;
    const directa = Math.sqrt(x + 1) - Math.sqrt(x);
    const estable = 1 / (Math.sqrt(x + 1) + Math.sqrt(x));
    filas.push([`10^${k}`, directa, estable, Math.abs(directa - estable) / estable]);
  }
  return {
    convergio: true,
    resultado: [{ etiqueta: 'Conclusión', valor: 'Restar números casi iguales pierde cifras significativas; reformular la expresión evita la resta.' }],
    columnas: ['x', '√(x+1) − √x', '1/(√(x+1) + √x)', 'Error relativo de la forma directa'],
    filas,
    avisos: [],
  };
}

/**
 * 1.4 Orden de convergencia estimado a partir de una sucesión de aproximaciones:
 * p ≈ ln(e_{k+1}/e_k) / ln(e_k/e_{k−1}), con e_k = |x_k − límite|.
 */
function ordenConvergencia({ sucesion, limite }) {
  if (!Array.isArray(sucesion) || sucesion.length < 4) falla('Captura al menos 4 aproximaciones separadas por comas.');
  if (sucesion.some((v) => !Number.isFinite(v))) falla('La sucesión contiene valores no numéricos.');
  const L = Number.isFinite(limite) ? limite : sucesion[sucesion.length - 1];
  const usados = Number.isFinite(limite) ? sucesion : sucesion.slice(0, -1);
  const e = usados.map((x) => Math.abs(x - L));
  const filas = [];
  const ps = [];
  e.forEach((ek, k) => {
    let p = NaN, lambda = NaN;
    if (k >= 2 && e[k - 1] > 0 && e[k - 2] > 0 && ek > 0) {
      p = Math.log(ek / e[k - 1]) / Math.log(e[k - 1] / e[k - 2]);
      if (Number.isFinite(p)) { ps.push(p); lambda = ek / e[k - 1] ** p; }
    }
    filas.push([k, usados[k], ek, p, lambda]);
  });
  if (ps.length === 0) falla('No hay suficientes errores distintos de cero para estimar el orden.');
  const p = ps[ps.length - 1];
  const tipo = p < 1.2 ? 'lineal' : p < 1.8 ? 'superlineal' : p < 2.5 ? 'cuadrática' : 'de orden superior';
  return {
    convergio: true,
    resultado: [
      { etiqueta: 'Límite usado', valor: L },
      { etiqueta: 'Orden estimado p', valor: p },
      { etiqueta: 'Tipo de convergencia', valor: tipo },
    ],
    columnas: ['k', 'x_k', 'e_k = |x_k − L|', 'p estimado', 'λ = e_k / e_{k−1}^p'],
    filas,
    avisos: Number.isFinite(limite) ? [] : ['No se dio el límite: se usó el último término de la sucesión.'],
  };
}

MN.error = { erroresAbsRel, epsilonMaquina, truncamientoTaylor, propagacion, cancelacion, ordenConvergencia };
})();
