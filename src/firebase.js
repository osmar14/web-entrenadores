import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Tus llaves secretas de Coachboard
const firebaseConfig = {
  apiKey: "AIzaSyA32hLkrjnRykwufsjCCXWPUgrd7vSLpvo",
  authDomain: "coachboard-9271f.firebaseapp.com",
  projectId: "coachboard-9271f",
  storageBucket: "coachboard-9271f.firebasestorage.app",
  messagingSenderId: "981314483126",
  appId: "1:981314483126:web:592b348508eb3b701c0717"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos el "Guardia de Seguridad" (Auth) para usarlo en el Login
export const auth = getAuth(app);