import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let dbInstance = null;

/** Firestore is only initialized when VITE_FIREBASE_API_KEY is set (OSS-friendly default). */
export function getDb() {
  const key = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  if (!key) return null;
  if (!dbInstance) {
    const app = initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}

function requireDb() {
  const db = getDb();
  if (!db) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_API_KEY and related VITE_FIREBASE_* variables in .env (see .env.example).',
    );
  }
  return db;
}

const routesCol = () => collection(requireDb(), 'route_plans');

export const routePlanService = {
  async list(filters = {}) {
    let q = query(routesCol(), orderBy('createdAt', 'desc'));
    if (filters.status) {
      q = query(routesCol(), where('status', '==', filters.status), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async get(id) {
    const snap = await getDoc(doc(requireDb(), 'route_plans', id));
    if (!snap.exists()) throw new Error('Route plan not found');
    return { id: snap.id, ...snap.data() };
  },

  async create(payload) {
    const ref = await addDoc(routesCol(), {
      ...payload,
      status: payload.status || 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, ...payload };
  },

  async update(id, payload) {
    const ref = doc(requireDb(), 'route_plans', id);
    await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
    return { id, ...payload };
  },

  async remove(id) {
    await deleteDoc(doc(requireDb(), 'route_plans', id));
  },
};
