import {
    auth,
    createUserWithEmailAndPassword,
    firebaseConfigured,
    firebaseError,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from "./firebase-config.js";

const formulario = document.getElementById("loginForm");
const campoEmail = document.getElementById("email");
const campoPassword = document.getElementById("password");
const botonOjo = document.getElementById("togglePassword");
const botonRegistro = document.getElementById("registerBtn");
const botonReenviarVerificacion = document.getElementById("resendVerificationBtn");
const botonEnviar = formulario.querySelector('[type="submit"]');
const enlaceRecuperacion = document.getElementById("forgotLink");
const mensaje = document.getElementById("loginMensaje");

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LARGO_MINIMO_PASSWORD = 6;

const MENSAJES_ERROR = {
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
    "auth/invalid-email": "Escribe un correo electrónico válido.",
    "auth/invalid-credential": "El correo o la contraseña no son correctos.",
    "auth/user-not-found": "El correo o la contraseña no son correctos.",
    "auth/wrong-password": "El correo o la contraseña no son correctos.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e inténtalo otra vez.",
    "auth/network-request-failed": "No hay conexión con Firebase. Comprueba internet.",
    "auth/operation-not-allowed": "Activa Email/Password en Firebase Authentication.",
    "auth/admin-restricted-operation": "Activa Email/Password en Firebase Authentication.",
    "auth/configuration-not-found": "Firebase Authentication aún no está configurado en este proyecto.",
    "auth/unauthorized-domain": "Autoriza este dominio en Firebase Authentication."
};

function mostrarMensaje(texto, esError = true, permitirReenvio = false) {
    mensaje.textContent = texto;
    mensaje.classList.toggle("ok", !esError);
    mensaje.classList.toggle("visible", texto !== "");
    botonReenviarVerificacion.hidden = !permitirReenvio;
}

function firebaseDisponible() {
    if (firebaseConfigured && auth && !firebaseError) return true;

    mostrarMensaje(
        firebaseError
            ? "No se pudo iniciar Firebase. Revisa la configuración del proyecto."
            : "Falta la configuración web de Firebase en src/js/firebase-config.js."
    );
    return false;
}

function mostrarErrorAuth(error) {
    console.error("Error de Firebase Authentication:", error);
    mostrarMensaje(
        MENSAJES_ERROR[error.code] ||
        "No se pudo completar la solicitud. Inténtalo nuevamente."
    );
}

function leerCredenciales() {
    const email = campoEmail.value.trim();
    const password = campoPassword.value;

    if (!email || !password) {
        mostrarMensaje("Completa el correo y la contraseña.");
        return null;
    }

    if (!REGEX_EMAIL.test(email)) {
        mostrarMensaje("Escribe un correo electrónico válido.");
        campoEmail.focus();
        return null;
    }

    if (password.length < LARGO_MINIMO_PASSWORD) {
        mostrarMensaje(
            `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`
        );
        campoPassword.focus();
        return null;
    }

    return { email, password };
}

botonOjo.addEventListener("click", () => {
    const oculta = campoPassword.type === "password";

    campoPassword.type = oculta ? "text" : "password";
    botonOjo.setAttribute("aria-pressed", String(oculta));
    botonOjo.setAttribute(
        "aria-label",
        oculta ? "Ocultar contraseña" : "Mostrar contraseña"
    );
});

formulario.addEventListener("submit", async event => {
    event.preventDefault();
    if (!firebaseDisponible()) return;

    const credenciales = leerCredenciales();
    if (!credenciales) return;

    botonEnviar.disabled = true;

    try {
        const credencial = await signInWithEmailAndPassword(
            auth,
            credenciales.email,
            credenciales.password
        );

        if (!credencial.user.emailVerified) {
            await signOut(auth);
            campoPassword.value = "";
            mostrarMensaje(
                "Confirma tu correo desde el enlace que te enviamos. Para reenviarlo, escribe otra vez tu contraseña.",
                true,
                true
            );
            return;
        }

        window.location.replace("index.html");
    } catch (error) {
        mostrarErrorAuth(error);
    } finally {
        botonEnviar.disabled = false;
    }
});

botonRegistro.addEventListener("click", async () => {
    if (!firebaseDisponible()) return;

    const credenciales = leerCredenciales();
    if (!credenciales) return;

    botonRegistro.disabled = true;

    let usuario;

    try {
        const credencial = await createUserWithEmailAndPassword(
            auth,
            credenciales.email,
            credenciales.password
        );
        usuario = credencial.user;
    } catch (error) {
        mostrarErrorAuth(error);
        botonRegistro.disabled = false;
        return;
    }

    try {
        await sendEmailVerification(usuario);
    } catch (error) {
        console.error("No se pudo enviar la verificación de correo:", error);
        try {
            await signOut(auth);
        } catch (signOutError) {
            console.error("No se pudo cerrar la sesión tras el registro:", signOutError);
        }
        campoPassword.value = "";
        mostrarMensaje(
            "La cuenta se creó, pero no se pudo enviar el correo. Revisa tu conexión, escribe otra vez tu contraseña y reenvíalo.",
            true,
            true
        );
        botonRegistro.disabled = false;
        return;
    }

    try {
        await signOut(auth);
    } catch (error) {
        console.error("No se pudo cerrar la sesión tras el registro:", error);
        campoPassword.value = "";
        mostrarMensaje(
            "La cuenta se creó y el correo fue enviado. Confirma tu correo antes de continuar; puedes volver a escribir tu contraseña para reenviarlo.",
            false,
            true
        );
        botonRegistro.disabled = false;
        return;
    }

    campoPassword.value = "";
    mostrarMensaje(
        "Cuenta creada. Revisa tu correo y spam, y confirma el enlace para iniciar sesión. Si no llega, escribe otra vez tu contraseña para reenviarlo.",
        false,
        true
    );
    botonRegistro.disabled = false;
});

botonReenviarVerificacion.addEventListener("click", async () => {
    if (!firebaseDisponible()) return;

    const credenciales = leerCredenciales();
    if (!credenciales) return;

    botonReenviarVerificacion.disabled = true;

    try {
        const credencial = await signInWithEmailAndPassword(
            auth,
            credenciales.email,
            credenciales.password
        );

        if (credencial.user.emailVerified) {
            await signOut(auth);
            campoPassword.value = "";
            mostrarMensaje(
                "Tu correo ya está verificado. Ahora puedes iniciar sesión.",
                false
            );
            return;
        }

        await sendEmailVerification(credencial.user);
        await signOut(auth);
        campoPassword.value = "";
        mostrarMensaje(
            "Enviamos otro enlace de verificación. Revisa tu correo y spam.",
            false
        );
    } catch (error) {
        if (auth.currentUser) {
            try {
                await signOut(auth);
            } catch (signOutError) {
                console.error("No se pudo cerrar la sesión tras reenviar:", signOutError);
            }
        }
        mostrarErrorAuth(error);
    } finally {
        botonReenviarVerificacion.disabled = false;
    }
});

enlaceRecuperacion.addEventListener("click", async event => {
    event.preventDefault();
    if (!firebaseDisponible()) return;

    const email = campoEmail.value.trim();
    if (!REGEX_EMAIL.test(email)) {
        mostrarMensaje("Escribe primero un correo electrónico válido.");
        campoEmail.focus();
        return;
    }

    enlaceRecuperacion.setAttribute("aria-disabled", "true");

    try {
        await sendPasswordResetEmail(auth, email);
        mostrarMensaje(
            "Si el correo está registrado, recibirás instrucciones para recuperar la contraseña.",
            false
        );
    } catch (error) {
        mostrarErrorAuth(error);
    } finally {
        enlaceRecuperacion.removeAttribute("aria-disabled");
    }
});

if (!firebaseConfigured || !auth) {
    firebaseDisponible();
} else {
    onAuthStateChanged(auth, user => {
        if (user && user.emailVerified) window.location.replace("index.html");
    });
}

if (new URLSearchParams(window.location.search).get("verificar") === "1") {
    mostrarMensaje(
        "Verifica tu correo antes de entrar. Escribe tu contraseña para solicitar otro enlace.",
        false,
        true
    );
}