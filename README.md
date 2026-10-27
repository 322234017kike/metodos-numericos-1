# MetNum I

Sistema de apoyo para la asignatura **Métodos Numéricos I** de la Licenciatura en Matemáticas Aplicadas y Computación, FES Acatlán, UNAM.

Sigue el flujo de pantallas del proyecto: **Portada → Introducción → Menú principal → Unidad → Métodos → Teoría → Ejemplo → Tabla**, con regreso al menú y pantalla de salida.

## Cómo usarlo

No necesita instalación ni servidor: abre `index.html` con doble clic en cualquier navegador moderno (Chrome, Edge, Firefox).

Funciona igual con o sin internet: las funciones se interpretan con un intérprete matemático propio (`js/expresiones.js`), que también calcula la derivada simbólica para Newton. Con internet solo se descargan las tipografías.

## Seguridad

- **Sin servidor ni base de datos:** es una página estática; no guarda datos de usuarios ni tiene inicio de sesión.
- **El texto capturado nunca se ejecuta como código:** el intérprete solo acepta números, `x`, `+ − * / ^`, paréntesis, `pi`, `e` y una lista cerrada de funciones (`sin`, `cos`, `exp`, `ln`, `sqrt`, …). Cualquier otra cosa se rechaza.
- **Política de seguridad de contenido (CSP)** en `index.html`: solo se ejecutan los scripts propios del proyecto; no se permiten scripts en línea, de otros sitios, conexiones de red ni formularios.
- **Sin dependencias de JavaScript externas**, por lo que un CDN comprometido no puede inyectar código.
- **Protección contra clickjacking:** la página se niega a mostrarse dentro de un marco (`iframe`) de otro sitio.
- **Límites de entrada** (longitud de expresiones, anidamiento, iteraciones ≤ 10 000, tamaño de matrices y listas) para que nadie congele la página.
- La interfaz muestra todo con `textContent`, así que el texto del usuario nunca se interpreta como HTML.

Recomendaciones para quien publique el sitio: activar la verificación en dos pasos en GitHub, no compartir tokens de acceso y servirlo por HTTPS (GitHub Pages lo hace automáticamente).

## Contenido

El menú sigue el del proyecto: unidades II a V y la opción VI para salir.

| Unidad | Métodos |
|---|---|
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

## Licencia

© 2026 Espinosa Martínez Iván, Huesca Martínez José Arturo y Martínez González Enrique René. **Todos los derechos reservados.**

Se permite usar el sistema para estudio personal y revisarlo con fines de evaluación académica. No se permite copiar, modificar, redistribuir ni presentar este trabajo como propio sin autorización escrita de los autores. Consulta los términos completos en [LICENSE](LICENSE).
