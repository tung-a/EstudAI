// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAStqkIhJOuoGhUtNCg5OuN623RkKGpxeA",
  authDomain: "estudai-628ed.firebaseapp.com",
  projectId: "estudai-628ed",
  storageBucket: "estudai-628ed.firebasestorage.app",
  messagingSenderId: "133885041211",
  appId: "1:133885041211:web:329ca0e8c4330c770d1a1e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let auth;

if (Platform.OS === "android" || Platform.OS === "ios") {
  // Configuração para nativo com persistência
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} else {
  // Configuração padrão para a web
  auth = getAuth(app);
}

// Exporta as instâncias prontas para serem usadas em qualquer lugar
export { auth, db };
