import { SavedPresentation } from '../types';

// IndexedDB local storage for saved PowerPoint presentations and per-slide explainer ink annotations
const DB_NAME = 'WaelHamdyPresentationsDB';
const DB_VERSION = 1;
const DECKS_STORE = 'decks';
const ANNOTATIONS_STORE = 'annotations';

interface StoredAnnotationRecord {
  key: string;
  presentationId: string;
  slideIndex: number;
  imageData: string;
  updatedAtMs: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DECKS_STORE)) {
        db.createObjectStore(DECKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ANNOTATIONS_STORE)) {
        const store = db.createObjectStore(ANNOTATIONS_STORE, { keyPath: 'key' });
        store.createIndex('by_presentation', 'presentationId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open Presentations IndexedDB'));
  });
}

export async function saveLocalPresentation(deck: SavedPresentation): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DECKS_STORE, 'readwrite');
      tx.objectStore(DECKS_STORE).put(deck);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('Could not save presentation locally in IndexedDB:', e);
  }
}

export async function getAllLocalPresentations(): Promise<SavedPresentation[]> {
  try {
    const db = await openDb();
    const list = await new Promise<SavedPresentation[]>((resolve, reject) => {
      const tx = db.transaction(DECKS_STORE, 'readonly');
      const req = tx.objectStore(DECKS_STORE).getAll();
      req.onsuccess = () => resolve((req.result as SavedPresentation[]) || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  } catch {
    return [];
  }
}

export async function getLocalPresentationById(id: string): Promise<SavedPresentation | null> {
  try {
    const db = await openDb();
    const res = await new Promise<SavedPresentation | undefined>((resolve, reject) => {
      const tx = db.transaction(DECKS_STORE, 'readonly');
      const req = tx.objectStore(DECKS_STORE).get(id);
      req.onsuccess = () => resolve(req.result as SavedPresentation | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return res || null;
  } catch {
    return null;
  }
}

export async function deleteLocalPresentation(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DECKS_STORE, 'readwrite');
      tx.objectStore(DECKS_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    const keys = await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(ANNOTATIONS_STORE, 'readonly');
      const req = tx.objectStore(ANNOTATIONS_STORE).index('by_presentation').getAllKeys(id);
      req.onsuccess = () => resolve((req.result as string[]) || []);
      req.onerror = () => reject(req.error);
    });
    if (keys.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(ANNOTATIONS_STORE, 'readwrite');
        const store = tx.objectStore(ANNOTATIONS_STORE);
        for (const k of keys) store.delete(k);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    db.close();
  } catch {
    // ignore
  }
}

export async function saveLocalPresentationAnnotation(
  presentationId: string,
  slideIndex: number,
  imageData: string
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ANNOTATIONS_STORE, 'readwrite');
      const record: StoredAnnotationRecord = {
        key: `${presentationId}::${slideIndex}`,
        presentationId,
        slideIndex,
        imageData,
        updatedAtMs: Date.now(),
      };
      tx.objectStore(ANNOTATIONS_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('Could not save presentation slide annotation locally:', e);
  }
}

export async function getLocalPresentationAnnotations(
  presentationId: string
): Promise<Record<number, string>> {
  try {
    const db = await openDb();
    const records = await new Promise<StoredAnnotationRecord[]>((resolve, reject) => {
      const tx = db.transaction(ANNOTATIONS_STORE, 'readonly');
      const req = tx.objectStore(ANNOTATIONS_STORE).index('by_presentation').getAll(presentationId);
      req.onsuccess = () => resolve((req.result as StoredAnnotationRecord[]) || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    const map: Record<number, string> = {};
    for (const r of records) {
      if (r.imageData) {
        map[r.slideIndex] = r.imageData;
      }
    }
    return map;
  } catch {
    return {};
  }
}
