// Firebase Client SDK Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
export const auth = getAuth(firebaseApp);

let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(firebaseApp);
} catch (e) {
  console.log("Firebase Analytics initialized (or local environment)");
}
export const analytics = analyticsInstance;

// Helper to format exact Firebase Auth errors in Arabic with code
export function formatFirebaseAuthError(error) {
  const code = error?.code || 'auth/unknown';
  const rawMsg = error?.message || String(error);
  
  const translations = {
    'auth/email-already-in-use': 'البريد الإلكتروني مسجل بالفعل بحساب آخر',
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صالحة',
    'auth/operation-not-allowed': 'تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في لوحة تحكم Firebase (Authentication -> Sign-in method)',
    'auth/weak-password': 'كلمة المرور ضعيفة جداً، يجب أن تكون 6 أحرف على الأقل',
    'auth/user-disabled': 'تم تعطيل هذا الحساب من قِبل المشرف',
    'auth/user-not-found': 'لا يوجد حساب مسجل بهذا البريد الإلكتروني',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/too-many-requests': 'تم حظر الطلبات مؤقتاً لكثرة المحاولات غير الناجحة، يرجى المحاولة لاحقاً',
    'auth/network-request-failed': 'فشل الاتصال بالإنترنت أو خوادم Firebase'
  };

  const arabicDesc = translations[code] || rawMsg;
  return {
    code: code,
    message: rawMsg,
    display: `${arabicDesc} [${code}]`
  };
}

window.firebaseApp = firebaseApp;
window.firebaseAuth = auth;
window.firebaseAnalytics = analytics;
window.FirebaseAuth = {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  formatFirebaseAuthError
};

console.log("🔥 Firebase Client & Auth Initialized for project:", firebaseConfig.projectId);

