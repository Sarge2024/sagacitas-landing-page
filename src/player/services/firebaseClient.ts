import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const firebaseAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '';
const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
const firebaseAppId = import.meta.env.VITE_FIREBASE_APP_ID || '';

export function isFirebaseAuthConfigured(): boolean {
  return Boolean(
    firebaseApiKey &&
    firebaseApiKey !== 'your-firebase-api-key' &&
    firebaseProjectId &&
    firebaseProjectId !== 'your-project-id'
  );
}

let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseAppInstance) {
    return firebaseAppInstance;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseAppInstance = getApp();
    return firebaseAppInstance;
  }

  const firebaseConfig = {
    apiKey: firebaseApiKey || 'AIzaSyPlaceholderKeyForSDKDemo',
    authDomain: firebaseAuthDomain || 'sagacitas-demo.firebaseapp.com',
    projectId: firebaseProjectId || 'sagacitas-demo',
    appId: firebaseAppId || '1:123456789:web:demo',
  };

  firebaseAppInstance = initializeApp(firebaseConfig);
  return firebaseAppInstance;
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuthInstance) {
    return firebaseAuthInstance;
  }

  const app = getFirebaseApp();
  firebaseAuthInstance = getAuth(app);
  return firebaseAuthInstance;
}
