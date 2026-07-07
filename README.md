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
└── images/
    ├── 1
    ├── 2
    └── 3
    .
    .
    .    
```

---

## Cómo ejecutar el proyecto

```bash
# Python 3
cd /ruta/al/proyecto
python3 -m http.server 8080 o python -m http.server 8000
```
Abre: `http://localhost:8080`

---

