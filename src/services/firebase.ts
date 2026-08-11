import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Configuração fornecida para o projeto do Firebase "sagacitas-landpage"
const firebaseConfig = {
  apiKey: "AIzaSyDlUfNK6Q_w1msSob3jwgLtXf7aPkZT0Fs",
  authDomain: "sagacitas-landpage.firebaseapp.com",
  projectId: "sagacitas-landpage",
  storageBucket: "sagacitas-landpage.firebasestorage.app",
  messagingSenderId: "1033877611990",
  appId: "1:1033877611990:web:dfdfbdb980ff63cefcb077",
  measurementId: "G-C6XG8YHNCM"
};

// Inicialização do Firebase e exportação do serviço de autenticação
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
