const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return admin;

  // Prefer path from env; fallback to serviceAccountKey.json in project root
  const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || path.join(__dirname, '..', 'serviceAccountKey.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.warn('Firebase service account file not found at', serviceAccountPath, '- Firebase Admin will not be initialized.');
    return null;
  }

  const serviceAccount = require(serviceAccountPath);

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('Firebase Admin initialized');
    return admin;
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err);
    return null;
  }
}

module.exports = { initFirebaseAdmin };
