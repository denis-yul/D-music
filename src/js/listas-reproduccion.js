(() => {
    function obtenerClave() {
        if (!window.claveListas) {
            throw new Error("No se encontró la clave de listas de esta cuenta.");
        }

        return window.claveListas;
    }

    function obtenerListas() {
        const contenido = localStorage.getItem(obtenerClave());
        if (contenido === null) return [];

        const listas = JSON.parse(contenido);
        if (!Array.isArray(listas)) {
            throw new Error("Las listas guardadas tienen un formato no válido.");
        }

        return listas.filter(lista =>
            lista &&
            typeof lista.id === "string" &&
            typeof lista.nombre === "string" &&
            Array.isArray(lista.canciones)
        );
    }

    function guardarListas(listas) {
        localStorage.setItem(obtenerClave(), JSON.stringify(listas));
    }

    function crearLista(nombre) {
        const nombreLimpio = nombre.trim();
        if (!nombreLimpio) {
            throw new Error("Escribe un nombre para la lista.");
        }
        if (nombreLimpio.length > 50) {
            throw new Error("El nombre no puede superar 50 caracteres.");
        }

        const listas = obtenerListas();
        if (listas.some(lista =>
            lista.nombre.toLocaleLowerCase() === nombreLimpio.toLocaleLowerCase()
        )) {
            throw new Error("Ya tienes una lista con ese nombre.");
        }

        const lista = {
            id: `lista-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            nombre: nombreLimpio,
            canciones: []
        };

        listas.push(lista);
        guardarListas(listas);
        return lista;
    }

    function agregarCancion(listaId, cancion) {
        if (
            !cancion ||
            !cancion.id ||
            cancion.spotifyId ||
            cancion.source === "itunes"
        ) {
            throw new Error("Solo se pueden agregar canciones reproducibles de Audius.");
        }

        const listas = obtenerListas();
        const lista = listas.find(item => item.id === listaId);
        if (!lista) throw new Error("No se encontró esa lista.");

        if (lista.canciones.some(item =>
            String(item.id) === String(cancion.id)
        )) {
            return false;
        }

        lista.canciones.push(cancion);
        guardarListas(listas);
        return true;
    }

    function eliminarCancion(listaId, cancionId) {
        const listas = obtenerListas();
        const lista = listas.find(item => item.id === listaId);
        if (!lista) throw new Error("No se encontró esa lista.");

        const cancionesActualizadas = lista.canciones.filter(
            cancion => String(cancion.id) !== String(cancionId)
        );

        if (cancionesActualizadas.length === lista.canciones.length) {
            throw new Error("No se encontró esa canción en la lista.");
        }

        lista.canciones = cancionesActualizadas;
        guardarListas(listas);
    }

    function eliminarLista(listaId) {
        const listas = obtenerListas();
        const listasActualizadas = listas.filter(lista => lista.id !== listaId);
        if (listasActualizadas.length === listas.length) {
            throw new Error("No se encontró esa lista.");
        }

        guardarListas(listasActualizadas);
    }

    const store = Object.freeze({
        obtenerListas,
        crearLista,
        agregarCancion,
        eliminarCancion,
        eliminarLista
    });

    window.ListasReproduccion = store;

    const dialogo = document.getElementById("playlistDialog");
    const formulario = document.getElementById("addToPlaylistForm");
    const selector = document.getElementById("playlistSelect");
    const mensaje = document.getElementById("playlistDialogMessage");
    const botonCrear = document.getElementById("goToPlaylistsBtn");
    const botonCancelar = document.getElementById("cancelPlaylistDialogBtn");
    let cancionPendiente = null;

    window.abrirDialogoLista = function (cancion) {
        if (!dialogo || !cancion || !cancion.id) return;

        cancionPendiente = cancion;
        selector.replaceChildren();

        try {
            const listas = obtenerListas();
            listas.forEach(lista => {
                const opcion = document.createElement("option");
                opcion.value = lista.id;
                opcion.textContent = lista.nombre;
                selector.appendChild(opcion);
            });

            const hayListas = listas.length > 0;
            selector.hidden = !hayListas;
            formulario.querySelector('[type="submit"]').hidden = !hayListas;
            botonCrear.hidden = hayListas;
            mensaje.textContent = hayListas
                ? "Elige en qué lista guardar esta canción."
                : "Primero crea una lista para poder agregar canciones.";

            dialogo.showModal();
        } catch (error) {
            console.error("No se pudieron cargar las listas:", error);
            mensaje.textContent = "No se pudieron cargar tus listas.";
            dialogo.showModal();
        }
    };

    formulario.addEventListener("submit", event => {
        event.preventDefault();
        if (!cancionPendiente) return;

        try {
            const agregada = agregarCancion(selector.value, cancionPendiente);
            mensaje.textContent = agregada
                ? "Canción agregada a la lista."
                : "Esa canción ya está en la lista.";
            if (agregada) dialogo.close();
        } catch (error) {
            console.error("No se pudo agregar la canción a la lista:", error);
            mensaje.textContent = error.message;
        }
    });

    botonCancelar.addEventListener("click", () => dialogo.close());

    botonCrear.addEventListener("click", () => {
        dialogo.close();
        document.querySelector('.navbar [data-page="listas"]')?.click();
    });

    dialogo.addEventListener("click", event => {
        if (event.target === dialogo) dialogo.close();
    });
})();
