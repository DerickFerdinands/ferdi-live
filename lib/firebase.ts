// lib/firebaseClient.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  enableIndexedDbPersistence,
  Firestore,
} from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";

// —————————————————————————————————————————————————————————————
// 1. Your Firebase “web” config (only NEXT_PUBLIC_* vars are exposed to the browser)
const firebaseConfig = {
  apiKey:        process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:         process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  databaseURL:   process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
};

// —————————————————————————————————————————————————————————————
// 2. Validate that the essential config values actually made it into `firebaseConfig`
const requiredFields: [keyof typeof firebaseConfig, string][] = [
  ["apiKey",        firebaseConfig.apiKey],
  ["authDomain",    firebaseConfig.authDomain],
  ["projectId",     firebaseConfig.projectId],
  ["appId",         firebaseConfig.appId],
];
const missing = requiredFields
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missing.length) {
  throw new Error(
      `Missing Firebase config values in firebaseConfig: ${missing.join(", ")}`
  );
}

// —————————————————————————————————————————————————————————————
// 3. Initialize (or reuse) the Firebase App
const app: FirebaseApp =
    getApps().length === 0
        ? initializeApp(firebaseConfig)
        : getApps()[0];

// —————————————————————————————————————————————————————————————
// 4. Exports (wrapped in SSR‐guard so Auth/RTDB only load in the browser)
let auth: Auth | null = null;
let realtimeDb: Database | null = null;
let db: Firestore;

if (typeof window !== "undefined") {
  // Client‐only: Auth + RTDB
  auth = getAuth(app);
  realtimeDb = getDatabase(app);

  // Firestore with XHR long‐polling & offline persistence
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  enableIndexedDbPersistence(db).catch((err) => {
    console.warn("IndexedDB persistence failed:", err.code);
  });
} else {
  // SSR/Node: just grab the default Firestore instance
  db = getFirestore(app);
}

export { app, auth, db, realtimeDb };
export default app;
