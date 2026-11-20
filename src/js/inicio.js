
/* =========================================
   1. INICIALIZAR PÁGINA DE INICIO
   ========================================= */

window.inicializarInicio = function () {

    const CLAVE_FAVORITOS = window.claveFavoritos;

    if (!CLAVE_FAVORITOS) {
        throw new Error("No se encontró la clave de favoritos de la cuenta.");
    }

    /* =========================================
       2. CONFIGURACIÓN DE AUDIUS
       ========================================= */

    const API_INICIO = "https://api.audius.co/v1";
    const API_KEY_INICIO = "";


    /* =========================================
       3. ELEMENTOS HTML
       ========================================= */

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");

    const songList = document.getElementById("songList");
    const artistList = document.getElementById("artistList");

    const songStatusText = document.getElementById("songStatus");
    const artistStatusText = document.getElementById("artistStatus");

    const sectionTitle = document.getElementById("sectionTitle");
    const artistsTitle = document.getElementById("artistsTitle");

    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const loadMoreArtistsBtn = document.getElementById("loadMoreArtistsBtn");


    /* =========================================
       4. VARIABLES
       ========================================= */

    const LIMIT = 6;
    const ARTIST_LIMIT = 5;

    let songs = [];
    let artists = [];

    let trackOffset = 0;
    let artistOffset = 0;
    let numeroSolicitudCanciones = 0;

    let currentTrackEndpoint = "/tracks/trending";
    let currentArtistEndpoint = "/users/top";


    /* =========================================
       5. CONSULTAR AUDIUS
       ========================================= */

    async function consultarInicio(endpoint) {

        const headers = {};

        if (API_KEY_INICIO) {
            headers["X-API-Key"] = API_KEY_INICIO;
        }

        const response = await fetch(API_INICIO + endpoint, {
            headers
        });

        if (!response.ok) {
            throw new Error("Error al conectar con Audius");
        }

        const result = await response.json();

        return result.data || [];
    }


    /* =========================================
       6. CARGAR MÚSICA RECOMENDADA
       ========================================= */

    async function cargarMusica() {

        numeroSolicitudCanciones++;
        currentTrackEndpoint = "/tracks/trending";
        trackOffset = 0;
        songs = [];

        songList.innerHTML = "";

        sectionTitle.textContent = "Música recomendada";

        songStatusText.textContent = "Cargando canciones...";

        await cargarMasCanciones(false);
    }


    /* =========================================
       7. CARGAR MÁS CANCIONES
       ========================================= */

    async function cargarMasCanciones(anexar = true) {

        const solicitud = numeroSolicitudCanciones;
        const endpoint = currentTrackEndpoint;
        const offset = trackOffset;

        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = "Cargando...";

        try {

            const resultado = await consultarInicio(
                endpoint +
                (endpoint.includes("?") ? "&" : "?") +
                "limit=" + LIMIT +
                "&offset=" + offset
            );

            if (solicitud !== numeroSolicitudCanciones) return;

            const nuevasCanciones = resultado.filter(
                song => song && song.id
            );

            if (!anexar) {
                songs = [];
                songList.innerHTML = "";
            }

            const inicio = songs.length;

            songs.push(...nuevasCanciones);

            nuevasCanciones.forEach((song, index) => {
                crearTarjetaCancion(song, inicio + index);
            });

            trackOffset += nuevasCanciones.length;

            songStatusText.textContent = songs.length
                ? "Canciones disponibles: " + songs.length
                : "No se encontraron canciones.";

            loadMoreBtn.hidden =
                nuevasCanciones.length < LIMIT;

        } catch (error) {

            if (solicitud !== numeroSolicitudCanciones) return;

            console.error("Error al cargar canciones:", error);

            songStatusText.textContent = "Error al cargar canciones.";

        } finally {

            if (solicitud === numeroSolicitudCanciones) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = "Cargar más canciones";
            }
        }
    }


    /* =========================================
       8. CREAR TARJETAS DE CANCIONES
       ========================================= */

    function crearTarjetaCancion(song) {

        const card = document.createElement("article");
        card.className = "song";

        const image = document.createElement("img");

        window.cargarImagenConFallback(
            image,
            song.artwork?.["480x480"] ||
            song.artwork?.["150x150"]
        );

        image.alt = "Portada de la canción";

        const info = document.createElement("div");
        info.className = "song-info";

        const title = document.createElement("strong");
        title.textContent = song.title || "Sin título";

        const artistName = document.createElement("small");

        artistName.textContent =
            song.user?.name || "Artista desconocido";

        info.append(title, artistName);

        // Botón para reproducir
        const playButton = document.createElement("button");

        playButton.type = "button";
        playButton.innerHTML = '<img class="app-icon" src="src/icons/Play.svg" alt="" aria-hidden="true">';
        playButton.setAttribute(
            "aria-label",
            "Reproducir " + (song.title || "canción")
        );

        playButton.addEventListener("click", (event) => {

            event.stopPropagation();

            Reproductor.reproducir(song, songs);
        });

        // Botón para agregar a favoritos
        const favoriteButton = document.createElement("button");

        favoriteButton.type = "button";
        favoriteButton.innerHTML = '<img class="app-icon" src="src/icons/Heart.svg" alt="" aria-hidden="true">';
        favoriteButton.setAttribute(
            "aria-label",
            "Agregar " + (song.title || "canción") + " a favoritos"
        );

        favoriteButton.addEventListener("click", (event) => {

            event.stopPropagation();

            guardarFavorito(song);
        });

        const playlistButton = document.createElement("button");
        playlistButton.type = "button";
        playlistButton.innerHTML = '<img class="app-icon" src="src/icons/Plus Math.svg" alt="" aria-hidden="true">';
        playlistButton.setAttribute(
            "aria-label",
            "Agregar " + (song.title || "canción") + " a una lista"
        );
        playlistButton.addEventListener("click", event => {
            event.stopPropagation();
            window.abrirDialogoLista(song);
        });

        card.append(
            image,
            info,
            playButton,
            favoriteButton,
            playlistButton
        );

        card.addEventListener("click", () => {
            Reproductor.reproducir(song, songs);
        });

        songList.appendChild(card);
    }


    /* =========================================
       9. CARGAR ARTISTAS POPULARES
       ========================================= */

    async function cargarArtistas() {

        currentArtistEndpoint = "/users/top";
        artistOffset = 0;
        artists = [];

        artistList.innerHTML = "";

        artistStatusText.textContent = "Cargando artistas...";

        await cargarMasArtistas(false);
    }


    /* =========================================
       10. CARGAR MÁS ARTISTAS
       ========================================= */

    async function cargarMasArtistas(anexar = true) {

        loadMoreArtistsBtn.disabled = true;
        loadMoreArtistsBtn.textContent = "Cargando...";

        try {

            const resultado = await consultarInicio(
                currentArtistEndpoint +
                "?limit=" + ARTIST_LIMIT +
                "&offset=" + artistOffset
            );

            const nuevosArtistas = resultado.filter(
                artist => artist && artist.id
            );

            if (!anexar) {
                artists = [];
                artistList.innerHTML = "";
            }

            artists.push(...nuevosArtistas);

            nuevosArtistas.forEach(artist => {
                crearTarjetaArtista(artist);
            });

            artistOffset += nuevosArtistas.length;

            loadMoreArtistsBtn.hidden =
                nuevosArtistas.length < ARTIST_LIMIT;

            artistStatusText.textContent = artists.length
                ? "Artistas disponibles: " + artists.length
                : "No se encontraron artistas.";

        } catch (error) {

            console.error("Error al cargar artistas:", error);

            artistStatusText.textContent = "Error al cargar artistas.";

        } finally {

            loadMoreArtistsBtn.disabled = false;
            loadMoreArtistsBtn.textContent = "Cargar más artistas";
        }
    }


    /* =========================================
       11. CREAR TARJETAS DE ARTISTAS
       ========================================= */

    function crearTarjetaArtista(artist) {

        const card = document.createElement("article");
        card.className = "artist";

        const image = document.createElement("img");

        window.cargarImagenConFallback(
            image,
            artist.profile_picture?.["480x480"] ||
            artist.profile_picture?.["150x150"]
        );

        image.alt = "Imagen del artista";

        const name = document.createElement("strong");
        name.textContent = artist.name || "Artista desconocido";

        const handle = document.createElement("small");

        handle.textContent = artist.handle
            ? "@" + artist.handle
            : "Artista de Audius";

        const followers = document.createElement("small");

        followers.textContent =
            (artist.follower_count || 0).toLocaleString("es-PE") +
            " seguidores";

        const button = document.createElement("button");

        button.type = "button";
        button.textContent = "Ver canciones";

        button.addEventListener("click", () => {
            cargarCancionesArtista(artist);
        });

        card.append(
            image,
            name,
            handle,
            followers,
            button
        );

        artistList.appendChild(card);
    }


    /* =========================================
       12. CANCIONES DE UN ARTISTA
       ========================================= */

    async function cargarCancionesArtista(artist) {

        numeroSolicitudCanciones++;
        currentTrackEndpoint =
            "/users/" + encodeURIComponent(artist.id) + "/tracks";

        trackOffset = 0;
        songs = [];

        songList.innerHTML = "";

        songList.hidden = false;
        artistList.hidden = true;

        artistsTitle.hidden = true;
        artistStatusText.hidden = true;
        loadMoreArtistsBtn.hidden = true;
        sectionTitle.hidden = false;

        sectionTitle.textContent =
            "Canciones de " + artist.name;

        songStatusText.textContent =
            "Cargando canciones del artista...";

        await cargarMasCanciones(false);
    }


    /* =========================================
       13. BUSCAR CANCIONES
       ========================================= */

    searchForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const query = searchInput.value.trim();

        if (!query) return;

        window.busquedaCatalogoPendiente = query;
        document.querySelector('.navbar [data-page="buscar"]')?.click();
    });


    /* =========================================
       14. OBTENER FAVORITOS
       ========================================= */

    function obtenerFavoritos() {

        try {

            const datos = JSON.parse(
                localStorage.getItem(CLAVE_FAVORITOS) || "[]"
            );

            return Array.isArray(datos)
                ? datos.filter(item => item && typeof item === "object" && item.id)
                : [];

        } catch (error) {

            console.error("Error al leer favoritos:", error);

            return [];
        }
    }


    /* =========================================
       15. GUARDAR FAVORITOS
       ========================================= */

    function guardarFavorito(song) {

        if (!song || !song.id) {
            songStatusText.textContent = "No se pudo guardar una canción no válida.";
            return;
        }

        const favoritos = obtenerFavoritos();

        const existe = favoritos.some(
            item => item && String(item.id) === String(song.id)
        );

        if (existe) {
            songStatusText.textContent =
                "Esta canción ya está en favoritos.";
            return;
        }

        favoritos.push(song);

        try {
            localStorage.setItem(
                CLAVE_FAVORITOS,
                JSON.stringify(favoritos)
            );

            songStatusText.innerHTML =
                '¡Canción agregada a favoritos! <img class="app-icon inline-icon" src="src/icons/Heart.svg" alt="" aria-hidden="true">';
        } catch (error) {
            console.error("Error al guardar favorito:", error);
            songStatusText.textContent =
                "No se pudo guardar la canción (almacenamiento lleno o bloqueado).";
        }
    }



    /* =========================================
       16. BOTONES CARGAR MÁS
       ========================================= */

    loadMoreBtn.addEventListener("click", () => {
        cargarMasCanciones(true);
    });

    loadMoreArtistsBtn.addEventListener("click", () => {
        cargarMasArtistas(true);
    });


    /* =========================================
       17. INICIAR PÁGINA DE INICIO
       ========================================= */

    async function iniciarInicio() {

        songList.hidden = false;
        artistList.hidden = false;
        artistStatusText.hidden = false;

        sectionTitle.hidden = false;
        artistsTitle.hidden = false;

        loadMoreBtn.hidden = false;
        loadMoreArtistsBtn.hidden = false;

        await Promise.all([
            cargarMusica(),
            cargarArtistas()
        ]);
    }

    iniciarInicio();

};
