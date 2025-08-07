import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVYMv7W4swZ8u6MEhhneA-TwfSAsBZYU4",
  authDomain: "notetakerapp01.firebaseapp.com",
  projectId: "notetakerapp01",
  storageBucket: "notetakerapp01.firebasestorage.app",
  messagingSenderId: "788028137743",
  appId: "1:788028137743:web:c26de441e1fde4cf4c9e7a",
  measurementId: "G-2KWJKJWB80"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);