import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { FIREBASE_CONFIG, isFirebaseConfigured } from './config/env';

const app = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(FIREBASE_CONFIG)
  : null;

const analytics = app ? getAnalytics(app) : null;
const auth = app ? getAuth(app) : null;

export { app, analytics, auth };
