// Firebase Client SDK Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxWjqg_DfzQwdGbmz9OTtmoEVwLNzCjW4",
  authDomain: "goalpath-747c4.firebaseapp.com",
  projectId: "goalpath-747c4",
  storageBucket: "goalpath-747c4.firebasestorage.app",
  messagingSenderId: "775425893620",
  appId: "1:775425893620:web:06459b70e1e6e329866aa1",
  measurementId: "G-3R0M46X3M0"
};

// Initialize Firebase Client
export const firebaseApp = initializeApp(firebaseConfig);
let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(firebaseApp);
} catch (e) {
  console.log("Firebase Analytics initialized (or local environment)");
}
export const analytics = analyticsInstance;

window.firebaseApp = firebaseApp;
window.firebaseAnalytics = analytics;
console.log("🔥 Firebase Client Initialized for project:", firebaseConfig.projectId);
