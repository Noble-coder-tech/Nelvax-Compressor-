// =========================================================================
// 🚀 MANDATORY MODULAR IMPORTS (Add these to the very top!)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =========================================================================
// GLOBAL FIREBASE INITIALIZATION CORE
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAkeA8InvvBhpp4rH2g5YsV7ZMrnPgcTIk",
  authDomain: "nelvax-tech.firebaseapp.com",
  projectId: "nelvax-tech",
  storageBucket: "nelvax-tech.firebasestorage.app",
  messagingSenderId: "1028641621168",
  appId: "1:1028641621168:web:53f93374642b44b30b2775"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Modern exports matching your version 10 setup (Fixes the crash!)
export const auth = getAuth(app);
export const db = getFirestore(app);

// Absolute mandatory unique identifier required for administrative access
const REQUIRED_ADMIN_UID = "IeDiKaEi20dJDyPGPBFRXcZ9GVp2";

// Global balance toggling operational memory states
let originalBalance = "";
let isHidden = false;
let performanceChartInstance = null;

// Routing Core
const currentPath = window.location.pathname;