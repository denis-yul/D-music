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

let instalacionPwa;

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    instalacionPwa = event;
    window.dispatchEvent(new CustomEvent("pwa-installable"));
});

window.addEventListener("appinstalled", () => {
    instalacionPwa = null;
    console.log("Music se instaló correctamente.");
});

window.solicitarInstalacionPwa = async () => {
    if (!instalacionPwa) return false;

    instalacionPwa.prompt();
    const resultado = await instalacionPwa.userChoice;
    instalacionPwa = null;
    return resultado.outcome === "accepted";
};