// ============================================
// js/firebase-config.js – Firebase Initialization
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your web app's Firebase configuration (from provided SDK)
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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Expose globally for use in other scripts (auth-rbac.js, etc.)
window.auth = auth;
window.db = db;
window.analytics = analytics;
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
