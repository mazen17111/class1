import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { BrandSettings, IssuedCertificate, Student, WordItem } from './types';

// Initialize Firebase App & Enterprise Named Firestore Database (direct access, no login required)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on startup
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (client is offline).');
      return false;
    }
    return true;
  }
}

export function sanitizeDocId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

function clampString(val: string | undefined, maxLen: number, fallback = ''): string {
  const s = (val ?? fallback).trim();
  return s.slice(0, maxLen);
}

// =========================================================================
// STUDENTS (Direct Firestore Collection — Permanent, NEVER Deleted)
// =========================================================================

export function subscribeStudents(
  onData: (students: Student[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'students';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: (Student & { _ts: number })[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const ts = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : 0;
        list.push({
          id: String(d.id || docSnap.id),
          name: String(d.name || ''),
          avatarColor: String(d.avatarColor || '#3B82F6'),
          _ts: ts,
        });
      });
      list.sort((a, b) => b._ts - a._ts);
      onData(list.map(({ _ts, ...rest }) => rest));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function saveStudentToFirestore(student: Student): Promise<void> {
  const id = sanitizeDocId(student.id);
  const path = `students/${id}`;
  const ref = doc(db, 'students', id);

  try {
    const name = clampString(student.name, 100, 'طالب');
    const avatarColor = clampString(student.avatarColor, 20, '#3B82F6');

    await runTransaction(db, async (tx) => {
      const existingSnap = await tx.get(ref);
      if (!existingSnap.exists()) {
        tx.set(ref, {
          id,
          name,
          avatarColor,
          createdAt: serverTimestamp(),
        });
      } else {
        tx.update(ref, {
          name,
          avatarColor,
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  const id = sanitizeDocId(studentId);
  const path = `students/${id}`;
  try {
    await deleteDoc(doc(db, 'students', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteStudentsBatchFromFirestore(studentIds: string[]): Promise<void> {
  for (const sid of studentIds) {
    await deleteStudentFromFirestore(sid);
  }
}

// =========================================================================
// ISSUED CERTIFICATES (Direct Firestore Collection — Permanent Archive)
// =========================================================================

export function subscribeCertificates(
  onData: (certs: IssuedCertificate[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'certificates';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: IssuedCertificate[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const createdAtMs =
          d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
        list.push({
          id: String(d.id || docSnap.id),
          studentId: String(d.studentId || ''),
          studentName: String(d.studentName || ''),
          studentAvatarColor: String(d.studentAvatarColor || '#F59E0B'),
          letterId: String(d.letterId || ''),
          letterChar: String(d.letterChar || ''),
          letterName: String(d.letterName || ''),
          score: Number(d.score ?? 0),
          total: Number(d.total ?? 1),
          percentage: Number(d.percentage ?? 0),
          themeId: String(d.themeId || 'gold'),
          issuedDateLabel: String(d.issuedDateLabel || ''),
          createdAtMs,
        });
      });
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function saveCertificateToFirestore(cert: IssuedCertificate): Promise<void> {
  const id = sanitizeDocId(cert.id);
  const path = `certificates/${id}`;
  const ref = doc(db, 'certificates', id);

  try {
    const themeId = clampString(cert.themeId, 40, 'gold');

    await runTransaction(db, async (tx) => {
      const existingSnap = await tx.get(ref);
      if (!existingSnap.exists()) {
        tx.set(ref, {
          id,
          studentId: clampString(cert.studentId, 128, 'student'),
          studentName: clampString(cert.studentName, 100, 'طالب'),
          studentAvatarColor: clampString(cert.studentAvatarColor, 20, '#F59E0B'),
          letterId: clampString(cert.letterId, 40, 'alif'),
          letterChar: clampString(cert.letterChar, 10, 'أ'),
          letterName: clampString(cert.letterName, 40, 'الألف'),
          score: Math.max(0, Math.min(100, Math.round(cert.score))),
          total: Math.max(1, Math.min(100, Math.round(cert.total))),
          percentage: Math.max(0, Math.min(100, Math.round(cert.percentage))),
          themeId,
          issuedDateLabel: clampString(cert.issuedDateLabel, 80, ''),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(ref, {
          themeId,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateCertificateThemeInFirestore(
  certId: string,
  themeId: string
): Promise<void> {
  const id = sanitizeDocId(certId);
  const path = `certificates/${id}`;
  const ref = doc(db, 'certificates', id);

  try {
    await updateDoc(ref, {
      themeId: clampString(themeId, 40, 'gold'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =========================================================================
// CUSTOM WORDS & IMAGES (Direct Firestore Collection)
// =========================================================================

export function subscribeCustomWords(
  onData: (words: WordItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'customWords';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: (WordItem & { _ts: number })[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const ts = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : 0;
        list.push({
          id: String(d.id || docSnap.id),
          word: String(d.word || ''),
          cleanWord: String(d.cleanWord || ''),
          targetLetter: String(d.targetLetter || 'أ'),
          position: d.position || 'beginning',
          maddType: d.maddType || 'none',
          shortVowel: d.shortVowel || undefined,
          image: String(d.image || ''),
          meaning: d.meaning ? String(d.meaning) : undefined,
          isCustom: true,
          _ts: ts,
        });
      });
      list.sort((a, b) => b._ts - a._ts);
      onData(list.map(({ _ts, ...rest }) => rest));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function saveCustomWordToFirestore(word: WordItem): Promise<void> {
  const id = sanitizeDocId(word.id);
  const path = `customWords/${id}`;
  const ref = doc(db, 'customWords', id);

  try {
    const payload: Record<string, unknown> = {
      id,
      word: clampString(word.word, 80, 'كلمة'),
      cleanWord: clampString(word.cleanWord, 80, 'كلمة'),
      targetLetter: clampString(word.targetLetter, 10, 'أ'),
      position: word.position,
      maddType: word.maddType,
      image: clampString(word.image, 500000, ''),
      isCustom: true,
      createdAt: serverTimestamp(),
    };
    if (word.shortVowel) payload.shortVowel = word.shortVowel;
    if (word.meaning && word.meaning.trim()) {
      payload.meaning = clampString(word.meaning, 120);
    }
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCustomWordFromFirestore(wordId: string): Promise<void> {
  const id = sanitizeDocId(wordId);
  const path = `customWords/${id}`;
  try {
    await deleteDoc(doc(db, 'customWords', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================================
// PLATFORM BRANDING SETTINGS (settings/branding)
// =========================================================================

export function subscribeBrandSettings(
  onData: (settings: BrandSettings) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'settings/branding';
  return onSnapshot(
    doc(db, 'settings', 'branding'),
    (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        onData({
          logoUrl: typeof d.logoUrl === 'string' ? d.logoUrl : '',
          badgeChar: typeof d.badgeChar === 'string' && d.badgeChar.trim() ? d.badgeChar : 'ض',
          badgeColor: typeof d.badgeColor === 'string' && d.badgeColor.trim() ? d.badgeColor : '#F97316',
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function saveBrandSettingsToFirestore(settings: BrandSettings): Promise<void> {
  const path = 'settings/branding';
  const ref = doc(db, 'settings', 'branding');
  const logoUrl = clampString(settings.logoUrl, 500000, '');
  const badgeChar = clampString(settings.badgeChar, 10, 'ض') || 'ض';
  const badgeColor = clampString(settings.badgeColor, 20, '#F97316') || '#F97316';

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        tx.set(ref, {
          id: 'branding',
          logoUrl,
          badgeChar,
          badgeColor,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(ref, {
          logoUrl,
          badgeChar,
          badgeColor,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// =========================================================================
// INITIAL AUTOMATIC CLOUD SYNC (Singleton prevents StrictMode race)
// =========================================================================

let initialSyncPromise: Promise<boolean> | null = null;

export function syncLocalDataToFirestore(
  localStudents: Student[],
  localCertificates: IssuedCertificate[],
  localCustomWords: WordItem[],
  hasLocalStudentsSaved = false
): Promise<boolean> {
  if (initialSyncPromise) return initialSyncPromise;

  initialSyncPromise = (async () => {
    try {
      const online = await testConnection();
      if (!online) return false;

      const [stuSnap, certSnap, wordSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'certificates')),
        getDocs(collection(db, 'customWords')),
      ]);

      const remoteStudentIds = new Set(stuSnap.docs.map((d) => d.id));
      const remoteStudentNames = new Set(
        stuSnap.docs.map((d) => String(d.data().name || '').trim())
      );
      const remoteCertIds = new Set(certSnap.docs.map((d) => d.id));
      const remoteWordIds = new Set(wordSnap.docs.map((d) => d.id));

      // Seed students only if Firestore is empty (first-time setup), or if user added custom ones locally before Firestore existed
      if (stuSnap.empty && (!hasLocalStudentsSaved || localStudents.length > 0)) {
        for (const st of localStudents) {
          const id = sanitizeDocId(st.id);
          const cleanName = st.name.trim();
          if (!cleanName) continue;
          if (!remoteStudentIds.has(id) && !remoteStudentNames.has(cleanName)) {
            await saveStudentToFirestore({ ...st, id });
          }
        }
      }

      for (const cert of localCertificates) {
        const id = sanitizeDocId(cert.id);
        if (!remoteCertIds.has(id)) {
          await saveCertificateToFirestore({ ...cert, id });
        }
      }

      for (const word of localCustomWords) {
        if (!word.isCustom) continue;
        const id = sanitizeDocId(word.id);
        if (!remoteWordIds.has(id)) {
          await saveCustomWordToFirestore({ ...word, id });
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing local data to Firestore:', error);
      return false;
    }
  })();

  return initialSyncPromise;
}
