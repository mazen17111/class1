import { BrandSettings, IssuedCertificate, Student, WordItem } from '../types';
import { DEFAULT_STUDENTS, INITIAL_WORDS } from '../data/arabicData';

const STUDENTS_KEY = 'arabic_app_students_v1';
const WORDS_KEY = 'arabic_app_words_v1';
const CERTIFICATES_KEY = 'arabic_app_certificates_v1';
const BRAND_LOGO_KEY = 'arabic_app_brand_logo_v1';
const BRAND_SETTINGS_KEY = 'arabic_app_brand_settings_v1';

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  logoUrl: '',
  badgeChar: 'ض',
  badgeColor: '#F97316',
};

export function loadBrandSettings(): BrandSettings {
  try {
    const raw = localStorage.getItem(BRAND_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        logoUrl: typeof parsed.logoUrl === 'string' ? parsed.logoUrl : '',
        badgeChar: typeof parsed.badgeChar === 'string' && parsed.badgeChar.trim() ? parsed.badgeChar : 'ض',
        badgeColor: typeof parsed.badgeColor === 'string' && parsed.badgeColor.trim() ? parsed.badgeColor : '#F97316',
      };
    }
    const legacyLogo = localStorage.getItem(BRAND_LOGO_KEY) || '';
    return { ...DEFAULT_BRAND_SETTINGS, logoUrl: legacyLogo };
  } catch (e) {
    console.error('Failed to load brand settings from localStorage', e);
    return DEFAULT_BRAND_SETTINGS;
  }
}

export function saveBrandSettingsLocal(settings: BrandSettings): void {
  try {
    localStorage.setItem(BRAND_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save brand settings to localStorage', e);
  }
}

export function hasSavedStudentsLocally(): boolean {
  try {
    return localStorage.getItem(STUDENTS_KEY) !== null;
  } catch {
    return false;
  }
}

export function loadStudents(): Student[] {
  try {
    const data = localStorage.getItem(STUDENTS_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load students from localStorage', e);
  }
  return DEFAULT_STUDENTS;
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students to localStorage', e);
  }
}

export function mergePermanentStudents(primary: Student[], secondary: Student[]): Student[] {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const merged: Student[] = [];

  for (const s of [...primary, ...secondary]) {
    const cleanName = s.name.trim();
    if (!cleanName) continue;
    if (seenIds.has(s.id) || seenNames.has(cleanName)) continue;
    seenIds.add(s.id);
    seenNames.add(cleanName);
    merged.push({ ...s, name: cleanName });
  }
  return merged;
}

export function loadWords(): WordItem[] {
  try {
    const data = localStorage.getItem(WORDS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customOnly = parsed.filter((item: WordItem) => item.isCustom);
        return [...customOnly, ...INITIAL_WORDS];
      }
    }
  } catch (e) {
    console.error('Failed to load words from localStorage', e);
  }
  return INITIAL_WORDS;
}

export function saveCustomWord(newWord: WordItem): WordItem[] {
  const currentWords = loadWords();
  const customTagged: WordItem = {
    ...newWord,
    isCustom: true,
  };
  const withoutNew = currentWords.filter(w => w.id !== newWord.id);
  const updated = [customTagged, ...withoutNew];
  try {
    const customWords = updated.filter(w => w.isCustom);
    localStorage.setItem(WORDS_KEY, JSON.stringify(customWords));
  } catch (e) {
    console.error('Failed to save custom words to localStorage', e);
  }
  return updated;
}

export function saveAllCustomWords(customWords: WordItem[]): WordItem[] {
  const customTagged = customWords.map(w => ({ ...w, isCustom: true }));
  try {
    localStorage.setItem(WORDS_KEY, JSON.stringify(customTagged));
  } catch (e) {
    console.error('Failed to save custom words list to localStorage', e);
  }
  return [...customTagged, ...INITIAL_WORDS];
}

export function deleteCustomWord(id: string): WordItem[] {
  const currentWords = loadWords();
  const updated = currentWords.filter(w => w.id !== id);
  try {
    const customWords = updated.filter(w => w.isCustom);
    localStorage.setItem(WORDS_KEY, JSON.stringify(customWords));
  } catch (e) {
    console.error('Failed to update words in localStorage', e);
  }
  return updated;
}

export function loadCertificates(): IssuedCertificate[] {
  try {
    const data = localStorage.getItem(CERTIFICATES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      }
    }
  } catch (e) {
    console.error('Failed to load certificates from localStorage', e);
  }
  return [];
}

export function saveCertificatesLocal(certs: IssuedCertificate[]): void {
  try {
    localStorage.setItem(CERTIFICATES_KEY, JSON.stringify(certs));
  } catch (e) {
    console.error('Failed to save certificates to localStorage', e);
  }
}

export function upsertCertificateLocal(cert: IssuedCertificate): IssuedCertificate[] {
  const current = loadCertificates();
  const withoutSame = current.filter(c => c.id !== cert.id);
  const updated = [cert, ...withoutSame].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  saveCertificatesLocal(updated);
  return updated;
}
