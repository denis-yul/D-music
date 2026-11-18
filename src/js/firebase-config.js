import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

// Copia estos valores desde Firebase Console > Project settings > Your apps.
const firebaseConfig = {
    apiKey: "AIzaSyCuD9qysAujkA2bujIGtWwyabwC1BbTY_A",
    authDomain: "music-7c4c5.firebaseapp.com",
    projectId: "music-7c4c5",
    appId: "1:796824371747:web:b171463aa442d3d4516796"
};

export const firebaseConfigured = Object.values(firebaseConfig).every(
    value => typeof value === "string" && value.trim() !== ""
);

let authInstance = null;
let firebaseError = null;

if (firebaseConfigured) {
    try {
        authInstance = getAuth(initializeApp(firebaseConfig));
    } catch (error) {
        firebaseError = error;
        console.error("No se pudo inicializar Firebase:", error);
    }
}

export const auth = authInstance;
export { firebaseError };
export {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
};
