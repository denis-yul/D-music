(() => {
    const API_URL = "https://itunes.apple.com/search";
    const COUNTRY = "PE";

    function buscar(term, entity, limit) {
        const parameters = new URLSearchParams({
            term,
            country: COUNTRY,
            media: "music",
            entity,
            limit: String(limit)
        });

        return new Promise((resolve, reject) => {
            const callback = `itunesSearch_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}`;
            const script = document.createElement("script");
            let terminado = false;

            function limpiar() {
                if (terminado) return;
                terminado = true;
                window.clearTimeout(timeout);
                delete window[callback];
                script.remove();
            }

            const timeout = window.setTimeout(() => {
                limpiar();
                reject(new Error("iTunes Search tardó demasiado en responder."));
            }, 15000);

            window[callback] = result => {
                limpiar();
                if (!result || !Array.isArray(result.results)) {
                    reject(new Error("iTunes devolvió una respuesta no válida."));
                    return;
                }
                resolve(result.results);
            };

            script.async = true;
            script.referrerPolicy = "strict-origin-when-cross-origin";
            script.onerror = () => {
                limpiar();
                reject(new Error("No se pudo conectar con iTunes Search."));
            };

            parameters.set("callback", callback);
            script.src = `${API_URL}?${parameters.toString()}`;
            document.head.appendChild(script);
        });
    }

    window.ItunesApi = Object.freeze({
        buscarCanciones(term, limit = 20) {
            return buscar(term, "song", limit);
        },
        buscarArtistas(term, limit = 10) {
            return buscar(term, "musicArtist", limit);
        }
    });
})();
