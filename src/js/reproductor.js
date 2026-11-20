
/* =========================================
   DENNIS MUSIC
   CONTROLADOR PRINCIPAL
   ========================================= */


/* =========================================
   1. ELEMENTOS DEL REPRODUCTOR
   ========================================= */

const audio = document.getElementById("audio");
const player = document.getElementById("player");

const cover = document.getElementById("cover");
const songTitle = document.getElementById("songTitle");
const artist = document.getElementById("artist");
const playerStatus = document.getElementById("playerStatus");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const progress = document.getElementById("progress");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");

const contenido = document.getElementById("contenido");


/* =========================================
   2. COMPROBAR ELEMENTOS
   ========================================= */

if (
    !audio ||
    !player ||
    !cover ||
    !songTitle ||
    !artist ||
    !playerStatus ||
    !playBtn ||
    !prevBtn ||
    !nextBtn ||
    !progress ||
    !currentTime ||
    !duration ||
    !contenido
) {
    throw new Error(
        "Faltan elementos necesarios en index.html."
    );
}


/* =========================================
   3. VARIABLES DEL REPRODUCTOR
   ========================================= */

let cancionesActuales = [];
let indiceActual = -1;

audio.preload = "metadata";

window.cargarImagenConFallback = function (imagen, src) {
    imagen.onerror = () => {
        imagen.onerror = null;
        imagen.src = "src/img/icon-192.png";
    };

    imagen.src = src || "src/img/icon-192.png";
};


/* =========================================
   4. FORMATO DEL TIEMPO
   ========================================= */

function formatoTiempo(segundos) {

    if (!Number.isFinite(segundos)) {
        return "0:00";
    }

    const minutos = Math.floor(segundos / 60);
    const resto = Math.floor(segundos % 60);

    return `${minutos}:${String(resto).padStart(2, "0")}`;
}


/* =========================================
   5. CONTROLADOR DE REPRODUCCIÓN
   ========================================= */

const Reproductor = {

    async reproducir(cancion, lista = []) {

        if (!cancion || !cancion.id) {
            console.error("Canción no válida.");
            return;
        }

        if (cancion.is_streamable === false) {
            alert("Esta canción no está disponible.");
            return;
        }

        cancionesActuales = lista.length
            ? lista
            : [cancion];

        indiceActual = cancionesActuales.findIndex(
            item => item.id === cancion.id
        );

        if (indiceActual < 0) {
            cancionesActuales = [cancion];
            indiceActual = 0;
        }

        // Mostrar información
        songTitle.textContent =
            cancion.title || "Sin título";

        artist.textContent =
            cancion.user?.name || "Artista desconocido";
        playerStatus.textContent = "";

        window.cargarImagenConFallback(
            cover,
            cancion.artwork?.["480x480"] ||
            cancion.artwork?.["150x150"]
        );

        // Reiniciar progreso
        progress.value = 0;
        currentTime.textContent = "0:00";
        duration.textContent = "0:00";

        // Mostrar reproductor
        player.classList.add("active");

        // Cambiar canción
        audio.src =
            `https://api.audius.co/v1/tracks/${cancion.id}/stream`;

        audio.load();

        try {

            await audio.play();

        } catch (error) {

            console.error(
                "No se pudo reproducir la canción:",
                error
            );
            playerStatus.textContent =
                "No se pudo reproducir esta canción. Comprueba tu conexión o prueba otra.";

        }
    },


    async alternar() {

        // Comprobar que exista una canción cargada
        if (!audio.getAttribute("src")) {
            return;
        }

        if (audio.paused) {

            try {

                await audio.play();

            } catch (error) {

                console.error(
                    "Error al continuar la reproducción:",
                    error
                );
                playerStatus.textContent =
                    "No se pudo reanudar la reproducción.";

            }

        } else {

            audio.pause();

        }
    },


    siguiente() {

        if (!cancionesActuales.length) {
            return;
        }

        const nuevoIndice =
            (indiceActual + 1) % cancionesActuales.length;

        this.reproducir(
            cancionesActuales[nuevoIndice],
            cancionesActuales
        );
    },


    anterior() {

        if (!cancionesActuales.length) {
            return;
        }

        const nuevoIndice =
            (indiceActual - 1 + cancionesActuales.length) %
            cancionesActuales.length;

        this.reproducir(
            cancionesActuales[nuevoIndice],
            cancionesActuales
        );
    }

};

// Hacer disponible el reproductor para las secciones
window.Reproductor = Reproductor;


/* =========================================
   6. BOTONES DEL REPRODUCTOR
   ========================================= */

playBtn.addEventListener("click", () => {
    Reproductor.alternar();
});

nextBtn.addEventListener("click", () => {
    Reproductor.siguiente();
});

prevBtn.addEventListener("click", () => {
    Reproductor.anterior();
});


/* =========================================
   7. EVENTOS DEL AUDIO
   ========================================= */

audio.addEventListener("play", () => {
    playBtn.innerHTML = '<img class="app-icon" src="src/icons/Play.svg" alt="" aria-hidden="true">';
    playerStatus.textContent = "";
});

audio.addEventListener("pause", () => {
    playBtn.innerHTML = '<img class="app-icon" src="src/icons/Play.svg" alt="" aria-hidden="true">';
});

audio.addEventListener("ended", () => {
    Reproductor.siguiente();
});

audio.addEventListener("loadedmetadata", () => {

    duration.textContent =
        formatoTiempo(audio.duration);

});

audio.addEventListener("error", () => {

    console.error(
        "No se pudo cargar el audio. Comprueba la conexión o el enlace."
    );
    playerStatus.textContent =
        "No se pudo cargar el audio. Comprueba tu conexión o prueba otra canción.";

});


/* =========================================
   8. BARRA DE PROGRESO
   ========================================= */

audio.addEventListener("timeupdate", () => {

    if (!Number.isFinite(audio.duration)) {
        return;
    }

    progress.value =
        (audio.currentTime / audio.duration) * 100;

    currentTime.textContent =
        formatoTiempo(audio.currentTime);

    duration.textContent =
        formatoTiempo(audio.duration);

});


progress.addEventListener("input", () => {

    if (!Number.isFinite(audio.duration)) {
        return;
    }

    audio.currentTime =
        (progress.value / 100) * audio.duration;

});


/* =========================================
   9. CONFIGURACIÓN DE LAS SECCIONES
   ========================================= */

const paginas = {

    inicio: {
        html: "inicio.html",
        css: "src/css/inicio.css",
        js: "src/js/inicio.js",
        inicializador: "inicializarInicio"
    },

    buscar: {
        html: "buscar.html",
        css: "src/css/buscar.css",
        js: "src/js/buscar.js",
        inicializador: "inicializarBuscar"
    },

    favoritos: {
        html: "favoritos.html",
        css: "src/css/favoritos.css",
        js: "src/js/favoritos.js",
        inicializador: "inicializarFavoritos"
    },

    listas: {
        html: "listas.html",
        css: "src/css/listas.css",
        js: "src/js/listas.js",
        inicializador: "inicializarListas"
    }

};


/* =========================================
   10. CSS DINÁMICO
   ========================================= */

// Este archivo cambia según la sección.
// reproductor.css permanece siempre activo.

const estiloPagina = document.createElement("link");

estiloPagina.rel = "stylesheet";
estiloPagina.id = "estiloPagina";

document.head.appendChild(estiloPagina);


/* =========================================
   11. CONTROL DE SCRIPTS
   ========================================= */

// Evita cargar varias veces el mismo JavaScript.

const scriptsCargados = new Map();


function cargarScript(ruta) {

    if (scriptsCargados.has(ruta)) {
        return scriptsCargados.get(ruta);
    }

    const promesa = new Promise((resolve, reject) => {

        const script = document.createElement("script");

        script.src = ruta;

        script.onload = () => {
            resolve();
        };

        script.onerror = () => {

            scriptsCargados.delete(ruta);

            script.remove();

            reject(
                new Error(
                    "No se pudo cargar el archivo: " + ruta
                )
            );

        };

        document.body.appendChild(script);

    });

    scriptsCargados.set(ruta, promesa);

    return promesa;
}


/* =========================================
   12. CARGAR UNA SECCIÓN
   ========================================= */

let numeroNavegacion = 0;


async function cargarPagina(nombre, guardarHistorial = true) {

    const pagina = paginas[nombre];

    if (!pagina) {
        return;
    }

    const navegacionActual = ++numeroNavegacion;

    contenido.innerHTML = "<p>Cargando sección...</p>";

    try {

        // Descargar HTML
        const respuesta = await fetch(pagina.html);

        if (!respuesta.ok) {
            throw new Error(
                "No se pudo cargar: " + pagina.html
            );
        }

        const html = await respuesta.text();

        // Convertir HTML en documento
        const documento = new DOMParser().parseFromString(
            html,
            "text/html"
        );

        const main = documento.querySelector("main");

        if (!main) {
            throw new Error(
                "No se encontró el elemento main en " + pagina.html
            );
        }

        // Evitar que una navegación anterior interfiera
        if (navegacionActual !== numeroNavegacion) {
            return;
        }

        // Insertar solamente el contenido de la sección
        contenido.innerHTML = main.innerHTML;

        // Cambiar los estilos de la sección
        estiloPagina.href = pagina.css;

        // Cargar el JavaScript correspondiente
        await cargarScript(pagina.js);

        if (navegacionActual !== numeroNavegacion) {
            return;
        }

        // Ejecutar el inicializador
        const inicializador =
            window[pagina.inicializador];

        if (typeof inicializador !== "function") {

            throw new Error(
                "No se encontró la función " +
                pagina.inicializador
            );

        }

        inicializador();

        // Actualizar botón activo
        document.querySelectorAll(".navbar button").forEach(boton => {

            boton.classList.toggle(
                "active",
                boton.dataset.page === nombre
            );

        });

        // Guardar navegación
        if (guardarHistorial) {

            history.pushState(
                { pagina: nombre },
                "",
                "#" + nombre
            );

        }

        console.log(
            "Sección cargada correctamente:",
            nombre
        );

    } catch (error) {

        if (navegacionActual !== numeroNavegacion) {
            return;
        }

        console.error(
            "Error al cargar la sección:",
            error
        );

        contenido.innerHTML =
            "<p>Error al cargar la sección. Revisa la consola.</p>";

    }
}


/* =========================================
   13. BOTONES DE NAVEGACIÓN
   ========================================= */

document.querySelectorAll(".navbar button").forEach(boton => {

    boton.addEventListener("click", () => {

        cargarPagina(boton.dataset.page);

    });

});


/* =========================================
   14. ATRÁS Y ADELANTE DEL NAVEGADOR
   ========================================= */

window.addEventListener("popstate", (event) => {

    const nombre =
        event.state?.pagina ||
        location.hash.replace("#", "") ||
        "inicio";

    cargarPagina(
        paginas[nombre] ? nombre : "inicio",
        false
    );

});


/* =========================================
   15. INICIAR DENNIS MUSIC
   ========================================= */

const paginaInicial =
    location.hash.replace("#", "") || "inicio";

cargarPagina(
    paginas[paginaInicial] ? paginaInicial : "inicio",
    false
);
