// Configuração do Firebase para páginas públicas (sem autenticação)

const firebaseConfig = {
  apiKey: "AIzaSyDQJNob3jko-HWWkJWYzpGcPQabqWWyBuw",
  authDomain: "effore-recursos-humanos.firebaseapp.com",
  projectId: "effore-recursos-humanos",
  storageBucket: "effore-recursos-humanos.firebasestorage.app",
  messagingSenderId: "16564831761",
  appId: "1:16564831761:web:d289bc071921f688a8d3b0",
  measurementId: "G-0P81XEC4HY"
};

// Inicializar Firebase apenas se ainda não foi inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase inicializado com sucesso!");
} else {
  console.log("Firebase já estava inicializado.");
}

// Inicializar apenas Firestore (sem auth)
const db = firebase.firestore();
