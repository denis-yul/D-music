
/* =========================================
   DENNIS MUSIC - FAVORITOS
   ========================================= */


/* =========================================
   1. INICIALIZAR PÁGINA DE FAVORITOS
   ========================================= */

window.inicializarFavoritos = function () {

    const CLAVE_FAVORITOS = window.claveFavoritos;

    if (!CLAVE_FAVORITOS) {
        console.error("No se encontró la clave de favoritos de la cuenta.");
        return;
    }

    /* =========================================
       2. ELEMENTOS HTML
       ========================================= */

    const songList = document.getElementById("songList");
    const statusText = document.getElementById("status");

    // Comprobar que los elementos existan
    if (!songList || !statusText) {

        console.error(
            "No se encontraron los elementos de Favoritos."
        );

        return;
    }


    /* =========================================
       3. OBTENER FAVORITOS
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

            console.error(
                "Error al leer favoritos:",
                error
            );

            return [];
        }
    }


    /* =========================================
       4. GUARDAR FAVORITOS
       ========================================= */

    function guardarFavoritos() {

        try {

            localStorage.setItem(
                CLAVE_FAVORITOS,
                JSON.stringify(favoritos)
            );

            return true;

        } catch (error) {

            console.error(
                "Error al guardar favoritos:",
                error
            );

            return false;
        }
    }


    // Obtener la lista al entrar en la sección
    let favoritos = obtenerFavoritos();


    /* =========================================
       5. MOSTRAR FAVORITOS
       ========================================= */

    function mostrarFavoritos() {

        // Limpiar la lista anterior
        songList.innerHTML = "";

        // Comprobar si existen canciones
        if (!favoritos.length) {

            statusText.textContent =
                "Todavía no tienes canciones favoritas. ♥";

            return;
        }

        statusText.textContent =
            "Tus canciones favoritas: " + favoritos.length;


        // Recorrer todos los favoritos
        favoritos.forEach((song, index) => {

            const card = document.createElement("article");

            card.className = "song";


            /* ---------------------------------
               PORTADA
               --------------------------------- */

            const image = document.createElement("img");

            window.cargarImagenConFallback(
                image,
                song.artwork?.["480x480"] ||
                song.artwork?.["150x150"]
            );

            image.alt = "Portada de la canción";


            /* ---------------------------------
               INFORMACIÓN
               --------------------------------- */

            const info = document.createElement("div");

            info.className = "song-info";

            const title = document.createElement("strong");

            title.textContent =
                song.title || "Sin título";

            const artist = document.createElement("small");

            artist.textContent =
                song.user?.name || "Artista desconocido";

            info.append(title, artist);


            /* ---------------------------------
               BOTÓN REPRODUCIR
               --------------------------------- */

            const playButton = document.createElement("button");

            playButton.type = "button";

            playButton.textContent = "▶";

            playButton.title = "Reproducir canción";

            playButton.setAttribute(
                "aria-label",
                "Reproducir " + (song.title || "canción")
            );

            playButton.addEventListener("click", (event) => {

                event.stopPropagation();

                // Utilizar una copia de la lista
                window.Reproductor.reproducir(
                    song,
                    [...favoritos]
                );

            });

            const playlistButton = document.createElement("button");
            playlistButton.type = "button";
            playlistButton.textContent = "＋";
            playlistButton.title = "Agregar a una lista";
            playlistButton.setAttribute(
                "aria-label",
                `Agregar ${song.title || "canción"} a una lista`
            );
            playlistButton.addEventListener("click", event => {
                event.stopPropagation();
                window.abrirDialogoLista(song);
            });


            /* ---------------------------------
               BOTÓN ELIMINAR
               --------------------------------- */

            const deleteButton = document.createElement("button");

            deleteButton.type = "button";

            deleteButton.textContent = "✕";

            deleteButton.title = "Quitar de favoritos";

            deleteButton.setAttribute(
                "aria-label",
                "Eliminar " + (song.title || "canción")
            );

            deleteButton.addEventListener("click", (event) => {

                event.stopPropagation();

                eliminarFavorito(index);

            });


            /* ---------------------------------
               REPRODUCIR AL PULSAR LA TARJETA
               --------------------------------- */

            card.addEventListener("click", () => {

                window.Reproductor.reproducir(
                    song,
                    [...favoritos]
                );

            });


            /* ---------------------------------
               AGREGAR ELEMENTOS A LA TARJETA
               --------------------------------- */

            card.append(
                image,
                info,
                playButton,
                playlistButton,
                deleteButton
            );

            songList.appendChild(card);

        });

    }


    /* =========================================
       6. ELIMINAR FAVORITOS
       ========================================= */

    function eliminarFavorito(index) {

        // Comprobar que el índice sea válido
        if (
            index < 0 ||
            index >= favoritos.length
        ) {
            return;
        }

        const [eliminado] = favoritos.splice(index, 1);

        if (!guardarFavoritos()) {
            favoritos.splice(index, 0, eliminado);
            mostrarFavoritos();
            statusText.textContent =
                "No se pudieron guardar los cambios.";
            return;
        }

        mostrarFavoritos();
        statusText.textContent =
            "Canción eliminada. Favoritos restantes: " +
            favoritos.length;

    }


    /* =========================================
       7. INICIAR SECCIÓN
       ========================================= */

    mostrarFavoritos();

};
