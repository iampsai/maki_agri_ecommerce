Firebase Admin (optional)

This server can optionally sync admin-created users into Firebase Authentication so that client-side Firebase sign-in works for accounts created by admins.

Setup:
- Place your Firebase service account JSON at `server/serviceAccountKey.json`, or set the environment variable `FIREBASE_ADMIN_SDK_PATH` to its absolute path.
- Install dependencies: run `npm install` inside the `server` folder (this will install `firebase-admin`).

Behavior:
- If the service account file is present, the server initializes Firebase Admin and will create/update Firebase Auth users when an admin creates or updates a user/rider (`/admin/create`, `/admin/create-rider`, `PUT /admin/:id`).
- If the service account is missing, the server will continue to function but won't sync users to Firebase.
