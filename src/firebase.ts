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
import {
  BrandSettings,
  DeckTheme,
  IssuedCertificate,
  PresentationSlide,
  SavedPresentation,
  SlideTransitionType,
  Student,
  StudyMaterial,
  WordItem,
} from './types';

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

export async function deleteCertificateFromFirestore(certId: string): Promise<void> {
  const id = sanitizeDocId(certId);
  const path = `certificates/${id}`;
  try {
    await deleteDoc(doc(db, 'certificates', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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

// =========================================================================
// STUDY MATERIALS & PER-PAGE ANNOTATIONS (Direct Firestore Collection)
// =========================================================================

export function subscribeStudyMaterials(
  onData: (materials: StudyMaterial[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'studyMaterials';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: StudyMaterial[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const createdAtMs =
          d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
        const updatedAtMs =
          d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : createdAtMs;
        list.push({
          id: String(d.id || docSnap.id),
          title: String(d.title || 'مادة دراسية'),
          sourceType: d.sourceType || 'pdf_file',
          fileUrl: String(d.fileUrl || ''),
          inlineImage: typeof d.inlineImage === 'string' ? d.inlineImage : undefined,
          pageCount: Math.max(1, Number(d.pageCount ?? 1)),
          lastPage: Math.max(1, Number(d.lastPage ?? 1)),
          createdAtMs,
          updatedAtMs,
        });
      });
      list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
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

export async function saveStudyMaterialToFirestore(material: StudyMaterial): Promise<void> {
  const id = sanitizeDocId(material.id);
  const path = `studyMaterials/${id}`;
  const ref = doc(db, 'studyMaterials', id);

  try {
    const title = clampString(material.title, 140, 'مادة دراسية');
    const fileUrl = clampString(material.fileUrl, 2000, '');
    const pageCount = Math.max(1, Math.min(2000, Math.round(material.pageCount || 1)));
    const lastPage = Math.max(1, Math.min(2000, Math.round(material.lastPage || 1)));
    const inlineImage =
      material.inlineImage && material.inlineImage.length <= 490000
        ? material.inlineImage
        : undefined;

    await runTransaction(db, async (tx) => {
      const existingSnap = await tx.get(ref);
      if (!existingSnap.exists()) {
        const payload: Record<string, unknown> = {
          id,
          title,
          sourceType: material.sourceType,
          fileUrl,
          pageCount,
          lastPage,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (inlineImage) {
          payload.inlineImage = inlineImage;
        }
        tx.set(ref, payload);
      } else {
        tx.update(ref, {
          title,
          pageCount,
          lastPage,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateStudyMaterialProgressInFirestore(
  materialId: string,
  patch: { lastPage?: number; pageCount?: number; title?: string }
): Promise<void> {
  const id = sanitizeDocId(materialId);
  const path = `studyMaterials/${id}`;
  const ref = doc(db, 'studyMaterials', id);

  try {
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (patch.lastPage !== undefined) {
      payload.lastPage = Math.max(1, Math.min(2000, Math.round(patch.lastPage)));
    }
    if (patch.pageCount !== undefined) {
      payload.pageCount = Math.max(1, Math.min(2000, Math.round(patch.pageCount)));
    }
    if (patch.title !== undefined) {
      payload.title = clampString(patch.title, 140, 'مادة دراسية');
    }
    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudyMaterialFromFirestore(materialId: string): Promise<void> {
  const id = sanitizeDocId(materialId);
  const path = `studyMaterials/${id}`;
  try {
    const annSnap = await getDocs(collection(db, 'studyMaterials', id, 'annotations'));
    for (const d of annSnap.docs) {
      await deleteDoc(doc(db, 'studyMaterials', id, 'annotations', d.id));
    }
    await deleteDoc(doc(db, 'studyMaterials', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchMaterialAnnotationsFromFirestore(
  materialId: string
): Promise<Record<number, string>> {
  const id = sanitizeDocId(materialId);
  const path = `studyMaterials/${id}/annotations`;
  try {
    const snap = await getDocs(collection(db, 'studyMaterials', id, 'annotations'));
    const map: Record<number, string> = {};
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const pageNum = Number(d.pageNumber ?? 0);
      const imageData = typeof d.imageData === 'string' ? d.imageData : '';
      if (pageNum >= 1 && imageData) {
        map[pageNum] = imageData;
      }
    });
    return map;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveMaterialAnnotationToFirestore(
  materialId: string,
  pageNumber: number,
  imageData: string
): Promise<void> {
  const id = sanitizeDocId(materialId);
  const cleanPage = Math.max(1, Math.min(2000, Math.round(pageNumber)));
  const pageKey = `p_${cleanPage}`;
  const path = `studyMaterials/${id}/annotations/${pageKey}`;
  const ref = doc(db, 'studyMaterials', id, 'annotations', pageKey);

  // Enforce 500KB limit from firestore.rules
  if (imageData.length > 490000) {
    return;
  }

  try {
    await runTransaction(db, async (tx) => {
      const existingSnap = await tx.get(ref);
      if (!existingSnap.exists()) {
        tx.set(ref, {
          id: pageKey,
          materialId: id,
          pageNumber: cleanPage,
          imageData,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(ref, {
          imageData,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// =========================================================================
// SAVED POWERPOINT PRESENTATIONS, SLIDES & EXPLAINER ANNOTATIONS
// =========================================================================

async function compressDataUrlForFirestore(dataUrl: string, maxDim = 720): Promise<string> {
  if (!dataUrl.startsWith('data:image/') || dataUrl.length < 140000) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width || maxDim;
      let h = img.height || maxDim;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.max(1, Math.round(w * ratio));
        h = Math.max(1, Math.round(h * ratio));
      }
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      let out = c.toDataURL('image/jpeg', 0.8);
      if (out.length > 220000) {
        out = c.toDataURL('image/jpeg', 0.62);
      }
      resolve(out);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function sanitizeThemeForFirestore(theme: DeckTheme): Record<string, string> {
  return {
    id: clampString(theme.id, 40, 'sand'),
    name: clampString(theme.name, 80, 'تصميم أنيق'),
    primaryHex: clampString(theme.primaryHex, 20, '#F97316'),
    secondaryHex: clampString(theme.secondaryHex, 20, '#EA580C'),
    accentHex: clampString(theme.accentHex, 20, '#0EA5E9'),
    bgHex: clampString(theme.bgHex, 20, '#FFFFFF'),
    surfaceHex: clampString(theme.surfaceHex, 20, '#F8FAFC'),
    borderHex: clampString(theme.borderHex, 20, '#E2E8F0'),
    textHex: clampString(theme.textHex, 20, '#0F172A'),
    mutedTextHex: clampString(theme.mutedTextHex, 20, '#64748B'),
    patternType: (['waves', 'geometric', 'diagonal', 'arches', 'ribbons', 'dots'].includes(
      theme.patternType
    )
      ? theme.patternType
      : 'waves') as DeckTheme['patternType'],
  };
}

async function sanitizeSlideForFirestore(slide: PresentationSlide): Promise<Record<string, unknown>> {
  const buildPayload = async (maxDim: number, forceTight = false) => {
    const safeItems = await Promise.all(
      (slide.items || []).slice(0, 50).map(async (it) => {
        const obj: Record<string, unknown> = {
          id: clampString(it.id, 128, `it_${Date.now()}`),
          label: clampString(it.label, 200, ''),
          value: clampString(it.value, 200, ''),
        };
        if (it.subtext !== undefined) obj.subtext = clampString(it.subtext, 300, '');
        if (it.image) {
          obj.image = forceTight
            ? await compressDataUrlForFirestore(it.image, maxDim)
            : await compressDataUrlForFirestore(it.image, 620);
        }
        return obj;
      })
    );

    const safeUploaded = slide.uploadedImages
      ? await Promise.all(
          slide.uploadedImages.slice(0, 30).map(async (im) => ({
            id: clampString(im.id, 128, `im_${Date.now()}`),
            dataUrl: await compressDataUrlForFirestore(im.dataUrl, forceTight ? maxDim : 680),
            caption: clampString(im.caption, 200, ''),
          }))
        )
      : undefined;

    const out: Record<string, unknown> = {
      id: clampString(slide.id, 128, `slide_${Date.now()}`),
      kind: slide.kind,
      layoutVariant: slide.layoutVariant,
      title: clampString(slide.title, 300, 'شريحة'),
      subtitle: clampString(slide.subtitle, 500, ''),
      items: safeItems,
      teacherNote: clampString(slide.teacherNote, 200, ''),
    };

    if (slide.badgeText !== undefined) out.badgeText = clampString(slide.badgeText, 120, '');
    if (slide.highlightLetter !== undefined)
      out.highlightLetter = clampString(slide.highlightLetter, 20, '');
    if (slide.bodyText !== undefined) out.bodyText = clampString(slide.bodyText, 4000, '');
    if (safeUploaded && safeUploaded.length > 0) out.uploadedImages = safeUploaded;
    if (slide.textAlign !== undefined) out.textAlign = slide.textAlign;
    if (slide.headerLetterSide !== undefined) out.headerLetterSide = slide.headerLetterSide;
    if (slide.columnsOverride !== undefined) out.columnsOverride = slide.columnsOverride;
    if (slide.fontScale !== undefined) out.fontScale = slide.fontScale;
    if (slide.swapPositions !== undefined) out.swapPositions = slide.swapPositions;
    if (slide.fullBleedImage !== undefined) out.fullBleedImage = Boolean(slide.fullBleedImage);

    return out;
  };

  let out = await buildPayload(620, false);
  if (JSON.stringify(out).length > 780000) {
    out = await buildPayload(360, true);
  }
  return out;
}

export function subscribePresentations(
  onData: (presentations: SavedPresentation[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'presentations';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: SavedPresentation[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const createdAtMs =
          d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
        const updatedAtMs =
          d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : createdAtMs;
        list.push({
          id: String(d.id || docSnap.id),
          title: String(d.title || 'عرض تقديمي'),
          letterId: String(d.letterId || 'alif'),
          letterChar: String(d.letterChar || 'أ'),
          letterName: String(d.letterName || 'الألف'),
          theme: (d.theme || {}) as DeckTheme,
          slides: [],
          slideCount: Math.max(1, Number(d.slideCount ?? 1)),
          transitionEnabled: Boolean(d.transitionEnabled),
          transitionType: (d.transitionType || 'none') as SlideTransitionType,
          isExternal: d.isExternal ? true : undefined,
          externalType: d.externalType || undefined,
          externalUrl: typeof d.externalUrl === 'string' ? d.externalUrl : undefined,
          createdAtMs,
          updatedAtMs,
        });
      });
      list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
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

export async function fetchPresentationSlidesFromFirestore(
  presentationId: string
): Promise<PresentationSlide[]> {
  const id = sanitizeDocId(presentationId);
  const path = `presentations/${id}/slides`;
  try {
    const snap = await getDocs(collection(db, 'presentations', id, 'slides'));
    const rows: { index: number; slide: PresentationSlide }[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.slideData) {
        rows.push({
          index: Number(d.slideIndex ?? 0),
          slide: d.slideData as PresentationSlide,
        });
      }
    });
    rows.sort((a, b) => a.index - b.index);
    return rows.map((r) => r.slide);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function savePresentationToFirestore(
  presentation: SavedPresentation
): Promise<void> {
  const id = sanitizeDocId(presentation.id);
  const path = `presentations/${id}`;
  const ref = doc(db, 'presentations', id);

  try {
    const title = clampString(presentation.title, 160, 'عرض تقديمي');
    const letterId = clampString(presentation.letterId, 40, 'alif');
    const letterChar = clampString(presentation.letterChar, 10, 'أ');
    const letterName = clampString(presentation.letterName, 40, 'الألف');
    const slideCount = Math.max(1, Math.min(100, presentation.slides.length));
    const transitionEnabled = Boolean(presentation.transitionEnabled);
    const validTypes: SlideTransitionType[] = [
      'none',
      'fade',
      'slide',
      'zoom',
      'flip',
      'curtain',
      'cube',
    ];
    const transitionType: SlideTransitionType =
      transitionEnabled && validTypes.includes(presentation.transitionType)
        ? presentation.transitionType
        : transitionEnabled
        ? 'slide'
        : 'none';
    const theme = sanitizeThemeForFirestore(presentation.theme);
    const validExtTypes = ['pptx_file', 'pdf_slides', 'embed_url'];
    const isExternal = Boolean(presentation.isExternal);
    const externalType =
      isExternal && presentation.externalType && validExtTypes.includes(presentation.externalType)
        ? presentation.externalType
        : undefined;
    const externalUrl =
      isExternal && presentation.externalUrl
        ? clampString(presentation.externalUrl, 2000, '')
        : undefined;

    await runTransaction(db, async (tx) => {
      const existingSnap = await tx.get(ref);
      const baseDoc: Record<string, unknown> = {
        id,
        title,
        letterId,
        letterChar,
        letterName,
        slideCount,
        transitionEnabled,
        transitionType,
        theme,
        updatedAt: serverTimestamp(),
      };
      if (isExternal) {
        baseDoc.isExternal = true;
        if (externalType) baseDoc.externalType = externalType;
        if (externalUrl) baseDoc.externalUrl = externalUrl;
      }

      if (!existingSnap.exists()) {
        baseDoc.createdAt = serverTimestamp();
        tx.set(ref, baseDoc);
      } else {
        const updatePayload: Record<string, unknown> = {
          title,
          letterId,
          letterChar,
          letterName,
          slideCount,
          transitionEnabled,
          transitionType,
          theme,
          updatedAt: serverTimestamp(),
        };
        if (isExternal) {
          updatePayload.isExternal = true;
          if (externalType) updatePayload.externalType = externalType;
          if (externalUrl) updatePayload.externalUrl = externalUrl;
        }
        tx.update(ref, updatePayload);
      }
    });

    // Save each slide in ordered subcollection docs s_0..s_{N-1}
    const existingSlidesSnap = await getDocs(collection(db, 'presentations', id, 'slides'));
    const keepKeys = new Set<string>();

    for (let i = 0; i < Math.min(100, presentation.slides.length); i++) {
      const slideKey = `s_${i}`;
      keepKeys.add(slideKey);
      const slideRef = doc(db, 'presentations', id, 'slides', slideKey);
      const safeSlideData = await sanitizeSlideForFirestore(presentation.slides[i]);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(slideRef);
        if (!snap.exists()) {
          tx.set(slideRef, {
            id: slideKey,
            presentationId: id,
            slideIndex: i,
            slideData: safeSlideData,
            updatedAt: serverTimestamp(),
          });
        } else {
          tx.update(slideRef, {
            slideIndex: i,
            slideData: safeSlideData,
            updatedAt: serverTimestamp(),
          });
        }
      });
    }

    // Remove stale trailing slides if presentation shrunk
    for (const d of existingSlidesSnap.docs) {
      if (!keepKeys.has(d.id)) {
        await deleteDoc(doc(db, 'presentations', id, 'slides', d.id));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePresentationFromFirestore(presentationId: string): Promise<void> {
  const id = sanitizeDocId(presentationId);
  const path = `presentations/${id}`;
  try {
    const [slidesSnap, annsSnap] = await Promise.all([
      getDocs(collection(db, 'presentations', id, 'slides')),
      getDocs(collection(db, 'presentations', id, 'annotations')),
    ]);
    for (const d of slidesSnap.docs) {
      await deleteDoc(doc(db, 'presentations', id, 'slides', d.id));
    }
    for (const d of annsSnap.docs) {
      await deleteDoc(doc(db, 'presentations', id, 'annotations', d.id));
    }
    await deleteDoc(doc(db, 'presentations', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchPresentationAnnotationsFromFirestore(
  presentationId: string
): Promise<Record<number, string>> {
  const id = sanitizeDocId(presentationId);
  const path = `presentations/${id}/annotations`;
  try {
    const snap = await getDocs(collection(db, 'presentations', id, 'annotations'));
    const map: Record<number, string> = {};
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const idx = Number(d.slideIndex ?? -1);
      const imageData = typeof d.imageData === 'string' ? d.imageData : '';
      if (idx >= 0 && imageData) {
        map[idx] = imageData;
      }
    });
    return map;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function savePresentationAnnotationToFirestore(
  presentationId: string,
  slideIndex: number,
  imageData: string
): Promise<void> {
  const id = sanitizeDocId(presentationId);
  const cleanIdx = Math.max(0, Math.min(100, Math.round(slideIndex)));
  const annKey = `a_${cleanIdx}`;
  const path = `presentations/${id}/annotations/${annKey}`;
  const ref = doc(db, 'presentations', id, 'annotations', annKey);

  if (imageData.length > 490000) return;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        tx.set(ref, {
          id: annKey,
          presentationId: id,
          slideIndex: cleanIdx,
          imageData,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(ref, {
          imageData,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

