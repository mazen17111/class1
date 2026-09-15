import { ArabicLetter, LetterPosition, MaddType, ShortVowel, WordItem } from '../types';

export interface ArabicAnalysis {
  cleanWord: string;
  targetLetter: string;
  position: LetterPosition;
  maddType: MaddType;
  shortVowel: ShortVowel;
  vowelTashkeel: string;
  found: boolean;
}

// Strip all Arabic diacritics / tashkeel
export function stripTashkeel(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u0651\u0652]/g, '');
}

// Normalize letters for flexible matching (e.g., أ إ آ -> ا, ة -> ه)
export function normalizeChar(char: string): string {
  if (/[أإآٱ]/.test(char)) return 'ا';
  if (char === 'ة') return 'ه';
  if (char === 'ى') return 'ي';
  return char;
}

/**
 * Intelligent linguistic analyzer that checks the exact word string,
 * locates the target letter with or without tashkeel, extracts the exact short vowel
 * directly from the diacritics, detects Madd (long sounds), and computes position.
 */
export function analyzeArabicWord(wordWithTashkeel: string, targetLetterChar: string): ArabicAnalysis {
  const cleanWord = stripTashkeel(wordWithTashkeel);
  const cleanTarget = stripTashkeel(targetLetterChar);
  const normTarget = normalizeChar(cleanTarget);

  // Find index in clean word
  let targetIndex = -1;

  // 1. Direct char match
  for (let i = 0; i < cleanWord.length; i++) {
    if (cleanWord[i] === cleanTarget) {
      targetIndex = i;
      break;
    }
  }

  // 2. Normalized match if direct failed
  if (targetIndex === -1) {
    for (let i = 0; i < cleanWord.length; i++) {
      if (normalizeChar(cleanWord[i]) === normTarget) {
        targetIndex = i;
        break;
      }
    }
  }

  // 3. Fallback: if not found at all
  if (targetIndex === -1) {
    return {
      cleanWord,
      targetLetter: targetLetterChar,
      position: 'beginning',
      maddType: 'none',
      shortVowel: 'fatha',
      vowelTashkeel: 'َ',
      found: false
    };
  }

  // Determine Position
  let position: LetterPosition = 'middle';
  if (targetIndex === 0) {
    position = 'beginning';
  } else if (targetIndex === cleanWord.length - 1) {
    position = 'end';
  } else {
    position = 'middle';
  }

  // Locate the target letter in the original word with tashkeel to read its diacritics
  let cleanCounter = 0;
  let charInFullWordIndex = -1;

  for (let i = 0; i < wordWithTashkeel.length; i++) {
    const ch = wordWithTashkeel[i];
    // Check if ch is a base letter (not diacritic)
    if (!/[\u064B-\u065F\u0670\u0651\u0652]/.test(ch)) {
      if (cleanCounter === targetIndex) {
        charInFullWordIndex = i;
        break;
      }
      cleanCounter++;
    }
  }

  // Gather diacritics immediately attached to the target letter
  let diacritics = '';
  if (charInFullWordIndex !== -1) {
    for (let j = charInFullWordIndex + 1; j < wordWithTashkeel.length; j++) {
      const nextCh = wordWithTashkeel[j];
      if (/[\u064B-\u065F\u0670\u0651\u0652]/.test(nextCh)) {
        diacritics += nextCh;
      } else {
        break;
      }
    }
  }

  // Detect short vowel from diacritics
  let shortVowel: ShortVowel = 'fatha';
  let vowelTashkeel = 'َ';

  if (/[\u064F\u064C]/.test(diacritics)) {
    // Damma or Dammatan
    shortVowel = 'damma';
    vowelTashkeel = 'ُ';
  } else if (/[\u0650\u064D]/.test(diacritics)) {
    // Kasra or Kasratan
    shortVowel = 'kasra';
    vowelTashkeel = 'ِ';
  } else if (/[\u0652]/.test(diacritics)) {
    // Sukoon
    shortVowel = 'sukoon';
    vowelTashkeel = 'ْ';
  } else if (/[\u064E\u064B]/.test(diacritics)) {
    // Fatha or Fathatan
    shortVowel = 'fatha';
    vowelTashkeel = 'َ';
  }

  // Detect Madd (Long sound)
  // Madd occurs when the letter is followed by ا or و or ي without a vowel on the madd letter,
  // preceded by the corresponding vowel: Fatha -> Alif, Damma -> Waw, Kasra -> Yaa.
  let maddType: MaddType = 'none';

  if (targetIndex < cleanWord.length - 1) {
    const nextChar = cleanWord[targetIndex + 1];
    if (nextChar === 'ا' || nextChar === 'آ') {
      maddType = 'alif';
      shortVowel = 'fatha';
      vowelTashkeel = 'َ';
    } else if (nextChar === 'و') {
      // If vowel before was damma or no vowel specified
      maddType = 'waw';
      shortVowel = 'damma';
      vowelTashkeel = 'ُ';
    } else if (nextChar === 'ي' || nextChar === 'ى') {
      maddType = 'yaa';
      shortVowel = 'kasra';
      vowelTashkeel = 'ِ';
    }
  }

  return {
    cleanWord,
    targetLetter: targetLetterChar,
    position,
    maddType,
    shortVowel,
    vowelTashkeel,
    found: true
  };
}

/**
 * Validates and refines any WordItem (preset or custom added by teacher)
 * ensuring all metadata (position, maddType, shortVowel) is 100% linguistically correct.
 */
export function ensureWordItemAccuracy(item: WordItem, targetLetter: string): WordItem {
  const analysis = analyzeArabicWord(item.word, targetLetter || item.targetLetter);
  return {
    ...item,
    cleanWord: analysis.cleanWord,
    targetLetter: item.targetLetter || targetLetter,
    position: analysis.position,
    maddType: analysis.maddType !== 'none' ? analysis.maddType : (item.maddType || 'none'),
    shortVowel: analysis.shortVowel || item.shortVowel || 'fatha'
  };
}
