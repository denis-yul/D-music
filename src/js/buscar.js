window.inicializarBuscar = function () {
    const claveFavoritos = window.claveFavoritos;
    const formulario = document.getElementById("searchForm");
    const campoBusqueda = document.getElementById("searchInput");
    const listaAudius = document.getElementById("songList");
    const estadoAudius = document.getElementById("status");
    const listaItunes = document.getElementById("itunesSongList");
    const estadoItunes = document.getElementById("itunesStatus");
    const listaArtistasItunes = document.getElementById("itunesArtistList");
    const estadoArtistasItunes = document.getElementById("itunesArtistStatus");

    if (
        !claveFavoritos ||
        !formulario ||
        !campoBusqueda ||
        !listaAudius ||
        !estadoAudius ||
        !listaItunes ||
        !estadoItunes ||
        !listaArtistasItunes ||
        !estadoArtistasItunes
    ) {
        console.error("Faltan elementos necesarios en la búsqueda.");
        return;
    }

    let cancionesAudius = [];
    let numeroBusqueda = 0;

    async function consultarAudius(query) {
        const parameters = new URLSearchParams({
            query,
            limit: "20"
        });
        const response = await fetch(
            `https://api.audius.co/v1/tracks/search?${parameters}`
        );

        if (!response.ok) {
            throw new Error(`Audius respondió con el estado ${response.status}.`);
        }

        const result = await response.json();
        return Array.isArray(result.data) ? result.data : [];
    }

    function obtenerFavoritos() {
        try {
            const datos = JSON.parse(localStorage.getItem(claveFavoritos) || "[]");
            return Array.isArray(datos)
                ? datos.filter(item => item && typeof item === "object" && item.id)
                : [];
        } catch (error) {
            console.error("Error al leer favoritos:", error);
            return [];
        }
    }

    function crearTarjetaAudius(song) {
        const card = document.createElement("article");
        card.className = "song";

        const image = document.createElement("img");
        window.cargarImagenConFallback(
            image,
            song.artwork?.["480x480"] || song.artwork?.["150x150"]
        );
        image.alt = `Portada de ${song.title || "la canción"}`;

        const info = document.createElement("div");
        info.className = "song-info";

        const title = document.createElement("strong");
        title.textContent = song.title || "Sin título";

        const artist = document.createElement("small");
        artist.textContent = song.user?.name || "Artista desconocido";
        info.append(title, artist);

        const playButton = document.createElement("button");
        playButton.type = "button";
        playButton.innerHTML = '<img class="app-icon" src="src/icons/Play.svg" alt="" aria-hidden="true">';
        playButton.setAttribute("aria-label", `Reproducir ${song.title || "canción"}`);
        playButton.addEventListener("click", event => {
            event.stopPropagation();
            window.Reproductor.reproducir(song, cancionesAudius);
        });

        const favoriteButton = document.createElement("button");
        favoriteButton.type = "button";
        favoriteButton.innerHTML = '<img class="app-icon" src="src/icons/Heart.svg" alt="" aria-hidden="true">';
        favoriteButton.setAttribute(
            "aria-label",
            `Agregar ${song.title || "canción"} a favoritos`
        );
        favoriteButton.addEventListener("click", event => {
            event.stopPropagation();

            const favorites = obtenerFavoritos();
            if (favorites.some(item => String(item.id) === String(song.id))) {
                estadoAudius.textContent = "Esta canción ya está en favoritos.";
                return;
            }

            try {
                favorites.push(song);
                localStorage.setItem(claveFavoritos, JSON.stringify(favorites));
                estadoAudius.innerHTML = '¡Canción agregada a favoritos! <img class="app-icon inline-icon" src="src/icons/Heart.svg" alt="" aria-hidden="true">';
            } catch (error) {
                console.error("Error al guardar favorito:", error);
                estadoAudius.textContent = "No se pudo guardar la canción.";
            }
        });

        const playlistButton = document.createElement("button");
        playlistButton.type = "button";
        playlistButton.innerHTML = '<img class="app-icon" src="src/icons/Plus Math.svg" alt="" aria-hidden="true">';
        playlistButton.setAttribute(
            "aria-label",
            `Agregar ${song.title || "canción"} a una lista`
        );
        playlistButton.addEventListener("click", event => {
            event.stopPropagation();
            window.abrirDialogoLista(song);
        });

        card.addEventListener("click", () => {
            window.Reproductor.reproducir(song, cancionesAudius);
        });

        card.append(image, info, playButton, favoriteButton, playlistButton);
        return card;
    }

    function obtenerEnlaceApple(url) {
        if (typeof url !== "string") return null;

        try {
            const enlace = new URL(url);
            return enlace.protocol === "https:" &&
                (enlace.hostname === "music.apple.com" ||
                    enlace.hostname === "itunes.apple.com")
                ? enlace.href
                : null;
        } catch {
            return null;
        }
    }

    function crearTarjetaItunes(track) {
        const card = document.createElement("article");
        card.className = "song itunes-result";

        const image = document.createElement("img");
        window.cargarImagenConFallback(image, track.artworkUrl100);
        image.alt = `Portada de ${track.trackName || "la canción"}`;

        const info = document.createElement("div");
        info.className = "song-info";

        const title = document.createElement("strong");
        title.textContent = track.trackName || "Sin título";

        const artist = document.createElement("small");
        artist.textContent = track.artistName || "Artista desconocido";

        const album = document.createElement("small");
        album.textContent = track.collectionName || "Catálogo de Apple";
        info.append(title, artist, album);

        const linkUrl = obtenerEnlaceApple(track.trackViewUrl);
        if (linkUrl) {
            const link = document.createElement("a");
            link.className = "apple-link";
            link.href = linkUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Ver en Apple Music";
            link.setAttribute(
                "aria-label",
                `Ver ${track.trackName || "canción"} en Apple Music`
            );
            card.append(image, info, link);
        } else {
            card.append(image, info);
        }

        return card;
    }

    function crearTarjetaArtista(artist) {
        const card = document.createElement("article");
        card.className = "artist";

        const name = document.createElement("strong");
        name.textContent = artist.artistName || "Artista desconocido";

        const genre = document.createElement("small");
        genre.textContent = artist.primaryGenreName || "Música";

        card.append(name, genre);

        const linkUrl = obtenerEnlaceApple(artist.artistLinkUrl);
        if (linkUrl) {
            const link = document.createElement("a");
            link.className = "apple-link";
            link.href = linkUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Ver en Apple Music";
            link.setAttribute(
                "aria-label",
                `Ver a ${artist.artistName || "este artista"} en Apple Music`
            );
            card.appendChild(link);
        }

        return card;
    }

    async function ejecutarBusqueda(query) {
        if (!query) {
            estadoAudius.textContent = "Escribe el nombre de una canción o artista.";
            return;
        }

        const busquedaActual = ++numeroBusqueda;
        cancionesAudius = [];
        listaAudius.replaceChildren();
        listaItunes.replaceChildren();
        listaArtistasItunes.replaceChildren();
        estadoAudius.textContent = "Buscando en Audius...";
        estadoItunes.textContent = "Buscando en iTunes...";
        estadoArtistasItunes.textContent = "Buscando artistas...";

        const tareas = [
            (async () => {
                try {
                    const results = await consultarAudius(query);
                    if (busquedaActual !== numeroBusqueda) return;

                    cancionesAudius = results.filter(song => song && song.id);
                    cancionesAudius.forEach(song => {
                        listaAudius.appendChild(crearTarjetaAudius(song));
                    });
                    estadoAudius.textContent = cancionesAudius.length
                        ? `Audius: ${cancionesAudius.length} resultados.`
                        : "Audius: no se encontraron canciones.";
                } catch (error) {
                    if (busquedaActual !== numeroBusqueda) return;
                    console.error("Error al buscar en Audius:", error);
                    estadoAudius.textContent = "No se pudo buscar en Audius.";
                }
            })(),
            (async () => {
                try {
                    const results = await window.ItunesApi.buscarCanciones(query);
                    if (busquedaActual !== numeroBusqueda) return;

                    results.forEach(track => {
                        listaItunes.appendChild(crearTarjetaItunes(track));
                    });
                    estadoItunes.textContent = results.length
                        ? `iTunes: ${results.length} resultados. Abre Apple Music para ver el contenido.`
                        : "iTunes: no se encontraron canciones.";
                } catch (error) {
                    if (busquedaActual !== numeroBusqueda) return;
                    console.error("Error al buscar en iTunes:", error);
                    estadoItunes.textContent =
                        "No se pudo consultar iTunes Search. Inténtalo otra vez.";
                }
            })(),
            (async () => {
                try {
                    const results = await window.ItunesApi.buscarArtistas(query);
                    if (busquedaActual !== numeroBusqueda) return;

                    results.forEach(artist => {
                        listaArtistasItunes.appendChild(crearTarjetaArtista(artist));
                    });
                    estadoArtistasItunes.textContent = results.length
                        ? `Artistas de iTunes: ${results.length} resultados.`
                        : "iTunes: no se encontraron artistas.";
                } catch (error) {
                    if (busquedaActual !== numeroBusqueda) return;
                    console.error("Error al buscar artistas en iTunes:", error);
                    estadoArtistasItunes.textContent =
                        "No se pudieron consultar artistas en iTunes.";
                }
            })()
        ];

        await Promise.all(tareas);
    }

    formulario.addEventListener("submit", async event => {
        event.preventDefault();
        await ejecutarBusqueda(campoBusqueda.value.trim());
    });

    estadoAudius.textContent = "Busca canciones en Audius.";
    estadoItunes.textContent = "Los resultados de iTunes incluirán un enlace a Apple Music.";
    estadoArtistasItunes.textContent = "";

    if (typeof window.busquedaCatalogoPendiente === "string") {
        const query = window.busquedaCatalogoPendiente;
        delete window.busquedaCatalogoPendiente;
        campoBusqueda.value = query;
        formulario.requestSubmit();
    }
};
