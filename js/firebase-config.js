// ============================================
// js/firebase-config.js – Firebase Initialization
// Uses provided config – no manual setup needed
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your Firebase configuration (copied from provided SDK)
const firebaseConfig = {
  apiKey: "AIzaSyBCdSPOM47RDoQpH2uIOlGpphS6RAiyWao",
  authDomain: "skill2jobvisitcount.firebaseapp.com",
  databaseURL: "https://skill2jobvisitcount-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "skill2jobvisitcount",
  storageBucket: "skill2jobvisitcount.firebasestorage.app",
  messagingSenderId: "765089407089",
  appId: "1:765089407089:web:a410facdd7dfb6e1fbbbd0",
  measurementId: "G-S5X1VJQS79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Expose globally for use in other scripts
window.auth = auth;
window.db = db;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.signOut = signOut;
window.doc = doc;
window.getDoc = getDoc;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.collection = collection;
window.query = query;
window.getDocs = getDocs;
window.onAuthStateChanged = onAuthStateChanged;

console.log('Firebase initialized successfully');
