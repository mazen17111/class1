import { ArabicLetter, WordItem, Student } from '../types';

export const DEFAULT_STUDENTS: Student[] = [
  { id: '1', name: 'أحمد', avatarColor: '#3B82F6' },
  { id: '2', name: 'سارة', avatarColor: '#EC4899' },
  { id: '3', name: 'محمد', avatarColor: '#10B981' },
  { id: '4', name: 'فاطمة', avatarColor: '#8B5CF6' },
  { id: '5', name: 'عمر', avatarColor: '#F59E0B' },
  { id: '6', name: 'مريم', avatarColor: '#06B6D4' },
  { id: '7', name: 'خالد', avatarColor: '#EF4444' },
  { id: '8', name: 'نور', avatarColor: '#14B8A6' },
];

export const ARABIC_LETTERS: ArabicLetter[] = [
  {
    id: 'alif',
    char: 'أ',
    name: 'أَلِف',
    forms: { isolated: 'أ', beginning: 'أ', middle: 'ـأ', end: 'ـأ' },
    shortSounds: { fatha: 'أَ', damma: 'أُ', kasra: 'إِ' },
    longSounds: { alif: 'آ', waw: 'أُو', yaa: 'إِي' }
  },
  {
    id: 'baa',
    char: 'ب',
    name: 'بَاء',
    forms: { isolated: 'ب', beginning: 'بـ', middle: 'ـبـ', end: 'ـب' },
    shortSounds: { fatha: 'بَ', damma: 'بُ', kasra: 'بِ' },
    longSounds: { alif: 'بَا', waw: 'بُو', yaa: 'بِي' }
  },
  {
    id: 'taa',
    char: 'ت',
    name: 'تَاء',
    forms: { isolated: 'ت', beginning: 'تـ', middle: 'ـتـ', end: 'ـت' },
    shortSounds: { fatha: 'تَ', damma: 'تُ', kasra: 'تِ' },
    longSounds: { alif: 'تَا', waw: 'تُو', yaa: 'تِي' }
  },
  {
    id: 'thaa',
    char: 'ث',
    name: 'ثَاء',
    forms: { isolated: 'ث', beginning: 'ثـ', middle: 'ـثـ', end: 'ـث' },
    shortSounds: { fatha: 'ثَ', damma: 'ثُ', kasra: 'ثِ' },
    longSounds: { alif: 'ثَا', waw: 'ثُو', yaa: 'ثِي' }
  },
  {
    id: 'jeem',
    char: 'ج',
    name: 'جِيم',
    forms: { isolated: 'ج', beginning: 'جـ', middle: 'ـجـ', end: 'ـج' },
    shortSounds: { fatha: 'جَ', damma: 'جُ', kasra: 'جِ' },
    longSounds: { alif: 'جَا', waw: 'جُو', yaa: 'جِي' }
  },
  {
    id: 'haa',
    char: 'ح',
    name: 'حَاء',
    forms: { isolated: 'ح', beginning: 'حـ', middle: 'ـحـ', end: 'ـح' },
    shortSounds: { fatha: 'حَ', damma: 'حُ', kasra: 'حِ' },
    longSounds: { alif: 'حَا', waw: 'حُو', yaa: 'حِي' }
  },
  {
    id: 'khaa',
    char: 'خ',
    name: 'خَاء',
    forms: { isolated: 'خ', beginning: 'خـ', middle: 'ـخـ', end: 'ـخ' },
    shortSounds: { fatha: 'خَ', damma: 'خُ', kasra: 'خِ' },
    longSounds: { alif: 'خَا', waw: 'خُو', yaa: 'خِي' }
  },
  {
    id: 'daal',
    char: 'د',
    name: 'دَال',
    forms: { isolated: 'د', beginning: 'د', middle: 'ـد', end: 'ـد' },
    shortSounds: { fatha: 'دَ', damma: 'دُ', kasra: 'دِ' },
    longSounds: { alif: 'دَا', waw: 'دُو', yaa: 'دِي' }
  },
  {
    id: 'thaal',
    char: 'ذ',
    name: 'ذَال',
    forms: { isolated: 'ذ', beginning: 'ذ', middle: 'ـذ', end: 'ـذ' },
    shortSounds: { fatha: 'ذَ', damma: 'ذُ', kasra: 'ذِ' },
    longSounds: { alif: 'ذَا', waw: 'ذُو', yaa: 'ذِي' }
  },
  {
    id: 'raa',
    char: 'ر',
    name: 'رَاء',
    forms: { isolated: 'ر', beginning: 'ر', middle: 'ـر', end: 'ـر' },
    shortSounds: { fatha: 'رَ', damma: 'رُ', kasra: 'رِ' },
    longSounds: { alif: 'رَا', waw: 'رُو', yaa: 'رِي' }
  },
  {
    id: 'zaay',
    char: 'ز',
    name: 'زَاي',
    forms: { isolated: 'ز', beginning: 'ز', middle: 'ـز', end: 'ـز' },
    shortSounds: { fatha: 'زَ', damma: 'زُ', kasra: 'زِ' },
    longSounds: { alif: 'زَا', waw: 'زُو', yaa: 'زِي' }
  },
  {
    id: 'seen',
    char: 'س',
    name: 'سِين',
    forms: { isolated: 'س', beginning: 'سـ', middle: 'ـسـ', end: 'ـس' },
    shortSounds: { fatha: 'سَ', damma: 'سُ', kasra: 'سِ' },
    longSounds: { alif: 'سَا', waw: 'سُو', yaa: 'سِي' }
  },
  {
    id: 'sheen',
    char: 'ش',
    name: 'شِين',
    forms: { isolated: 'ش', beginning: 'شـ', middle: 'ـشـ', end: 'ـش' },
    shortSounds: { fatha: 'شَ', damma: 'شُ', kasra: 'شِ' },
    longSounds: { alif: 'شَا', waw: 'شُو', yaa: 'شِي' }
  },
  {
    id: 'saad',
    char: 'ص',
    name: 'صَاد',
    forms: { isolated: 'ص', beginning: 'صـ', middle: 'ـصـ', end: 'ـص' },
    shortSounds: { fatha: 'صَ', damma: 'صُ', kasra: 'صِ' },
    longSounds: { alif: 'صَا', waw: 'صُو', yaa: 'صِي' }
  },
  {
    id: 'daad',
    char: 'ض',
    name: 'ضَاد',
    forms: { isolated: 'ض', beginning: 'ضـ', middle: 'ـضـ', end: 'ـض' },
    shortSounds: { fatha: 'ضَ', damma: 'ضُ', kasra: 'ضِ' },
    longSounds: { alif: 'ضَا', waw: 'ضُو', yaa: 'ضِي' }
  },
  {
    id: 'taa2',
    char: 'ط',
    name: 'طَاء',
    forms: { isolated: 'ط', beginning: 'طـ', middle: 'ـطـ', end: 'ـط' },
    shortSounds: { fatha: 'طَ', damma: 'طُ', kasra: 'طِ' },
    longSounds: { alif: 'طَا', waw: 'طُو', yaa: 'طِي' }
  },
  {
    id: 'zaa',
    char: 'ظ',
    name: 'ظَاء',
    forms: { isolated: 'ظ', beginning: 'ظـ', middle: 'ـظـ', end: 'ـظ' },
    shortSounds: { fatha: 'ظَ', damma: 'ظُ', kasra: 'ظِ' },
    longSounds: { alif: 'ظَا', waw: 'ظُو', yaa: 'ظِي' }
  },
  {
    id: 'ayn',
    char: 'ع',
    name: 'عَيْن',
    forms: { isolated: 'ع', beginning: 'عـ', middle: 'ـعـ', end: 'ـع' },
    shortSounds: { fatha: 'عَ', damma: 'عُ', kasra: 'عِ' },
    longSounds: { alif: 'عَا', waw: 'عُو', yaa: 'عِي' }
  },
  {
    id: 'ghayn',
    char: 'غ',
    name: 'غَيْن',
    forms: { isolated: 'غ', beginning: 'غـ', middle: 'ـغـ', end: 'ـغ' },
    shortSounds: { fatha: 'غَ', damma: 'غُ', kasra: 'غِ' },
    longSounds: { alif: 'غَا', waw: 'غُو', yaa: 'غِي' }
  },
  {
    id: 'faa',
    char: 'ف',
    name: 'فَاء',
    forms: { isolated: 'ف', beginning: 'فـ', middle: 'ـفـ', end: 'ـف' },
    shortSounds: { fatha: 'فَ', damma: 'فُ', kasra: 'فِ' },
    longSounds: { alif: 'فَا', waw: 'فُو', yaa: 'فِي' }
  },
  {
    id: 'qaaf',
    char: 'ق',
    name: 'قَاف',
    forms: { isolated: 'ق', beginning: 'قـ', middle: 'ـقـ', end: 'ـق' },
    shortSounds: { fatha: 'قَ', damma: 'قُ', kasra: 'قِ' },
    longSounds: { alif: 'قَا', waw: 'قُو', yaa: 'قِي' }
  },
  {
    id: 'kaaf',
    char: 'ك',
    name: 'كَاف',
    forms: { isolated: 'ك', beginning: 'كـ', middle: 'ـكـ', end: 'ـك' },
    shortSounds: { fatha: 'كَ', damma: 'كُ', kasra: 'كِ' },
    longSounds: { alif: 'كَا', waw: 'كُو', yaa: 'كِي' }
  },
  {
    id: 'laam',
    char: 'ل',
    name: 'لاَم',
    forms: { isolated: 'ل', beginning: 'لـ', middle: 'ـلـ', end: 'ـل' },
    shortSounds: { fatha: 'لَ', damma: 'لُ', kasra: 'لِ' },
    longSounds: { alif: 'لاَ', waw: 'لُو', yaa: 'لِي' }
  },
  {
    id: 'meem',
    char: 'م',
    name: 'مِيم',
    forms: { isolated: 'م', beginning: 'مـ', middle: 'ـمـ', end: 'ـم' },
    shortSounds: { fatha: 'مَ', damma: 'مُ', kasra: 'مِ' },
    longSounds: { alif: 'مَا', waw: 'مُو', yaa: 'مِي' }
  },
  {
    id: 'noon',
    char: 'ن',
    name: 'نُون',
    forms: { isolated: 'ن', beginning: 'نـ', middle: 'ـنـ', end: 'ـن' },
    shortSounds: { fatha: 'نَ', damma: 'نُ', kasra: 'نِ' },
    longSounds: { alif: 'نَا', waw: 'نُو', yaa: 'نِي' }
  },
  {
    id: 'haa2',
    char: 'هـ',
    name: 'هَاء',
    forms: { isolated: 'هـ', beginning: 'هـ', middle: 'ـهـ', end: 'ـه' },
    shortSounds: { fatha: 'هَ', damma: 'هُ', kasra: 'هِ' },
    longSounds: { alif: 'هَا', waw: 'هُو', yaa: 'هِي' }
  },
  {
    id: 'waw',
    char: 'و',
    name: 'وَاو',
    forms: { isolated: 'و', beginning: 'و', middle: 'ـو', end: 'ـو' },
    shortSounds: { fatha: 'وَ', damma: 'وُ', kasra: 'وِ' },
    longSounds: { alif: 'وَا', waw: 'وُو', yaa: 'وِي' }
  },
  {
    id: 'yaa',
    char: 'ي',
    name: 'يَاء',
    forms: { isolated: 'ي', beginning: 'يـ', middle: 'ـيـ', end: 'ـي' },
    shortSounds: { fatha: 'يَ', damma: 'يُ', kasra: 'يِ' },
    longSounds: { alif: 'يَا', waw: 'يُو', yaa: 'يِي' }
  }
];

// Helper to build friendly, colorful illustrated SVG data URIs
export function createSvgIllustration(emoji: string, bgGradient: [string, string], title: string): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}" />
        <stop offset="100%" stop-color="${bgGradient[1]}" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.15"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" rx="24" fill="url(#grad)" />
    <!-- Decorative background circles -->
    <circle cx="60" cy="50" r="35" fill="white" opacity="0.18" />
    <circle cx="340" cy="240" r="60" fill="white" opacity="0.15" />
    <circle cx="330" cy="60" r="25" fill="white" opacity="0.2" />
    
    <!-- Central Stage -->
    <circle cx="200" cy="140" r="85" fill="white" filter="url(#shadow)" opacity="0.95" />
    <text x="200" y="165" font-size="80" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    
    <!-- Word Label banner -->
    <rect x="70" y="235" width="260" height="46" rx="16" fill="white" opacity="0.95" filter="url(#shadow)" />
    <text x="200" y="265" font-family="'Tajawal', sans-serif" font-size="24" font-weight="bold" fill="#1e293b" text-anchor="middle" direction="rtl">${title}</text>
  </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Built-in educational word bank for all letters, with positions and Madd variants
export const INITIAL_WORDS: WordItem[] = [
  // أ
  {
    id: 'w-alif-1',
    word: 'أَرْنَبٌ',
    cleanWord: 'أرنب',
    targetLetter: 'أ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🐰', ['#FDE68A', '#F59E0B'], 'أَرْنَب'),
    meaning: 'حيوان أليف سريع القفز'
  },
  {
    id: 'w-alif-2',
    word: 'فَأْرٌ',
    cleanWord: 'فأر',
    targetLetter: 'أ',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'sukoon',
    image: createSvgIllustration('🐭', ['#E2E8F0', '#94A3B8'], 'فَأْر'),
    meaning: 'حيوان صغير'
  },
  {
    id: 'w-alif-3',
    word: 'خَبَأَ',
    cleanWord: 'خبأ',
    targetLetter: 'أ',
    position: 'end',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('📦', ['#FEF08A', '#CA8A04'], 'خَبَأَ'),
    meaning: 'وضع الشيء في مكان سري'
  },

  // ب
  {
    id: 'w-baa-1',
    word: 'بَطَّةٌ',
    cleanWord: 'بطة',
    targetLetter: 'ب',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🦆', ['#BAE6FD', '#0284C7'], 'بَطَّة'),
    meaning: 'طائر يسبح في الماء'
  },
  {
    id: 'w-baa-2',
    word: 'بَابٌ',
    cleanWord: 'باب',
    targetLetter: 'ب',
    position: 'beginning',
    maddType: 'alif', // مد بالألف: بَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🚪', ['#FED7AA', '#EA580C'], 'بَاب'),
    meaning: 'مدخل الغرفة'
  },
  {
    id: 'w-baa-3',
    word: 'حَبْلٌ',
    cleanWord: 'حبل',
    targetLetter: 'ب',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'sukoon',
    image: createSvgIllustration('🪢', ['#FDE047', '#D97706'], 'حَبْل'),
    meaning: 'خيط سميك وقوي'
  },
  {
    id: 'w-baa-4',
    word: 'كَلْبٌ',
    cleanWord: 'كلب',
    targetLetter: 'ب',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🐶', ['#FFEDD5', '#FB923C'], 'كَلْب'),
    meaning: 'حيوان وفي ومخلص'
  },
  {
    id: 'w-baa-5',
    word: 'بُومَةٌ',
    cleanWord: 'بومة',
    targetLetter: 'ب',
    position: 'beginning',
    maddType: 'waw', // مد بالواو: بُو
    shortVowel: 'damma',
    image: createSvgIllustration('🦉', ['#E0E7FF', '#4F46E5'], 'بُومَة'),
    meaning: 'طائر ليلي حكيم'
  },
  {
    id: 'w-baa-6',
    word: 'طَبِيبٌ',
    cleanWord: 'طبيب',
    targetLetter: 'ب',
    position: 'middle',
    maddType: 'yaa', // مد بالياء: بِي
    shortVowel: 'kasra',
    image: createSvgIllustration('👨‍⚕️', ['#CCFBF1', '#0D9488'], 'طَبِيب'),
    meaning: 'يعالج المرضى'
  },
  {
    id: 'w-baa-7',
    word: 'بَيْتٌ',
    cleanWord: 'بيت',
    targetLetter: 'ب',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🏠', ['#FEF08A', '#EAB308'], 'بَيْت'),
    meaning: 'منزل نسكن فيه'
  },
  {
    id: 'w-baa-8',
    word: 'بُرْتُقَالٌ',
    cleanWord: 'برتقال',
    targetLetter: 'ب',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🍊', ['#FED7AA', '#F97316'], 'بُرْتُقَال'),
    meaning: 'فاكهة لذيذة غنية بالفيتامينات'
  },
  {
    id: 'w-baa-9',
    word: 'بِنْتٌ',
    cleanWord: 'بنت',
    targetLetter: 'ب',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('👧', ['#FBCFE8', '#DB2777'], 'بِنْت'),
    meaning: 'فتاة صغيرة مهذبة'
  },
  {
    id: 'w-baa-10',
    word: 'بَحْرٌ',
    cleanWord: 'بحر',
    targetLetter: 'ب',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🌊', ['#BAE6FD', '#0284C7'], 'بَحْر'),
    meaning: 'ماء واسع وأمواج جميلة'
  },
  {
    id: 'w-baa-11',
    word: 'كِتَابٌ',
    cleanWord: 'كتاب',
    targetLetter: 'ب',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('📖', ['#DDD6FE', '#7C3AED'], 'كِتَاب'),
    meaning: 'نقرأ فيه لنتعلم'
  },
  {
    id: 'w-baa-12',
    word: 'خُبْزٌ',
    cleanWord: 'خبز',
    targetLetter: 'ب',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'sukoon',
    image: createSvgIllustration('🍞', ['#FEF3C7', '#D97706'], 'خُبْز'),
    meaning: 'غذاء يومي لذيذ'
  },
  {
    id: 'w-baa-13',
    word: 'عِنَبٌ',
    cleanWord: 'عنب',
    targetLetter: 'ب',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🍇', ['#E9D5FF', '#9333EA'], 'عِنَب'),
    meaning: 'فاكهة صيفية حلوة'
  },
  {
    id: 'w-baa-14',
    word: 'قَلْبٌ',
    cleanWord: 'قلب',
    targetLetter: 'ب',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('❤️', ['#FECDD3', '#E11D48'], 'قَلْب'),
    meaning: 'ينبض بالحياة والمحبة'
  },
  {
    id: 'w-baa-15',
    word: 'لَبَنٌ',
    cleanWord: 'لبن',
    targetLetter: 'ب',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🥛', ['#F1F5F9', '#64748B'], 'لَبَن'),
    meaning: 'مشروب صحي ومفيد'
  },
  {
    id: 'w-baa-16',
    word: 'صَابُونٌ',
    cleanWord: 'صابون',
    targetLetter: 'ب',
    position: 'middle',
    maddType: 'waw', // صَابُو... مد بالواو بعد الباء المضمومة
    shortVowel: 'damma',
    image: createSvgIllustration('🧼', ['#CFFAFE', '#0891B2'], 'صَابُون'),
    meaning: 'نغسل به أيدينا لنحافظ على النظافة'
  },
  {
    id: 'w-baa-17',
    word: 'حَقِيبَةٌ',
    cleanWord: 'حقيبة',
    targetLetter: 'ب',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🎒', ['#FDE68A', '#D97706'], 'حَقِيبَة'),
    meaning: 'نضع فيها كتبنا وأدواتنا'
  },
  {
    id: 'w-baa-18',
    word: 'قُبَّعَةٌ',
    cleanWord: 'قبعة',
    targetLetter: 'ب',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🧢', ['#BFDBFE', '#2563EB'], 'قُبَّعَة'),
    meaning: 'نرتديها على الرأس للحماية من الشمس'
  },
  {
    id: 'w-baa-19',
    word: 'بَقَرَةٌ',
    cleanWord: 'بقرة',
    targetLetter: 'ب',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🐮', ['#F5F5F4', '#57534E'], 'بَقَرَة'),
    meaning: 'حيوان أليف يعطينا الحليب'
  },

  // ت
  {
    id: 'w-taa-1',
    word: 'تُفَّاحَةٌ',
    cleanWord: 'تفاحة',
    targetLetter: 'ت',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🍎', ['#FECDD3', '#E11D48'], 'تُفَّاحَة'),
    meaning: 'فاكهة لذيذة ومفيدة'
  },
  {
    id: 'w-taa-2',
    word: 'تَاجٌ',
    cleanWord: 'تاج',
    targetLetter: 'ت',
    position: 'beginning',
    maddType: 'alif', // مد بالألف: تَا
    shortVowel: 'fatha',
    image: createSvgIllustration('👑', ['#FEF08A', '#EAB308'], 'تَاج'),
    meaning: 'يلبسه الملك على رأسه'
  },
  {
    id: 'w-taa-3',
    word: 'تُوتٌ',
    cleanWord: 'توت',
    targetLetter: 'ت',
    position: 'beginning',
    maddType: 'waw', // مد بالواو: تُو
    shortVowel: 'damma',
    image: createSvgIllustration('🫐', ['#DDD6FE', '#7C3AED'], 'تُوت'),
    meaning: 'ثمرة التوت الجميلة'
  },
  {
    id: 'w-taa-4',
    word: 'تِينٌ',
    cleanWord: 'تين',
    targetLetter: 'ت',
    position: 'beginning',
    maddType: 'yaa', // مد بالياء: تِي
    shortVowel: 'kasra',
    image: createSvgIllustration('🪴', ['#BBF7D0', '#16A34A'], 'تِين'),
    meaning: 'فاكهة مباركة ومغذية'
  },
  {
    id: 'w-taa-5',
    word: 'كِتَابٌ',
    cleanWord: 'كتاب',
    targetLetter: 'ت',
    position: 'middle',
    maddType: 'alif',
    shortVowel: 'fatha',
    image: createSvgIllustration('📖', ['#BFDBFE', '#2563EB'], 'كِتَاب'),
    meaning: 'نقرأ فيه ونتعلم'
  },
  {
    id: 'w-taa-6',
    word: 'بَيْتٌ',
    cleanWord: 'بيت',
    targetLetter: 'ت',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🏠', ['#FED7AA', '#F97316'], 'بَيْت'),
    meaning: 'المسكن الدافئ'
  },

  // ث
  {
    id: 'w-thaa-1',
    word: 'ثَعْلَبٌ',
    cleanWord: 'ثعلب',
    targetLetter: 'ث',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🦊', ['#FFEDD5', '#EA580C'], 'ثَعْلَب'),
    meaning: 'حيوان ماكر وذكي'
  },
  {
    id: 'w-thaa-2',
    word: 'ثَوْبٌ',
    cleanWord: 'ثوب',
    targetLetter: 'ث',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('👗', ['#FBCFE8', '#DB2777'], 'ثَوْب'),
    meaning: 'لباس جميل'
  },
  {
    id: 'w-thaa-3',
    word: 'مُثَلَّثٌ',
    cleanWord: 'مثلث',
    targetLetter: 'ث',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🔺', ['#FEF08A', '#CA8A04'], 'مُثَلَّث'),
    meaning: 'شكل هندسي ذو 3 أضلاع'
  },
  {
    id: 'w-thaa-4',
    word: 'ثُومٌ',
    cleanWord: 'ثوم',
    targetLetter: 'ث',
    position: 'beginning',
    maddType: 'waw', // مد بالواو: ثُو
    shortVowel: 'damma',
    image: createSvgIllustration('🧄', ['#E2E8F0', '#64748B'], 'ثُوم'),
    meaning: 'نبات مفيد في الطعام'
  },

  // ج
  {
    id: 'w-jeem-1',
    word: 'جَمَلٌ',
    cleanWord: 'جمل',
    targetLetter: 'ج',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🐪', ['#FEF3C7', '#D97706'], 'جَمَل'),
    meaning: 'سفينة الصحراء'
  },
  {
    id: 'w-jeem-2',
    word: 'جِسْرٌ',
    cleanWord: 'جسر',
    targetLetter: 'ج',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('🌉', ['#E0E7FF', '#4338CA'], 'جِسْر'),
    meaning: 'نمر فوقه عبر النهر'
  },
  {
    id: 'w-jeem-3',
    word: 'نَجْمَةٌ',
    cleanWord: 'نجمة',
    targetLetter: 'ج',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'sukoon',
    image: createSvgIllustration('⭐', ['#FEF08A', '#EAB308'], 'نَجْمَة'),
    meaning: 'تضيء في السماء ليلاً'
  },
  {
    id: 'w-jeem-4',
    word: 'تَاجٌ',
    cleanWord: 'تاج',
    targetLetter: 'ج',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('👑', ['#FDE68A', '#CA8A04'], 'تَاج'),
    meaning: 'زينة الملك'
  },

  // ح
  {
    id: 'w-haa-1',
    word: 'حِصَانٌ',
    cleanWord: 'حصان',
    targetLetter: 'ح',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('🐎', ['#FED7AA', '#C2410C'], 'حِصَان'),
    meaning: 'حيوان رشيق وسريع'
  },
  {
    id: 'w-haa-2',
    word: 'حُوتٌ',
    cleanWord: 'حوت',
    targetLetter: 'ح',
    position: 'beginning',
    maddType: 'waw', // مد بالواو: حُو
    shortVowel: 'damma',
    image: createSvgIllustration('🐋', ['#BAE6FD', '#0284C7'], 'حُوت'),
    meaning: 'أضخم مخلوقات البحر'
  },
  {
    id: 'w-haa-3',
    word: 'حَلِيبٌ',
    cleanWord: 'حليب',
    targetLetter: 'ح',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🥛', ['#F1F5F9', '#94A3B8'], 'حَلِيب'),
    meaning: 'شراب صحي يقوي العظام'
  },
  {
    id: 'w-haa-4',
    word: 'سَحَابٌ',
    cleanWord: 'سحاب',
    targetLetter: 'ح',
    position: 'middle',
    maddType: 'alif', // مد بالألف: حَا
    shortVowel: 'fatha',
    image: createSvgIllustration('☁️', ['#E2E8F0', '#64748B'], 'سَحَاب'),
    meaning: 'غيوم تمطر في السماء'
  },
  {
    id: 'w-haa-5',
    word: 'تُفَّاحٌ',
    cleanWord: 'تفاح',
    targetLetter: 'ح',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🍏', ['#BBF7D0', '#22C55E'], 'تُفَّاح'),
    meaning: 'تفاح أخضر منعش'
  },

  // خ
  {
    id: 'w-khaa-1',
    word: 'خَرُوفٌ',
    cleanWord: 'خروف',
    targetLetter: 'خ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🐑', ['#F3E8FF', '#9333EA'], 'خَرُوف'),
    meaning: 'حيوان ذو صوف ناعم'
  },
  {
    id: 'w-khaa-2',
    word: 'خَاتَمٌ',
    cleanWord: 'خاتم',
    targetLetter: 'خ',
    position: 'beginning',
    maddType: 'alif', // خَا
    shortVowel: 'fatha',
    image: createSvgIllustration('💍', ['#FEF08A', '#EAB308'], 'خَاتَم'),
    meaning: 'حلي يوضع في الإصبع'
  },
  {
    id: 'w-khaa-3',
    word: 'نَخْلَةٌ',
    cleanWord: 'نخلة',
    targetLetter: 'خ',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'sukoon',
    image: createSvgIllustration('🌴', ['#DCFCE7', '#15803D'], 'نَخْلَة'),
    meaning: 'شجرة التمر الشامخة'
  },
  {
    id: 'w-khaa-4',
    word: 'بِطِّيخٌ',
    cleanWord: 'بطيخ',
    targetLetter: 'خ',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🍉', ['#FEE2E2', '#EF4444'], 'بِطِّيخ'),
    meaning: 'فاكهة الصيف اللذيذة'
  },

  // د
  {
    id: 'w-daal-1',
    word: 'دِيكٌ',
    cleanWord: 'ديك',
    targetLetter: 'د',
    position: 'beginning',
    maddType: 'yaa', // دِي
    shortVowel: 'kasra',
    image: createSvgIllustration('🐓', ['#FED7AA', '#EA580C'], 'دِيك'),
    meaning: 'يصيح في الصباح الباكر'
  },
  {
    id: 'w-daal-2',
    word: 'دُبٌّ',
    cleanWord: 'دب',
    targetLetter: 'د',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🐻', ['#FEF3C7', '#B45309'], 'دُبّ'),
    meaning: 'حيوان قوي ذو فرو'
  },
  {
    id: 'w-daal-3',
    word: 'دَارٌ',
    cleanWord: 'دار',
    targetLetter: 'د',
    position: 'beginning',
    maddType: 'alif', // دَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🏡', ['#E0E7FF', '#4F46E5'], 'دَار'),
    meaning: 'المنزل'
  },
  {
    id: 'w-daal-4',
    word: 'وَرْدَةٌ',
    cleanWord: 'وردة',
    targetLetter: 'د',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🌹', ['#FCE7F3', '#DB2777'], 'وَرْدَة'),
    meaning: 'زهرة ذات رائحة عطرة'
  },
  {
    id: 'w-daal-5',
    word: 'أَسَدٌ',
    cleanWord: 'أسد',
    targetLetter: 'د',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🦁', ['#FEF08A', '#CA8A04'], 'أَسَد'),
    meaning: 'ملك الغابة'
  },

  // ذ
  {
    id: 'w-thaal-1',
    word: 'ذُرَةٌ',
    cleanWord: 'ذرة',
    targetLetter: 'ذ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🌽', ['#FEF08A', '#EAB308'], 'ذُرَة'),
    meaning: 'نبات أصفر لذيذ ومشوي'
  },
  {
    id: 'w-thaal-2',
    word: 'ذِئْبٌ',
    cleanWord: 'ذئب',
    targetLetter: 'ذ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('🐺', ['#E2E8F0', '#475569'], 'ذِئْب'),
    meaning: 'حيوان بري سريع'
  },
  {
    id: 'w-thaal-3',
    word: 'ذَيْلٌ',
    cleanWord: 'ذيل',
    targetLetter: 'ذ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🐈', ['#FDE68A', '#D97706'], 'ذَيْل'),
    meaning: 'ذيل القطة'
  },
  {
    id: 'w-thaal-4',
    word: 'حِذَاءٌ',
    cleanWord: 'حذاء',
    targetLetter: 'ذ',
    position: 'middle',
    maddType: 'alif', // ذَا
    shortVowel: 'fatha',
    image: createSvgIllustration('👟', ['#BAE6FD', '#0284C7'], 'حِذَاء'),
    meaning: 'نلبسه في القدم'
  },

  // ر
  {
    id: 'w-raa-1',
    word: 'رِيشَةٌ',
    cleanWord: 'ريشة',
    targetLetter: 'ر',
    position: 'beginning',
    maddType: 'yaa', // رِي
    shortVowel: 'kasra',
    image: createSvgIllustration('🪶', ['#DDD6FE', '#7C3AED'], 'رِيشَة'),
    meaning: 'غطاء الطيور الخفيف'
  },
  {
    id: 'w-raa-2',
    word: 'رُمَّانٌ',
    cleanWord: 'رمان',
    targetLetter: 'ر',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🫐', ['#FECDD3', '#E11D48'], 'رُمَّان'),
    meaning: 'فاكهة حمراء حبوبها لؤلؤية'
  },
  {
    id: 'w-raa-3',
    word: 'زَرَافَةٌ',
    cleanWord: 'زرافة',
    targetLetter: 'ر',
    position: 'middle',
    maddType: 'alif', // رَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🦒', ['#FEF08A', '#D97706'], 'زَرَافَة'),
    meaning: 'أطول الحيوانات رقبة'
  },
  {
    id: 'w-raa-4',
    word: 'قَمَرٌ',
    cleanWord: 'قمر',
    targetLetter: 'ر',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🌙', ['#E0E7FF', '#4338CA'], 'قَمَر'),
    meaning: 'ينير سماء الليل'
  },

  // ز
  {
    id: 'w-zaay-1',
    word: 'زَهْرَةٌ',
    cleanWord: 'زهرة',
    targetLetter: 'ز',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🌸', ['#FCE7F3', '#EC4899'], 'زَهْرَة'),
    meaning: 'وردة جميلة ملونة'
  },
  {
    id: 'w-zaay-2',
    word: 'زَيْتُونٌ',
    cleanWord: 'زيتون',
    targetLetter: 'ز',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🫒', ['#DCFCE7', '#16A34A'], 'زَيْتُون'),
    meaning: 'شجرة مباركة وثمر مفيد'
  },
  {
    id: 'w-zaay-3',
    word: 'غَزَالٌ',
    cleanWord: 'غزال',
    targetLetter: 'ز',
    position: 'middle',
    maddType: 'alif', // زَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🦌', ['#FED7AA', '#C2410C'], 'غَزَال'),
    meaning: 'حيوان رشيق وجميل'
  },
  {
    id: 'w-zaay-4',
    word: 'مَوْزٌ',
    cleanWord: 'موز',
    targetLetter: 'ز',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🍌', ['#FEF08A', '#EAB308'], 'مَوْز'),
    meaning: 'فاكهة صفراء غنية بالطاقة'
  },

  // س
  {
    id: 'w-seen-1',
    word: 'سَمَكَةٌ',
    cleanWord: 'سمكة',
    targetLetter: 'س',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🐟', ['#BAE6FD', '#0284C7'], 'سَمَكَة'),
    meaning: 'كائن يعيش ويسبح في الماء'
  },
  {
    id: 'w-seen-2',
    word: 'سَاعَةٌ',
    cleanWord: 'ساعة',
    targetLetter: 'س',
    position: 'beginning',
    maddType: 'alif', // سَا
    shortVowel: 'fatha',
    image: createSvgIllustration('⏰', ['#FEF3C7', '#D97706'], 'سَاعَة'),
    meaning: 'تخبرنا بالوقت المنظم'
  },
  {
    id: 'w-seen-3',
    word: 'سُورٌ',
    cleanWord: 'سور',
    targetLetter: 'س',
    position: 'beginning',
    maddType: 'waw', // سُو
    shortVowel: 'damma',
    image: createSvgIllustration('🧱', ['#FED7AA', '#EA580C'], 'سُور'),
    meaning: 'جدار يحمي المكان'
  },
  {
    id: 'w-seen-4',
    word: 'مَسْجِدٌ',
    cleanWord: 'مسجد',
    targetLetter: 'س',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'sukoon',
    image: createSvgIllustration('🕌', ['#CCFBF1', '#0F766E'], 'مَسْجِد'),
    meaning: 'بيت الله نصلي فيه'
  },
  {
    id: 'w-seen-5',
    word: 'شَمْسٌ',
    cleanWord: 'شمس',
    targetLetter: 'س',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('☀️', ['#FEF08A', '#EAB308'], 'شَمْس'),
    meaning: 'تنير وتدفئ كوكبنا'
  },

  // ش
  {
    id: 'w-sheen-1',
    word: 'شَمْسٌ',
    cleanWord: 'شمس',
    targetLetter: 'ش',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('☀️', ['#FEF08A', '#F59E0B'], 'شَمْس'),
    meaning: 'النجم المضيء'
  },
  {
    id: 'w-sheen-2',
    word: 'شَارِعٌ',
    cleanWord: 'شارع',
    targetLetter: 'ش',
    position: 'beginning',
    maddType: 'alif', // شَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🛣️', ['#E2E8F0', '#475569'], 'شَارِع'),
    meaning: 'طريق السيارات والمشاة'
  },
  {
    id: 'w-sheen-3',
    word: 'شَجَرَةٌ',
    cleanWord: 'شجرة',
    targetLetter: 'ش',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🌳', ['#DCFCE7', '#15803D'], 'شَجَرَة'),
    meaning: 'نبات وارف الظلال'
  },
  {
    id: 'w-sheen-4',
    word: 'مِشْمِشٌ',
    cleanWord: 'مشمش',
    targetLetter: 'ش',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'sukoon',
    image: createSvgIllustration('🍑', ['#FED7AA', '#EA580C'], 'مِشْمِش'),
    meaning: 'فاكهة برتقالية حلوة'
  },
  {
    id: 'w-sheen-5',
    word: 'عُشٌّ',
    cleanWord: 'عش',
    targetLetter: 'ش',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🪺', ['#FEF3C7', '#B45309'], 'عُشّ'),
    meaning: 'بيت العصفور الصغير'
  },

  // ص
  {
    id: 'w-saad-1',
    word: 'صَقْرٌ',
    cleanWord: 'صقر',
    targetLetter: 'ص',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🦅', ['#FED7AA', '#B45309'], 'صَقْر'),
    meaning: 'طائر جارح حاد البصر'
  },
  {
    id: 'w-saad-2',
    word: 'صَابُونٌ',
    cleanWord: 'صابون',
    targetLetter: 'ص',
    position: 'beginning',
    maddType: 'alif', // صَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🧼', ['#CCFBF1', '#0D9488'], 'صَابُون'),
    meaning: 'ينظف أيدينا بالرغوة'
  },
  {
    id: 'w-saad-3',
    word: 'صُورَةٌ',
    cleanWord: 'صورة',
    targetLetter: 'ص',
    position: 'beginning',
    maddType: 'waw', // صُو
    shortVowel: 'damma',
    image: createSvgIllustration('🖼️', ['#E0E7FF', '#4338CA'], 'صُورَة'),
    meaning: 'لوحة جميلة معلقة'
  },
  {
    id: 'w-saad-4',
    word: 'عَصِيرٌ',
    cleanWord: 'عصير',
    targetLetter: 'ص',
    position: 'middle',
    maddType: 'yaa', // صِي
    shortVowel: 'kasra',
    image: createSvgIllustration('🧃', ['#FEF08A', '#EAB308'], 'عَصِير'),
    meaning: 'مشروب الفواكه اللذيذ'
  },
  {
    id: 'w-saad-5',
    word: 'قَفَصٌ',
    cleanWord: 'قفص',
    targetLetter: 'ص',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🪴', ['#E2E8F0', '#64748B'], 'قَفَص'),
    meaning: 'مأوى الحيوانات في الحديقة'
  },

  // ض
  {
    id: 'w-daad-1',
    word: 'ضِفْدَعٌ',
    cleanWord: 'ضفدع',
    targetLetter: 'ض',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('🐸', ['#DCFCE7', '#16A34A'], 'ضِفْدَع'),
    meaning: 'حيوان برمائي يقفز في البحيرة'
  },
  {
    id: 'w-daad-2',
    word: 'ضَوْءٌ',
    cleanWord: 'ضوء',
    targetLetter: 'ض',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('💡', ['#FEF08A', '#EAB308'], 'ضَوْء'),
    meaning: 'ينير المكان المظلم'
  },
  {
    id: 'w-daad-3',
    word: 'خُضَارٌ',
    cleanWord: 'خضار',
    targetLetter: 'ض',
    position: 'middle',
    maddType: 'alif', // ضَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🥦', ['#BBF7D0', '#15803D'], 'خُضَار'),
    meaning: 'نباتات صحية للجسم'
  },
  {
    id: 'w-daad-4',
    word: 'بَيْضٌ',
    cleanWord: 'بيض',
    targetLetter: 'ض',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🥚', ['#FEF3C7', '#F59E0B'], 'بَيْض'),
    meaning: 'غذاء صحي غني بالبروتين'
  },

  // ط
  {
    id: 'w-taa2-1',
    word: 'طَائِرَةٌ',
    cleanWord: 'طائرة',
    targetLetter: 'ط',
    position: 'beginning',
    maddType: 'alif', // طَا
    shortVowel: 'fatha',
    image: createSvgIllustration('✈️', ['#BAE6FD', '#0284C7'], 'طَائِرَة'),
    meaning: 'تطير في أعالي الجو'
  },
  {
    id: 'w-taa2-2',
    word: 'طَبْلٌ',
    cleanWord: 'طبل',
    targetLetter: 'ط',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🥁', ['#FECDD3', '#E11D48'], 'طَبْل'),
    meaning: 'آلة موسيقية إيقاعية'
  },
  {
    id: 'w-taa2-3',
    word: 'مَطَرٌ',
    cleanWord: 'مطر',
    targetLetter: 'ط',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🌧️', ['#E0E7FF', '#3B82F6'], 'مَطَر'),
    meaning: 'ماء ينزل من السحاب'
  },
  {
    id: 'w-taa2-4',
    word: 'قِطٌّ',
    cleanWord: 'قط',
    targetLetter: 'ط',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🐱', ['#FED7AA', '#EA580C'], 'قِطّ'),
    meaning: 'حيوان أليف محب للعب'
  },

  // ظ
  {
    id: 'w-zaa-1',
    word: 'ظَرْفٌ',
    cleanWord: 'ظرف',
    targetLetter: 'ظ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('✉️', ['#FEF3C7', '#D97706'], 'ظَرْف'),
    meaning: 'نضع فيه الرسائل البريدية'
  },
  {
    id: 'w-zaa-2',
    word: 'ظِلٌّ',
    cleanWord: 'ظل',
    targetLetter: 'ظ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('👤', ['#E2E8F0', '#64748B'], 'ظِلّ'),
    meaning: 'يحجب أشعة الشمس الحارة'
  },
  {
    id: 'w-zaa-3',
    word: 'نَظَّارَةٌ',
    cleanWord: 'نظارة',
    targetLetter: 'ظ',
    position: 'middle',
    maddType: 'alif', // ظَا
    shortVowel: 'fatha',
    image: createSvgIllustration('👓', ['#DDD6FE', '#7C3AED'], 'نَظَّارَة'),
    meaning: 'تساعدنا على الرؤية بوضوح'
  },
  {
    id: 'w-zaa-4',
    word: 'حَظٌّ',
    cleanWord: 'حظ',
    targetLetter: 'ظ',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🍀', ['#DCFCE7', '#16A34A'], 'حَظّ'),
    meaning: 'نصيب سعيد ومبهج'
  },

  // ع
  {
    id: 'w-ayn-1',
    word: 'عَيْنٌ',
    cleanWord: 'عين',
    targetLetter: 'ع',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('👁️', ['#BAE6FD', '#0284C7'], 'عَيْن'),
    meaning: 'عضو الإبصار والنظر'
  },
  {
    id: 'w-ayn-2',
    word: 'عِنَبٌ',
    cleanWord: 'عنب',
    targetLetter: 'ع',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('🍇', ['#EDE9FE', '#8B5CF6'], 'عِنَب'),
    meaning: 'عناقيد فاكهة حلوة'
  },
  {
    id: 'w-ayn-3',
    word: 'عُصْفُورٌ',
    cleanWord: 'عصفور',
    targetLetter: 'ع',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🐦', ['#FEF08A', '#EAB308'], 'عُصْفُور'),
    meaning: 'طائر يغرد بألحان جميلة'
  },
  {
    id: 'w-ayn-4',
    word: 'شُعَاعٌ',
    cleanWord: 'شعاع',
    targetLetter: 'ع',
    position: 'middle',
    maddType: 'alif', // عَا
    shortVowel: 'fatha',
    image: createSvgIllustration('✨', ['#FEF3C7', '#F59E0B'], 'شُعَاع'),
    meaning: 'نور الشمس اللامع'
  },
  {
    id: 'w-ayn-5',
    word: 'مُذِيعٌ',
    cleanWord: 'مذيع',
    targetLetter: 'ع',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🎙️', ['#E0E7FF', '#4338CA'], 'مُذِيع'),
    meaning: 'يقدم برامج ممتعة في الإذاعة'
  },

  // غ
  {
    id: 'w-ghayn-1',
    word: 'غَزَالٌ',
    cleanWord: 'غزال',
    targetLetter: 'غ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🦌', ['#FED7AA', '#EA580C'], 'غَزَال'),
    meaning: 'حيوان بري جميل'
  },
  {
    id: 'w-ghayn-2',
    word: 'غَابَةٌ',
    cleanWord: 'غابة',
    targetLetter: 'غ',
    position: 'beginning',
    maddType: 'alif', // غَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🌲', ['#DCFCE7', '#15803D'], 'غَابَة'),
    meaning: 'أشجار كثيفة تعيش فيها الحيوانات'
  },
  {
    id: 'w-ghayn-3',
    word: 'غَيْمَةٌ',
    cleanWord: 'غيمة',
    targetLetter: 'غ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('☁️', ['#E0F2FE', '#0284C7'], 'غَيْمَة'),
    meaning: 'سحابة بيضاء في السماء'
  },
  {
    id: 'w-ghayn-4',
    word: 'صَغِيرٌ',
    cleanWord: 'صغير',
    targetLetter: 'غ',
    position: 'middle',
    maddType: 'yaa', // غِي
    shortVowel: 'kasra',
    image: createSvgIllustration('🐣', ['#FEF08A', '#CA8A04'], 'صَغِير'),
    meaning: 'كتكوت لطيف الحجم'
  },
  {
    id: 'w-ghayn-5',
    word: 'دِمَاغٌ',
    cleanWord: 'دماغ',
    targetLetter: 'غ',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🧠', ['#FCE7F3', '#DB2777'], 'دِمَاغ'),
    meaning: 'مركز التفكير والذكاء'
  },

  // ف
  {
    id: 'w-faa-1',
    word: 'فَرَاشَةٌ',
    cleanWord: 'فراشة',
    targetLetter: 'ف',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🦋', ['#EDE9FE', '#8B5CF6'], 'فَرَاشَة'),
    meaning: 'حشرة ذات أجنحة ملونة ساحرة'
  },
  {
    id: 'w-faa-2',
    word: 'فِيلٌ',
    cleanWord: 'فيل',
    targetLetter: 'ف',
    position: 'beginning',
    maddType: 'yaa', // فِي
    shortVowel: 'kasra',
    image: createSvgIllustration('🐘', ['#E2E8F0', '#64748B'], 'فِيل'),
    meaning: 'حيوان ضخم بخرطوم طويل'
  },
  {
    id: 'w-faa-3',
    word: 'فُولٌ',
    cleanWord: 'فول',
    targetLetter: 'ف',
    position: 'beginning',
    maddType: 'waw', // فُو
    shortVowel: 'damma',
    image: createSvgIllustration('🫘', ['#FED7AA', '#C2410C'], 'فُول'),
    meaning: 'طعام شهي ومغذي'
  },
  {
    id: 'w-faa-4',
    word: 'سَفِينَةٌ',
    cleanWord: 'سفينة',
    targetLetter: 'ف',
    position: 'middle',
    maddType: 'yaa', // فِي
    shortVowel: 'kasra',
    image: createSvgIllustration('🚢', ['#BAE6FD', '#0284C7'], 'سَفِينَة'),
    meaning: 'مركب بحري ضخم'
  },
  {
    id: 'w-faa-5',
    word: 'خَرُوفٌ',
    cleanWord: 'خروف',
    targetLetter: 'ف',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🐑', ['#F3E8FF', '#A855F7'], 'خَرُوف'),
    meaning: 'صديق المزرعة الوديع'
  },

  // ق
  {
    id: 'w-qaaf-1',
    word: 'قَمَرٌ',
    cleanWord: 'قمر',
    targetLetter: 'ق',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🌕', ['#FEF08A', '#EAB308'], 'قَمَر'),
    meaning: 'بدر ساطع في السماء'
  },
  {
    id: 'w-qaaf-2',
    word: 'قِطَارٌ',
    cleanWord: 'قطار',
    targetLetter: 'ق',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('🚂', ['#FED7AA', '#EA580C'], 'قِطَار'),
    meaning: 'يسير على القضبان بسرعة'
  },
  {
    id: 'w-qaaf-3',
    word: 'قُورَبٌ',
    cleanWord: 'قارب',
    targetLetter: 'ق',
    position: 'beginning',
    maddType: 'alif', // قَا
    shortVowel: 'fatha',
    image: createSvgIllustration('⛵', ['#BAE6FD', '#0284C7'], 'قَارِب'),
    meaning: 'زورق شراعي يبحر'
  },
  {
    id: 'w-qaaf-4',
    word: 'صَقْرٌ',
    cleanWord: 'صقر',
    targetLetter: 'ق',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'sukoon',
    image: createSvgIllustration('🦅', ['#FEF3C7', '#B45309'], 'صَقْر'),
    meaning: 'طائر شجاع'
  },
  {
    id: 'w-qaaf-5',
    word: 'إِبْرِيقٌ',
    cleanWord: 'إبريق',
    targetLetter: 'ق',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🫖', ['#CCFBF1', '#0F766E'], 'إِبْرِيق'),
    meaning: 'نسكب منه الشاي الدافئ'
  },

  // ك
  {
    id: 'w-kaaf-1',
    word: 'كِتَابٌ',
    cleanWord: 'كتاب',
    targetLetter: 'ك',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('📚', ['#BFDBFE', '#2563EB'], 'كِتَاب'),
    meaning: 'كنز المعرفة'
  },
  {
    id: 'w-kaaf-2',
    word: 'كَوْكَبٌ',
    cleanWord: 'كوكب',
    targetLetter: 'ك',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🪐', ['#DDD6FE', '#7C3AED'], 'كَوْكَب'),
    meaning: 'جرم سماوي يدور في الفضاء'
  },
  {
    id: 'w-kaaf-3',
    word: 'كُوبٌ',
    cleanWord: 'كوب',
    targetLetter: 'ك',
    position: 'beginning',
    maddType: 'waw', // كُو
    shortVowel: 'damma',
    image: createSvgIllustration('☕', ['#FED7AA', '#EA580C'], 'كُوب'),
    meaning: 'كوب للمشروبات الدافئة'
  },
  {
    id: 'w-kaaf-4',
    word: 'سَمَكَةٌ',
    cleanWord: 'سمكة',
    targetLetter: 'ك',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🐠', ['#BAE6FD', '#0284C7'], 'سَمَكَة'),
    meaning: 'سمكة بحرية رشيقة'
  },
  {
    id: 'w-kaaf-5',
    word: 'دِيكٌ',
    cleanWord: 'ديك',
    targetLetter: 'ك',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🐓', ['#FECDD3', '#E11D48'], 'دِيك'),
    meaning: 'ديك الصباح'
  },

  // ل
  {
    id: 'w-laam-1',
    word: 'لَيْمُونٌ',
    cleanWord: 'ليمون',
    targetLetter: 'ل',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🍋', ['#FEF08A', '#EAB308'], 'لَيْمُون'),
    meaning: 'فاكهة حمضية منعشة ومفيدة'
  },
  {
    id: 'w-laam-2',
    word: 'لُعْبَةٌ',
    cleanWord: 'لعبة',
    targetLetter: 'ل',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🧸', ['#FED7AA', '#EA580C'], 'لُعْبَة'),
    meaning: 'دمية دب لطيفة نلعب بها'
  },
  {
    id: 'w-laam-3',
    word: 'قَلَمٌ',
    cleanWord: 'قلم',
    targetLetter: 'ل',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('✏️', ['#FDE68A', '#D97706'], 'قَلَم'),
    meaning: 'نكتب به الحروف والكلمات'
  },
  {
    id: 'w-laam-4',
    word: 'حِلِيبٌ',
    cleanWord: 'حليب',
    targetLetter: 'ل',
    position: 'middle',
    maddType: 'yaa', // لِي
    shortVowel: 'kasra',
    image: createSvgIllustration('🥛', ['#F1F5F9', '#64748B'], 'حَلِيب'),
    meaning: 'غذاء صحي متكامل'
  },
  {
    id: 'w-laam-5',
    word: 'نَحْلٌ',
    cleanWord: 'نحل',
    targetLetter: 'ل',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🐝', ['#FEF08A', '#CA8A04'], 'نَحْل'),
    meaning: 'يصنع العسل اللذيذ والشفاء'
  },

  // م
  {
    id: 'w-meem-1',
    word: 'مَوْزٌ',
    cleanWord: 'موز',
    targetLetter: 'م',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🍌', ['#FEF08A', '#EAB308'], 'مَوْز'),
    meaning: 'فاكهة محبوبة ومغذية'
  },
  {
    id: 'w-meem-2',
    word: 'مَاءٌ',
    cleanWord: 'ماء',
    targetLetter: 'م',
    position: 'beginning',
    maddType: 'alif', // مَا
    shortVowel: 'fatha',
    image: createSvgIllustration('💧', ['#BAE6FD', '#0284C7'], 'مَاء'),
    meaning: 'سر الحياة ورواء العطش'
  },
  {
    id: 'w-meem-3',
    word: 'لَيْمُونٌ',
    cleanWord: 'ليمون',
    targetLetter: 'م',
    position: 'middle',
    maddType: 'waw', // مُو
    shortVowel: 'damma',
    image: createSvgIllustration('🍋', ['#FEF3C7', '#CA8A04'], 'لَيْمُون'),
    meaning: 'غني بفيتامين ج'
  },
  {
    id: 'w-meem-4',
    word: 'قَمِيصٌ',
    cleanWord: 'قميص',
    targetLetter: 'م',
    position: 'middle',
    maddType: 'yaa', // مِي
    shortVowel: 'kasra',
    image: createSvgIllustration('👔', ['#BFDBFE', '#3B82F6'], 'قَمِيص'),
    meaning: 'لباس أنيق ومرتب'
  },
  {
    id: 'w-meem-5',
    word: 'نَجْمٌ',
    cleanWord: 'نجم',
    targetLetter: 'م',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🌟', ['#FEF08A', '#F59E0B'], 'نَجْم'),
    meaning: 'نجم يتلألأ في الأفق'
  },

  // ن
  {
    id: 'w-noon-1',
    word: 'نَمِرٌ',
    cleanWord: 'نمر',
    targetLetter: 'ن',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🐅', ['#FED7AA', '#EA580C'], 'نَمِر'),
    meaning: 'حيوان قوي ومخطط'
  },
  {
    id: 'w-noon-2',
    word: 'نَارٌ',
    cleanWord: 'نار',
    targetLetter: 'ن',
    position: 'beginning',
    maddType: 'alif', // نَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🔥', ['#FECDD3', '#E11D48'], 'نَار'),
    meaning: 'لهب دافئ للشتاء'
  },
  {
    id: 'w-noon-3',
    word: 'نُورٌ',
    cleanWord: 'نور',
    targetLetter: 'ن',
    position: 'beginning',
    maddType: 'waw', // نُو
    shortVowel: 'damma',
    image: createSvgIllustration('🕯️', ['#FEF08A', '#D97706'], 'نُور'),
    meaning: 'ضوء الشمعة الوضاء'
  },
  {
    id: 'w-noon-4',
    word: 'عِنَبٌ',
    cleanWord: 'عنب',
    targetLetter: 'ن',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🍇', ['#DDD6FE', '#7C3AED'], 'عِنَب'),
    meaning: 'عنب بنفسجي طازج'
  },
  {
    id: 'w-noon-5',
    word: 'عَيْنٌ',
    cleanWord: 'عين',
    targetLetter: 'ن',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('👁️', ['#BAE6FD', '#0284C7'], 'عَيْن'),
    meaning: 'عين الإنسان الجميلة'
  },

  // هـ
  {
    id: 'w-haa2-1',
    word: 'هِلَالٌ',
    cleanWord: 'هلال',
    targetLetter: 'هـ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('🌙', ['#FEF08A', '#CA8A04'], 'هِلَال'),
    meaning: 'قمر بداية الشهر الهجري'
  },
  {
    id: 'w-haa2-2',
    word: 'هَدِيَّةٌ',
    cleanWord: 'هدية',
    targetLetter: 'هـ',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🎁', ['#FECDD3', '#E11D48'], 'هَدِيَّة'),
    meaning: 'مفاجأة سارة تفرح القلوب'
  },
  {
    id: 'w-haa2-3',
    word: 'هَاتِفٌ',
    cleanWord: 'هاتف',
    targetLetter: 'هـ',
    position: 'beginning',
    maddType: 'alif', // هَا
    shortVowel: 'fatha',
    image: createSvgIllustration('📱', ['#E0E7FF', '#4F46E5'], 'هَاتِف'),
    meaning: 'جهاز نتواصل به مع الأحباب'
  },
  {
    id: 'w-haa2-4',
    word: 'فَهْدٌ',
    cleanWord: 'فهد',
    targetLetter: 'هـ',
    position: 'middle',
    maddType: 'none',
    shortVowel: 'sukoon',
    image: createSvgIllustration('🐆', ['#FEF3C7', '#D97706'], 'فَهْد'),
    meaning: 'أسرع حيوان على الأرض'
  },
  {
    id: 'w-haa2-5',
    word: 'وَجْهٌ',
    cleanWord: 'وجه',
    targetLetter: 'هـ',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('😊', ['#FEF08A', '#F59E0B'], 'وَجْه'),
    meaning: 'وجه مبتسم مشرق'
  },

  // و
  {
    id: 'w-waw-1',
    word: 'وَرْدَةٌ',
    cleanWord: 'وردة',
    targetLetter: 'و',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('🌹', ['#FECDD3', '#E11D48'], 'وَرْدَة'),
    meaning: 'زهرة فواحة العبير'
  },
  {
    id: 'w-waw-2',
    word: 'وِسَادَةٌ',
    cleanWord: 'وسادة',
    targetLetter: 'و',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'kasra',
    image: createSvgIllustration('🛋️', ['#E0E7FF', '#6366F1'], 'وِسَادَة'),
    meaning: 'مخدة مريحة للنوم'
  },
  {
    id: 'w-waw-3',
    word: 'وَاحَةٌ',
    cleanWord: 'واحة',
    targetLetter: 'و',
    position: 'beginning',
    maddType: 'alif', // وَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🏝️', ['#BBF7D0', '#16A34A'], 'وَاحَة'),
    meaning: 'أشجار ونبع ماء وسط الصحراء'
  },
  {
    id: 'w-waw-4',
    word: 'طَاوُوسٌ',
    cleanWord: 'طاووس',
    targetLetter: 'و',
    position: 'middle',
    maddType: 'waw', // وُو
    shortVowel: 'damma',
    image: createSvgIllustration('🦚', ['#BAE6FD', '#0284C7'], 'طَاوُوس'),
    meaning: 'طائر بديع الريش'
  },
  {
    id: 'w-waw-5',
    word: 'دَلْوٌ',
    cleanWord: 'دلو',
    targetLetter: 'و',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🪣', ['#E2E8F0', '#64748B'], 'دَلْو'),
    meaning: 'إناء لرفع الماء من البئر'
  },

  // ي
  {
    id: 'w-yaa-1',
    word: 'يَدٌ',
    cleanWord: 'يد',
    targetLetter: 'ي',
    position: 'beginning',
    maddType: 'none',
    shortVowel: 'fatha',
    image: createSvgIllustration('✋', ['#FED7AA', '#FB923C'], 'يَد'),
    meaning: 'نعمة نكتب ونعمل بها'
  },
  {
    id: 'w-yaa-2',
    word: 'يَاسَمِينٌ',
    cleanWord: 'ياسمين',
    targetLetter: 'ي',
    position: 'beginning',
    maddType: 'alif', // يَا
    shortVowel: 'fatha',
    image: createSvgIllustration('🌼', ['#FEF08A', '#CA8A04'], 'يَاسَمِين'),
    meaning: 'زهر أبيض عبق'
  },
  {
    id: 'w-yaa-3',
    word: 'يُوسُفِيٌّ',
    cleanWord: 'يوسفي',
    targetLetter: 'ي',
    position: 'beginning',
    maddType: 'waw', // يُو
    shortVowel: 'damma',
    image: createSvgIllustration('🍊', ['#FED7AA', '#EA580C'], 'يُوسُفِيّ'),
    meaning: 'فاكهة حمضية شتوية لذيذة'
  },
  {
    id: 'w-yaa-4',
    word: 'خِيَارٌ',
    cleanWord: 'خيار',
    targetLetter: 'ي',
    position: 'middle',
    maddType: 'alif',
    shortVowel: 'fatha',
    image: createSvgIllustration('🥒', ['#BBF7D0', '#15803D'], 'خِيَار'),
    meaning: 'خضار أخضر مقرمش'
  },
  {
    id: 'w-yaa-5',
    word: 'شَايٌ',
    cleanWord: 'شاي',
    targetLetter: 'ي',
    position: 'end',
    maddType: 'none',
    shortVowel: 'damma',
    image: createSvgIllustration('🫖', ['#FED7AA', '#C2410C'], 'شَاي'),
    meaning: 'مشروب دافئ ومحبوب'
  }
];

export const QUESTION_TYPES_INFO: Record<string, { label: string; desc: string; icon: string }> = {
  drag_drop: {
    label: 'سحب الحرف إلى مكانه',
    desc: 'سحب الحرف المفقود أو حروف الكلمة إلى مواضعها الصحيحة',
    icon: 'HandMetal'
  },
  choose_letter: {
    label: 'اختيار الحرف الصحيح',
    desc: 'اختيار الحرف المناسب لإكمال الكلمة من بين خيارات متعددة',
    icon: 'CheckSquare'
  },
  choose_madd: {
    label: 'تمييز المدود والأصوات الطويلة',
    desc: 'التدريب على المد بالألف (مَا)، والواو (مُو)، والياء (مِي)',
    icon: 'Sparkles'
  },
  letter_position: {
    label: 'تحديد موضع الحرف',
    desc: 'معرفة هل الحرف في أول الكلمة، وسطها، أو في آخرها',
    icon: 'Navigation'
  },
  short_vowel: {
    label: 'اختيار الصوت القصير',
    desc: 'تمييز الفتحة (ـَ)، الضمة (ـُ)، الكسرة (ـِ)، والسكون',
    icon: 'Volume2'
  },
  build_word: {
    label: 'تركيب الكلمة كاملة',
    desc: 'ترتيب جميع حروف الكلمة حتى تكتمل وتطابق الصورة',
    icon: 'Puzzle'
  },
  picture_match: {
    label: 'أسئلة تعتمد على الصور',
    desc: 'اختيار الصورة الصحيحة التي تحتوي على الحرف المطلوب',
    icon: 'Image'
  }
};
