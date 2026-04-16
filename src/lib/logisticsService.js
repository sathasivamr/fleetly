import {
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
import { getDb } from '@/lib/firebase';

const LS_KEY = 'fleetly-logistics-demo-orders';

function restBase() {
  const u = import.meta.env.VITE_LOGISTICS_API_URL?.trim();
  return u ? u.replace(/\/$/, '') : '';
}

function localRead() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function localWrite(rows) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

const localAdapter = {
  async list(filters = {}) {
    let list = localRead();
    if (filters.status) list = list.filter((o) => o.status === filters.status);
    list.sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
    return list;
  },

  async get(id) {
    const o = localRead().find((x) => String(x.id) === String(id));
    if (!o) throw new Error('Order not found');
    return o;
  },

  async create(payload) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const row = {
      id,
      ...payload,
      status: payload.status || 'pending',
      createdAt: now,
      updatedAt: now,
    };
    const list = localRead();
    list.unshift(row);
    localWrite(list);
    return row;
  },

  async update(id, payload) {
    const list = localRead();
    const i = list.findIndex((x) => String(x.id) === String(id));
    if (i < 0) throw new Error('Order not found');
    const now = new Date().toISOString();
    list[i] = { ...list[i], ...payload, id: list[i].id, updatedAt: now };
    localWrite(list);
    return list[i];
  },

  async remove(id) {
    const list = localRead().filter((x) => String(x.id) !== String(id));
    localWrite(list);
  },
};

function firestoreAdapter() {
  const db = getDb();
  if (!db) return null;
  const ordersCol = () => collection(db, 'logistics_orders');
  return {
    async list(filters = {}) {
      let q = query(ordersCol(), orderBy('createdAt', 'desc'));
      if (filters.status) {
        q = query(ordersCol(), where('status', '==', filters.status), orderBy('createdAt', 'desc'));
      }
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    async get(id) {
      const snap = await getDoc(doc(db, 'logistics_orders', id));
      if (!snap.exists()) throw new Error('Order not found');
      return { id: snap.id, ...snap.data() };
    },

    async create(payload) {
      const ref = await addDoc(ordersCol(), {
        ...payload,
        status: payload.status || 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: ref.id, ...payload };
    },

    async update(id, payload) {
      const ref = doc(db, 'logistics_orders', id);
      await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
      return { id, ...payload };
    },

    async remove(id) {
      await deleteDoc(doc(db, 'logistics_orders', id));
    },
  };
}

async function restFetch(path, options = {}) {
  const base = restBase();
  const url = `${base}${path}`;
  const r = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (r.status === 204) return null;
  const text = await r.text();
  if (!r.ok) throw new Error(text || r.statusText || `HTTP ${r.status}`);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const restAdapter = {
  async list(filters = {}) {
    const qs = filters.status ? `?status=${encodeURIComponent(filters.status)}` : '';
    const data = await restFetch(`/orders${qs}`);
    if (Array.isArray(data)) return data;
    const arr = data?.orders ?? data?.data;
    return Array.isArray(arr) ? arr : [];
  },

  async get(id) {
    const data = await restFetch(`/orders/${encodeURIComponent(id)}`);
    if (!data || typeof data !== 'object') throw new Error('Order not found');
    return data;
  },

  async create(payload) {
    return restFetch('/orders', { method: 'POST', body: JSON.stringify(payload) });
  },

  async update(id, payload) {
    const data = await restFetch(`/orders/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data ?? { id, ...payload };
  },

  async remove(id) {
    await restFetch(`/orders/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

function pickAdapter() {
  if (restBase()) return restAdapter;
  const fs = firestoreAdapter();
  if (fs) return fs;
  return localAdapter;
}

/** @returns {'commercial_api' | 'firestore' | 'demo'} */
export function getLogisticsBackendMode() {
  if (restBase()) return 'commercial_api';
  if (getDb()) return 'firestore';
  return 'demo';
}

export const logisticsService = {
  async list(filters) {
    return pickAdapter().list(filters);
  },
  async get(id) {
    return pickAdapter().get(id);
  },
  async create(payload) {
    return pickAdapter().create(payload);
  },
  async update(id, payload) {
    return pickAdapter().update(id, payload);
  },
  async remove(id) {
    return pickAdapter().remove(id);
  },
};
