import 'dotenv/config';
import {
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import {
  getDatabase as getAdminDatabase,
} from 'firebase-admin/database';

let database = null;

try {
  const apps = getApps();

  if (!apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      privateKey &&
      process.env.FIREBASE_DATABASE_URL
    ) {
      const app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

      database = getAdminDatabase(app);

      console.log(
        '[Firebase] Admin SDK initialized successfully'
      );
    } else {
      console.warn(
        '[Firebase] Required environment variables are missing'
      );
    }
  } else {
    database = getAdminDatabase(apps[0]);
  }
} catch (error) {
  console.error(
    '[Firebase] Initialization failed:',
    error.message
  );
}

export function getDatabase() {
  return database;
}