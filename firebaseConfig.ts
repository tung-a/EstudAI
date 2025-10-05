// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

const missingEnvVars = [
  ["EXPO_PUBLIC_FIREBASE_API_KEY", apiKey],
  ["EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", authDomain],
  ["EXPO_PUBLIC_FIREBASE_PROJECT_ID", projectId],
  ["EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", storageBucket],
  ["EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", messagingSenderId],
  ["EXPO_PUBLIC_FIREBASE_APP_ID", appId],
].filter(([, value]) => !value);

if (missingEnvVars.length > 0) {
  const formattedList = missingEnvVars
    .map(([name]) => ` - ${name}`)
    .join("\n");

  throw new Error(
    `Missing Firebase environment variables:\n${formattedList}\nAdd them to your Expo config or .env file (prefixed with EXPO_PUBLIC_).`
  );
}

const firebaseConfig = {
  apiKey: apiKey as string,
  authDomain: authDomain as string,
  projectId: projectId as string,
  storageBucket: storageBucket as string,
  messagingSenderId: messagingSenderId as string,
  appId: appId as string,
};

// Initialize Firebase
const appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const app = appInstance;
export const db = getFirestore(app);
export const auth = getAuth(app);
