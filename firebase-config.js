// Configuração do Firebase
// IMPORTANTE: Substitua os valores abaixo pelas suas credenciais do Firebase Console

const firebaseConfig = {
  apiKey: "AIzaSyDQJNob3jko-HWWkJWYzpGcPQabqWWyBuw",
  authDomain: "effore-recursos-humanos.firebaseapp.com",
  projectId: "effore-recursos-humanos",
  storageBucket: "effore-recursos-humanos.firebasestorage.app",
  messagingSenderId: "16564831761",
  appId: "1:16564831761:web:d289bc071921f688a8d3b0",
  measurementId: "G-0P81XEC4HY"
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase inicializado!");
} else {
  console.log("Firebase já estava inicializado.");
}

// Inicializar serviços
const db = firebase.firestore();
const auth = firebase.auth();

// Configurar persistência de autenticação
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error("Erro ao configurar persistência:", error);
  });

console.log("Firebase e Auth inicializados com sucesso!");
