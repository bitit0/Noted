// Firebase initialization.
// The web config below is *public* by design (it identifies the project to the
// client SDK; it is not a secret). Values can be overridden via environment
// variables so the same build can target different Firebase projects.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const env = process.env;

const firebaseConfig = {
  apiKey: env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAUQIjQo4wVFt7FM3KRAtoyuUHQY5zL5_E",
  authDomain: env.REACT_APP_FIREBASE_AUTH_DOMAIN || "noted-11d5b.firebaseapp.com",
  projectId: env.REACT_APP_FIREBASE_PROJECT_ID || "noted-11d5b",
  storageBucket: env.REACT_APP_FIREBASE_STORAGE_BUCKET || "noted-11d5b.firebasestorage.app",
  messagingSenderId: env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "539076609248",
  appId: env.REACT_APP_FIREBASE_APP_ID || "1:539076609248:web:52e2ac5299087679c0bc85",
  measurementId: env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-Q4D11WFZZ4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);

export { app, db, auth, googleProvider, storage };
