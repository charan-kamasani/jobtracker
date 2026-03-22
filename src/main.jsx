import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import App from './App';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDBd0a6E95BISdmeECmsIAyUdWLd3OJR4Y",
  authDomain: "hirezen-tracker.firebaseapp.com",
  projectId: "hirezen-tracker",
  storageBucket: "hirezen-tracker.firebasestorage.app",
  messagingSenderId: "467740456719",
  appId: "1:467740456719:web:4c3dadfb50f2708b4c307a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Storage adapter — maps window.storage API to Firestore
window.storage = {
  async get(key, shared) {
    try {
      const ref = doc(db, 'tracker', 'appdata');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return { key, value: snap.data().value, shared: true };
      }
      return null;
    } catch (err) {
      console.error('Storage get error:', err);
      // Fallback to localStorage
      const val = localStorage.getItem(key);
      return val ? { key, value: val, shared: false } : null;
    }
  },
  async set(key, value, shared) {
    try {
      const ref = doc(db, 'tracker', 'appdata');
      await setDoc(ref, { value, updatedAt: new Date().toISOString() });
      // Also save to localStorage as backup
      localStorage.setItem(key, value);
      return { key, value, shared: true };
    } catch (err) {
      console.error('Storage set error:', err);
      // Fallback to localStorage
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    }
  },
  async delete(key, shared) {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true, shared };
    } catch {
      return null;
    }
  },
  async list(prefix, shared) {
    return { keys: [], prefix, shared };
  }
};

// Backup helpers
window.createBackup = async (data) => {
  try {
    const backupId = `backup_${Date.now()}`;
    const ref = doc(db, 'backups', backupId);
    await setDoc(ref, {
      data,
      label: `Backup ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('Backup error:', err);
    return false;
  }
};

window.getBackups = async () => {
  try {
    const { getDocs, collection, query, orderBy, limit } = await import('firebase/firestore');
    const q = query(collection(db, 'backups'), orderBy('createdAt', 'desc'), limit(10));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Get backups error:', err);
    return [];
  }
};

window.restoreBackup = async (data) => {
  try {
    const ref = doc(db, 'tracker', 'appdata');
    await setDoc(ref, { value: data, updatedAt: new Date().toISOString() });
    localStorage.setItem('jt-v6', data);
    return true;
  } catch {
    return false;
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
