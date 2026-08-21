import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhQgPNpQjRa8Lz5uUU281C_hN-Sq81TTU",
  authDomain: "issue-tracking-portal.firebaseapp.com",
  projectId: "issue-tracking-portal",
  storageBucket: "issue-tracking-portal.firebasestorage.app",
  messagingSenderId: "1097759406001",
  appId: "1:1097759406001:web:f5c900633f1010e72eaf90"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
