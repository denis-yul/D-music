window.inicializarListas = function () {
    const store = window.ListasReproduccion;
    const form = document.getElementById("createPlaylistForm");
    const nameInput = document.getElementById("playlistName");
    const status = document.getElementById("playlistStatus");
    const listContainer = document.getElementById("playlistList");
    const detail = document.getElementById("playlistDetail");
    const detailTitle = document.getElementById("playlistDetailTitle");
    const detailStatus = document.getElementById("playlistDetailStatus");
    const songsContainer = document.getElementById("playlistSongs");
    const backButton = document.getElementById("backToPlaylistsBtn");
    const deleteButton = document.getElementById("deletePlaylistBtn");
    let selectedListId = null;

    function mostrarListas() {
        listContainer.replaceChildren();

        try {
            const listas = store.obtenerListas();
            if (!listas.length) {
                status.textContent = "Aún no tienes listas. Crea una arriba.";
                return;
            }

            status.textContent = `Tienes ${listas.length} listas.`;

            listas.forEach(lista => {
                const card = document.createElement("article");
                card.className = "playlist-card";

                const title = document.createElement("h3");
                title.textContent = lista.nombre;

                const count = document.createElement("p");
                count.textContent = `${lista.canciones.length} canciones`;

                const actions = document.createElement("div");
                actions.className = "playlist-card-actions";

                const openButton = document.createElement("button");
                openButton.type = "button";
                openButton.textContent = "Abrir";
                openButton.addEventListener("click", () => abrirLista(lista.id));

                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "delete-playlist";
                removeButton.textContent = "Eliminar";
                removeButton.setAttribute(
                    "aria-label",
                    `Eliminar la lista ${lista.nombre}`
                );
                removeButton.addEventListener("click", () => borrarLista(lista));

                actions.append(openButton, removeButton);
                card.append(title, count, actions);
                listContainer.appendChild(card);
            });
        } catch (error) {
            console.error("No se pudieron mostrar las listas:", error);
            status.textContent = "No se pudieron leer tus listas guardadas.";
        }
    }

    function abrirLista(listaId) {
        try {
            const lista = store.obtenerListas().find(item => item.id === listaId);
            if (!lista) throw new Error("No se encontró esa lista.");

            selectedListId = lista.id;
            detailTitle.textContent = lista.nombre;
            detail.hidden = false;
            listContainer.hidden = true;
            form.hidden = true;
            status.hidden = true;
            mostrarCanciones(lista);
        } catch (error) {
            console.error("No se pudo abrir la lista:", error);
            status.textContent = error.message;
        }
    }

    function mostrarCanciones(lista) {
        songsContainer.replaceChildren();

        if (!lista.canciones.length) {
            detailStatus.textContent = "Esta lista está vacía.";
            return;
        }

        detailStatus.textContent = `${lista.canciones.length} canciones`;

        lista.canciones.forEach(cancion => {
            const card = document.createElement("article");
            card.className = "song";

            const image = document.createElement("img");
            window.cargarImagenConFallback(
                image,
                cancion.artwork?.["480x480"] ||
                cancion.artwork?.["150x150"]
            );
            image.alt = "Portada de la canción";

            const info = document.createElement("div");
            info.className = "song-info";

            const title = document.createElement("strong");
            title.textContent = cancion.title || "Sin título";

            const artist = document.createElement("small");
            artist.textContent = cancion.user?.name || "Artista desconocido";
            info.append(title, artist);

            const playButton = document.createElement("button");
            playButton.type = "button";
            playButton.textContent = "▶";
            playButton.setAttribute(
                "aria-label",
                `Reproducir ${cancion.title || "canción"}`
            );
            playButton.addEventListener("click", () => {
                window.Reproductor.reproducir(cancion, lista.canciones);
            });

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.textContent = "✕";
            removeButton.setAttribute(
                "aria-label",
                `Quitar ${cancion.title || "canción"} de la lista`
            );
            removeButton.addEventListener("click", () => {
                try {
                    store.eliminarCancion(lista.id, cancion.id);
                    abrirLista(lista.id);
                } catch (error) {
                    console.error("No se pudo quitar la canción:", error);
                    detailStatus.textContent = "No se pudo quitar la canción.";
                }
            });

            card.append(image, info, playButton, removeButton);
            songsContainer.appendChild(card);
        });
    }

    function borrarLista(lista) {
        if (!window.confirm(`¿Eliminar la lista "${lista.nombre}"?`)) return;

        try {
            store.eliminarLista(lista.id);
            if (selectedListId === lista.id) volverAListas();
            mostrarListas();
        } catch (error) {
            console.error("No se pudo eliminar la lista:", error);
            status.textContent = error.message;
        }
    }

    function volverAListas() {
        selectedListId = null;
        detail.hidden = true;
        listContainer.hidden = false;
        form.hidden = false;
        status.hidden = false;
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        try {
            const lista = store.crearLista(nameInput.value);
            nameInput.value = "";
            status.textContent = `Se creó la lista "${lista.nombre}".`;
            mostrarListas();
        } catch (error) {
            console.error("No se pudo crear la lista:", error);
            status.textContent = error.message;
        }
    });

    backButton.addEventListener("click", volverAListas);
    deleteButton.addEventListener("click", () => {
        try {
            const lista = store.obtenerListas().find(item => item.id === selectedListId);
            if (lista) borrarLista(lista);
        } catch (error) {
            console.error("No se pudo leer la lista seleccionada:", error);
            detailStatus.textContent = "No se pudo leer la lista seleccionada.";
        }
    });

    mostrarListas();
};
