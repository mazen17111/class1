import { ArabicLetter, Question, QuestionType, WordItem } from '../types';
import { ARABIC_LETTERS } from '../data/arabicData';
import { analyzeArabicWord } from './arabicAnalyzer';

// Helper to remove harakat (tashkeel)
export function removeTashkeel(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u0651\u0652]/g, '');
}

// Helper to shuffle array
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateQuizQuestions(
  targetLetter: ArabicLetter,
  allWords: WordItem[],
  count: number,
  selectedTypes: QuestionType[]
): Question[] {
  // Filter words that contain targetLetter
  const letterWords = allWords.filter(
    w => w.targetLetter === targetLetter.char || removeTashkeel(w.word).includes(targetLetter.char)
  );

  const availableWords = letterWords.length > 0 ? letterWords : allWords;
  const questions: Question[] = [];

  const defaultTypes: QuestionType[] = ['drag_drop', 'choose_letter', 'choose_madd', 'letter_position'];
  const typesToUse: QuestionType[] = selectedTypes.length > 0 ? selectedTypes : defaultTypes;

  // Separate plain words (maddType === 'none') and words with long sounds/madd (maddType !== 'none')
  const plainWords = availableWords.filter(w => {
    const analysis = analyzeArabicWord(w.word, targetLetter.char);
    return analysis.maddType === 'none';
  });
  const maddWords = availableWords.filter(w => {
    const analysis = analyzeArabicWord(w.word, targetLetter.char);
    return analysis.maddType !== 'none';
  });

  for (let i = 0; i < count; i++) {
    const type = typesToUse[i % typesToUse.length];

    // For madd questions ('choose_madd'), prioritize words that showcase madd / long sound if available.
    // For other questions, prefer plain words (without madd) so the letter is displayed clean and plain.
    let word: WordItem;
    if (type === 'choose_madd') {
      if (maddWords.length > 0) {
        word = maddWords[i % maddWords.length];
      } else {
        word = availableWords[i % availableWords.length];
      }
    } else {
      if (plainWords.length > 0) {
        word = plainWords[i % plainWords.length];
      } else {
        word = availableWords[i % availableWords.length];
      }
    }

    const q = createSingleQuestion(type, word, targetLetter, allWords, `${i + 1}`);
    questions.push(q);
  }

  return questions;
}

function createSingleQuestion(
  type: QuestionType,
  word: WordItem,
  targetLetter: ArabicLetter,
  allWords: WordItem[],
  qid: string
): Question {
  const analysis = analyzeArabicWord(word.word, targetLetter.char);
  const clean = analysis.cleanWord;
  const letterChars = clean.split('');

  switch (type) {
    case 'drag_drop': {
      // Create empty slots for target letter occurrences or missing letters
      const slots = letterChars.map((char, index) => {
        const isTarget = char === targetLetter.char;
        return {
          index,
          char,
          isEmpty: isTarget
        };
      });

      // If no target letter matched directly, empty the first letter
      const hasEmpty = slots.some(s => s.isEmpty);
      if (!hasEmpty && slots.length > 0) {
        slots[0].isEmpty = true;
      }

      // Build draggable tiles for each empty slot independently
      const missingTiles = slots
        .filter(s => s.isEmpty)
        .map((s, idx) => ({
          id: `tile-${s.char}-${s.index}-${idx}`,
          char: s.char,
          originalIndex: s.index
        }));

      // Add 2 distractor tiles from other letters
      const otherLetters = ARABIC_LETTERS.filter(l => l.char !== targetLetter.char);
      const distractors = shuffle(otherLetters).slice(0, 2).map((l, idx) => ({
        id: `distractor-${l.char}-${idx}`,
        char: l.char,
        originalIndex: -1
      }));

      const draggableLetters = shuffle([...missingTiles, ...distractors]);

      return {
        id: `q-drag-${qid}`,
        type: 'drag_drop',
        prompt: `اسحب حرف (${targetLetter.char}) إلى مكانه الصحيح في الكلمة:`,
        targetWord: word,
        targetLetter,
        slots,
        draggableLetters,
        correctAnswer: missingTiles.map(t => t.char)
      };
    }

    case 'choose_letter': {
      // Multiple choice for missing letter
      const otherLetters = ARABIC_LETTERS.filter(l => l.char !== targetLetter.char);
      const distractors = shuffle(otherLetters).slice(0, 3).map(l => l.char);
      const options = shuffle([targetLetter.char, ...distractors]);

      return {
        id: `q-choose-${qid}`,
        type: 'choose_letter',
        prompt: `ما هو الحرف الناقص لتكتمل الكلمة المعروضة بالصورة؟`,
        targetWord: word,
        targetLetter,
        options,
        correctAnswer: targetLetter.char
      };
    }

    case 'choose_madd': {
      // Long vowels and Madd practice for the selected letter:
      // Uses accurate long sounds for the target letter: e.g. با / بو / بي or جا / جو / جي
      const longA = targetLetter.longSounds.alif;
      const longW = targetLetter.longSounds.waw;
      const longY = targetLetter.longSounds.yaa;
      const shortSound = `${targetLetter.char}َ`;

      const options = [
        `مَدّ بالألف (${longA})`,
        `مَدّ بالواو (${longW})`,
        `مَدّ بالياء (${longY})`,
        `صوت قصير بدون مد (${shortSound})`
      ];

      // Accurate linguistic deduction from word content
      const actualMadd = analysis.maddType !== 'none' ? analysis.maddType : (word.maddType || 'none');

      let correctAnswer = options[3]; // Default to short sound / no madd
      if (actualMadd === 'alif') correctAnswer = options[0];
      else if (actualMadd === 'waw') correctAnswer = options[1];
      else if (actualMadd === 'yaa') correctAnswer = options[2];

      return {
        id: `q-madd-${qid}`,
        type: 'choose_madd',
        prompt: `ما نوع الصوت الطويل أو المد لحرف (${targetLetter.char}) في كلمة "${word.word}"؟`,
        targetWord: word,
        targetLetter,
        options,
        correctAnswer
      };
    }

    case 'letter_position': {
      const options = [
        'أول الكلمة (في البداية)',
        'وسط الكلمة (في المنتصف)',
        'آخر الكلمة (في النهاية)'
      ];

      // Derived directly from the position of the character in cleanWord
      const actualPos = analysis.found ? analysis.position : (word.position || 'beginning');

      let correctAnswer = options[0];
      if (actualPos === 'beginning') correctAnswer = options[0];
      else if (actualPos === 'middle') correctAnswer = options[1];
      else if (actualPos === 'end') correctAnswer = options[2];

      return {
        id: `q-pos-${qid}`,
        type: 'letter_position',
        prompt: `أين يقع حرف (${targetLetter.char}) في كلمة "${word.word}"؟`,
        targetWord: word,
        targetLetter,
        options,
        correctAnswer
      };
    }

    case 'short_vowel': {
      const letter = targetLetter.char;
      const options = [
        `فَتْحَة (${letter}ـَ)`,
        `ضَمَّة (${letter}ـُ)`,
        `كَسْرَة (${letter}ـِ)`,
        `سُكُون (${letter}ـْ)`
      ];

      // Derived directly from diacritics attached to the target letter
      const actualVowel = analysis.shortVowel || word.shortVowel || 'fatha';

      let correctAnswer = options[0];
      if (actualVowel === 'fatha') correctAnswer = options[0];
      else if (actualVowel === 'damma') correctAnswer = options[1];
      else if (actualVowel === 'kasra') correctAnswer = options[2];
      else if (actualVowel === 'sukoon') correctAnswer = options[3];

      return {
        id: `q-vowel-${qid}`,
        type: 'short_vowel',
        prompt: `ما هي الحركة القصيرة لحرف (${letter}) في كلمة "${word.word}"؟`,
        targetWord: word,
        targetLetter,
        options,
        correctAnswer
      };
    }

    case 'build_word': {
      const slots = letterChars.map((char, index) => ({
        index,
        char,
        isEmpty: true
      }));

      const tiles = letterChars.map((char, index) => ({
        id: `tile-build-${char}-${index}`,
        char,
        originalIndex: index
      }));

      return {
        id: `q-build-${qid}`,
        type: 'build_word',
        prompt: `رتب حروف الكلمة المعروضة بالصورة لتكوينها بشكل صحيح:`,
        targetWord: word,
        targetLetter,
        slots,
        draggableLetters: shuffle(tiles),
        correctAnswer: clean
      };
    }

    case 'picture_match': {
      const distractors = shuffle(allWords.filter(w => w.id !== word.id)).slice(0, 2);
      const choices = shuffle([word, ...distractors]);

      return {
        id: `q-pic-${qid}`,
        type: 'picture_match',
        prompt: `أي صورة من الصور التالية تمثل كلمة: "${word.word}" وبها حرف (${targetLetter.char})؟`,
        targetWord: word,
        targetLetter,
        options: choices.map(c => c.id),
        correctAnswer: word.id
      };
    }
  }
}
