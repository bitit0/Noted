// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUQIjQo4wVFt7FM3KRAtoyuUHQY5zL5_E",
  authDomain: "noted-11d5b.firebaseapp.com",
  projectId: "noted-11d5b",
  storageBucket: "noted-11d5b.firebasestorage.app",
  messagingSenderId: "539076609248",
  appId: "1:539076609248:web:52e2ac5299087679c0bc85",
  measurementId: "G-Q4D11WFZZ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);

export { db, auth, googleProvider, storage };