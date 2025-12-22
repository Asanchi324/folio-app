import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import type { Activity } from "./types";

// Your web app's Firebase configuration (safe to expose in frontend)
const firebaseConfig = {
  apiKey: "AIzaSyD_Nke1z03YKmZGWdM0863PVT6diKn87bs",
  authDomain: "folio-c7b30.firebaseapp.com",
  projectId: "folio-c7b30",
  storageBucket: "folio-c7b30.firebasestorage.app",
  messagingSenderId: "946077477408",
  appId: "1:946077477408:web:6e070311203a74a0242a45"
  // measurementId not needed for core app logic
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export function subscribeToAuth(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  await signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  await signOut(auth);
}

export async function loadActivitiesForUser(
  userId: string
): Promise<Activity[]> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const data = snap.data() as { activities?: Activity[] };
  return Array.isArray(data.activities) ? data.activities : [];
}

export async function saveActivitiesForUser(
  userId: string,
  activities: Activity[]
) {
  const ref = doc(db, "users", userId);
  await setDoc(
    ref,
    {
      activities
    },
    { merge: true }
  );
}


