import {
  ArabicLetter,
  DeckTheme,
  PresentationSlide,
  SlideLayoutVariant,
  UploadedTeacherImage,
  WordItem,
} from '../types';
import { removeTashkeel, shuffle } from './questionGenerator';

export const DECK_THEMES: DeckTheme[] = [
  {
    id: 'royal-navy',
    name: 'الكحلي والذهبي التعليمي',
    primaryHex: '#1E3A8A',
    secondaryHex: '#0284C7',
    accentHex: '#D97706',
    bgHex: '#F8FAFC',
    surfaceHex: '#FFFFFF',
    borderHex: '#CBD5E1',
    textHex: '#0F172A',
    mutedTextHex: '#475569',
    patternType: 'waves',
  },
  {
    id: 'emerald-forest',
    name: 'الزمردي المشرق',
    primaryHex: '#065F46',
    secondaryHex: '#0D9488',
    accentHex: '#EA580C',
    bgHex: '#F0FDF4',
    surfaceHex: '#FFFFFF',
    borderHex: '#A7F3D0',
    textHex: '#064E3B',
    mutedTextHex: '#334155',
    patternType: 'arches',
  },
  {
    id: 'warm-amber',
    name: 'العنبري الدافئ',
    primaryHex: '#B45309',
    secondaryHex: '#EA580C',
    accentHex: '#0F766E',
    bgHex: '#FFFBEB',
    surfaceHex: '#FFFFFF',
    borderHex: '#FDE68A',
    textHex: '#1E293B',
    mutedTextHex: '#64748B',
    patternType: 'ribbons',
  },
  {
    id: 'plum-editorial',
    name: 'البنفسجي الإبداعي',
    primaryHex: '#5B21B6',
    secondaryHex: '#7C3AED',
    accentHex: '#DB2777',
    bgHex: '#FAF5FF',
    surfaceHex: '#FFFFFF',
    borderHex: '#DDD6FE',
    textHex: '#1E1B4B',
    mutedTextHex: '#475569',
    patternType: 'geometric',
  },
  {
    id: 'coral-sky',
    name: 'المرجاني والسماوي',
    primaryHex: '#BE123C',
    secondaryHex: '#E11D48',
    accentHex: '#0369A1',
    bgHex: '#FFF1F2',
    surfaceHex: '#FFFFFF',
    borderHex: '#FECDD3',
    textHex: '#1E293B',
    mutedTextHex: '#475569',
    patternType: 'diagonal',
  },
  {
    id: 'teal-slate',
    name: 'الفيروزي العصري',
    primaryHex: '#0F766E',
    secondaryHex: '#0891B2',
    accentHex: '#D97706',
    bgHex: '#F0FDFA',
    surfaceHex: '#FFFFFF',
    borderHex: '#99F6E4',
    textHex: '#0F172A',
    mutedTextHex: '#475569',
    patternType: 'dots',
  },
];

// Track previous theme and cover variant so every generation produces a distinct design
let lastThemeId = '';
let lastCoverVariant: SlideLayoutVariant | '' = '';
let lastGenerationCount = 0;

const COVER_TITLES = [
  (l: ArabicLetter) => `رِحْلَةُ تَعَلُّمِ حَرْفِ (${l.char})`,
  (l: ArabicLetter) => `أَبْطَالُ الصَّفِّ الأَوَّلِ مَعَ حَرْفِ (${l.name})`,
  (l: ArabicLetter) => `كِتَابُ الحَرْفِ التَّفَاعُلِيُّ: (${l.char})`,
  (l: ArabicLetter) => `نَجْمُ اليَوْمِ: حَرْفُ (${l.name})`,
  (l: ArabicLetter) => `مَهَارَاتُ وَأَصْوَاتُ حَرْفِ (${l.char})`,
];

const MOTIVATIONAL_CLOSINGS = [
  'أنتَ بطلٌ رائعٌ يا صغيري! استمر في القراءة والكتابة كل يوم لتُصبحَ نجمَ الفصل.',
  'أحسنتَ إتقانَ الحرفِ وأصواتهِ القصيرةِ والطويلة! المعلم وائل حمدي فخورٌ بك جداً.',
  'ممتاز! تدرَّبْ مع أسرتك على كتابةِ كلماتٍ جديدةٍ تحتوي على هذا الحرف الجميل.',
  'رائعٌ يا بطل! المراجعةُ المستمرةُ تجعلُ قراءتكَ سريعةً وخطَّكَ أجمل.',
];

export interface GeneratedDeck {
  theme: DeckTheme;
  slides: PresentationSlide[];
  generationNumber: number;
}

export function pickNextUniqueTheme(excludeId?: string): DeckTheme {
  const candidates = DECK_THEMES.filter(t => t.id !== (excludeId || lastThemeId));
  const chosen = candidates[Math.floor(Math.random() * candidates.length)] || DECK_THEMES[0];
  lastThemeId = chosen.id;
  return chosen;
}

export function generateLetterPresentationDeck(
  letter: ArabicLetter,
  allWords: WordItem[],
  uploadedImages: UploadedTeacherImage[],
  includeCustomBankWords = true,
  imagesPerSlide = 4
): GeneratedDeck {
  lastGenerationCount += 1;

  // 1. Pick a fresh theme different from the last one
  const theme = pickNextUniqueTheme();

  // 2. Pick a fresh cover layout variant different from the last one
  const coverVariants: SlideLayoutVariant[] = ['hero-split', 'hero-centered', 'hero-arch'];
  const eligibleCovers = coverVariants.filter(v => v !== lastCoverVariant);
  const coverVariant = eligibleCovers[Math.floor(Math.random() * eligibleCovers.length)] || 'hero-split';
  lastCoverVariant = coverVariant;

  // 3. Gather matching words for this letter
  const matchingWords = allWords.filter(w => {
    if (w.targetLetter === letter.char) return true;
    const clean = w.cleanWord || removeTashkeel(w.word);
    return clean.includes(letter.char);
  });

  const customWords = shuffle(matchingWords.filter(w => w.isCustom));
  const builtinWords = shuffle(matchingWords.filter(w => !w.isCustom));
  const prioritizedWords = includeCustomBankWords
    ? [...customWords, ...builtinWords]
    : builtinWords;

  // Pick example words per position & vowel
  const beginningWord =
    prioritizedWords.find(w => w.position === 'beginning')?.word || `${letter.shortSounds.fatha}...`;
  const middleWord =
    prioritizedWords.find(w => w.position === 'middle')?.word || `ـ${letter.char}ـ`;
  const endWord =
    prioritizedWords.find(w => w.position === 'end')?.word || `ـ${letter.char}`;

  const fathaWord = prioritizedWords.find(w => w.shortVowel === 'fatha')?.word || beginningWord;
  const dammaWord = prioritizedWords.find(w => w.shortVowel === 'damma')?.word || `${letter.shortSounds.damma}...`;
  const kasraWord = prioritizedWords.find(w => w.shortVowel === 'kasra')?.word || `${letter.shortSounds.kasra}...`;
  const sukoonWord = prioritizedWords.find(w => w.shortVowel === 'sukoon')?.word || `${letter.char}ْ`;

  const alifMaddWord = prioritizedWords.find(w => w.maddType === 'alif')?.word || `${letter.longSounds.alif}...`;
  const wawMaddWord = prioritizedWords.find(w => w.maddType === 'waw')?.word || `${letter.longSounds.waw}...`;
  const yaaMaddWord = prioritizedWords.find(w => w.maddType === 'yaa')?.word || `${letter.longSounds.yaa}...`;

  // Pick varied cover title & closing quote
  const titleBuilder = COVER_TITLES[(lastGenerationCount + Math.floor(Math.random() * COVER_TITLES.length)) % COVER_TITLES.length];
  const closingQuote = MOTIVATIONAL_CLOSINGS[Math.floor(Math.random() * MOTIVATIONAL_CLOSINGS.length)];

  const slides: PresentationSlide[] = [];

  // ---------------------------------------------------------------------------
  // SLIDE 1: COVER SLIDE
  // ---------------------------------------------------------------------------
  slides.push({
    id: `slide-cover-${Date.now()}-1`,
    kind: 'cover',
    layoutVariant: coverVariant,
    title: titleBuilder(letter),
    subtitle: `دَرْسٌ مُتَكَامِلٌ فِي أَشْكَالِ وَأَصْوَاتِ الحَرْفِ · الصَّفُّ الأَوَّلُ الابْتِدَائِيُّ`,
    badgeText: 'مَنَصَّةُ أَبْطَالِ الصَّفِّ الأَوَّلِ',
    highlightLetter: letter.char,
    bodyText: `حَرْفُ ${letter.name} (${letter.char}) — شَرْحٌ مَرْئِيٌّ وَتَدْرِيبَاتٌ تَفَاعُلِيَّةٌ مُنَظَّمَةٌ`,
    items: [
      { id: 'cov-1', label: 'الْمُعَلِّمُ الْمُشْرِفُ', value: 'المعلم وائل حمدي' },
      { id: 'cov-2', label: 'اسْمُ الحَرْفِ', value: letter.name },
      { id: 'cov-3', label: 'رَمْزُ الحَرْفِ', value: letter.char },
    ],
    teacherNote: 'إعداد وتنسيق: المعلم وائل حمدي — أبطال الصف الأول',
  });

  // ---------------------------------------------------------------------------
  // SLIDE 2: LETTER FORMS (أشكال الحرف حسب موقعه)
  // ---------------------------------------------------------------------------
  const formsLayout: SlideLayoutVariant = lastGenerationCount % 2 === 0 ? 'cards-4' : 'list-clean';
  slides.push({
    id: `slide-forms-${Date.now()}-2`,
    kind: 'forms',
    layoutVariant: formsLayout,
    title: `أَشْكَالُ حَرْفِ (${letter.char}) فِي الكَلِمَةِ`,
    subtitle: 'نُلاحظ كَيْفَ يَتَغَيَّرُ شَكْلُ الحَرْفِ حَسَبَ مَوْقِعِهِ فِي أَوَّلِ وَوَسَطِ وَآخِرِ الكَلِمَةِ',
    badgeText: 'أولاً · المواضع والأشكال',
    highlightLetter: letter.char,
    items: [
      {
        id: 'form-beg',
        label: 'فِي أَوَّلِ الكَلِمَةِ',
        value: letter.forms.beginning,
        subtext: `مِثَال: ${beginningWord}`,
      },
      {
        id: 'form-mid',
        label: 'فِي وَسَطِ الكَلِمَةِ',
        value: letter.forms.middle,
        subtext: `مِثَال: ${middleWord}`,
      },
      {
        id: 'form-end',
        label: 'فِي آخِرِ الكَلِمَةِ (مُتَّصِل)',
        value: letter.forms.end,
        subtext: `مِثَال: ${endWord}`,
      },
      {
        id: 'form-iso',
        label: 'مُنْفَصِلاً (مُفْرَد)',
        value: letter.forms.isolated,
        subtext: `اسْمُهُ: ${letter.name}`,
      },
    ],
    teacherNote: 'بقيادة المعلم وائل حمدي — تدريب عملي على كتابة مواضع الحرف',
  });

  // ---------------------------------------------------------------------------
  // SLIDE 3: SHORT VOWELS (الحركات القصيرة)
  // ---------------------------------------------------------------------------
  const vowelsLayout: SlideLayoutVariant = lastGenerationCount % 2 === 1 ? 'cards-4' : 'list-clean';
  slides.push({
    id: `slide-vowels-${Date.now()}-3`,
    kind: 'short_vowels',
    layoutVariant: vowelsLayout,
    title: `الأَصْوَاتُ القَصِيرَةُ لِحَرْفِ (${letter.char})`,
    subtitle: 'نَنْطِقُ الحَرْفَ بِصَوْتٍ قَصِيرٍ مَعَ الفَتْحَةِ وَالضَّمَّةِ وَالكَسْرَةِ وَالسُّكُونِ',
    badgeText: 'ثانياً · الحركات القصيرة',
    highlightLetter: letter.char,
    items: [
      {
        id: 'v-fatha',
        label: 'الفَتْحَةُ (نَفْتَحُ الفَمَ)',
        value: letter.shortSounds.fatha,
        subtext: `كَلِمَة: ${fathaWord}`,
      },
      {
        id: 'v-damma',
        label: 'الضَّمَّةُ (نَضُمُّ الشَّفَتَيْنِ)',
        value: letter.shortSounds.damma,
        subtext: `كَلِمَة: ${dammaWord}`,
      },
      {
        id: 'v-kasra',
        label: 'الكَسْرَةُ (نَبْتَسِمُ لِلأَسْفَلِ)',
        value: letter.shortSounds.kasra,
        subtext: `كَلِمَة: ${kasraWord}`,
      },
      {
        id: 'v-sukoon',
        label: 'السُّكُونُ (نَقِفُ عَلَى الحَرْفِ)',
        value: `${letter.char}ْ`,
        subtext: `كَلِمَة: ${sukoonWord}`,
      },
    ],
    teacherNote: 'بقيادة المعلم وائل حمدي — انطق الحركات القصيرة بصوت واضح',
  });

  // ---------------------------------------------------------------------------
  // SLIDE 4: LONG VOWELS / MADD (الأصوات الطويلة - المدود)
  // ---------------------------------------------------------------------------
  const maddLayout: SlideLayoutVariant = lastGenerationCount % 3 === 0 ? 'list-clean' : 'cards-3';
  slides.push({
    id: `slide-madd-${Date.now()}-4`,
    kind: 'long_vowels',
    layoutVariant: maddLayout,
    title: `الأَصْوَاتُ الطَّوِيلَةُ وَالمُدُودُ لِحَرْفِ (${letter.char})`,
    subtitle: 'المَدُّ يُطِيلُ صَوْتَ الحَرْفِ ثَلاثَ مَرَّاتٍ: مَدٌّ بِالأَلِفِ، مَدٌّ بِالوَاوِ، وَمَدٌّ بِاليَاءِ',
    badgeText: 'ثالثاً · المدود الثلاثة',
    highlightLetter: letter.char,
    items: [
      {
        id: 'm-alif',
        label: 'مَدٌّ بِالأَلِفِ (فَتْحَة + ا)',
        value: letter.longSounds.alif,
        subtext: `مِثَال: ${alifMaddWord}`,
      },
      {
        id: 'm-waw',
        label: 'مَدٌّ بِالوَاوِ (ضَمَّة + و)',
        value: letter.longSounds.waw,
        subtext: `مِثَال: ${wawMaddWord}`,
      },
      {
        id: 'm-yaa',
        label: 'مَدٌّ بِاليَاءِ (كَسْرَة + ي)',
        value: letter.longSounds.yaa,
        subtext: `مِثَال: ${yaaMaddWord}`,
      },
    ],
    teacherNote: 'بقيادة المعلم وائل حمدي — فرّق بين الصوت القصير والصوت الطويل',
  });

  // ---------------------------------------------------------------------------
  // SLIDE 5: ILLUSTRATED VOCABULARY FROM WORD BANK
  // ---------------------------------------------------------------------------
  const vocabSample = prioritizedWords.slice(0, 4);
  if (vocabSample.length > 0) {
    slides.push({
      id: `slide-vocab-${Date.now()}-5`,
      kind: 'vocabulary',
      layoutVariant: 'gallery-grid',
      title: `كَلِمَاتٌ وَصُوَرٌ مُخْتَارَةٌ لِحَرْفِ (${letter.char})`,
      subtitle: 'اقْرَأْ الكَلِمَةَ وَتَعَرَّفْ عَلَى مَوْضِعِ حَرْفِ اليَوْمِ فِي كُلِّ صُورَةٍ',
      badgeText: 'رابعاً · القاموس المصور',
      highlightLetter: letter.char,
      items: vocabSample.map((w, idx) => ({
        id: `vocab-${w.id}-${idx}`,
        label: w.word,
        value: w.position === 'beginning' ? 'أول الكلمة' : w.position === 'middle' ? 'وسط الكلمة' : 'آخر الكلمة',
        subtext: w.meaning || `كلمة تحتوي على حرف (${letter.char})`,
        image: w.image,
      })),
      teacherNote: 'بقيادة المعلم وائل حمدي — القاموس المصور للحروف العربية',
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 6+: TEACHER'S UPLOADED IMAGES (Based on teacher's merge choice)
  // -1 => Merge ALL uploaded images into ONE single slide
  //  1 => Every uploaded image on its own dedicated slide
  //  N => N images per slide (e.g. 2 or 3)
  // ---------------------------------------------------------------------------
  if (uploadedImages.length > 0) {
    const chunkSize =
      imagesPerSlide === -1
        ? uploadedImages.length
        : Math.max(1, imagesPerSlide || 4);

    for (let i = 0; i < uploadedImages.length; i += chunkSize) {
      const chunk = uploadedImages.slice(i, i + chunkSize);
      const slideIdx = Math.floor(i / chunkSize) + 1;
      const totalPhotoSlides = Math.ceil(uploadedImages.length / chunkSize);

      slides.push({
        id: `slide-teacher-photos-${Date.now()}-${i}`,
        kind: 'uploaded_gallery',
        layoutVariant: 'gallery-grid',
        title:
          totalPhotoSlides > 1
            ? `صُوَرُ وَبِطَاقَاتُ المُعَلِّمِ لِحَرْفِ (${letter.char}) (${slideIdx}/${totalPhotoSlides})`
            : `صُوَرُ وَبِطَاقَاتُ المُعَلِّمِ لِحَرْفِ (${letter.char})`,
        subtitle: 'بِطَاقَاتٌ بَصَرِيَّةٌ مُضَافَةٌ خِصِّيصاً لِتَعْزِيزِ فَهْمِ الطُّلَّابِ فِي الفَصْلِ',
        badgeText: 'صور المعلم المضافة',
        highlightLetter: letter.char,
        items: [],
        uploadedImages: chunk.map(img => ({
          id: img.id,
          dataUrl: img.dataUrl,
          caption: img.caption || `بطاقة حرف (${letter.char})`,
        })),
        teacherNote: 'صور تعليمية مخصصة — إشراف المعلم وائل حمدي',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // SLIDE 7: VARIED INTERACTIVE ACTIVITY / WORKSHEET SLIDE
  // ---------------------------------------------------------------------------
  const activityTemplates = [
    {
      title: `تَحَدِّي الأَبْطَالِ: أَكْمِلْ حَرْفَ (${letter.char}) النَّاقِصَ`,
      subtitle: 'اقْرَأْ الكَلِمَةَ وَفَكِّرْ فِي الشَّكْلِ الصَّحِيحِ لِلْحَرْفِ النَّاقِصِ',
      items: [
        { id: 'act-1', label: 'أول الكلمة', value: `...${removeTashkeel(beginningWord).slice(1) || 'ـــ'}`, subtext: `الإجابة: (${letter.forms.beginning})` },
        { id: 'act-2', label: 'وسط الكلمة', value: `${removeTashkeel(middleWord).replace(letter.char, ' ... ')}`, subtext: `الإجابة: (${letter.forms.middle})` },
        { id: 'act-3', label: 'التحليل الصوتي', value: `${letter.shortSounds.fatha} · ${letter.shortSounds.damma} · ${letter.shortSounds.kasra}`, subtext: 'انطقها بالتسلسل!' },
      ],
    },
    {
      title: `تَدْرِيبُ التَّمْيِيزِ: صَوْتٌ قَصِيرٌ أَمْ مَدٌّ طَوِيلٌ؟`,
      subtitle: 'صَنِّفْ الأَصْوَاتَ التَّالِيَةَ مَعَ مُعَلِّمِكَ عَلَى السَّبُّورَةِ الذَّكِيَّةِ',
      items: [
        { id: 'act-1', label: 'البطاقة الأولى', value: `${letter.longSounds.alif}  مقابل  ${letter.shortSounds.fatha}`, subtext: 'مد بالألف أم فتحة؟' },
        { id: 'act-2', label: 'البطاقة الثانية', value: `${letter.longSounds.waw}  مقابل  ${letter.shortSounds.damma}`, subtext: 'مد بالواو أم ضمة؟' },
        { id: 'act-3', label: 'البطاقة الثالثة', value: `${letter.longSounds.yaa}  مقابل  ${letter.shortSounds.kasra}`, subtext: 'مد بالياء أم كسرة؟' },
      ],
    },
    {
      title: `نَشَاطُ الكِتَابَةِ وَالبَحْثِ فِي الغُرْفَةِ الصَّفِّيَّةِ`,
      subtitle: 'ابْحَثْ مَعَ زُمَلائِكَ عَنْ أَشْيَاءَ تَبْدَأُ أَوْ تَحْتَوِي عَلَى حَرْفِ اليَوْمِ',
      items: [
        { id: 'act-1', label: 'التحدي الأول', value: `اكتب ${letter.forms.beginning} ثلاث مرات`, subtext: 'بخط واضح وجميل على السطر' },
        { id: 'act-2', label: 'التحدي الثاني', value: `اذكر كلمة بها (${letter.char})`, subtext: `مثل: ${prioritizedWords[0]?.word || beginningWord}` },
        { id: 'act-3', label: 'التحدي الثالث', value: `ميّز المد: ${letter.longSounds.alif}`, subtext: 'انطق الصوت الطويل بصوت قوي' },
      ],
    },
  ];

  const chosenActivity =
    activityTemplates[(lastGenerationCount + Math.floor(Math.random() * activityTemplates.length)) % activityTemplates.length];

  slides.push({
    id: `slide-activity-${Date.now()}-6`,
    kind: 'activity',
    layoutVariant: 'activity-sheet',
    title: chosenActivity.title,
    subtitle: chosenActivity.subtitle,
    badgeText: 'نشاط وتدريب الفصل',
    highlightLetter: letter.char,
    items: chosenActivity.items,
    teacherNote: 'نشاط تفاعلي بقيادة المعلم وائل حمدي — أبطال الصف الأول',
  });

  // ---------------------------------------------------------------------------
  // SLIDE 8: CLOSING & HOMEWORK SLIDE
  // ---------------------------------------------------------------------------
  slides.push({
    id: `slide-closing-${Date.now()}-7`,
    kind: 'closing',
    layoutVariant: 'hero-centered',
    title: `خِتَامُ دَرْسِ حَرْفِ (${letter.name}) ⭐`,
    subtitle: 'المُراجَعَةُ وَالمَهَمَّةُ المَنْزِلِيَّةُ لأَبْطَالِ الصَّفِّ الأَوَّلِ',
    badgeText: 'الواجب والتكريم',
    highlightLetter: letter.char,
    bodyText: closingQuote,
    items: [
      { id: 'cl-1', label: '1. القراءة', value: `قراءة (${letter.char}) بالحركات والمدود`, subtext: 'مع ولي الأمر في المنزل' },
      { id: 'cl-2', label: '2. الكتابة', value: `كتابة (${letter.forms.beginning} ${letter.forms.middle} ${letter.forms.end})`, subtext: 'بخط منظم ومرتب' },
      { id: 'cl-3', label: '3. الإبداع', value: `جمع كلمتين جديدتين لحرف (${letter.char})`, subtext: 'للمشاركة في الحصة القادمة' },
    ],
    teacherNote: 'مع تحيات المعلم وائل حمدي · منصة أبطال الصف الأول',
  });

  return {
    theme,
    slides,
    generationNumber: lastGenerationCount,
  };
}
