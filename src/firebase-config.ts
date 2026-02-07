// Firebase Configuration
// Replace these values with your actual Firebase project credentials
// You can find these in your Firebase Console -> Project Settings -> General

const getRequiredEnvVar = (key: string, fallback: string): string => {
  const value = import.meta.env[key];
  if (!value && fallback.startsWith('your-')) {
    console.warn(`Firebase config: ${key} is not set. Using placeholder value. Firebase features will not work.`);
  }
  return value || fallback;
};

export const firebaseConfig = {
  apiKey: getRequiredEnvVar('VITE_FIREBASE_API_KEY', "YOUR_API_KEY"),
  authDomain: getRequiredEnvVar('VITE_FIREBASE_AUTH_DOMAIN', "your-project.firebaseapp.com"),
  projectId: getRequiredEnvVar('VITE_FIREBASE_PROJECT_ID', "your-project"),
  storageBucket: getRequiredEnvVar('VITE_FIREBASE_STORAGE_BUCKET', "your-project.appspot.com"),
  messagingSenderId: getRequiredEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', "123456789"),
  appId: getRequiredEnvVar('VITE_FIREBASE_APP_ID', "1:123456789:web:abcdef123456")
};
