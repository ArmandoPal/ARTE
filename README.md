# Monotonía Atemporal

Una página web artística e interactiva donde cada módulo negro del código QR
es reemplazado por un vídeo HTML5 reproduciéndose de forma independiente.

---

## Estructura del proyecto

```
/
├── index.html          — Punto de entrada
├── style.css           — Estilos (pantalla completa, fondo negro)
├── script.js           — Lógica principal (QR + render de vídeos)
├── qrcode.bundle.js    — Generador QR bundleado (sin CDN externo)
├── README.md           — Este archivo
└── videos/
    ├── video1.mp4
    ├── video2.mp4
    └── video3.mp4
```

---

## Cómo ejecutar el proyecto

El navegador moderno bloquea vídeos locales por política CORS si abres
`index.html` directamente con `file://`. Necesitas un servidor HTTP local.

### Opción A — Python (recomendado, sin instalar nada)

```bash
# Python 3
cd /ruta/al/proyecto
python3 -m http.server 8080
```
Abre: `http://localhost:8080`

### Opción B — Node.js

```bash
npx serve .
# o
npx http-server . -p 8080
```

### Opción C — VS Code
Instala la extensión **Live Server** y haz clic en "Go Live".

---

## Cómo cambiar la URL del QR

Abre `script.js` y modifica la primera variable de configuración:

```js
const QR_URL = 'https://tudominio.com';  // ← cambia esta línea
```

Recarga la página. El QR se regenerará automáticamente.

---

## Cómo agregar más vídeos

1. Copia tus archivos `.mp4` dentro de la carpeta `videos/`.
2. Abre `script.js` y amplía el array `VIDEO_SOURCES`:

```js
const VIDEO_SOURCES = [
  'videos/video1.mp4',
  'videos/video2.mp4',
  'videos/video3.mp4',
  'videos/video4.mp4',   // ← nuevo
  'videos/video5.mp4',   // ← nuevo
  // … hasta 50, 100, 365 sin cambiar nada más
];
```

El sistema distribuye los vídeos cíclicamente sobre los módulos negros
sin que necesites tocar ninguna otra parte del código.

---

## Variables de configuración en script.js

| Variable              | Descripción                                         | Default   |
|-----------------------|-----------------------------------------------------|-----------|
| `QR_URL`              | URL que codifica el QR                              | —         |
| `MODULE_SIZE`         | Tamaño en px de cada módulo                         | `12`      |
| `ERROR_CORRECTION`    | Nivel QR: `'L'` `'M'` `'Q'` `'H'`                  | `'M'`     |
| `VIDEO_SOURCES`       | Array de rutas de vídeo                             | 3 vídeos  |
| `PROTECT_FINDER_PATTERNS` | `true` = esquinas negras sólidas (QR legible)  | `true`    |

---

## Ajuste del tamaño `MODULE_SIZE`

| MODULE_SIZE | Descripción                                              |
|-------------|----------------------------------------------------------|
| `6–8`       | QR completo visible en pantallas pequeñas                |
| `10–14`     | Balance visual / rendimiento (recomendado)               |
| `16–24`     | Módulos grandes, QR parcialmente visible en pantalla     |
| `28–40`     | Módulos muy grandes, pocos visibles, máximo impacto      |

---

## Nota sobre rendimiento

Con `MODULE_SIZE = 12` y un QR de nivel M sobre una URL corta (~25×25 = 625
módulos, ~300–340 vídeos), el navegador maneja la reproducción sin problemas
en hardware moderno (Chrome / Firefox / Safari).

Para URLs más largas (QR de 33×33 o 41×41) el número de vídeos sube.
Si notas ralentización:
- Baja `MODULE_SIZE` para reducir resolución visual
- Usa `ERROR_CORRECTION = 'L'` para generar un QR más pequeño
- Considera la versión Canvas/WebGL (ver comentarios en script.js)

---

## Compatibilidad

| Navegador      | Estado    |
|----------------|-----------|
| Chrome 90+     | ✅ Óptimo  |
| Firefox 88+    | ✅ Óptimo  |
| Safari 14+     | ✅ OK      |
| Edge 90+       | ✅ Óptimo  |
| Mobile Chrome  | ✅ OK      |
| Mobile Safari  | ⚠️ Puede requerir interacción del usuario para autoplay |
