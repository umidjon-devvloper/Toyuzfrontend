import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase konfiguratsiyasi — qiymatlar .env (VITE_FIREBASE_*) dan olinadi
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.storageBucket);

let storage = null;
if (isConfigured) {
  const app = initializeApp(firebaseConfig);
  storage = getStorage(app);
}

export const firebaseReady = isConfigured;

// Rasmni Firebase Storage ga yuklab, yuklab olish URL ini qaytaradi
export const uploadImage = async (file, folder = "invitations") => {
  if (!storage) {
    throw new Error("Firebase sozlanmagan. .env dagi VITE_FIREBASE_* qiymatlarini to'ldiring.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  // Date.now o'rniga oddiy tasodifiy qism (turli fayllar uchun)
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${folder}/${rand}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};
