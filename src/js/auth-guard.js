import {
    auth,
    firebaseConfigured,
    firebaseError,
    onAuthStateChanged,
    signOut
} from "./firebase-config.js";

const app = document.querySelector(".app");
const authStatus = document.getElementById("authStatus");
const logoutButton = document.getElementById("logoutBtn");

function mostrarEstado(texto) {
    authStatus.hidden = false;
    authStatus.textContent = texto;
}

if (!firebaseConfigured || !auth) {
    mostrarEstado(
        firebaseError
            ? "No se pudo iniciar Firebase. Revisa la configuración del proyecto."
            : "Configura Firebase en src/js/firebase-config.js para continuar."
    );
} else {
    let appIniciada = false;

    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;

        try {
            await signOut(auth);
        } catch (error) {
            console.error("No se pudo cerrar la sesión:", error);
            mostrarEstado("No se pudo cerrar la sesión. Inténtalo otra vez.");
            logoutButton.disabled = false;
        }
    });

    onAuthStateChanged(
        auth,
        async user => {
            if (!user) {
                window.location.replace("login.html");
                return;
            }

            if (!user.emailVerified) {
                try {
                    await signOut(auth);
                    window.location.replace("login.html?verificar=1");
                } catch (error) {
                    console.error(
                        "No se pudo cerrar la sesión sin verificar:",
                        error
                    );
                    mostrarEstado(
                        "Verifica tu correo antes de usar la aplicación. Recarga para volver al inicio de sesión."
                    );
                }
                return;
            }

            if (appIniciada) return;
            appIniciada = true;

            const claveFavoritos = `favoritosMusic:${user.uid}`;
            const claveListas = `listasMusic:${user.uid}`;

            try {
                if (localStorage.getItem(claveFavoritos) === null) {
                    const favoritosAnteriores =
                        localStorage.getItem("favoritosMusic");

                    if (favoritosAnteriores !== null) {
                        localStorage.setItem(
                            claveFavoritos,
                            favoritosAnteriores
                        );
                        localStorage.removeItem("favoritosMusic");
                    }
                }
            } catch (error) {
                console.error(
                    "No se pudieron asociar los favoritos existentes a la cuenta:",
                    error
                );
            }

            window.claveFavoritos = claveFavoritos;
            window.claveListas = claveListas;
            authStatus.hidden = true;
            app.hidden = false;

            const script = document.createElement("script");
            script.src = "src/js/reproductor.js";
            script.onerror = () => {
                mostrarEstado("No se pudo cargar el reproductor. Recarga la página.");
                app.hidden = true;
            };
            document.body.appendChild(script);
        },
        error => {
            console.error("No se pudo comprobar la sesión:", error);
            mostrarEstado("No se pudo comprobar la sesión. Recarga la página.");
        }
    );
}
