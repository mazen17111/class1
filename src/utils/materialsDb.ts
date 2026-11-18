// IndexedDB local storage for large uploaded PDFs, images, and per-page ink annotations

const DB_NAME = 'WaelHamdyStudyMaterialsDB';
const DB_VERSION = 1;
const FILES_STORE = 'files';
const ANNOTATIONS_STORE = 'annotations';

interface StoredFileRecord {
  id: string;
  buffer: ArrayBuffer;
  mimeType: string;
}

interface StoredAnnotationRecord {
  key: string;
  materialId: string;
  pageNumber: number;
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
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ANNOTATIONS_STORE)) {
        const store = db.createObjectStore(ANNOTATIONS_STORE, { keyPath: 'key' });
        store.createIndex('by_material', 'materialId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export async function saveLocalMaterialFile(
  id: string,
  buffer: ArrayBuffer,
  mimeType: string
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, 'readwrite');
      const store = tx.objectStore(FILES_STORE);
      const record: StoredFileRecord = { id, buffer, mimeType };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('Could not save material file locally in IndexedDB:', e);
  }
}

export async function getLocalMaterialFile(
  id: string
): Promise<{ buffer: ArrayBuffer; mimeType: string } | null> {
  try {
    const db = await openDb();
    const res = await new Promise<StoredFileRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, 'readonly');
      const req = tx.objectStore(FILES_STORE).get(id);
      req.onsuccess = () => resolve(req.result as StoredFileRecord | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!res) return null;
    return { buffer: res.buffer, mimeType: res.mimeType };
  } catch {
    return null;
  }
}

export async function deleteLocalMaterialFile(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, 'readwrite');
      tx.objectStore(FILES_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

export async function saveLocalAnnotation(
  materialId: string,
  pageNumber: number,
  imageData: string
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ANNOTATIONS_STORE, 'readwrite');
      const store = tx.objectStore(ANNOTATIONS_STORE);
      const record: StoredAnnotationRecord = {
        key: `${materialId}::${pageNumber}`,
        materialId,
        pageNumber,
        imageData,
        updatedAtMs: Date.now(),
      };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('Could not save annotation locally in IndexedDB:', e);
  }
}

export async function getLocalAnnotationsForMaterial(
  materialId: string
): Promise<Record<number, string>> {
  try {
    const db = await openDb();
    const records = await new Promise<StoredAnnotationRecord[]>((resolve, reject) => {
      const tx = db.transaction(ANNOTATIONS_STORE, 'readonly');
      const index = tx.objectStore(ANNOTATIONS_STORE).index('by_material');
      const req = index.getAll(materialId);
      req.onsuccess = () => resolve((req.result as StoredAnnotationRecord[]) || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    const map: Record<number, string> = {};
    for (const r of records) {
      if (r.imageData) {
        map[r.pageNumber] = r.imageData;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export async function deleteLocalAnnotationsForMaterial(materialId: string): Promise<void> {
  try {
    const db = await openDb();
    const keys = await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(ANNOTATIONS_STORE, 'readonly');
      const index = tx.objectStore(ANNOTATIONS_STORE).index('by_material');
      const req = index.getAllKeys(materialId);
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
