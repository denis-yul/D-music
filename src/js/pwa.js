// Comprobar si el navegador admite Service Workers
if ("serviceWorker" in navigator) {

    // Registrar el Service Worker
    window.addEventListener("load", () => {

        navigator.serviceWorker.register("./service-worker.js")
            .then(() => {
                console.log("Music está lista para instalarse.");
            })
            .catch(error => {
                console.error("Error al registrar la aplicación:", error);
            });

    });

}