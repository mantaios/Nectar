import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // <--- 1. ΠΡΟΣΘΕΣΕ ΑΥΤΟ

const firebaseConfig = {
  apiKey: "AIzaSyBxcEdokUyCP9S0XXmpzxTQ_0RydiLascY",
  authDomain: "my-food-app-57cfe.firebaseapp.com",
  projectId: "my-food-app-57cfe",
  storageBucket: "my-food-app-57cfe.firebasestorage.app",
  messagingSenderId: "762885742517",
  appId: "1:762885742517:web:126a2660d6a0976bc743fc"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // <--- 2. ΠΡΟΣΘΕΣΕ ΑΥΤΟ