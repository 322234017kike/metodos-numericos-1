# MetNum I

Sistema de apoyo para la asignatura **Métodos Numéricos I** de la Licenciatura en Matemáticas Aplicadas y Computación, FES Acatlán, UNAM.

Sigue el flujo de pantallas del proyecto: **Portada → Introducción → Menú principal → Unidad → Métodos → Teoría → Ejemplo → Tabla**, con regreso al menú y pantalla de salida.

## Cómo usarlo

No necesita instalación ni servidor: abre `index.html` con doble clic en cualquier navegador moderno (Chrome, Edge, Firefox).

- Con internet, las funciones se interpretan con [math.js](https://mathjs.org/) y Newton usa la derivada simbólica.
- Sin internet, se usa un evaluador propio y una derivada numérica (diferencia central).

## Contenido (temario completo)

| Unidad | Métodos |
|---|---|
| I. Análisis de error | Error absoluto y relativo, punto flotante y épsilon de máquina, truncamiento (Taylor), propagación del error, cancelación catastrófica, orden de convergencia |
| II. Ecuaciones de una variable | Bisección, falsa posición, Newton-Raphson, secante, Bairstow |
| III. Sistemas de ecuaciones lineales | Inversión (Gauss-Jordan), método de intercambio, Gauss con pivoteo parcial, Gauss-Jordan con pivoteo total, Gauss-Jordan particionado, mejoramiento iterativo, Jacobi, Gauss-Seidel, relajación (SOR) |
| IV. Factorización LU | Fundamentos LU, Cholesky, Doolittle, Crout para sistemas bandados |
| V. Valores y vectores propios | Método de potencias (directo e inverso), Householder, iteración QR |

Cada método incluye la teoría, un ejemplo precargado que se puede modificar y la tabla de iteraciones o el desarrollo paso a paso.

## Estructura

```
index.html            Página principal
css/styles.css        Estilos (modo claro y oscuro)
js/config.js          Datos de la portada (integrantes, fecha)
js/metodos/           Métodos numéricos (funciones puras)
js/expresiones.js     Interpretación de funciones y números capturados
js/contenido.js       Teoría y ejemplos de cada método
js/ui.js              Componentes de interfaz
js/app.js             Navegación entre pantallas y transiciones
tests/pruebas.html    Pruebas de los métodos (abrir en el navegador)
```

Los scripts son clásicos (no módulos) para que la página funcione desde `file://`. Si agregas un archivo `.js`, inclúyelo en `index.html` en el orden correcto.

## Integrantes

- Espinosa Martínez Iván
- Huesca Martínez José Arturo
- Martínez González Enrique René

Noviembre 2026 · Derechos Reservados MMXXVI UNAM
