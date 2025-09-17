import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBYZDXhGbUnO8LfDKuQRfvD30aN7xBKaCM",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "rasanew-71d16.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "rasanew-71d16",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "rasanew-71d16.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "21194757939",
  appId: process.env.FIREBASE_APP_ID || "1:21194757939:web:f70da3ae3c5cb12c1cd046",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-T2E42MVYZE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connect to emulator in development (optional)
if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Firebase emulator already connected or not available');
  }
}

export default app;