const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const API_URL = getEnv('VITE_API_URL').replace(/\/$/, '');

export const FIREBASE_CONFIG = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

export const ADMIN_LOGIN_CONFIG = {
  email: getEnv('VITE_ADMIN_EMAIL') || 'madderlachethan@gmauil.com',
  password: getEnv('VITE_ADMIN_PASSWORD') || '8008104299C',
};

export const isFirebaseConfigured = Object.values(FIREBASE_CONFIG).every(Boolean);
