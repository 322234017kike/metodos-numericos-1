// Navegación entre pantallas, siguiendo el flujo del pizarrón:
// Portada → Intro → Menú → Unidad → Métodos → Teoría → Ejemplo → Tabla, y Salir.
window.MN = window.MN || {};

(() => {
'use strict';

const { CONFIG } = MN.config;
const { INTRO, UNIDADES, METODOS } = MN.contenido;
const { compilarFuncion, evaluarNumero, evaluarLista } = MN.expresiones;
const { ErrorMetodo, falla } = MN.util;
const { h, icono, formatoNumero, vistaValor, vistaTabla, vistaMatriz, editorMatriz, editorVector, editorSimple, redimensionarMatriz, redimensionarVector, grafica } = MN.ui;

const app = document.getElementById('app');
const LETRAS = 'abcdefghijklmnopqrstuvwxyz';
const ICONO_UNIDAD = { 2: 'raices', 3: 'sistemas', 4: 'lu', 5: 'propios' };

// Datos capturados (como texto) y último resultado de cada método.
// Map y no objeto: la clave viene de la URL y un id como "__proto__" no debe tocar Object.prototype.
const capturas = new Map();
const resultados = new Map();

// ---------------- Transiciones ----------------

const DURACION_SALIDA = 380; // la cortina cubre la pantalla en este momento; ahí se cambia de hoja
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Qué tan "adentro" del flujo está una ruta; decide si la animación avanza o regresa. */
function profundidad(ruta) {
  const [seccion, , b] = ruta.replace(/^#\/?/, '').split('/');
  switch (seccion) {
    case 'intro': return 1;
    case 'menu': return 2;
    case 'unidad': return b === 'metodos' ? 4 : 3;
    case 'metodo': return b === 'tabla' ? 7 : b === 'ejemplo' ? 6 : 5;
    case 'salir': return 8;
    default: return 0;
  }
}

let rutaActual = location.hash;
let navegando = false;

/** Navega con animación: resalta la opción elegida, desvanece la hoja actual y cambia de ruta. */
function ir(ruta, origen) {
  if (navegando || ruta === location.hash) return;
  if (sinMovimiento()) { location.hash = ruta; return; }
  navegando = true;
  origen?.classList.add('elegido');
  const hojaActual = app.querySelector('.hoja');
  const atras = profundidad(ruta) < profundidad(location.hash);
  hojaActual?.classList.remove('entrando', 'entrando-atras');
  hojaActual?.classList.add(atras ? 'saliendo-atras' : 'saliendo');
  barrerCortina(ruta, atras);
  setTimeout(() => { navegando = false; location.hash = ruta; }, DURACION_SALIDA);
}

/** Número de unidad al que pertenece una ruta (para pintar la cortina con su color). */
function unidadDeRuta(ruta) {
  const [seccion, a] = ruta.replace(/^#\/?/, '').split('/');
  if (seccion === 'unidad') return Number(a) || null;
  if (seccion === 'metodo' && Object.hasOwn(METODOS, a ?? '')) return METODOS[a].unidad;
  return null;
}

/** Cortina de color que cruza la pantalla mientras cambia la hoja. */
function barrerCortina(ruta, atras) {
  const n = unidadDeRuta(ruta);
  const cortina = h('div', { class: `cortina${atras ? ' atras' : ''}${n ? ` u${n}` : ''}`, 'aria-hidden': 'true' });
  document.body.append(cortina);
  const quitar = () => cortina.remove();
  cortina.addEventListener('animationend', (e) => { if (e.target === cortina) quitar(); });
  setTimeout(quitar, 1200); // por si el navegador no dispara animationend
}

// Onda que se expande desde el punto donde se hace clic en tarjetas, filas y botones.
app.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.tarjeta, .fila-metodo, .boton');
  if (!el || sinMovimiento()) return;
  const r = el.getBoundingClientRect();
  const onda = h('span', { class: 'onda-clic', 'aria-hidden': 'true' });
  onda.style.left = `${e.clientX - r.left}px`;
  onda.style.top = `${e.clientY - r.top}px`;
  el.append(onda);
  setTimeout(() => onda.remove(), 700);
});

// Los enlaces internos también pasan por la transición.
app.addEventListener('click', (e) => {
  const enlace = e.target.closest('a[href^="#/"]');
  if (!enlace || e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  ir(enlace.getAttribute('href'), enlace.closest('.tarjeta, .fila-metodo') ? enlace : null);
});

// ---------------- Tema claro / oscuro ----------------

function temaGuardado() {
  try { return localStorage.getItem('metnum-tema'); } catch { return null; }
}

function aplicarTema(tema) {
  if (tema) document.documentElement.dataset.theme = tema;
  else delete document.documentElement.dataset.theme;
}

function temaEfectivo() {
  return document.documentElement.dataset.theme
    ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function botonTema() {
  const oscuro = temaEfectivo() === 'dark';
  return h('button', {
    type: 'button', class: 'boton-icono', title: oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
    'aria-label': oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
    onclick: (e) => {
      const nuevo = temaEfectivo() === 'dark' ? 'light' : 'dark';
      aplicarTema(nuevo);
      try { localStorage.setItem('metnum-tema', nuevo); } catch { /* sin almacenamiento */ }
      e.currentTarget.replaceWith(botonTema());
    },
  }, icono(oscuro ? 'sol' : 'luna'));
}

aplicarTema(temaGuardado());

// ---------------- Estructura común ----------------

/** Hoja de una pantalla. `unidad` pinta los acentos con el color de esa unidad. */
function hoja({ clase = '', unidad } = {}, ...contenido) {
  return h('section', { class: `hoja ${clase} ${unidad ? `u${unidad}` : ''}` }, contenido);
}

/** Barra superior con la marca, la ruta de navegación y el cambio de tema. */
function barra(...migas) {
  return h('header', { class: 'barra' },
    h('a', { href: '#/menu', class: 'marca', 'aria-label': 'Ir al menú principal' },
      h('span', { class: 'logo' }, 'Σ'),
      h('span', {}, h('strong', {}, CONFIG.sistema), h('small', {}, 'FES Acatlán · UNAM'))),
    migas.length ? h('nav', { class: 'migas', 'aria-label': 'Ubicación' }, migas) : h('span', { class: 'migas' }),
    botonTema());
}

const boton = (texto, accion, clase = 'secundario', nombreIcono) => h('button', {
  type: 'button', class: `boton ${clase}`, onclick: (e) => accion(e.currentTarget),
}, clase === 'primario' ? null : nombreIcono ? icono(nombreIcono) : null, h('span', {}, texto), clase === 'primario' ? icono(nombreIcono ?? 'flecha') : null);

const acciones = (...botones) => h('div', { class: 'acciones' }, botones);

/** Agrega retrasos escalonados para que los elementos aparezcan uno tras otro. */
const escalonar = (lista) => lista.map((el, i) => { el.style.setProperty('--i', i); el.classList.add('aparece'); return el; });

function unidadDe(id) {
  return UNIDADES.find((u) => u.numero === METODOS[id].unidad);
}

/** Pasos de un método (Teoría → Ejemplo → Tabla) con el actual resaltado. */
function pasosMetodo(id, actual) {
  const pasos = [['teoria', 'Teoría', `#/metodo/${id}`], ['ejemplo', 'Ejemplo', `#/metodo/${id}/ejemplo`], ['tabla', 'Tabla', `#/metodo/${id}/tabla`]];
  return h('ol', { class: 'pasos-metodo', 'aria-label': 'Etapas del método' },
    pasos.map(([clave, texto, ruta], i) => h('li', { class: clave === actual ? 'actual' : null },
      h('a', { href: ruta, 'aria-current': clave === actual ? 'step' : null },
        h('span', { class: 'circulo' }, icono(clave)), h('span', {}, `${i + 1}. ${texto}`)))));
}

function cabeceraMetodo(id, etapa) {
  const m = METODOS[id];
  const u = unidadDe(id);
  return [
    barra(h('a', { href: '#/menu' }, 'Menú'), h('a', { href: `#/unidad/${u.numero}/metodos` }, `Unidad ${u.romano}`), h('span', {}, m.nombre)),
    h('div', { class: 'titular' },
      h('span', { class: 'insignia-unidad' }, icono(ICONO_UNIDAD[u.numero])),
      h('div', {},
        h('p', { class: 'sobretitulo' }, `Unidad ${u.romano} · Tema ${m.tema}`),
        h('h1', {}, m.nombre))),
    pasosMetodo(id, etapa),
  ];
}

const iniciales = (nombre) => {
  const p = nombre.split(/\s+/);
  return ((p[2] ?? p[0])[0] + p[0][0]).toUpperCase();
};

// ---------------- Pantallas ----------------

function portada() {
  return hoja({ clase: 'portada' },
    h('div', { class: 'decoracion', 'aria-hidden': 'true' }, curvaDecorativa()),
    h('div', { class: 'escudos' }, h('span', { class: 'chip' }, 'UNAM'), h('span', { class: 'chip' }, 'FES Acatlán')),
    h('p', { class: 'institucion' }, CONFIG.universidad),
    h('p', { class: 'institucion tenue' }, CONFIG.facultad),
    h('h1', { class: 'titulo-sistema' }, CONFIG.sistema),
    h('p', { class: 'asignatura' }, CONFIG.asignatura),
    h('p', { class: 'carrera' }, CONFIG.carrera),
    h('div', { class: 'integrantes' },
      h('h2', {}, 'Integrantes'),
      h('ul', {}, escalonar(CONFIG.integrantes.map((n) => h('li', {}, h('span', { class: 'avatar' }, iniciales(n)), h('span', {}, n)))))),
    CONFIG.profesor ? h('p', {}, `Profesor: ${CONFIG.profesor}`) : null,
    CONFIG.grupo ? h('p', {}, `Grupo: ${CONFIG.grupo}`) : null,
    h('p', { class: 'fecha' }, CONFIG.fecha),
    acciones(boton('Comenzar', (b) => ir('#/intro', b), 'primario')));
}

/** Curva que se dibuja sola detrás del título de la portada. */
function curvaDecorativa() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 600 200');
  svg.setAttribute('preserveAspectRatio', 'none');
  const puntos = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * 600;
    const t = (i / 120) * Math.PI * 3;
    return `${x.toFixed(1)},${(100 - 55 * Math.sin(t) * Math.exp(-i / 140)).toFixed(1)}`;
  });
  for (const [clase, d] of [['eje', 'M0,100 L600,100'], ['onda', `M${puntos.join(' L')}`]]) {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', clase);
    if (clase === 'onda') p.setAttribute('pathLength', '1');
    svg.append(p);
  }
  return svg;
}

const RASGOS = [
  ['teoria', 'Teoría', 'La idea del método, sus fórmulas, el algoritmo paso a paso y cuándo converge.'],
  ['ejemplo', 'Ejemplo', 'Un ejercicio precargado que puedes modificar para resolver los tuyos.'],
  ['tabla', 'Tabla', 'Las iteraciones o los pasos de la matriz, con el resultado y su error.'],
];

function intro() {
  const parrafos = INTRO.filter((p) => !Array.isArray(p));
  return hoja({},
    barra(h('span', {}, 'Introducción')),
    h('p', { class: 'sobretitulo' }, 'Bienvenida'),
    h('h1', {}, 'Introducción'),
    h('p', { class: 'entrada' }, parrafos[0]),
    h('p', {}, parrafos[1]),
    h('p', {}, parrafos[2]),
    h('div', { class: 'rasgos' }, escalonar(RASGOS.map(([ic, titulo, texto]) => h('div', { class: 'rasgo' },
      h('span', { class: 'circulo' }, icono(ic)), h('h3', {}, titulo), h('p', {}, texto))))),
    h('p', { class: 'consejo' }, icono('ejemplo'), h('span', {}, parrafos[3])),
    acciones(boton('Regresar', (b) => ir('#/portada', b), 'secundario', 'atras'), boton('Ir al menú', (b) => ir('#/menu', b), 'primario')));
}

/** Campo "Opción" como en el pizarrón: acepta número, romano o letra y resalta la opción que coincide. */
function campoOpcion(opciones, ayuda) {
  const error = h('p', { class: 'error-opcion', role: 'alert' });
  const entrada = h('input', { id: 'opcion', type: 'text', autocomplete: 'off', size: 4, 'aria-describedby': 'ayuda-opcion' });
  const destinoDe = () => opciones.find((o) => o.claves.includes(entrada.value.trim().toLowerCase()));
  const enlaceDe = (o) => app.querySelector(`a[href="${o.ruta}"].tarjeta, a[href="${o.ruta}"].fila-metodo`);
  const elegir = () => {
    const destino = destinoDe();
    if (destino) ir(destino.ruta, enlaceDe(destino));
    else {
      error.textContent = `Opción no válida. ${ayuda}`;
      entrada.select();
      entrada.classList.remove('sacudir');
      void entrada.offsetWidth; // reinicia la animación
      entrada.classList.add('sacudir');
    }
  };
  entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter') elegir(); });
  entrada.addEventListener('input', () => {
    error.textContent = '';
    app.querySelectorAll('.coincide').forEach((el) => el.classList.remove('coincide'));
    const destino = destinoDe();
    if (destino) enlaceDe(destino)?.classList.add('coincide');
  });
  return h('div', { class: 'opcion' },
    icono('teclado'),
    h('label', { for: 'opcion' }, 'Opción:'), entrada, boton('Aceptar', elegir),
    h('span', { id: 'ayuda-opcion', class: 'ayuda' }, ayuda), error);
}

function menu() {
  const opciones = [
    ...UNIDADES.map((u) => ({ claves: [u.romano.toLowerCase(), String(u.numero)], ruta: `#/unidad/${u.numero}`, u })),
    { claves: ['vi', '6'], ruta: '#/salir' },
  ];
  const tarjetas = opciones.map((o) => (o.u
    ? h('a', { href: o.ruta, class: `tarjeta u${o.u.numero}` },
      h('span', { class: 'numeral-fondo', 'aria-hidden': 'true' }, o.u.romano),
      h('span', { class: 'insignia-unidad' }, icono(ICONO_UNIDAD[o.u.numero])),
      h('span', { class: 'etiqueta-unidad' }, `Unidad ${o.u.romano}`),
      h('strong', { class: 'titulo-tarjeta' }, o.u.titulo),
      h('span', { class: 'conteo' }, `${o.u.metodos.length} métodos`, icono('flecha')))
    : h('a', { href: o.ruta, class: 'tarjeta tarjeta-salir' },
      h('span', { class: 'insignia-unidad' }, icono('salir')),
      h('span', { class: 'etiqueta-unidad' }, 'Opción VI'),
      h('strong', { class: 'titulo-tarjeta' }, 'Salir'),
      h('span', { class: 'conteo' }, 'Terminar la sesión'))));
  return hoja({ clase: 'ancha' },
    barra(h('span', {}, 'Menú principal')),
    h('p', { class: 'sobretitulo' }, CONFIG.asignatura),
    h('h1', {}, 'Menú principal'),
    h('p', { class: 'tenue' }, 'Elige una unidad para estudiar sus métodos.'),
    h('nav', { class: 'tarjetas', 'aria-label': 'Unidades' }, escalonar(tarjetas)),
    campoOpcion(opciones, 'Escribe II–VI o 2–6 y presiona Enter.'));
}

function unidad(n) {
  const u = UNIDADES.find((x) => x.numero === n);
  if (!u) return noEncontrado();
  return hoja({ unidad: n },
    barra(h('a', { href: '#/menu' }, 'Menú'), h('span', {}, `Unidad ${u.romano}`)),
    h('div', { class: 'banda' },
      h('span', { class: 'numeral-fondo', 'aria-hidden': 'true' }, u.romano),
      h('span', { class: 'insignia-unidad grande' }, icono(ICONO_UNIDAD[n])),
      h('p', { class: 'sobretitulo' }, `Unidad ${u.romano}`),
      h('h1', {}, u.titulo)),
    h('p', { class: 'objetivo' }, h('strong', {}, 'Objetivo: '), u.objetivo),
    u.descripcion.map((p) => h('p', {}, p)),
    h('h2', {}, 'Temas'),
    h('ul', { class: 'chips' }, escalonar(u.temas.map((t) => h('li', {}, t)))),
    acciones(boton('Menú principal', (b) => ir('#/menu', b), 'secundario', 'atras'), boton('Ver métodos', (b) => ir(`#/unidad/${n}/metodos`, b), 'primario')));
}

function metodosDeUnidad(n) {
  const u = UNIDADES.find((x) => x.numero === n);
  if (!u) return noEncontrado();
  const opciones = u.metodos.map((id, i) => ({ claves: [LETRAS[i]], ruta: `#/metodo/${id}`, texto: METODOS[id].nombre, tema: METODOS[id].tema }));
  const letraMenu = LETRAS[opciones.length];
  opciones.push({ claves: [letraMenu], ruta: '#/menu', texto: 'Menú principal' });
  return hoja({ unidad: n },
    barra(h('a', { href: '#/menu' }, 'Menú'), h('a', { href: `#/unidad/${n}` }, `Unidad ${u.romano}`), h('span', {}, 'Métodos')),
    h('div', { class: 'titular' },
      h('span', { class: 'insignia-unidad' }, icono(ICONO_UNIDAD[n])),
      h('div', {}, h('p', { class: 'sobretitulo' }, `Unidad ${u.romano} · ${u.titulo}`), h('h1', {}, 'Métodos'))),
    h('nav', { 'aria-label': 'Métodos de la unidad' },
      h('ol', { class: 'lista-metodos' }, escalonar(opciones.map((o) => h('li', {},
        h('a', { href: o.ruta, class: `fila-metodo${o.ruta === '#/menu' ? ' regreso' : ''}` },
          h('span', { class: 'letra' }, o.claves[0]),
          h('span', { class: 'nombre' }, o.texto),
          o.tema ? h('span', { class: 'tema' }, o.tema) : null,
          icono(o.ruta === '#/menu' ? 'inicio' : 'flecha', 'icono chevron'))))))),
    campoOpcion(opciones, `Escribe una letra de a) a ${letraMenu}) y presiona Enter.`));
}

function teoria(id) {
  const m = METODOS[id];
  const u = unidadDe(id);
  const t = m.teoria;
  return hoja({ unidad: u.numero },
    cabeceraMetodo(id, 'teoria'),
    h('div', { class: 'bloque idea' }, h('h2', {}, 'Idea del método'), h('p', {}, t.idea)),
    h('div', { class: 'bloque' }, h('h2', {}, 'Fórmulas'), h('ul', { class: 'formulas' }, t.formulas.map((f) => h('li', {}, f)))),
    h('div', { class: 'bloque' }, h('h2', {}, 'Algoritmo'), h('ol', { class: 'algoritmo' }, t.algoritmo.map((p) => h('li', {}, p)))),
    t.notas?.length ? h('div', { class: 'bloque notas' }, h('h2', {}, 'Observaciones'), h('ul', {}, t.notas.map((p) => h('li', {}, p)))) : null,
    acciones(boton('Métodos de la unidad', (b) => ir(`#/unidad/${u.numero}/metodos`, b), 'secundario', 'atras'), boton('Ver ejemplo', (b) => ir(`#/metodo/${id}/ejemplo`, b), 'primario')));
}

// ---------------- Captura de datos ----------------

function capturaInicial(m) {
  const c = {};
  for (const p of m.parametros) {
    if (p.tipo === 'matriz') c[p.clave] = p.valor.map((f) => f.map(String));
    else if (p.tipo === 'vector') c[p.clave] = p.valor.map(String);
    else c[p.clave] = String(p.valor);
  }
  return c;
}

function capturaDe(id) {
  if (!capturas.has(id)) capturas.set(id, capturaInicial(METODOS[id]));
  return capturas.get(id);
}

function interpretar(m, c) {
  const v = {};
  for (const p of m.parametros) {
    const crudo = c[p.clave];
    const nombre = p.etiqueta.replace(/:$|=$/, '').trim();
    switch (p.tipo) {
      case 'funcion':
        v[p.clave] = compilarFuncion(crudo);
        v[`${p.clave}_texto`] = crudo;
        break;
      case 'numero':
        v[p.clave] = p.opcional && !crudo.trim() ? NaN : evaluarNumero(crudo, nombre);
        break;
      case 'entero': {
        const x = evaluarNumero(crudo, nombre);
        if (!Number.isInteger(x)) falla(`${nombre} debe ser un número entero.`);
        if (p.max !== undefined && x > p.max) falla(`${nombre} no puede ser mayor que ${p.max}.`);
        v[p.clave] = x;
        break;
      }
      case 'lista': v[p.clave] = evaluarLista(crudo, nombre); break;
      case 'matriz': v[p.clave] = crudo.map((f, i) => f.map((x, j) => evaluarNumero(x, `${p.clave}(${i + 1},${j + 1})`))); break;
      case 'vector': v[p.clave] = crudo.map((x, i) => evaluarNumero(x, `${p.clave}(${i + 1})`)); break;
      default: v[p.clave] = crudo;
    }
  }
  return v;
}

function calcular(id) {
  const m = METODOS[id];
  try {
    resultados.set(id, { ok: true, datos: m.ejecutar(interpretar(m, capturaDe(id))) });
  } catch (e) {
    if (!(e instanceof ErrorMetodo)) console.error(e);
    resultados.set(id, { ok: false, mensaje: e instanceof ErrorMetodo ? e.message : `Error inesperado: ${e.message}` });
  }
  return resultados.get(id);
}

function ejemplo(id) {
  const m = METODOS[id];
  const u = unidadDe(id);
  const c = capturaDe(id);
  const formulario = h('div', { class: 'formulario' });
  const mensaje = h('div', { class: 'mensaje-error', role: 'alert' });

  const dibujar = () => {
    formulario.replaceChildren(...m.parametros.map((p) => {
      if (p.tipo === 'matriz') {
        return editorMatriz(p, c[p.clave], (n) => {
          c[p.clave] = redimensionarMatriz(c[p.clave], n);
          for (const q of m.parametros) if (q.de === p.clave) c[q.clave] = redimensionarVector(c[q.clave], n);
          dibujar();
        }, (i, j, x) => { c[p.clave][i][j] = x; });
      }
      if (p.tipo === 'vector') return editorVector(p, c[p.clave], (i, x) => { c[p.clave][i] = x; });
      return editorSimple(p, c[p.clave], (x) => { c[p.clave] = x; });
    }));
  };
  dibujar();

  const enviar = (e) => {
    e.preventDefault();
    const r = calcular(id);
    if (r.ok) ir(`#/metodo/${id}/tabla`, e.submitter);
    else {
      mensaje.replaceChildren(icono('alerta'), h('span', {}, r.mensaje));
      mensaje.classList.remove('sacudir');
      void mensaje.offsetWidth;
      mensaje.classList.add('sacudir');
    }
  };

  return hoja({ unidad: u.numero },
    cabeceraMetodo(id, 'ejemplo'),
    h('p', { class: 'tenue' }, 'Los datos del ejemplo ya están cargados. Puedes calcularlo tal cual o cambiar los valores para resolver tu propio ejercicio.'),
    h('form', { onsubmit: enviar, novalidate: true },
      h('div', { class: 'bloque' }, formulario),
      mensaje,
      acciones(
        boton('Teoría', (b) => ir(`#/metodo/${id}`, b), 'secundario', 'atras'),
        boton('Restaurar ejemplo', () => { capturas.set(id, capturaInicial(m)); render(); }),
        h('button', { type: 'submit', class: 'boton primario' }, h('span', {}, m.presentacion === 'propios' ? 'Encontrar' : 'Calcular'), icono('flecha')))));
}

// ---------------- Tabla de resultados ----------------

const COLUMNA_ITERADO = { biseccion: 3, falsaPosicion: 5, newton: 4, secante: 5 };

function graficaRaices(id, datos) {
  const c = capturas.get(id) ?? capturaInicial(METODOS[id]);
  let f;
  try { f = compilarFuncion(c.f); } catch { return null; }
  const puntos = datos.filas.map((fila) => fila[COLUMNA_ITERADO[id]]);
  const raiz = datos.resultado[0].valor;
  const extremos = ['a', 'b', 'x0', 'x1'].filter((k) => k in c).map((k) => { try { return evaluarNumero(c[k], k); } catch { return NaN; } });
  const xs = [...extremos, ...puntos, raiz].filter(Number.isFinite);
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  const margen = (x1 - x0 || 1) * 0.15;
  x0 -= margen; x1 += margen;
  const svg = grafica(f, x0, x1, puntos, raiz);
  return svg ? h('figure', { class: 'figura bloque' }, svg, h('figcaption', {}, 'Curva de f(x); los puntos sobre el eje son las aproximaciones y el círculo verde la raíz final.')) : null;
}

// ---------------- Presentación de valores propios (al estilo de una calculadora de matrices) ----------------

const SUPERINDICES = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const superindice = (k) => String(k).split('').map((c) => SUPERINDICES[c]).join('');

/** Redondea a `d` decimales y quita el −0. */
const redondear = (x, d) => { const r = Number(x.toFixed(d)); return Object.is(r, -0) ? 0 : r; };

const columna = (v, d) => vistaMatriz(v.map((x) => [d === undefined ? x : redondear(x, d)]), undefined, 'parentesis');

/** det(A − λI) como texto: −λ³ + 14λ² − 35λ + 22. */
function textoPolinomio(coef) {
  const n = coef.length - 1;
  let texto = '';
  coef.forEach((c, i) => {
    const g = n - i;
    if (c === 0) return;
    const abs = Math.abs(c);
    const valor = formatoNumero(abs);
    const cuerpo = g === 0 ? valor : `${abs === 1 ? '' : valor}λ${g > 1 ? superindice(g) : ''}`;
    texto += texto === '' ? `${c < 0 ? '−' : ''}${cuerpo}` : ` ${c < 0 ? '−' : '+'} ${cuerpo}`;
  });
  return texto || '0';
}

/** Factorización con las raíces reales: −(λ − 1)(λ − 2)(λ − 11). Null si hay raíces complejas. */
function textoFactorizado(coef, raices) {
  if (raices.some((z) => z.im !== 0)) return null;
  const lider = coef[0];
  const factores = raices.slice().sort((a, b) => a.re - b.re)
    .map(({ re }) => (re === 0 ? 'λ' : `(λ ${re < 0 ? '+' : '−'} ${formatoNumero(Math.abs(re))})`)).join('');
  return `${lider === -1 ? '−' : lider === 1 ? '' : formatoNumero(lider)}${factores}`;
}

const textoRaiz = (z) => (z.im === 0 ? formatoNumero(z.re) : `${formatoNumero(z.re)} ${z.im < 0 ? '−' : '+'} ${formatoNumero(Math.abs(z.im))}i`);

/** Matriz A − λI con las entradas de la diagonal escritas como "a − λ". */
function matrizMenosLambda(A) {
  return A.map((fila, i) => fila.map((a, j) => {
    if (i !== j) return a;
    return a === 0 ? '−λ' : `${formatoNumero(a)} − λ`;
  }));
}

const PASOS_COMPLETOS = 5; // cuántas iteraciones se muestran desarrolladas antes de abreviar

function pasoPotencia(p, inversa, d) {
  const sup = superindice(p.k), supAnt = superindice(p.k - 1);
  const ecuacion = inversa
    ? h('div', { class: 'ecuacion' }, h('span', {}, `Se resuelve A · y${sup} = x${supAnt}:  y${sup} =`), columna(p.y, d))
    : h('div', { class: 'ecuacion' }, h('span', {}, `y${sup} = A · x${supAnt} = A ·`), columna(p.x, d), h('span', {}, '='), columna(p.y, d));
  const escala = inversa
    ? `μ${sup} = ${formatoNumero(redondear(p.mu, d))} (componente de mayor valor absoluto)  →  λ${sup} = 1 / μ${sup} = ${formatoNumero(redondear(p.lambda, d))}`
    : `λ${sup} = ${formatoNumero(redondear(p.lambda, d))} (componente de mayor valor absoluto)`;
  const divisor = inversa ? `μ${sup}` : `λ${sup}`;
  const siguiente = p.y.map((v) => v / p.mu);
  return h('li', {},
    h('strong', {}, `Iteración ${p.k}`),
    ecuacion,
    h('p', {}, escala),
    h('div', { class: 'ecuacion' }, h('span', {}, `x${sup} = y${sup} / ${divisor} =`), columna(siguiente, d)),
    Number.isFinite(p.err) ? h('p', { class: 'nota' }, `Error |λ${sup} − λ${supAnt}| = ${formatoNumero(p.err)}`) : null);
}

function vistaPropios(d) {
  const P = d.potencia;
  const inversa = P.variante === 'inversa';
  const decimales = Math.min(8, Math.max(3, Math.ceil(-Math.log10(P.tol) / 2)));
  const tipo = inversa ? 'mínimo' : 'máximo';
  const { comprobacion: C } = P;

  // Las primeras iteraciones desarrolladas; si son muchas, se abrevia y se muestra la última.
  const pasos = P.pasos;
  const visibles = pasos.length <= PASOS_COMPLETOS + 1 ? pasos : [...pasos.slice(0, PASOS_COMPLETOS), null, pasos[pasos.length - 1]];

  const verificado = C.coincide
    ? h('p', { class: 'verificado' }, icono('check'), h('span', {}, `El valor propio ${tipo} según el polinomio es λ = ${textoRaiz(C.esperado)}, que coincide con el método de ${inversa ? 'potencia inversa' : 'potencias'}.`))
    : h('p', { class: 'mensaje-error' }, icono('alerta'), h('span', {}, `El polinomio indica λ = ${textoRaiz(C.esperado)} como valor ${tipo}; no coincide con el obtenido.`));
  const factorizado = textoFactorizado(C.coef, C.raices);

  return h('div', { class: 'calc-propios' },
    h('div', { class: 'ecuacion grande' }, h('span', { class: 'mat-nombre' }, 'A ='), vistaMatriz(P.A, undefined, 'parentesis')),
    h('h2', {}, `Valor propio ${tipo} y su vector propio`),
    h('ul', { class: 'lista-propios' },
      h('li', {},
        h('div', { class: 'ecuacion grande' },
          h('span', { class: 'mat-nombre' }, 'v ='), columna(P.vector, decimales),
          h('span', {}, ', valor propio ', tipo, ' '), h('strong', { class: 'lambda' }, `λ = ${formatoNumero(redondear(P.lambda, decimales))}`)))),
    h('p', { class: 'nota' }, `Valores redondeados a ${decimales} decimales. Comprobación directa: ‖A·v − λ·v‖∞ = ${formatoNumero(P.residuo)}.`),
    h('details', { class: 'detalles' },
      h('summary', {}, 'Los detalles'),
      h('ol', { class: 'pasos-propios' },
        h('li', {},
          h('strong', {}, `Método de ${inversa ? 'potencia inversa' : 'potencias'}`),
          h('p', {}, inversa
            ? 'Los valores propios de A⁻¹ son 1/λ, así que el valor dominante de A⁻¹ da el valor propio mínimo de A. En vez de invertir A, en cada iteración se resuelve A·y = x.'
            : 'En cada iteración se multiplica A por el vector actual y se divide entre su componente de mayor valor absoluto; ese factor converge al valor propio máximo.'),
          h('div', { class: 'ecuacion' }, h('span', {}, 'Vector inicial x⁰ ='), columna(P.x0)),
          h('ol', { class: 'iteraciones-propios' }, visibles.map((p) => (p
            ? pasoPotencia(p, inversa, decimales)
            : h('li', { class: 'omitidas' }, `… iteraciones ${PASOS_COMPLETOS + 1} a ${pasos.length - 1}: ver la tabla …`)))),
          h('p', {}, `Después de ${pasos.length} iteraciones: λ = ${formatoNumero(P.lambda)}.`)),
        h('li', {},
          h('strong', {}, 'Tabla de iteraciones'),
          vistaTabla(d.columnas, d.filas)),
        h('li', {},
          h('strong', {}, 'Comprobación con el polinomio característico'),
          h('p', {}, 'Si λ es un valor propio de A, existe un vector v ≠ 0 tal que A·v = λ·v, es decir (A − λI)·v = 0. Como v no es nulo, el determinante de A − λI debe ser 0:'),
          h('div', { class: 'ecuacion' },
            h('span', {}, 'det(A − λI) ='), vistaMatriz(matrizMenosLambda(P.A), undefined, 'determinante'),
            h('span', {}, `= ${textoPolinomio(C.coef)}${factorizado ? ` = ${factorizado}` : ''} = 0`)),
          h('p', {}, 'Raíces (todos los valores propios de A):'),
          h('ol', { class: 'raices' }, C.raices.map((z, i) => h('li', {}, `λ${i + 1} = ${textoRaiz(z)}`, h('span', { class: 'nota' }, `   |λ| = ${formatoNumero(Math.hypot(z.re, z.im))}`)))),
          verificado))));
}

function tabla(id) {
  const m = METODOS[id];
  const u = unidadDe(id);
  const r = resultados.get(id) ?? calcular(id);
  const botones = acciones(
    boton('Menú principal', (b) => ir('#/menu', b), 'secundario', 'inicio'),
    boton('Métodos de la unidad', (b) => ir(`#/unidad/${u.numero}/metodos`, b), 'secundario', 'atras'),
    boton('Otro ejemplo', (b) => ir(`#/metodo/${id}/ejemplo`, b), 'primario', 'ejemplo'));

  if (!r.ok) {
    return hoja({ unidad: u.numero }, cabeceraMetodo(id, 'tabla'),
      h('div', { class: 'mensaje-error', role: 'alert' }, icono('alerta'), h('span', {}, r.mensaje)), botones);
  }
  const d = r.datos;
  if (m.presentacion === 'propios' && d.potencia) {
    return hoja({ clase: 'ancha', unidad: u.numero },
      cabeceraMetodo(id, 'tabla'),
      h('div', { class: `estado ${d.convergio ? 'ok' : 'aviso'}` }, icono(d.convergio ? 'check' : 'alerta'), d.convergio ? 'Cálculo completado' : 'Cálculo sin convergencia'),
      d.avisos?.length ? h('ul', { class: 'avisos' }, d.avisos.map((a) => h('li', {}, a))) : null,
      vistaPropios(d),
      botones);
  }
  return hoja({ clase: 'ancha', unidad: u.numero },
    cabeceraMetodo(id, 'tabla'),
    h('div', { class: `estado ${d.convergio ? 'ok' : 'aviso'}` }, icono(d.convergio ? 'check' : 'alerta'), d.convergio ? 'Cálculo completado' : 'Cálculo sin convergencia'),
    d.avisos?.length ? h('ul', { class: 'avisos' }, d.avisos.map((a) => h('li', {}, a))) : null,
    d.nota ? h('p', { class: 'nota' }, d.nota) : null,
    h('h2', {}, 'Resultado'),
    h('dl', { class: 'resultado' }, escalonar(d.resultado.map(({ etiqueta, valor }) => h('div', {}, h('dt', {}, etiqueta), h('dd', {}, vistaValor(valor)))))),
    m.grafica && d.filas?.length ? graficaRaices(id, d) : null,
    d.columnas && d.filas?.length ? [h('h2', {}, 'Iteraciones'), vistaTabla(d.columnas, d.filas)] : null,
    d.pasos?.length ? [
      h('h2', {}, 'Desarrollo paso a paso'),
      h('ol', { class: 'pasos' }, d.pasos.map((p) => h('li', { class: 'bloque' },
        h('h3', {}, p.titulo),
        p.nota ? h('p', { class: 'nota' }, p.nota) : null,
        p.matrices ? h('div', { class: 'matrices' }, p.matrices.map((mx) => h('figure', {}, h('figcaption', {}, mx.nombre), vistaMatriz(mx.datos, mx.separador)))) : null))),
    ] : null,
    botones);
}

function salir() {
  return hoja({ clase: 'salida' },
    h('div', { class: 'sello' }, icono('check')),
    h('h1', {}, 'Gracias por usar el sistema'),
    h('p', { class: 'sistema' }, `${CONFIG.sistema} · ${CONFIG.asignatura}`),
    h('p', { class: 'equipo' }, CONFIG.integrantes.join(' · ')),
    h('p', { class: 'derechos' }, CONFIG.derechos),
    acciones(boton('Volver a iniciar', (b) => ir('#/portada', b), 'primario', 'inicio')));
}

function noEncontrado() {
  return hoja({}, barra(), h('h1', {}, 'Pantalla no encontrada'), acciones(boton('Menú principal', (b) => ir('#/menu', b), 'primario', 'inicio')));
}

// ---------------- Router ----------------

function pantalla(ruta) {
  const partes = ruta.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [seccion, a, b] = partes;
  switch (seccion) {
    case undefined:
    case 'portada': return portada();
    case 'intro': return intro();
    case 'menu': return menu();
    case 'salir': return salir();
    case 'unidad': return b === 'metodos' ? metodosDeUnidad(Number(a)) : unidad(Number(a));
    case 'metodo':
      // hasOwn: rutas como #/metodo/constructor no deben tomar propiedades heredadas del objeto
      if (!Object.hasOwn(METODOS, a ?? '')) return noEncontrado();
      if (b === 'ejemplo') return ejemplo(a);
      if (b === 'tabla') return tabla(a);
      return teoria(a);
    default: return noEncontrado();
  }
}

function render() {
  const atras = profundidad(location.hash) < profundidad(rutaActual);
  rutaActual = location.hash;
  const nueva = pantalla(location.hash);
  nueva.classList.add(atras ? 'entrando-atras' : 'entrando');
  app.replaceChildren(nueva);
  window.scrollTo(0, 0);
  const foco = app.querySelector('#opcion') ?? app.querySelector('h1');
  if (foco) { if (foco.tagName === 'H1') foco.setAttribute('tabindex', '-1'); foco.focus({ preventScroll: true }); }
  const titulo = app.querySelector('h1')?.textContent;
  document.title = titulo ? `${titulo} · ${CONFIG.sistema}` : CONFIG.sistema;
}

// Protección contra "clickjacking": no se deja mostrar dentro de un marco (iframe) de otro sitio.
if (window.top !== window.self) {
  app.replaceChildren(hoja({ clase: 'salida' },
    h('h1', {}, 'MetNum I'),
    h('p', {}, 'Por seguridad, este sistema no puede mostrarse dentro de otra página.'),
    h('a', { href: location.href, target: '_top', rel: 'noopener', class: 'boton primario' }, 'Abrir en su propia ventana')));
} else {
  window.addEventListener('hashchange', render);
  render();
}

})();
