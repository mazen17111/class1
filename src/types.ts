export type LetterPosition = 'beginning' | 'middle' | 'end' | 'isolated';

export type MaddType = 'none' | 'alif' | 'waw' | 'yaa'; // مد بالألف، مد بالواو، مد بالياء

export type ShortVowel = 'fatha' | 'damma' | 'kasra' | 'sukoon';

export type QuestionType = 
  | 'drag_drop'           // سحب وإفلات الحروف في الكلمة
  | 'choose_letter'        // اختيار الحرف الناقص الصحيح
  | 'choose_madd'          // تمييز نوع المد (ألف، واو، ياء، بدون مد)
  | 'letter_position'      // تحديد موضع الحرف (أول، وسط، آخر الكلمة)
  | 'short_vowel'          // اختيار الصوت القصير (فتحة، ضمة، كسرة)
  | 'build_word'           // تركيب الكلمة وترتيب حروفها
  | 'picture_match';       // اختيار الصورة المناسبة للكلمة/الحرف

export interface ArabicLetter {
  id: string;
  char: string;
  name: string;
  transliteration?: string;
  forms: {
    isolated: string;
    beginning: string;
    middle: string;
    end: string;
  };
  shortSounds: {
    fatha: string;
    damma: string;
    kasra: string;
  };
  longSounds: {
    alif: string;
    waw: string;
    yaa: string;
  };
}

export interface WordItem {
  id: string;
  word: string;             // الكلمة مشكولة
  cleanWord: string;        // الكلمة بدون تشكيل للمطابقة
  targetLetter: string;     // الحرف المستهدف
  position: LetterPosition; // موضع الحرف
  maddType: MaddType;       // نوع المد إن وجد
  shortVowel?: ShortVowel;  // الحركة القصيرة
  image: string;            // رابط أو Base64 للصورة
  meaning?: string;         // المعنى التوضيحي
  isCustom?: boolean;       // مضاف من قِبل المعلم
}

export interface Student {
  id: string;
  name: string;
  avatarColor: string;
  score?: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  targetWord: WordItem;
  targetLetter: ArabicLetter;
  // Specific payload depending on question type
  options?: string[];
  correctAnswer: string | string[];
  slots?: {
    index: number;
    char: string;
    isEmpty: boolean;
  }[];
  draggableLetters?: {
    id: string;
    char: string;
    originalIndex: number;
  }[];
}

export interface QuizConfig {
  student: Student;
  letter: ArabicLetter;
  questionCount: number;
  selectedTypes: QuestionType[];
  includeMadd: boolean;
}

export type AppStage = 
  | 'students'            // قائمة الطلاب والقرعة
  | 'letter_select'       // اختيار الحرف
  | 'quiz_setup'          // إعداد النشاط وعدد الأسئلة
  | 'quiz_active'         // حل الأسئلة التفاعلية
  | 'quiz_result'         // النتيجة والاحتفال
  | 'presentation_studio';// استوديو إصدار وتعديل باوربوينت و PDF

export type DeckPatternType = 'waves' | 'geometric' | 'diagonal' | 'arches' | 'ribbons' | 'dots';

export interface DeckTheme {
  id: string;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  bgHex: string;
  surfaceHex: string;
  borderHex: string;
  textHex: string;
  mutedTextHex: string;
  patternType: DeckPatternType;
}

export type SlideLayoutVariant =
  | 'hero-split'
  | 'hero-centered'
  | 'hero-arch'
  | 'cards-4'
  | 'cards-3'
  | 'list-clean'
  | 'gallery-grid'
  | 'activity-sheet'
  | 'custom-photo';

export interface SlideCardItem {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  image?: string;
}

export interface UploadedTeacherImage {
  id: string;
  dataUrl: string;
  caption: string;
  name: string;
}

export interface PresentationSlide {
  id: string;
  kind: 'cover' | 'forms' | 'short_vowels' | 'long_vowels' | 'vocabulary' | 'uploaded_gallery' | 'activity' | 'closing' | 'custom';
  layoutVariant: SlideLayoutVariant;
  title: string;
  subtitle: string;
  badgeText?: string;
  highlightLetter?: string;
  bodyText?: string;
  items: SlideCardItem[];
  uploadedImages?: { id: string; dataUrl: string; caption: string }[];
  teacherNote: string;
  // Interactive placement & typography customizations inside the slide
  textAlign?: 'right' | 'center' | 'left';
  headerLetterSide?: 'left' | 'right' | 'hidden';
  columnsOverride?: 1 | 2 | 3 | 4;
  fontScale?: 'sm' | 'md' | 'lg';
  swapPositions?: boolean;
}
