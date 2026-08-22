import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Standard Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || import.meta.env.VITE_FIREBASE_MEASUREMENTID || ""
};

// Verify if the config has been customized
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
  firebaseConfig.apiKey.length > 5;

let app;
let auth = null;
let analytics = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Safely initialize analytics if supported in current browser context
    if (typeof window !== "undefined") {
      isSupported().then((supported) => {
        if (supported && firebaseConfig.measurementId) {
          analytics = getAnalytics(app);
        }
      });
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { auth, analytics, isFirebaseConfigured };
export default auth;
