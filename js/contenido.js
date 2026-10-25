// Textos del sistema: introducción, unidades y teoría de cada método con su ejemplo precargado.
window.MN = window.MN || {};

(() => {
'use strict';

const error = MN.error;
const raices = MN.raices;
const lineales = MN.lineales;
const lu = MN.lu;
const propios = MN.propios;
const { derivar } = MN.expresiones;

const INTRO = [
  'MetNum I es un sistema de apoyo para la asignatura Métodos Numéricos I de la Licenciatura en Matemáticas Aplicadas y Computación (FES Acatlán, UNAM).',
  'Los métodos numéricos permiten resolver con una computadora problemas que no tienen solución analítica o cuya solución exacta es muy costosa: raíces de ecuaciones no lineales, sistemas de ecuaciones de gran tamaño y valores propios de matrices.',
  'El sistema está organizado según el temario oficial. Desde el menú principal eliges una unidad, después un método. Para cada método encontrarás:',
  ['La teoría: idea, fórmulas, algoritmo y condiciones de convergencia.', 'Un ejemplo precargado cuyos datos puedes modificar para resolver tus propios ejercicios.', 'La tabla de iteraciones o los pasos de la matriz, junto con el resultado y su error.'],
  'Las funciones se escriben con x como variable, por ejemplo: x^3 - 2*x - 5, exp(-x) - x, cos(x) - x. Los números aceptan expresiones como 1e-6, pi/4 o sqrt(2).',
];

const tolerancia = (valor = '1e-6') => ({ clave: 'tol', etiqueta: 'Tolerancia', tipo: 'numero', valor });
const maxIter = (valor = '50') => ({ clave: 'maxIter', etiqueta: 'Máximo de iteraciones', tipo: 'entero', valor });
const funcion = (valor = 'x^3 - 2*x - 5') => ({ clave: 'f', etiqueta: 'f(x) =', tipo: 'funcion', valor });
const matriz = (valor, etiqueta = 'Matriz A') => ({ clave: 'A', etiqueta, tipo: 'matriz', valor });
const vector = (clave, etiqueta, valor) => ({ clave, etiqueta, tipo: 'vector', valor, de: 'A' });

const A3 = [[4, -1, 1], [4, -8, 1], [-2, 1, 5]];
const b3 = [7, -21, 15];
const SIMETRICA4 = [[4, 1, -2, 2], [1, 2, 0, 1], [-2, 0, 3, -2], [2, 1, -2, -1]];

const UNIDADES = [
  {
    numero: 1,
    romano: 'I',
    titulo: 'Análisis de error',
    objetivo: 'El alumno utilizará las técnicas para minimizar los errores típicos en el uso de los métodos numéricos.',
    descripcion: [
      'Todo resultado numérico es una aproximación. El error proviene de dos fuentes principales: el redondeo, porque la computadora guarda los números con una cantidad finita de dígitos, y el truncamiento, porque un proceso infinito (una serie o un límite) se corta en un número finito de pasos.',
      'En esta unidad se miden los errores (absoluto y relativo), se estudia cómo representa los números la aritmética de punto flotante, cómo se propagan los errores en las operaciones y cómo comparar la rapidez de los métodos mediante el orden de convergencia.',
    ],
    temas: ['1.1 Introducción', '1.2 Errores de redondeo: punto flotante, truncamiento, absoluto y relativo', '1.3 Propagación del error', '1.4 Orden de convergencia'],
    metodos: ['errores', 'epsilon', 'truncamiento', 'propagacion', 'cancelacion', 'orden'],
  },
  {
    numero: 2,
    romano: 'II',
    titulo: 'Solución numérica de ecuaciones de una sola variable',
    objetivo: 'El alumno implementará los algoritmos de métodos numéricos para el cálculo de raíces de ecuaciones algebraicas de una sola variable, mediante un lenguaje de programación.',
    descripcion: [
      'Buscar una raíz de f(x) = 0 es encontrar el valor de x donde la gráfica corta al eje horizontal. Salvo casos sencillos, no existe una fórmula cerrada, así que se construye una sucesión de aproximaciones que se acerca a la raíz.',
      'Los métodos cerrados (bisección y falsa posición) parten de un intervalo con cambio de signo y siempre convergen. Los métodos abiertos (Newton y secante) parten de uno o dos valores iniciales, son más rápidos pero pueden diverger. Bairstow obtiene todas las raíces, reales y complejas, de un polinomio.',
    ],
    temas: ['2.1 Bisección', '2.2 Falsa posición', '2.3 Newton', '2.4 Secante', '2.5 Bairstow'],
    metodos: ['biseccion', 'falsaPosicion', 'newton', 'secante', 'bairstow'],
  },
  {
    numero: 3,
    romano: 'III',
    titulo: 'Solución de sistemas de ecuaciones lineales',
    objetivo: 'El alumno resolverá numéricamente sistemas de ecuaciones implementando los algoritmos en un lenguaje de programación.',
    descripcion: [
      'Un sistema Ax = b de n ecuaciones con n incógnitas tiene solución única si y solo si det(A) ≠ 0, es decir, si A es invertible (su rango es n). Por el teorema de Rouché-Frobenius, si rango(A) = rango([A|b]) < n hay infinitas soluciones, y si los rangos difieren no hay solución.',
      'Los métodos exactos (Gauss, Gauss-Jordan) obtienen la solución en un número finito de operaciones, salvo errores de redondeo. Los métodos iterativos (Jacobi, Gauss-Seidel, relajación) generan aproximaciones sucesivas y son útiles en sistemas grandes y dispersos.',
    ],
    temas: ['3.1 Existencia de solución: inversión de matrices y método de intercambio', '3.2 Métodos exactos: Gauss, Gauss-Jordan y Gauss-Jordan particionado', '3.4 Métodos iterativos: mejoramiento iterativo, Jacobi, Gauss-Seidel y relajación'],
    metodos: ['inversa', 'intercambio', 'gauss', 'gaussJordan', 'particionado', 'mejoramiento', 'jacobi', 'gaussSeidel', 'sor'],
  },
  {
    numero: 4,
    romano: 'IV',
    titulo: 'Factorización LU y sus aplicaciones',
    objetivo: 'El alumno aplicará técnicas numéricas para la factorización de matrices y la solución eficiente de sistemas en problemas específicos.',
    descripcion: [
      'Factorizar A = LU (L triangular inferior, U triangular superior) permite resolver Ax = b en dos sustituciones: Ly = b y después Ux = y. La factorización se hace una sola vez y se reutiliza para muchos vectores b, lo que la hace ideal cuando se resuelven varios sistemas con la misma matriz.',
      'Doolittle fija unos en la diagonal de L, Crout los fija en la diagonal de U y Cholesky aprovecha la simetría (A = LLᵀ) para hacer la mitad del trabajo. En matrices bandadas, como las tridiagonales, la factorización conserva la banda y el costo baja de O(n³) a O(n).',
    ],
    temas: ['4.1 Fundamentos de la factorización LU', '4.2 Cholesky', '4.3 Doolittle', '4.4 Sistemas bandados (Crout)'],
    metodos: ['fundamentosLU', 'cholesky', 'doolittle', 'crout'],
  },
  {
    numero: 5,
    romano: 'V',
    titulo: 'Cálculo de valores y vectores propios',
    objetivo: 'El alumno aplicará técnicas numéricas para el cálculo de valores propios.',
    descripcion: [
      'λ es un valor propio de A con vector propio v ≠ 0 si Av = λv. Calcularlos con el polinomio característico det(A − λI) = 0 es inestable y costoso, por lo que se usan métodos iterativos.',
      'El método de potencias obtiene el valor propio dominante (o, en su versión inversa, el más cercano a un valor dado). Para obtener todos, primero se reduce la matriz con transformaciones de Householder y después se aplica la iteración QR.',
    ],
    temas: ['5.1 Método de potencias', '5.2 Transformación de Householder', '5.3 Iteración QR'],
    metodos: ['potencias', 'householder', 'qr'],
  },
];

const METODOS = {
  // ---------------- Unidad I ----------------
  errores: {
    tema: '1.2', nombre: 'Error absoluto y relativo',
    teoria: {
      idea: 'Si p es el valor real y p* su aproximación, el error absoluto mide cuánto se separan y el relativo lo compara con el tamaño de p. El error relativo es el que indica cuántas cifras significativas son correctas.',
      formulas: ['Ea = |p − p*|', 'Er = |p − p*| / |p|,   p ≠ 0', 'Er% = Er · 100', 'p* tiene t cifras significativas si t es el mayor entero con Er ≤ 5 × 10⁻ᵗ'],
      algoritmo: ['Captura el valor real p y la aproximación p*.', 'Calcula Ea y Er.', 'Busca el mayor t que cumple Er ≤ 5 × 10⁻ᵗ.'],
      notas: ['Un error absoluto de 1 es enorme si p = 2, pero despreciable si p = 10⁶; por eso se prefiere el relativo.', 'En la práctica p se desconoce; se usa el error aproximado entre dos iteraciones consecutivas.'],
    },
    parametros: [
      { clave: 'real', etiqueta: 'Valor real p', tipo: 'numero', valor: 'pi' },
      { clave: 'aprox', etiqueta: 'Aproximación p*', tipo: 'numero', valor: '3.1416' },
    ],
    ejecutar: (v) => error.erroresAbsRel(v),
  },
  epsilon: {
    tema: '1.2', nombre: 'Punto flotante y épsilon de máquina',
    teoria: {
      idea: 'Un número de punto flotante se guarda como ±m × βᵉ, con una mantisa m de t dígitos y un exponente e acotado. Como t es finito, entre dos números representables hay huecos: el épsilon de máquina es la distancia de 1 al siguiente número representable.',
      formulas: ['x = ±(0.d₁d₂…dₜ)β × βᵉ', 'ε = β¹⁻ᵗ (con redondeo, la unidad de redondeo es ε/2)', 'IEEE 754 doble: β = 2, t = 53, ε = 2⁻⁵² ≈ 2.22 × 10⁻¹⁶', '|fl(x) − x| / |x| ≤ ε/2'],
      algoritmo: ['Inicia con ε = 1.', 'Mientras 1 + ε > 1, guarda ε y divide entre la base.', 'El último ε que cumplió la condición es el épsilon de máquina.'],
      notas: ['Por eso 0.1 + 0.2 ≠ 0.3 en la computadora: 0.1 no tiene representación exacta en base 2.', 'Truncar (cortar) en lugar de redondear duplica la cota del error.'],
    },
    parametros: [{ clave: 'base', etiqueta: 'Base de división', tipo: 'entero', valor: '2' }],
    ejecutar: (v) => error.epsilonMaquina(v),
  },
  truncamiento: {
    tema: '1.2', nombre: 'Error de truncamiento (serie de Taylor)',
    teoria: {
      idea: 'El error de truncamiento aparece al reemplazar un proceso infinito por uno finito. El ejemplo clásico es cortar la serie de Taylor: eˣ = 1 + x + x²/2! + x³/3! + … se aproxima con sus primeros n términos.',
      formulas: ['f(x) = Σₖ₌₀ⁿ f⁽ᵏ⁾(a)(x − a)ᵏ / k! + Rₙ(x)', 'Rₙ(x) = f⁽ⁿ⁺¹⁾(ξ)(x − a)ⁿ⁺¹ / (n + 1)!', 'Et% = |real − aprox| / |real| · 100', 'Ea% = |actual − anterior| / |actual| · 100'],
      algoritmo: ['Suma término a término xⁿ/n!.', 'En cada paso calcula el error verdadero y el error aproximado.', 'Observa cómo ambos errores disminuyen al agregar términos.'],
      notas: ['Para x negativos grandes la serie alterna y se pierde precisión por cancelación: conviene calcular 1/e^|x|.'],
    },
    parametros: [
      { clave: 'x', etiqueta: 'x', tipo: 'numero', valor: '1' },
      { clave: 'terminos', etiqueta: 'Número de términos', tipo: 'entero', valor: '12' },
    ],
    ejecutar: (v) => error.truncamientoTaylor(v),
  },
  propagacion: {
    tema: '1.3', nombre: 'Propagación del error',
    teoria: {
      idea: 'Si x y y traen errores Δx y Δy, el resultado de operar con ellos también tiene error. En sumas y restas se acumulan los errores absolutos; en productos y cocientes se acumulan los relativos.',
      formulas: ['Δ(x ± y) ≈ Δx + Δy', 'δ(x · y) ≈ δx + δy', 'δ(x / y) ≈ δx + δy', 'En general: Δf ≈ |∂f/∂x|·Δx + |∂f/∂y|·Δy', 'δ = Δ / |valor|'],
      algoritmo: ['Captura x, y y sus cotas de error absoluto.', 'Calcula el resultado de cada operación y su cota de error.', 'Compara los errores relativos: si la resta los dispara, hay cancelación.'],
      notas: ['Restar números casi iguales conserva el error absoluto pero el resultado es pequeño, así que el error relativo crece mucho.'],
    },
    parametros: [
      { clave: 'x', etiqueta: 'x', tipo: 'numero', valor: '2.718' },
      { clave: 'ex', etiqueta: 'Error absoluto de x (Δx)', tipo: 'numero', valor: '0.0005' },
      { clave: 'y', etiqueta: 'y', tipo: 'numero', valor: '2.716' },
      { clave: 'ey', etiqueta: 'Error absoluto de y (Δy)', tipo: 'numero', valor: '0.0005' },
    ],
    ejecutar: (v) => error.propagacion(v),
  },
  cancelacion: {
    tema: '1.3', nombre: 'Cancelación catastrófica',
    teoria: {
      idea: 'Al restar dos números muy parecidos se cancelan las cifras iguales y solo quedan las que traían error. La solución es reescribir la expresión para evitar la resta.',
      formulas: ['√(x+1) − √x = 1 / (√(x+1) + √x)', 'Fórmula cuadrática estable: x₁ = (−b − signo(b)√(b²−4ac)) / 2a,  x₂ = c / (a·x₁)'],
      algoritmo: ['Evalúa la expresión directa y la reformulada para x = 10, 100, 1000, …', 'Compara ambas: la reformulada es la referencia confiable.'],
      notas: ['Con x = 10¹⁶ la forma directa da 0 porque x + 1 y x son el mismo número en punto flotante.'],
    },
    parametros: [{ clave: 'potenciaMax', etiqueta: 'Potencia máxima de 10', tipo: 'entero', valor: '16' }],
    ejecutar: (v) => error.cancelacion(v),
  },
  orden: {
    tema: '1.4', nombre: 'Orden de convergencia',
    teoria: {
      idea: 'Una sucesión xₖ → L converge con orden p si los errores cumplen eₖ₊₁ ≈ λ·eₖᵖ. Con p = 1 (lineal) se gana una cantidad fija de dígitos por iteración; con p = 2 (cuadrática) los dígitos correctos se duplican.',
      formulas: ['lim eₖ₊₁ / eₖᵖ = λ,  eₖ = |xₖ − L|', 'p ≈ ln(eₖ₊₁/eₖ) / ln(eₖ/eₖ₋₁)', 'Bisección: p = 1, λ = 1/2', 'Secante: p ≈ 1.618', 'Newton (raíz simple): p = 2'],
      algoritmo: ['Captura las aproximaciones de un método y, si lo conoces, el límite.', 'Calcula los errores eₖ.', 'Estima p con tres errores consecutivos.'],
      notas: ['El ejemplo precargado son las iteraciones de Newton para x² − 2 = 0, partiendo de x₀ = 1.'],
    },
    parametros: [
      { clave: 'sucesion', etiqueta: 'Aproximaciones x₀, x₁, … (separadas por comas)', tipo: 'lista', valor: '1, 1.5, 1.4166666666666667, 1.4142156862745099, 1.4142135623746899' },
      { clave: 'limite', etiqueta: 'Límite L (opcional)', tipo: 'numero', valor: 'sqrt(2)', opcional: true },
    ],
    ejecutar: (v) => error.ordenConvergencia(v),
  },

  // ---------------- Unidad II ----------------
  biseccion: {
    tema: '2.1', nombre: 'Método de bisección',
    teoria: {
      idea: 'Si f es continua en [a, b] y f(a)·f(b) < 0, por el teorema de Bolzano hay al menos una raíz en el intervalo. Se toma el punto medio y se conserva la mitad donde sigue habiendo cambio de signo.',
      formulas: ['xr = (a + b) / 2', 'Si f(a)·f(xr) < 0 → b = xr;  si no → a = xr', '|xr − raíz| ≤ (b − a) / 2ⁿ', 'Iteraciones necesarias: n ≥ log₂((b − a) / tol)'],
      algoritmo: ['Verifica que f(a)·f(b) < 0.', 'Calcula xr = (a + b)/2 y f(xr).', 'Reemplaza el extremo que tiene el mismo signo que f(xr).', 'Repite hasta que el error relativo sea menor que la tolerancia.'],
      notas: ['Siempre converge, pero lentamente (convergencia lineal, el error se reduce a la mitad).', 'No detecta raíces dobles, porque ahí f no cambia de signo.'],
    },
    parametros: [funcion(), { clave: 'a', etiqueta: 'a', tipo: 'numero', valor: '2' }, { clave: 'b', etiqueta: 'b', tipo: 'numero', valor: '3' }, tolerancia(), maxIter()],
    ejecutar: (v) => raices.biseccion(v),
    grafica: true,
  },
  falsaPosicion: {
    tema: '2.2', nombre: 'Método de falsa posición (regla falsa)',
    teoria: {
      idea: 'Igual que bisección, conserva un intervalo con cambio de signo, pero en lugar del punto medio usa la intersección con el eje x de la recta que une (a, f(a)) y (b, f(b)). Aprovecha la magnitud de f, no solo su signo.',
      formulas: ['xr = b − f(b)·(a − b) / (f(a) − f(b))', 'Si f(a)·f(xr) < 0 → b = xr;  si no → a = xr'],
      algoritmo: ['Verifica que f(a)·f(b) < 0.', 'Calcula xr con la fórmula de la recta secante.', 'Reemplaza el extremo con el mismo signo que f(xr).', 'Repite hasta cumplir la tolerancia.'],
      notas: ['Suele ser más rápido que bisección, pero si la función es muy curva uno de los extremos se queda fijo y la convergencia se vuelve lenta.'],
    },
    parametros: [funcion(), { clave: 'a', etiqueta: 'a', tipo: 'numero', valor: '2' }, { clave: 'b', etiqueta: 'b', tipo: 'numero', valor: '3' }, tolerancia(), maxIter()],
    ejecutar: (v) => raices.falsaPosicion(v),
    grafica: true,
  },
  newton: {
    tema: '2.3', nombre: 'Método de Newton-Raphson',
    teoria: {
      idea: 'Se traza la recta tangente a f en xₙ y se toma como nueva aproximación el punto donde esa tangente corta el eje x. Se deduce de la serie de Taylor de primer orden: 0 = f(xₙ) + f\'(xₙ)(x − xₙ).',
      formulas: ["xₙ₊₁ = xₙ − f(xₙ) / f'(xₙ)", 'eₙ₊₁ ≈ |f″(r) / (2f\'(r))| · eₙ²  (convergencia cuadrática)'],
      algoritmo: ['Elige x₀ cercano a la raíz.', "Calcula f(xₙ) y f'(xₙ) (la derivada se obtiene simbólicamente).", "Aplica xₙ₊₁ = xₙ − f(xₙ)/f'(xₙ).", 'Repite hasta que el error relativo sea menor que la tolerancia.'],
      notas: ["Falla si f'(xₙ) = 0 (tangente horizontal).", 'Puede diverger u oscilar si x₀ está lejos de la raíz.', 'En raíces múltiples la convergencia se vuelve lineal.'],
    },
    parametros: [funcion(), { clave: 'x0', etiqueta: 'x₀', tipo: 'numero', valor: '2' }, tolerancia('1e-10'), maxIter('30')],
    ejecutar: (v) => {
      const { df, texto } = derivar(v.f_texto);
      const r = raices.newton({ ...v, df });
      r.resultado.push({ etiqueta: "f'(x) usada", valor: texto });
      return r;
    },
    grafica: true,
  },
  secante: {
    tema: '2.4', nombre: 'Método de la secante',
    teoria: {
      idea: 'Es Newton sin derivada: la tangente se sustituye por la recta secante que pasa por los dos últimos puntos. A diferencia de falsa posición, no exige cambio de signo y siempre usa los dos valores más recientes.',
      formulas: ["f'(xₙ) ≈ (f(xₙ₋₁) − f(xₙ)) / (xₙ₋₁ − xₙ)", 'xₙ₊₁ = xₙ − f(xₙ)·(xₙ₋₁ − xₙ) / (f(xₙ₋₁) − f(xₙ))', 'Orden de convergencia ≈ 1.618 (razón áurea)'],
      algoritmo: ['Elige dos valores iniciales x₀ y x₁.', 'Calcula xₙ₊₁ con la fórmula.', 'Desplaza: xₙ₋₁ ← xₙ, xₙ ← xₙ₊₁.', 'Repite hasta cumplir la tolerancia.'],
      notas: ['Útil cuando la derivada es difícil o costosa de calcular.', 'Puede diverger, igual que Newton.'],
    },
    parametros: [funcion(), { clave: 'x0', etiqueta: 'x₀', tipo: 'numero', valor: '2' }, { clave: 'x1', etiqueta: 'x₁', tipo: 'numero', valor: '3' }, tolerancia('1e-10'), maxIter('30')],
    ejecutar: (v) => raices.secante(v),
    grafica: true,
  },
  bairstow: {
    tema: '2.5', nombre: 'Método de Bairstow',
    teoria: {
      idea: 'Encuentra factores cuadráticos x² − rx − s de un polinomio. Cada factor da dos raíces (reales o complejas conjugadas) y el polinomio se divide entre él (deflación) para seguir con el cociente, usando solo aritmética real.',
      formulas: [
        'bₙ = aₙ,  bₙ₋₁ = aₙ₋₁ + r·bₙ,  bᵢ = aᵢ + r·bᵢ₊₁ + s·bᵢ₊₂',
        'cₙ = bₙ,  cₙ₋₁ = bₙ₋₁ + r·cₙ,  cᵢ = bᵢ + r·cᵢ₊₁ + s·cᵢ₊₂',
        'c₂·Δr + c₃·Δs = −b₁,   c₁·Δr + c₂·Δs = −b₀',
        'x = (r ± √(r² + 4s)) / 2',
      ],
      algoritmo: ['Elige valores iniciales r y s.', 'Calcula los coeficientes b (división sintética) y c (sus derivadas).', 'Resuelve el sistema 2×2 para Δr y Δs; actualiza r y s.', 'Al converger, obtén dos raíces del factor x² − rx − s.', 'Repite con el cociente (coeficientes b₂ … bₙ) hasta que quede grado 2 o 1.'],
      notas: ['Los coeficientes se capturan del grado mayor al término independiente.', 'Ejemplo precargado (Chapra): x⁵ − 3.5x⁴ + 2.75x³ + 2.125x² − 3.875x + 1.25, con raíces 0.5, −1, 2, 1 ± 0.5i.'],
    },
    parametros: [
      { clave: 'coeficientes', etiqueta: 'Coeficientes aₙ, …, a₀', tipo: 'lista', valor: '1, -3.5, 2.75, 2.125, -3.875, 1.25' },
      { clave: 'r', etiqueta: 'r inicial', tipo: 'numero', valor: '-1' },
      { clave: 's', etiqueta: 's inicial', tipo: 'numero', valor: '-1' },
      tolerancia('1e-8'), maxIter('100'),
    ],
    ejecutar: (v) => raices.bairstow(v),
  },

  // ---------------- Unidad III ----------------
  inversa: {
    tema: '3.1.1', nombre: 'Inversión de matrices (Gauss-Jordan)',
    teoria: {
      idea: 'Si A es invertible, el sistema Ax = b tiene la solución única x = A⁻¹b. La inversa se obtiene aplicando operaciones de renglón a [A | I] hasta convertir A en la identidad; lo que queda a la derecha es A⁻¹.',
      formulas: ['[A | I] → operaciones elementales → [I | A⁻¹]', 'A invertible ⇔ det(A) ≠ 0 ⇔ rango(A) = n', 'Costo: ≈ n³ operaciones'],
      algoritmo: ['Forma la matriz aumentada [A | I].', 'Para cada columna k elige el pivote de mayor valor absoluto e intercambia renglones.', 'Divide el renglón k entre el pivote.', 'Haz ceros en toda la columna k (arriba y abajo).', 'Al terminar, la parte derecha es A⁻¹.'],
      notas: ['Para resolver un solo sistema no conviene invertir: Gauss es unas tres veces más barato.'],
    },
    parametros: [matriz([[2, 1, 1], [1, 3, 2], [1, 0, 0]])],
    ejecutar: (v) => lineales.inversaGaussJordan(v),
  },
  intercambio: {
    tema: '3.1.2', nombre: 'Método de intercambio',
    teoria: {
      idea: 'Se escribe el sistema como y = Ax. Cada paso «intercambia» una variable dependiente yᵣ por una independiente x꜀: se despeja x꜀ de la ecuación r y se sustituye en las demás. Tras n intercambios la tabla expresa x = A⁻¹y.',
      formulas: ['Pivote p = tᵣ꜀', 'Pivote: t\'ᵣ꜀ = 1/p', 'Renglón pivote: t\'ᵣⱼ = −tᵣⱼ / p', 'Columna pivote: t\'ᵢ꜀ = tᵢ꜀ / p', 'Resto: t\'ᵢⱼ = tᵢⱼ − tᵢ꜀·tᵣⱼ / p'],
      algoritmo: ['Escribe la tabla T = A con renglones y₁…yₙ y columnas x₁…xₙ.', 'Elige un pivote (aquí, el de mayor valor absoluto entre los renglones y columnas no intercambiados).', 'Aplica la regla de intercambio y cambia las etiquetas yᵣ ↔ x꜀.', 'Repite n veces; reordena renglones y columnas según sus etiquetas para obtener A⁻¹.'],
      notas: ['Si en algún paso todos los pivotes posibles son cero, A es singular.', 'También se le conoce como pivoteo de Jordan o paso de intercambio.'],
    },
    parametros: [matriz([[0, 2, 1], [1, 1, 0], [3, 0, 1]])],
    ejecutar: (v) => lineales.metodoIntercambio(v),
  },
  gauss: {
    tema: '3.2.1', nombre: 'Gauss con pivoteo parcial',
    teoria: {
      idea: 'Se transforma Ax = b en un sistema triangular superior equivalente mediante eliminación, y se resuelve con sustitución regresiva. El pivoteo parcial elige como pivote el elemento de mayor valor absoluto de la columna, lo que evita dividir entre cero y reduce el error de redondeo.',
      formulas: ['mᵢₖ = aᵢₖ / aₖₖ', 'Fᵢ ← Fᵢ − mᵢₖ·Fₖ', 'xᵢ = (bᵢ − Σⱼ₌ᵢ₊₁ⁿ aᵢⱼxⱼ) / aᵢᵢ', 'Costo ≈ 2n³/3 operaciones'],
      algoritmo: ['Forma [A | b].', 'Para k = 1 … n−1: busca el mayor |aᵢₖ| con i ≥ k e intercambia renglones.', 'Elimina debajo del pivote con los multiplicadores mᵢₖ.', 'Resuelve el sistema triangular por sustitución regresiva.'],
      notas: ['Sin pivoteo, un pivote pequeño amplifica los errores de redondeo.'],
    },
    parametros: [matriz(A3), vector('b', 'Vector b', b3)],
    ejecutar: (v) => lineales.gaussPivoteoParcial(v),
  },
  gaussJordan: {
    tema: '3.2.2', nombre: 'Gauss-Jordan con pivoteo total',
    teoria: {
      idea: 'Gauss-Jordan elimina arriba y abajo del pivote hasta obtener la identidad, así la solución queda directamente en la última columna. El pivoteo total busca el mayor elemento en toda la submatriz restante, intercambiando renglones y columnas.',
      formulas: ['[A | b] → [I | x]', 'Pivote: máx |aᵢⱼ| con i, j ≥ k', 'Intercambiar columnas reordena las incógnitas'],
      algoritmo: ['Para cada k busca el mayor |aᵢⱼ| en la submatriz.', 'Intercambia renglones y columnas; registra el nuevo orden de las variables.', 'Divide el renglón entre el pivote y haz ceros en toda la columna.', 'Al final, deshaz el intercambio de columnas para ordenar x.'],
      notas: ['Es el pivoteo más estable, pero la búsqueda cuesta O(n³) comparaciones adicionales.'],
    },
    parametros: [matriz(A3), vector('b', 'Vector b', b3)],
    ejecutar: (v) => lineales.gaussJordanPivoteoTotal(v),
  },
  particionado: {
    tema: '3.2.3', nombre: 'Gauss-Jordan particionado',
    teoria: {
      idea: 'La matriz se divide en bloques y la inversa se arma a partir de inversas de bloques más pequeños. Es útil cuando A es demasiado grande para la memoria o cuando un bloque ya se conoce.',
      formulas: ['A = [A₁₁ A₁₂; A₂₁ A₂₂],  A₁₁ de p×p', 'S = A₂₂ − A₂₁A₁₁⁻¹A₁₂  (complemento de Schur)', 'B₁₁ = A₁₁⁻¹ + A₁₁⁻¹A₁₂S⁻¹A₂₁A₁₁⁻¹,  B₁₂ = −A₁₁⁻¹A₁₂S⁻¹', 'B₂₁ = −S⁻¹A₂₁A₁₁⁻¹,  B₂₂ = S⁻¹', 'x = A⁻¹b'],
      algoritmo: ['Elige el tamaño p del bloque A₁₁ y particiona A.', 'Invierte A₁₁ con Gauss-Jordan.', 'Calcula el complemento de Schur S y su inversa.', 'Arma los bloques B₁₁, B₁₂, B₂₁, B₂₂ de A⁻¹.', 'Calcula x = A⁻¹b.'],
      notas: ['Requiere que A₁₁ y S sean invertibles.'],
    },
    parametros: [
      matriz([[4, 1, 0, 1], [1, 5, 2, 0], [0, 2, 6, 1], [1, 0, 1, 3]]),
      vector('b', 'Vector b', [3.5, 0, 10.5, 4.5]),
      { clave: 'p', etiqueta: 'Tamaño p del bloque A₁₁', tipo: 'entero', valor: '2' },
    ],
    ejecutar: (v) => lineales.gaussJordanParticionado(v),
  },
  mejoramiento: {
    tema: '3.4.1', nombre: 'Mejoramiento iterativo de la solución',
    teoria: {
      idea: 'Una solución x calculada con redondeo tiene error. Se calcula el residuo r = b − Ax con mayor precisión, se resuelve Ae = r para estimar el error y se corrige x ← x + e. Repetirlo mejora la solución.',
      formulas: ['r⁽ᵏ⁾ = b − Ax⁽ᵏ⁾', 'A·e⁽ᵏ⁾ = r⁽ᵏ⁾', 'x⁽ᵏ⁺¹⁾ = x⁽ᵏ⁾ + e⁽ᵏ⁾', 'Número de condición: κ(A) = ‖A‖·‖A⁻¹‖'],
      algoritmo: ['Resuelve Ax = b con la precisión limitada (aquí se simula con pocas cifras significativas).', 'Calcula el residuo en doble precisión.', 'Resuelve Ae = r reutilizando la misma factorización.', 'Corrige x y repite hasta que ‖e‖ sea menor que la tolerancia.'],
      notas: ['El ejemplo es una matriz de Hilbert redondeada, que está mal condicionada: la primera solución tiene un error grande.'],
    },
    parametros: [
      matriz([[1, 0.5, 0.3333], [0.5, 0.3333, 0.25], [0.3333, 0.25, 0.2]]),
      vector('b', 'Vector b', [1, 0, 0]),
      { clave: 'cifras', etiqueta: 'Cifras significativas de la primera solución', tipo: 'entero', valor: '4' },
      tolerancia('1e-10'), maxIter('20'),
    ],
    ejecutar: (v) => lineales.mejoramientoIterativo(v),
  },
  jacobi: {
    tema: '3.4.2', nombre: 'Método de Jacobi',
    teoria: {
      idea: 'Se despeja cada incógnita de su ecuación y se calcula la nueva aproximación usando solo los valores de la iteración anterior.',
      formulas: ['xᵢ⁽ᵏ⁺¹⁾ = (bᵢ − Σⱼ≠ᵢ aᵢⱼxⱼ⁽ᵏ⁾) / aᵢᵢ', 'Forma matricial: x⁽ᵏ⁺¹⁾ = D⁻¹(b − (L + U)x⁽ᵏ⁾)', 'Error: ‖x⁽ᵏ⁺¹⁾ − x⁽ᵏ⁾‖∞ / ‖x⁽ᵏ⁺¹⁾‖∞'],
      algoritmo: ['Elige un vector inicial x⁽⁰⁾.', 'Calcula todas las componentes nuevas con los valores anteriores.', 'Repite hasta que el error relativo sea menor que la tolerancia.'],
      notas: ['Converge si A es estrictamente diagonal dominante: |aᵢᵢ| > Σⱼ≠ᵢ |aᵢⱼ|.', 'Cada componente es independiente, por lo que se puede calcular en paralelo.'],
    },
    parametros: [matriz(A3), vector('b', 'Vector b', b3), vector('x0', 'Vector inicial x⁽⁰⁾', [1, 2, 2]), tolerancia(), maxIter('100')],
    ejecutar: (v) => lineales.jacobi(v),
  },
  gaussSeidel: {
    tema: '3.4.3', nombre: 'Método de Gauss-Seidel',
    teoria: {
      idea: 'Es Jacobi, pero en cuanto se calcula una componente nueva se usa de inmediato en las siguientes ecuaciones. Normalmente converge en menos iteraciones.',
      formulas: ['xᵢ⁽ᵏ⁺¹⁾ = (bᵢ − Σⱼ<ᵢ aᵢⱼxⱼ⁽ᵏ⁺¹⁾ − Σⱼ>ᵢ aᵢⱼxⱼ⁽ᵏ⁾) / aᵢᵢ', 'Forma matricial: (D + L)x⁽ᵏ⁺¹⁾ = b − Ux⁽ᵏ⁾'],
      algoritmo: ['Elige x⁽⁰⁾.', 'Para i = 1 … n calcula xᵢ usando los valores ya actualizados.', 'Repite hasta cumplir la tolerancia.'],
      notas: ['Converge si A es diagonal dominante o simétrica definida positiva.', 'Compara el número de iteraciones con el de Jacobi usando el mismo ejemplo.'],
    },
    parametros: [matriz(A3), vector('b', 'Vector b', b3), vector('x0', 'Vector inicial x⁽⁰⁾', [1, 2, 2]), tolerancia(), maxIter('100')],
    ejecutar: (v) => lineales.gaussSeidel(v),
  },
  sor: {
    tema: '3.4.4', nombre: 'Método de relajación (SOR)',
    teoria: {
      idea: 'Se toma el valor que daría Gauss-Seidel y se combina con el anterior mediante un factor ω. Con ω > 1 (sobrerrelajación) se acelera la convergencia; con ω < 1 (subrelajación) se puede lograr que converja un sistema que oscila.',
      formulas: ['xᵢ⁽ᵏ⁺¹⁾ = (1 − ω)·xᵢ⁽ᵏ⁾ + ω·x̃ᵢ  (x̃ᵢ: valor de Gauss-Seidel)', '0 < ω < 2 es necesario para converger', 'ω = 1 equivale a Gauss-Seidel'],
      algoritmo: ['Elige x⁽⁰⁾ y ω.', 'Para cada i calcula el valor de Gauss-Seidel y aplica la combinación con ω.', 'Repite hasta cumplir la tolerancia.'],
      notas: ['El ω óptimo depende de la matriz; prueba distintos valores y compara las iteraciones.'],
    },
    parametros: [matriz(A3), vector('b', 'Vector b', b3), vector('x0', 'Vector inicial x⁽⁰⁾', [0, 0, 0]), { clave: 'omega', etiqueta: 'Factor de relajación ω', tipo: 'numero', valor: '1.1' }, tolerancia(), maxIter('100')],
    ejecutar: (v) => lineales.relajacion(v),
  },

  // ---------------- Unidad IV ----------------
  fundamentosLU: {
    tema: '4.1', nombre: 'Fundamentos de la factorización LU',
    teoria: {
      idea: 'La eliminación gaussiana sin intercambios equivale a factorizar A = LU: U es la matriz triangular que queda al final y L guarda los multiplicadores mᵢₖ debajo de una diagonal de unos.',
      formulas: ['A = LU', 'lᵢₖ = mᵢₖ = aᵢₖ⁽ᵏ⁾ / aₖₖ⁽ᵏ⁾', 'Ly = b (sustitución progresiva),  Ux = y (sustitución regresiva)', 'det(A) = Πuᵢᵢ', 'Si hace falta pivotear: PA = LU'],
      algoritmo: ['Aplica eliminación gaussiana sin intercambiar renglones.', 'Guarda cada multiplicador en la posición correspondiente de L.', 'Resuelve Ly = b y después Ux = y.'],
      notas: ['La factorización cuesta ≈ 2n³/3, pero cada nuevo b solo cuesta ≈ 2n² operaciones.', 'Existe sin pivoteo si todos los menores principales de A son distintos de cero.'],
    },
    parametros: [matriz(A3), vector('b', 'Vector b', b3)],
    ejecutar: (v) => lu.fundamentosLU(v),
  },
  cholesky: {
    tema: '4.2', nombre: 'Método de Cholesky',
    teoria: {
      idea: 'Si A es simétrica y definida positiva, se factoriza como A = LLᵀ con L triangular inferior de diagonal positiva. Requiere la mitad de operaciones que LU y no necesita pivoteo.',
      formulas: ['lⱼⱼ = √(aⱼⱼ − Σₖ₌₁ʲ⁻¹ lⱼₖ²)', 'lᵢⱼ = (aᵢⱼ − Σₖ₌₁ʲ⁻¹ lᵢₖlⱼₖ) / lⱼⱼ,  i > j', 'Costo ≈ n³/3 operaciones'],
      algoritmo: ['Verifica que A sea simétrica.', 'Para cada columna j calcula lⱼⱼ y después los lᵢⱼ debajo.', 'Si el radicando es ≤ 0, A no es definida positiva.', 'Resuelve Ly = b y Lᵀx = y.'],
      notas: ['Es la forma práctica de comprobar si una matriz simétrica es definida positiva.'],
    },
    parametros: [matriz([[4, 12, -16], [12, 37, -43], [-16, -43, 98]]), vector('b', 'Vector b', [1, 2, 3])],
    ejecutar: (v) => lu.cholesky(v),
  },
  doolittle: {
    tema: '4.3', nombre: 'Método de Doolittle',
    teoria: {
      idea: 'Factoriza A = LU con unos en la diagonal de L, calculando directamente las entradas con fórmulas en lugar de hacer la eliminación: en cada paso se obtiene un renglón de U y una columna de L.',
      formulas: ['uₖⱼ = aₖⱼ − Σₘ₌₁ᵏ⁻¹ lₖₘuₘⱼ,  j ≥ k', 'lᵢₖ = (aᵢₖ − Σₘ₌₁ᵏ⁻¹ lᵢₘuₘₖ) / uₖₖ,  i > k', 'lₖₖ = 1'],
      algoritmo: ['Para k = 1 … n: calcula el renglón k de U.', 'Calcula la columna k de L debajo de la diagonal.', 'Si uₖₖ = 0 se necesita pivoteo.', 'Resuelve Ly = b y Ux = y.'],
      notas: ['Produce las mismas L y U que la eliminación gaussiana sin pivoteo.'],
    },
    parametros: [matriz([[2, -1, 1], [3, 3, 9], [3, 3, 5]]), vector('b', 'Vector b', [2, -1, 4])],
    ejecutar: (v) => lu.doolittle(v),
  },
  crout: {
    tema: '4.4', nombre: 'Sistemas bandados (método de Crout)',
    teoria: {
      idea: 'Crout factoriza A = LU con unos en la diagonal de U. Si A es bandada (solo tiene elementos distintos de cero cerca de la diagonal), L y U conservan la banda y basta con calcular esos elementos. Para matrices tridiagonales se obtiene el algoritmo de Thomas, de costo O(n).',
      formulas: ['lᵢₖ = aᵢₖ − Σₘ lᵢₘuₘₖ,  i ≥ k', 'uₖⱼ = (aₖⱼ − Σₘ lₖₘuₘⱼ) / lₖₖ,  j > k', 'Tridiagonal: lᵢᵢ = aᵢᵢ − aᵢ,ᵢ₋₁·uᵢ₋₁,ᵢ,  uᵢ,ᵢ₊₁ = aᵢ,ᵢ₊₁ / lᵢᵢ', 'zᵢ = (bᵢ − aᵢ,ᵢ₋₁zᵢ₋₁) / lᵢᵢ,  xᵢ = zᵢ − uᵢ,ᵢ₊₁xᵢ₊₁'],
      algoritmo: ['Determina los anchos de banda inferior p y superior q.', 'Para cada k calcula la columna k de L y el renglón k de U, solo dentro de la banda.', 'Resuelve Lz = b y Ux = z.'],
      notas: ['Los sistemas tridiagonales aparecen en splines cúbicos y en ecuaciones diferenciales con diferencias finitas.'],
    },
    parametros: [
      matriz([[2, -1, 0, 0, 0], [-1, 2, -1, 0, 0], [0, -1, 2, -1, 0], [0, 0, -1, 2, -1], [0, 0, 0, -1, 2]]),
      vector('b', 'Vector b', [1, 0, 0, 0, 1]),
    ],
    ejecutar: (v) => lu.croutBandado(v),
  },

  // ---------------- Unidad V ----------------
  potencias: {
    tema: '5.1', nombre: 'Método de potencias',
    teoria: {
      idea: 'Al multiplicar repetidamente un vector por A, la componente en la dirección del vector propio dominante crece más rápido que las demás. Normalizando en cada paso, el vector converge a ese vector propio y el factor de escala al valor propio dominante.',
      formulas: ['y⁽ᵏ⁾ = Ax⁽ᵏ⁾', 'λ⁽ᵏ⁾ = componente de mayor valor absoluto de y⁽ᵏ⁾', 'x⁽ᵏ⁺¹⁾ = y⁽ᵏ⁾ / λ⁽ᵏ⁾', 'Rapidez: |λ₂ / λ₁|ᵏ', 'Inversa con desplazamiento q: (A − qI)y = x,  λ = q + 1/μ'],
      algoritmo: ['Elige x⁽⁰⁾ ≠ 0.', 'Calcula y = Ax (o resuelve (A − qI)y = x en la variante inversa).', 'Normaliza dividiendo entre la componente mayor.', 'Repite hasta que λ cambie menos que la tolerancia.'],
      notas: ['La variante inversa encuentra el valor propio más cercano a q.', 'Si dos valores propios tienen el mismo módulo, el método no converge.'],
    },
    parametros: [
      matriz([[2, 0, 0], [0, 3, 4], [0, 4, 9]]),
      vector('x0', 'Vector inicial x⁽⁰⁾', [1, 1, 1]),
      { clave: 'variante', etiqueta: 'Variante', tipo: 'opciones', valor: 'directa', opciones: [['directa', 'Directa (valor dominante)'], ['inversa', 'Inversa con desplazamiento q']] },
      { clave: 'q', etiqueta: 'Desplazamiento q (variante inversa)', tipo: 'numero', valor: '0' },
      tolerancia('1e-8'), maxIter('200'),
    ],
    ejecutar: (v) => propios.potencias(v),
  },
  householder: {
    tema: '5.2', nombre: 'Transformación de Householder',
    teoria: {
      idea: 'Una reflexión de Householder H = I − 2wwᵀ (con ‖w‖ = 1) es simétrica y ortogonal, y puede anular todas las entradas de un vector salvo la primera. Aplicando HAH columna por columna, una matriz simétrica se vuelve tridiagonal sin cambiar sus valores propios.',
      formulas: ['α = −signo(x₁)·‖x‖₂', 'v = x − α·e₁,  w = v / ‖v‖₂', 'H = I − 2wwᵀ,  H = Hᵀ = H⁻¹', 'A⁽ᵏ⁺¹⁾ = HₖA⁽ᵏ⁾Hₖ  (semejanza: mismos valores propios)'],
      algoritmo: ['Para k = 1 … n−2 toma x = la columna k debajo de la diagonal.', 'Construye w y la matriz Hₖ.', 'Calcula A ← HₖAHₖ.', 'El resultado es tridiagonal (o de Hessenberg si A no es simétrica).'],
      notas: ['Es el paso previo a la iteración QR: cada iteración sobre una tridiagonal cuesta O(n) en lugar de O(n³).'],
    },
    parametros: [matriz(SIMETRICA4)],
    ejecutar: (v) => propios.householder(v),
  },
  qr: {
    tema: '5.3', nombre: 'Iteración QR',
    teoria: {
      idea: 'Se factoriza A = QR (Q ortogonal, R triangular superior) y se forma RQ. Como RQ = QᵀAQ, la nueva matriz es semejante a A. Repitiendo, los elementos debajo de la diagonal tienden a cero y los valores propios aparecen en la diagonal.',
      formulas: ['Aₖ = QₖRₖ', 'Aₖ₊₁ = RₖQₖ = QₖᵀAₖQₖ', 'aᵢ₊₁,ᵢ⁽ᵏ⁾ → 0 con rapidez |λᵢ₊₁ / λᵢ|ᵏ'],
      algoritmo: ['Factoriza Aₖ = QₖRₖ (aquí con Gram-Schmidt modificado).', 'Calcula Aₖ₊₁ = RₖQₖ.', 'Repite hasta que el mayor elemento de la subdiagonal sea menor que la tolerancia.', 'Lee los valores propios en la diagonal.'],
      notas: ['Los valores propios complejos aparecen como bloques 2×2 que no se anulan.', 'En el ejemplo, λ = 2.27 y λ = −2.20 tienen módulos parecidos (cociente ≈ 0.97), por eso se requieren cientos de iteraciones.', 'En la práctica se usan desplazamientos para acelerar la convergencia.'],
    },
    parametros: [matriz(SIMETRICA4), tolerancia('1e-6'), maxIter('1000')],
    ejecutar: (v) => propios.iteracionQR(v),
  },
};

for (const unidad of UNIDADES) for (const id of unidad.metodos) METODOS[id].unidad = unidad.numero;

MN.contenido = { INTRO, UNIDADES, METODOS };
})();
