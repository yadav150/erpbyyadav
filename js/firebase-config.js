// ============================================
//  FIREBASE CONFIGURATION
//  (Compatible with Firebase CDN v10+)
// ============================================

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

// Initialize Firebase (using the global 'firebase' object loaded via CDN)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
