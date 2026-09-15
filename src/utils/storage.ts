import { Student, WordItem } from '../types';
import { DEFAULT_STUDENTS, INITIAL_WORDS } from '../data/arabicData';

const STUDENTS_KEY = 'arabic_app_students_v1';
const WORDS_KEY = 'arabic_app_words_v1';

export function loadStudents(): Student[] {
  try {
    const data = localStorage.getItem(STUDENTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
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

export function loadWords(): WordItem[] {
  try {
    const data = localStorage.getItem(WORDS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with built-in words to ensure no default words are missed
        const customOnly = parsed.filter((item: WordItem) => item.isCustom);
        return [...INITIAL_WORDS, ...customOnly];
      }
    }
  } catch (e) {
    console.error('Failed to load words from localStorage', e);
  }
  return INITIAL_WORDS;
}

export function saveCustomWord(newWord: WordItem): WordItem[] {
  const currentWords = loadWords();
  const updated = [newWord, ...currentWords];
  try {
    // Only store custom words in localStorage to save quota and preserve updates
    const customWords = updated.filter(w => w.isCustom);
    localStorage.setItem(WORDS_KEY, JSON.stringify(customWords));
  } catch (e) {
    console.error('Failed to save custom words to localStorage', e);
  }
  return updated;
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
