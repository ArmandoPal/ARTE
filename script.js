/**
 * ============================================================
 * Fondo mosaico Semanal — script.js
 * ============================================================
 * Sin vídeos. Auto-detecta TODAS las fotos que haya en cada
 * carpeta images/1/ ... images/7/, más una carpeta compartida
 * images/color/ con las fotos que se revelan al presionar "b",
 * leyendo el listado de directorio que devuelve el servidor.
 *
 * IMPORTANTE: esto requiere un servidor que genere listados de
 * carpeta en HTML (autoindex). Confirmado que funciona con:
 *   python3 -m http.server 8080
 *
 * Si usas Live Server (VS Code) u otro servidor y ves filas
 * vacías o imágenes rotas, prueba abrir en el navegador
 * directamente, por ejemplo: http://localhost:PUERTO/images/1/
 * Si esa URL no te muestra una lista de archivos, ese servidor
 * no sirve para este método — usa python3 -m http.server.
 * ============================================================
 */

// -------------------------------------------------------------
// Ajustes del mosaico
// -------------------------------------------------------------
// Se lee el tamaño real de --tile (definido en style.css, que ahora se
// calcula según el alto de pantalla) para saber cuántas columnas hacen
// falta a lo ancho y que no queden huecos.
const TILE_PX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tile')) || 110;
const VELOCIDAD_MIN = 35;
const VELOCIDAD_MAX = 70;
const PORCENTAJE_REVELADO = 0.30;
const EXTENSIONES_VALIDAS = /\.(jpe?g|png|webp|gif)$/i;

const fondo = document.getElementById('fondo');

// Cada fila se dibuja DOS veces seguidas en el DOM (para el efecto de
// scroll infinito sin cortes). Eso significa que cada foto en B/N en
// realidad tiene dos elementos <div class="tile"> gemelos: uno es la
// copia "original" y otro es la copia que entra en pantalla cuando el
// loop del scroll se reinicia.
//
// Un "grupo" representa una posición única de foto dentro de una fila,
// y guarda AMBOS elementos gemelos. Así, al revelar o esconder, se hace
// sobre los dos a la vez — nunca queda uno revelado y el otro no, que
// era lo que causaba el efecto de "recargo" al cruzar el punto del loop.
const todosLosGrupos = [];

function barajar(array){
  const copia = [...array];
  for(let i = copia.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Reparte un array en "grupos" listas sin que ningún elemento se repita
// entre dos grupos distintos (reparto por turnos tras barajar, así
// queda lo más parejo posible).
function repartirSinRepetir(array, grupos){
  const barajado = barajar(array);
  const resultado = Array.from({ length: grupos }, () => []);
  barajado.forEach((elemento, i) => {
    resultado[i % grupos].push(elemento);
  });
  return resultado;
}

// Lee el listado de directorio que devuelve el servidor para una ruta
// (ej. "images/1/") y extrae los nombres de archivo de imagen que
// encuentre en los enlaces <a> de esa página.
async function obtenerNombresDeCarpeta(ruta){
  try {
    const respuesta = await fetch(ruta);
    if(!respuesta.ok) return [];

    const tipo = respuesta.headers.get('content-type') || '';
    if(!tipo.includes('text/html')) return [];

    const texto = await respuesta.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(texto, 'text/html');
    const enlaces = Array.from(doc.querySelectorAll('a'));

    return enlaces
      .map(a => a.getAttribute('href'))
      .filter(Boolean)
      .map(href => decodeURIComponent(href.split('?')[0].split('#')[0]))
      .filter(href => href !== '../' && href !== './')
      .filter(href => !href.endsWith('/'))
      .filter(href => EXTENSIONES_VALIDAS.test(href))
      // Por si el listado da rutas con carpetas intermedias, nos
      // quedamos solo con el nombre final del archivo.
      .map(href => href.split('/').pop());
  } catch (error) {
    return [];
  }
}

const columnasNecesarias = Math.ceil(window.innerWidth / TILE_PX) + 4;

async function construirFondo(){
  let algunaFilaCargo = false;

  // Las fotos a color salen de UNA sola carpeta compartida: images/color/
  // Se reparten entre los 7 días para que cada foto quede asignada a
  // UN SOLO día — nunca puede aparecer revelada en más de una fila.
  const LISTA_COLOR = await obtenerNombresDeCarpeta(`images/color/`);
  if(!LISTA_COLOR.length){
    console.warn('No encontré fotos en images/color/, ninguna fila tendrá fotos para revelar con "b".');
  }
  const coloresPorDia = repartirSinRepetir(LISTA_COLOR, 7);

  for(let f = 1; f <= 7; f++){
    const LISTA_GRIS = await obtenerNombresDeCarpeta(`images/${f}/`);
    if(!LISTA_GRIS.length){
      console.warn(`Día ${f}: no encontré fotos en images/${f}/ (¿el servidor genera listado de carpeta? revisa http://.../images/${f}/ en el navegador).`);
      continue;
    }
    algunaFilaCargo = true;

    const LISTA_COLOR_DEL_DIA = coloresPorDia[f - 1];
    if(!LISTA_COLOR_DEL_DIA.length){
      console.warn(`Día ${f}: no le tocó ninguna foto de images/color/ en el reparto, esa fila no tendrá fotos para revelar.`);
    }
    const colaColorDia = barajar(LISTA_COLOR_DEL_DIA);

    const fila = document.createElement('div');
    fila.className = 'fila';

    let secuenciaGris = [];
    while(secuenciaGris.length < columnasNecesarias){
      secuenciaGris = secuenciaGris.concat(barajar(LISTA_GRIS));
    }
    secuenciaGris = secuenciaGris.slice(0, columnasNecesarias);

    // La foto de color se asigna UNA vez por POSICIÓN única (no por
    // copia). Las dos copias de esa posición comparten exactamente la
    // misma foto de color asignada.
    const gruposDeLaFila = secuenciaGris.map((nombreArchivo, i) => ({
      dia: f,
      colorSrc: colaColorDia.length ? colaColorDia[i % colaColorDia.length] : null,
      tiles: [],
    }));

    // Se dibuja la secuencia dos veces seguidas (mismo contenido) para
    // lograr el efecto de scroll infinito sin cortes.
    for(let copia = 0; copia < 2; copia++){
      secuenciaGris.forEach((nombreArchivo, i) => {
        const grupo = gruposDeLaFila[i];

        const tile = document.createElement('div');
        tile.className = 'tile';

        const imgBw = document.createElement('img');
        imgBw.className = 'bw';
        imgBw.src = `images/${f}/${nombreArchivo}`;
        imgBw.loading = 'lazy';
        imgBw.alt = '';
        // Si por algún motivo esta foto puntual no carga, ocultamos
        // la casilla entera en vez de mostrar el ícono de imagen rota.
        imgBw.onerror = () => { tile.style.visibility = 'hidden'; };
        tile.appendChild(imgBw);

        if(grupo.colorSrc){
          const imgColor = document.createElement('img');
          imgColor.className = 'color';
          imgColor.loading = 'lazy';
          imgColor.alt = '';
          imgColor.src = `images/color/${grupo.colorSrc}`;
          imgColor.onerror = () => { imgColor.style.opacity = '0'; imgColor.style.pointerEvents = 'none'; };
          tile.appendChild(imgColor);
        }

        grupo.tiles.push(tile);
        fila.appendChild(tile);
      });
    }

    gruposDeLaFila.forEach(grupo => todosLosGrupos.push(grupo));

    const duracion = VELOCIDAD_MIN + Math.random() * (VELOCIDAD_MAX - VELOCIDAD_MIN);
    fila.style.animationDuration = duracion + 's';
    if(f % 2 === 0){
      fila.style.animationDirection = 'reverse';
    }
    fondo.appendChild(fila);
  }

  if(!algunaFilaCargo){
    console.error('No se cargó ninguna fila. Revisa que la carpeta images/ exista junto a index.html y que el servidor genere listados de carpeta (usa python3 -m http.server).');
  }
}

construirFondo().catch(err => console.error('Error construyendo el mosaico:', err));

// -------------------------------------------------------------
// Tecla "B" = mostrar recuerdos a color (se apaga solo a los 5s)
// -------------------------------------------------------------
let recuerdosVisibles = false;
let temporizadorOcultar = null;
const DURACION_REVELADO_MS = 5000;

function elegirGruposAlAzar(){
  const cantidad = Math.round(todosLosGrupos.length * PORCENTAJE_REVELADO);
  const barajados = barajar(todosLosGrupos);

  const elegidos = [];
  const fotosYaElegidasPorDia = {}; // { "1": Set con fotos ya elegidas para el día 1, ... }

  for(const grupo of barajados){
    if(elegidos.length >= cantidad) break;

    if(grupo.colorSrc){
      const vistos = fotosYaElegidasPorDia[grupo.dia] || (fotosYaElegidasPorDia[grupo.dia] = new Set());
      if(vistos.has(grupo.colorSrc)) continue; // ya se va a mostrar esta foto en esa fila
      vistos.add(grupo.colorSrc);
    }

    elegidos.push(grupo);
  }

  return elegidos;
}

function ocultarRecuerdos(){
  recuerdosVisibles = false;
  clearTimeout(temporizadorOcultar);
  temporizadorOcultar = null;
  todosLosGrupos.forEach(grupo => {
    grupo.tiles.forEach(tile => tile.classList.remove('revelada'));
  });
}

function mostrarRecuerdos(){
  recuerdosVisibles = true;
  elegirGruposAlAzar().forEach(grupo => {
    // Se revelan LOS DOS gemelos del grupo, para que al cruzar el
    // punto donde el scroll infinito reinicia, no cambie nada visual.
    grupo.tiles.forEach(tile => tile.classList.add('revelada'));
  });

  clearTimeout(temporizadorOcultar);
  temporizadorOcultar = setTimeout(ocultarRecuerdos, DURACION_REVELADO_MS);
}

// Punto único de entrada: tanto la tecla "B" como el botón rojo llaman
// a esta misma función, así siempre tienen exactamente el mismo efecto.
const botonRecuerdo = document.getElementById('boton-recuerdo');

function alternarRecuerdos(){
  if(recuerdosVisibles){
    ocultarRecuerdos();
  } else {
    mostrarRecuerdos();
  }

  // Animación de "presionado" en el botón, se dispare desde donde se
  // dispare (clic o tecla).
  if(botonRecuerdo){
    botonRecuerdo.classList.remove('presionado');
    // Forzar reflow para poder reiniciar la animación si se presiona
    // varias veces seguidas rápido.
    void botonRecuerdo.offsetWidth;
    botonRecuerdo.classList.add('presionado');
  }
}

window.addEventListener('keydown', e => {
  if(e.key.toLowerCase() !== 'b') return;
  alternarRecuerdos();
});

if(botonRecuerdo){
  botonRecuerdo.addEventListener('click', alternarRecuerdos);
  botonRecuerdo.addEventListener('animationend', () => {
    botonRecuerdo.classList.remove('presionado');
  });
}