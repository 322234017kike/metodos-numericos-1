// Componentes de interfaz: creación de elementos, formato de números, tablas, editores y gráfica.
window.MN = window.MN || {};

(() => {
'use strict';

/** Crea un elemento: h('div', { class: 'x', onclick: fn }, hijo1, 'texto', ...). */
function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v; // vía CSSOM: lo permite la política de seguridad (CSP)
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo == null || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return el;
}

/** Formatea números con 8 cifras significativas y notación científica cuando conviene. */
function formatoNumero(v) {
  if (typeof v !== 'number') return String(v);
  if (Number.isNaN(v)) return '—';
  if (!Number.isFinite(v)) return v > 0 ? '∞' : '−∞';
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-4 || a >= 1e10)) return v.toExponential(6).replace('e', ' × 10^').replace('^+', '^');
  return String(Number(v.toPrecision(10)));
}

const esComplejo = (v) => v && typeof v === 'object' && 're' in v && 'im' in v;

function formatoComplejo({ re, im }) {
  if (Math.abs(im) < 1e-12) return formatoNumero(re);
  return `${formatoNumero(re)} ${im < 0 ? '−' : '+'} ${formatoNumero(Math.abs(im))}i`;
}

/** Tabla de una matriz (con separador vertical opcional para matrices aumentadas). */
function vistaMatriz(datos, separador) {
  return h('table', { class: 'matriz' },
    h('tbody', {}, datos.map((fila) => h('tr', {}, fila.map((x, j) =>
      h('td', { class: separador && j === separador ? 'separador' : null }, formatoNumero(Math.abs(x) < 1e-13 ? 0 : x)))))));
}

/** Representación de cualquier valor del resultado. */
function vistaValor(v) {
  if (Array.isArray(v) && Array.isArray(v[0])) return vistaMatriz(v);
  if (esComplejo(v)) return formatoComplejo(v);
  return formatoNumero(v);
}

/** Tabla de iteraciones. */
function vistaTabla(columnas, filas) {
  return h('div', { class: 'tabla-scroll' },
    h('table', { class: 'iteraciones' },
      h('thead', {}, h('tr', {}, columnas.map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', {}, filas.map((fila, i) => h('tr', { class: i === filas.length - 1 ? 'ultima' : null },
        fila.map((x) => h('td', {}, typeof x === 'number' ? formatoNumero(x) : String(x))))))));
}

// ---------------- Editores ----------------

const TAM_MIN = 2;
const TAM_MAX = 8;

/** Ajusta una matriz de textos a n×n conservando los valores existentes. */
function redimensionarMatriz(M, n) {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => M[i]?.[j] ?? (i === j ? '1' : '0')));
}

function redimensionarVector(v, n) {
  return Array.from({ length: n }, (_, i) => v[i] ?? '0');
}

/** Editor de matriz: selector de tamaño + rejilla de entradas. */
function editorMatriz(param, valor, alCambiarTam, alEditar) {
  const n = valor.length;
  const selector = h('select', {
    'aria-label': `Tamaño de ${param.etiqueta}`,
    onchange: (e) => alCambiarTam(Number(e.target.value)),
  }, Array.from({ length: TAM_MAX - TAM_MIN + 1 }, (_, k) => {
    const t = k + TAM_MIN;
    return h('option', { value: t, selected: t === n }, `${t} × ${t}`);
  }));
  const rejilla = h('div', { class: 'rejilla', style: `grid-template-columns: repeat(${n}, minmax(3.5rem, 1fr))` },
    valor.flatMap((fila, i) => fila.map((x, j) => h('input', {
      type: 'text', inputmode: 'decimal', value: x, 'aria-label': `${param.clave}${i + 1}${j + 1}`,
      oninput: (e) => alEditar(i, j, e.target.value),
    }))));
  return h('div', { class: 'campo campo-ancho' },
    h('div', { class: 'campo-titulo' }, h('span', {}, param.etiqueta), selector),
    rejilla);
}

/** Editor de vector (se dibuja como columna horizontal). */
function editorVector(param, valor, alEditar) {
  return h('div', { class: 'campo campo-ancho' },
    h('span', { class: 'campo-titulo' }, param.etiqueta),
    h('div', { class: 'rejilla', style: `grid-template-columns: repeat(${valor.length}, minmax(3.5rem, 1fr))` },
      valor.map((x, i) => h('input', {
        type: 'text', inputmode: 'decimal', value: x, 'aria-label': `${param.clave}${i + 1}`,
        oninput: (e) => alEditar(i, e.target.value),
      }))));
}

/** Campo simple: número, entero, lista, función u opciones. */
function editorSimple(param, valor, alEditar) {
  const id = `campo-${param.clave}`;
  let control;
  if (param.tipo === 'opciones') {
    control = h('select', { id, onchange: (e) => alEditar(e.target.value) },
      param.opciones.map(([v, texto]) => h('option', { value: v, selected: v === valor }, texto)));
  } else {
    control = h('input', {
      id, type: 'text', value: valor, spellcheck: 'false', autocomplete: 'off',
      inputmode: param.tipo === 'funcion' || param.tipo === 'lista' ? 'text' : 'decimal',
      placeholder: param.opcional ? 'opcional' : null,
      oninput: (e) => alEditar(e.target.value),
    });
  }
  const ancho = param.tipo === 'funcion' || param.tipo === 'lista';
  return h('div', { class: `campo${ancho ? ' campo-ancho' : ''}` }, h('label', { for: id }, param.etiqueta), control);
}

// ---------------- Gráfica de f(x) ----------------

/** Dibuja f en [x0, x1] con las aproximaciones marcadas sobre el eje x. */
function grafica(f, x0, x1, puntos = [], raiz) {
  const W = 640, H = 300, M = 36;
  const xs = Array.from({ length: 241 }, (_, i) => x0 + ((x1 - x0) * i) / 240);
  const ys = xs.map((x) => { try { const y = f(x); return Number.isFinite(y) ? y : NaN; } catch { return NaN; } });
  const validos = ys.filter(Number.isFinite);
  if (validos.length < 2) return null;
  // Solo recorta valores extremos (asíntotas) cuando aplastarían la curva.
  const ordenados = validos.slice().sort((a, b) => a - b);
  let y0 = ordenados[0], y1 = ordenados[ordenados.length - 1];
  const p0 = ordenados[Math.floor(ordenados.length * 0.02)], p1 = ordenados[Math.ceil(ordenados.length * 0.98) - 1];
  if (y1 - y0 > 20 * (p1 - p0)) { y0 = p0; y1 = p1; }
  y0 = Math.min(0, y0);
  y1 = Math.max(0, y1);
  if (y0 === y1) { y0 -= 1; y1 += 1; }
  const px = (x) => M + ((x - x0) / (x1 - x0)) * (W - 2 * M);
  const py = (y) => H - M - ((Math.max(y0, Math.min(y1, y)) - y0) / (y1 - y0)) * (H - 2 * M);

  let d = '';
  let pluma = false;
  xs.forEach((x, i) => {
    if (!Number.isFinite(ys[i])) { pluma = false; return; }
    d += `${pluma ? 'L' : 'M'}${px(x).toFixed(1)},${py(ys[i]).toFixed(1)} `;
    pluma = true;
  });
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'grafica');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Gráfica de f(x) con las aproximaciones');
  const add = (tag, attrs, texto) => {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (texto) el.textContent = texto;
    svg.append(el);
    return el;
  };
  add('line', { x1: M, x2: W - M, y1: py(0), y2: py(0), class: 'eje' });
  if (x0 <= 0 && x1 >= 0) add('line', { x1: px(0), x2: px(0), y1: M, y2: H - M, class: 'eje' });
  add('path', { d, class: 'curva', pathLength: 1 });
  puntos.filter((x) => Number.isFinite(x) && x >= x0 && x <= x1)
    .forEach((x, i) => add('circle', { cx: px(x), cy: py(0), r: 4, class: 'iterado', opacity: 0.35 + (0.65 * (i + 1)) / puntos.length }));
  if (Number.isFinite(raiz) && raiz >= x0 && raiz <= x1) add('circle', { cx: px(raiz), cy: py(0), r: 6, class: 'raiz' });
  add('text', { x: M, y: H - 10, class: 'etiqueta' }, formatoNumero(x0));
  add('text', { x: W - M, y: H - 10, class: 'etiqueta', 'text-anchor': 'end' }, formatoNumero(x1));
  add('text', { x: M + 4, y: M - 12, class: 'etiqueta' }, 'f(x)');
  return svg;
}

// ---------------- Íconos (trazos de 24×24) ----------------

const ICONOS = {
  error: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  raices: '<path d="M3 13h18"/><path d="M4 20c3-12 6-14 8-7s5 5 8-9"/><circle cx="10.4" cy="13" r="1.6" fill="currentColor"/>',
  sistemas: '<path d="M7 4H4v16h3"/><path d="M17 4h3v16h-3"/><path d="M8.5 9h7M8.5 12h7M8.5 15h7"/>',
  lu: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 20 20 4"/><path d="M4 20V4h0l16 0Z" fill="currentColor" opacity=".18" stroke="none"/>',
  propios: '<path d="M5 19 18 6"/><path d="M11 6h7v7"/><path d="M5 19h10" opacity=".55"/><circle cx="5" cy="19" r="1.4" fill="currentColor"/>',
  teoria: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M8 7h7M8 11h5"/>',
  ejemplo: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  tabla: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/>',
  salir: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 8l-4 4 4 4"/><path d="M5 12h11"/>',
  flecha: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  atras: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  inicio: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alerta: '<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  luna: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  teclado: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
};

/** Ícono SVG en línea; hereda el color del texto. */
function icono(nombre, clase = 'icono') {
  const span = document.createElement('span');
  span.className = clase;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONOS[nombre] ?? ''}</svg>`;
  return span;
}

MN.ui = { h, icono, formatoNumero, vistaMatriz, vistaValor, vistaTabla, redimensionarMatriz, redimensionarVector, editorMatriz, editorVector, editorSimple, grafica };
})();
