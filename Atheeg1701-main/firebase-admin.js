import admin from 'firebase-admin';

let database = null;

try {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      privateKey &&
      process.env.FIREBASE_DATABASE_URL
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

      database = admin.database();

      console.log(
        '[Firebase] Admin SDK initialized successfully'
      );
    } else {
      console.warn(
        '[Firebase] Required environment variables are missing'
      );
    }
  } else {
    database = admin.database();
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