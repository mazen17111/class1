import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Presentation,
  Upload,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Shuffle,
  Plus,
  Copy,
  ChevronUp,
  ChevronDown,
  Palette,
  ImagePlus,
  Loader2,
  Download,
  Edit3,
  LayoutTemplate,
  AlignRight,
  AlignCenter,
  AlignLeft,
  ArrowLeftRight,
  Columns,
  Type,
  Layers,
  X,
} from 'lucide-react';
import {
  ArabicLetter,
  DeckTheme,
  PresentationSlide,
  SlideLayoutVariant,
  UploadedTeacherImage,
  WordItem,
} from '../types';
import { ARABIC_LETTERS } from '../data/arabicData';
import {
  DECK_THEMES,
  generateLetterPresentationDeck,
} from '../utils/deckGenerator';
import { ensurePngDataUrl, exportToPdf, exportToPptx } from '../utils/deckExporter';
import { SlideRenderer } from './SlideRenderer';
import { sound } from '../utils/audio';

interface PresentationStudioProps {
  words: WordItem[];
  onBackToPlatform: () => void;
}

type StudioStep = 'setup' | 'generating' | 'editor';

export const PresentationStudio: React.FC<PresentationStudioProps> = ({
  words,
  onBackToPlatform,
}) => {
  const [step, setStep] = useState<StudioStep>('setup');

  // Setup state
  const [selectedLetter, setSelectedLetter] = useState<ArabicLetter>(ARABIC_LETTERS[1]); // Default ب
  const [uploadedImages, setUploadedImages] = useState<UploadedTeacherImage[]>([]);
  const [includeCustomBankWords, setIncludeCustomBankWords] = useState(true);
  const [uploadError, setUploadError] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [customPerSlideCount, setCustomPerSlideCount] = useState('2');
  const [lastImagesPerSlide, setLastImagesPerSlide] = useState<number>(4);

  // Generation progress state
  const [genProgress, setGenProgress] = useState(0);
  const [genStatusText, setGenStatusText] = useState('');

  // Active Deck state
  const [theme, setTheme] = useState<DeckTheme>(DECK_THEMES[0]);
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);

  // Export state
  const [exportStatus, setExportStatus] = useState<{
    type: 'pptx' | 'pdf' | null;
    progress: number;
    message: string;
    doneMessage: string;
    error: string;
  }>({
    type: null,
    progress: 0,
    message: '',
    doneMessage: '',
    error: '',
  });

  // Preview scaling
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.55);

  // Export DOM refs for PDF capture
  const exportSlideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setupFileInputRef = useRef<HTMLInputElement>(null);
  const slideFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const w = previewContainerRef.current.clientWidth;
        if (w > 0) {
          setPreviewScale(w / 1280);
        }
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (previewContainerRef.current) {
      observer.observe(previewContainerRef.current);
    }
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [step, activeSlideIndex]);

  // Compress and read image files into Data URLs
  const processImageFiles = async (files: FileList | null): Promise<UploadedTeacherImage[]> => {
    if (!files || files.length === 0) return [];
    const results: UploadedTeacherImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 900;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL('image/png'));
            } else {
              resolve(reader.result as string);
            }
          };
          img.onerror = () => resolve(reader.result as string);
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('read failed'));
        reader.readAsDataURL(file);
      }).catch(() => '');

      if (dataUrl) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
        results.push({
          id: `up-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl,
          caption: cleanName || `صورة ${i + 1}`,
          name: file.name,
        });
      }
    }
    return results;
  };

  const handleSetupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const newImgs = await processImageFiles(e.target.files);
    if (newImgs.length === 0 && e.target.files && e.target.files.length > 0) {
      setUploadError('يرجى اختيار ملفات صور صالحة (PNG, JPG, WebP).');
      return;
    }
    if (newImgs.length > 0) {
      sound.playSuccess();
      setUploadedImages(prev => [...prev, ...newImgs]);
    }
    if (e.target) e.target.value = '';
  };

  const handleConfirmClick = () => {
    sound.playClick();
    if (uploadedImages.length > 0) {
      setShowMergeModal(true);
    } else {
      startDeckGeneration(4);
    }
  };

  const startDeckGeneration = async (imagesPerSlideChoice: number) => {
    setShowMergeModal(false);
    setLastImagesPerSlide(imagesPerSlideChoice);
    setStep('generating');
    setGenProgress(15);
    setGenStatusText(`جاري تحليل مهارات وأصوات حرف (${selectedLetter.char} - ${selectedLetter.name})...`);

    await new Promise(r => setTimeout(r, 320));
    setGenProgress(45);
    setGenStatusText('جاري اختيار تصميم جديد وقالب منظم مختلف كلياً...');

    const deck = generateLetterPresentationDeck(
      selectedLetter,
      words,
      uploadedImages,
      includeCustomBankWords,
      imagesPerSlideChoice
    );

    // Pre-convert SVG illustrations into crisp PNG data URLs so both editor & exports are fast and reliable
    setGenProgress(75);
    setGenStatusText('جاري تجهيز الصور والرسومات التوضيحية للشرائح والـ PDF...');
    const normalizedSlides = await Promise.all(
      deck.slides.map(async s => {
        const updatedItems = await Promise.all(
          s.items.map(async item => {
            if (item.image && item.image.startsWith('data:image/svg')) {
              const png = await ensurePngDataUrl(item.image);
              return { ...item, image: png || item.image };
            }
            return item;
          })
        );
        return { ...s, items: updatedItems };
      })
    );

    await new Promise(r => setTimeout(r, 320));
    setGenProgress(100);
    setGenStatusText('اكتمل إعداد العرض والملف بنجاح!');

    setTheme(deck.theme);
    setSlides(normalizedSlides);
    setGenerationCount(deck.generationNumber);
    setActiveSlideIndex(0);
    setExportStatus({ type: null, progress: 0, message: '', doneMessage: '', error: '' });

    await new Promise(r => setTimeout(r, 250));
    sound.playVictory();
    setStep('editor');
  };

  // Regenerate a completely different layout & theme for the same letter
  const handleRegenerateFreshDesign = async () => {
    sound.playSnap();
    const deck = generateLetterPresentationDeck(
      selectedLetter,
      words,
      uploadedImages,
      includeCustomBankWords,
      lastImagesPerSlide
    );
    const normalizedSlides = await Promise.all(
      deck.slides.map(async s => ({
        ...s,
        items: await Promise.all(
          s.items.map(async item => {
            if (item.image && item.image.startsWith('data:image/svg')) {
              const png = await ensurePngDataUrl(item.image);
              return { ...item, image: png || item.image };
            }
            return item;
          })
        ),
      }))
    );
    setTheme(deck.theme);
    setSlides(normalizedSlides);
    setGenerationCount(deck.generationNumber);
    setActiveSlideIndex(0);
  };

  const activeSlide = slides[activeSlideIndex];

  const handleSwapItems = (fromIdx: number, toIdx: number) => {
    if (!activeSlide) return;
    if (toIdx < 0 || toIdx >= activeSlide.items.length) return;
    sound.playSnap();
    const next = [...activeSlide.items];
    [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
    updateActiveSlide({ items: next });
  };

  const handleSwapImages = (fromIdx: number, toIdx: number) => {
    if (!activeSlide || !activeSlide.uploadedImages) return;
    if (toIdx < 0 || toIdx >= activeSlide.uploadedImages.length) return;
    sound.playSnap();
    const next = [...activeSlide.uploadedImages];
    [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
    updateActiveSlide({ uploadedImages: next });
  };

  const updateActiveSlide = (patch: Partial<PresentationSlide>) => {
    setSlides(prev =>
      prev.map((s, idx) => (idx === activeSlideIndex ? { ...s, ...patch } : s))
    );
  };

  const updateSlideItem = (itemId: string, field: 'label' | 'value' | 'subtext', val: string) => {
    if (!activeSlide) return;
    const nextItems = activeSlide.items.map(it =>
      it.id === itemId ? { ...it, [field]: val } : it
    );
    updateActiveSlide({ items: nextItems });
  };

  const addSlideItem = () => {
    if (!activeSlide) return;
    sound.playClick();
    const nextItems = [
      ...activeSlide.items,
      {
        id: `item-${Date.now()}`,
        label: 'بطاقة جديدة',
        value: selectedLetter.char,
        subtext: 'مثال جديد',
      },
    ];
    updateActiveSlide({ items: nextItems });
  };

  const removeSlideItem = (itemId: string) => {
    if (!activeSlide) return;
    sound.playClick();
    updateActiveSlide({ items: activeSlide.items.filter(i => i.id !== itemId) });
  };

  const handleAddImageToActiveSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeSlide) return;
    const newImgs = await processImageFiles(e.target.files);
    if (newImgs.length > 0) {
      sound.playSuccess();
      const existing = activeSlide.uploadedImages || [];
      updateActiveSlide({
        uploadedImages: [
          ...existing,
          ...newImgs.map(im => ({ id: im.id, dataUrl: im.dataUrl, caption: im.caption })),
        ],
      });
    }
    if (e.target) e.target.value = '';
  };

  const handleAddNewCustomSlide = (mode: 'text' | 'photo') => {
    sound.playClick();
    const newSlide: PresentationSlide =
      mode === 'photo'
        ? {
            id: `slide-custom-${Date.now()}`,
            kind: 'uploaded_gallery',
            layoutVariant: 'gallery-grid',
            title: `بِطَاقَاتٌ وَصُوَرٌ إِضَافِيَّةٌ لِحَرْفِ (${selectedLetter.char})`,
            subtitle: 'شريحة صور مضافة من قِبل المعلم',
            badgeText: 'شريحة إضافية',
            highlightLetter: selectedLetter.char,
            items: [],
            uploadedImages: [],
            teacherNote: 'إشراف المعلم وائل حمدي',
          }
        : {
            id: `slide-custom-${Date.now()}`,
            kind: 'custom',
            layoutVariant: 'list-clean',
            title: `مُلَاحَظَاتٌ وَتَدْرِيبٌ إِضَافِيٌّ لِحَرْفِ (${selectedLetter.char})`,
            subtitle: 'اكتب هنا ما يناسب طلاب صفك',
            badgeText: 'شريحة حرة',
            highlightLetter: selectedLetter.char,
            bodyText: 'اكتب النص أو النشاط الذي تود عرضه للطلاب هنا...',
            items: [],
            teacherNote: 'إشراف المعلم وائل حمدي',
          };

    setSlides(prev => {
      const next = [...prev, newSlide];
      setActiveSlideIndex(next.length - 1);
      return next;
    });
  };

  const handleDuplicateSlide = (idx: number) => {
    sound.playClick();
    const src = slides[idx];
    const clone: PresentationSlide = {
      ...src,
      id: `slide-dup-${Date.now()}`,
      title: `${src.title} (نسخة)`,
      items: src.items.map(it => ({ ...it, id: `${it.id}-copy-${Math.random()}` })),
      uploadedImages: src.uploadedImages?.map(im => ({ ...im, id: `${im.id}-copy` })),
    };
    const next = [...slides];
    next.splice(idx + 1, 0, clone);
    setSlides(next);
    setActiveSlideIndex(idx + 1);
  };

  const handleDeleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    sound.playClick();
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    setActiveSlideIndex(Math.max(0, Math.min(activeSlideIndex, next.length - 1)));
  };

  const handleMoveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    sound.playClick();
    const next = [...slides];
    [next[idx], next[target]] = [next[target], next[idx]];
    setSlides(next);
    setActiveSlideIndex(target);
  };

  const handleDownloadPptx = async () => {
    sound.playClick();
    setExportStatus({
      type: 'pptx',
      progress: 5,
      message: 'جاري إنشاء ملف الباوربوينت (.pptx)...',
      doneMessage: '',
      error: '',
    });

    try {
      await exportToPptx(slides, theme, selectedLetter, (progress, message) => {
        setExportStatus(prev => ({ ...prev, progress, message }));
      });
      sound.playSuccess();
      setExportStatus({
        type: null,
        progress: 100,
        message: '',
        doneMessage: `تم حفظ ملف الباوربوينت (حرف_${selectedLetter.name}.pptx) بنجاح!`,
        error: '',
      });
    } catch (err) {
      console.error(err);
      setExportStatus({
        type: null,
        progress: 0,
        message: '',
        doneMessage: '',
        error: 'تعذّر تصدير ملف الباوربوينت، يرجى المحاولة مرة أخرى.',
      });
    }
  };

  const handleDownloadPdf = async () => {
    sound.playClick();
    setExportStatus({
      type: 'pdf',
      progress: 5,
      message: 'جاري إنشاء ملف الـ PDF وتنسيق الصفحات...',
      doneMessage: '',
      error: '',
    });

    try {
      const elements = slides
        .map((_, idx) => exportSlideRefs.current[idx])
        .filter((el): el is HTMLDivElement => el !== null);

      await exportToPdf(elements, selectedLetter, (progress, message) => {
        setExportStatus(prev => ({ ...prev, progress, message }));
      });
      sound.playSuccess();
      setExportStatus({
        type: null,
        progress: 100,
        message: '',
        doneMessage: `تم حفظ ملف الـ PDF (حرف_${selectedLetter.name}.pdf) بنجاح!`,
        error: '',
      });
    } catch (err) {
      console.error(err);
      setExportStatus({
        type: null,
        progress: 0,
        message: '',
        doneMessage: '',
        error: 'تعذّر تصدير ملف الـ PDF، يرجى المحاولة مرة أخرى.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" dir="rtl">
      {/* TOP BAR FOR STUDIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            استوديو إصدار العروض التقديمية وملفات PDF
          </h2>
          <p className="text-sm font-bold text-slate-500 mt-1">
            بقيادة المعلم وائل حمدي · تصميم عروض منظمة ومتنوعة تلقائياً لكل حرف مع إمكانية التعديل والحفظ
          </p>
        </div>

        <button
          id="btn-studio-back-platform"
          onClick={() => {
            sound.playClick();
            onBackToPlatform();
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-300 shadow-xs transition-all whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للمنصة الرئيسية</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* STEP 1: SETUP (PICK LETTER + OPTIONAL IMAGE UPLOAD + CONFIRM)     */}
      {/* ================================================================= */}
      {step === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Right: Pick Letter (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  1. اختر الحرف المطلوب إصدار ملف له
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                  في كل مرة يتم توليد تصميم وتنسيق وأمثلة جديدة ومرتبة مختلفة عن المرة السابقة
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-sm shrink-0">
                {selectedLetter.char}
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
              {ARABIC_LETTERS.map(l => {
                const isSelected = l.id === selectedLetter.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedLetter(l);
                    }}
                    className={`h-16 rounded-2xl font-black text-2xl transition-all flex flex-col items-center justify-center border-2 focus-visible:outline-2 focus-visible:outline-amber-500 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.03]'
                        : 'bg-slate-50 hover:bg-amber-50 text-slate-800 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <span className="leading-none">{l.char}</span>
                    <span
                      className={`text-[10px] font-bold mt-1 ${
                        isSelected ? 'text-amber-300' : 'text-slate-400'
                      }`}
                    >
                      {l.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left: Upload Custom Images + Confirm (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                2. رفع صور إضافية للـ PDF والباوربوينت (اختياري)
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                أضف أي صور من جهازك (بطاقات، أوراق عمل، رسومات) وسيتم دمجها في شرائح مرتبة تلقائياً
              </p>
            </div>

            {/* Hidden File Input */}
            <input
              ref={setupFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleSetupUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setupFileInputRef.current?.click()}
              className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 transition-colors flex flex-col items-center justify-center gap-2 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-black text-slate-800">
                اضغط لاختيار صورة أو عدة صور من جهازك
              </span>
              <span className="text-xs font-medium text-slate-500">
                يدعم PNG و JPG و WebP — يمكنك تعديل التسمية لكل صورة
              </span>
            </button>

            {uploadError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                {uploadError}
              </p>
            )}

            {/* Uploaded Images List */}
            {uploadedImages.length > 0 && (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pl-1">
                <div className="text-xs font-black text-slate-600">
                  الصور المرفوعة ({uploadedImages.length}):
                </div>
                {uploadedImages.map(img => (
                  <div
                    key={img.id}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.caption}
                      className="w-14 h-14 object-contain rounded-xl bg-white border border-slate-200 shrink-0"
                    />
                    <input
                      type="text"
                      value={img.caption}
                      onChange={e =>
                        setUploadedImages(prev =>
                          prev.map(item =>
                            item.id === img.id ? { ...item, caption: e.target.value } : item
                          )
                        )
                      }
                      placeholder="عنوان أو كلمة الصورة..."
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setUploadedImages(prev => prev.filter(item => item.id !== img.id));
                      }}
                      title="حذف الصورة"
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Include Custom Bank Words Toggle */}
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCustomBankWords}
                onChange={e => setIncludeCustomBankWords(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded"
              />
              <span className="text-sm font-bold text-slate-700">
                إدراج الكلمات والصور المضافة في بنك الكلمات لهذا الحرف
              </span>
            </label>

            {/* Primary Confirm Button */}
            <button
              id="btn-confirm-generate-deck"
              type="button"
              onClick={handleConfirmClick}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-amber-400" />
              <span>تأكيد وإنشاء الباوربوينت والـ PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: ASK TEACHER ABOUT MERGING UPLOADED IMAGES BEFORE CREATION  */}
      {/* ================================================================= */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    هل تود دمج الصور في شريحة واحدة؟
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5">
                    لديك {uploadedImages.length} صورة مرفوعة — اختر طريقة توزيعها في العرض والـ PDF
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Merge ALL into 1 slide */}
              <button
                id="btn-merge-all-one-slide"
                type="button"
                onClick={() => {
                  sound.playClick();
                  startDeckGeneration(-1);
                }}
                className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-right transition-all flex items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="font-black text-base">
                    نعم، دمج جميع الصور في شريحة واحدة
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    تظهر جميع الصور ({uploadedImages.length}) معاً بشكل منظم داخل صفحة واحدة
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              </button>

              {/* Option 2: Specific custom number per slide (e.g. 2 or 3) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div>
                  <div className="font-black text-sm text-slate-900">
                    أو اكتب عدد الصور المطلوب في كل شريحة (مثلاً 2 أو 3):
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    id="input-custom-images-per-slide"
                    type="number"
                    min={1}
                    max={Math.max(uploadedImages.length, 12)}
                    value={customPerSlideCount}
                    onChange={e => setCustomPerSlideCount(e.target.value)}
                    className="w-24 px-3 py-2.5 rounded-xl bg-white border border-amber-300 text-center font-black text-lg text-slate-900 focus:outline-none focus:border-amber-600 tabular-nums"
                  />
                  <button
                    id="btn-apply-custom-images-count"
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      const parsed = parseInt(customPerSlideCount, 10);
                      const validCount = Number.isFinite(parsed) && parsed >= 1 ? parsed : 2;
                      startDeckGeneration(validCount);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm transition-colors"
                  >
                    تقسيم ({Math.max(1, parseInt(customPerSlideCount, 10) || 2)} صور بكل شريحة) والمتابعة
                  </button>
                </div>
              </div>

              {/* Option 3: Every image in its own slide */}
              <button
                id="btn-each-image-own-slide"
                type="button"
                onClick={() => {
                  sound.playClick();
                  startDeckGeneration(1);
                }}
                className="w-full p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-right border border-slate-200 transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-black text-base">كل صورة بشريحة</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    إفراد شريحة كبيرة مستقلة لكل صورة ({uploadedImages.length} شرائح)
                  </div>
                </div>
                <ImagePlus className="w-5 h-5 text-slate-700 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 2: GENERATING / WAITING FOR COMPLETION                       */}
      {/* ================================================================= */}
      {step === 'generating' && (
        <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-lg text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">
              جاري إعداد عرض وملف حرف ({selectedLetter.char} - {selectedLetter.name})
            </h3>
            <p className="text-sm font-bold text-slate-500">{genStatusText}</p>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-amber-500 to-orange-600 transition-all duration-300 rounded-full"
              style={{ width: `${genProgress}%` }}
            />
          </div>

          <div className="text-xs font-extrabold text-slate-400 tabular-nums">
            {genProgress}% مكتمل · إشراف المعلم وائل حمدي
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 3: INTERACTIVE SLIDE EDITOR & PPTX / PDF EXPORT              */}
      {/* ================================================================= */}
      {step === 'editor' && activeSlide && (
        <div className="space-y-5">
          {/* ACTION TOOLBAR */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setStep('setup');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors whitespace-nowrap shrink-0"
              >
                اختيار حرف آخر ({selectedLetter.char})
              </button>

              <button
                id="btn-regenerate-deck"
                type="button"
                onClick={handleRegenerateFreshDesign}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-sm border border-amber-300 transition-colors whitespace-nowrap shrink-0"
              >
                <Shuffle className="w-4 h-4 text-amber-700" />
                <span>تغيير التصميم والشكل بالكامل</span>
              </button>

              <span className="text-xs font-bold text-slate-500 px-2">
                النسخة رقم {generationCount} · {slides.length} شرائح · {theme.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="btn-export-pptx"
                type="button"
                disabled={exportStatus.type !== null}
                onClick={handleDownloadPptx}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-black text-sm shadow-sm transition-all whitespace-nowrap shrink-0"
              >
                {exportStatus.type === 'pptx' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Presentation className="w-4 h-4" />
                )}
                <span>حفظ كـ باوربوينت (PPTX)</span>
              </button>

              <button
                id="btn-export-pdf"
                type="button"
                disabled={exportStatus.type !== null}
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black text-sm shadow-sm transition-all whitespace-nowrap shrink-0"
              >
                {exportStatus.type === 'pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>حفظ كـ ملف PDF</span>
              </button>
            </div>
          </div>

          {/* EXPORT PROGRESS / FEEDBACK BANNER */}
          {(exportStatus.type || exportStatus.doneMessage || exportStatus.error) && (
            <div
              className={`px-5 py-3.5 rounded-2xl border font-bold text-sm flex items-center justify-between gap-4 ${
                exportStatus.error
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : exportStatus.doneMessage
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {exportStatus.type ? (
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                ) : exportStatus.doneMessage ? (
                  <Download className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : null}
                <span>
                  {exportStatus.error || exportStatus.doneMessage || exportStatus.message}
                </span>
              </div>
              {exportStatus.type && (
                <span className="tabular-nums font-black">{exportStatus.progress}%</span>
              )}
            </div>
          )}

          {/* TWO-ZONE EDITOR LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* RIGHT SIDEBAR: SLIDE FILMSTRIP & THEME SWITCHER (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Slides List */}
              <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900">
                    شرائح العرض ({slides.length})
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddNewCustomSlide('text')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1 whitespace-nowrap"
                      title="إضافة شريحة نصية جديدة"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>شريحة نص</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddNewCustomSlide('photo')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black flex items-center gap-1 whitespace-nowrap"
                      title="إضافة شريحة صور جديدة"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>شريحة صور</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pl-1">
                  {slides.map((s, idx) => {
                    const isActive = idx === activeSlideIndex;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          sound.playClick();
                          setActiveSlideIndex(idx);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isActive
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 hover:bg-amber-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 tabular-nums ${
                                isActive ? 'bg-amber-500 text-slate-950' : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-sm font-black truncate">{s.title}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleMoveSlide(idx, -1)}
                            disabled={idx === 0}
                            title="تحريك لأعلى"
                            className={`p-1.5 rounded-lg disabled:opacity-30 ${
                              isActive ? 'hover:bg-white/15' : 'hover:bg-slate-200'
                            }`}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSlide(idx, 1)}
                            disabled={idx === slides.length - 1}
                            title="تحريك لأسفل"
                            className={`p-1.5 rounded-lg disabled:opacity-30 ${
                              isActive ? 'hover:bg-white/15' : 'hover:bg-slate-200'
                            }`}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateSlide(idx)}
                            title="تكرار الشريحة"
                            className={`p-1.5 rounded-lg ${
                              isActive ? 'hover:bg-white/15' : 'hover:bg-slate-200'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlide(idx)}
                            disabled={slides.length <= 1}
                            title="حذف الشريحة"
                            className={`p-1.5 rounded-lg disabled:opacity-30 ${
                              isActive ? 'hover:bg-rose-500/30 text-rose-300' : 'hover:bg-rose-100 text-rose-600'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Theme Color & Pattern Picker */}
              <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    قوالب الألوان والأشكال الهندسية
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DECK_THEMES.map(th => {
                    const isCurrent = th.id === theme.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setTheme(th);
                        }}
                        className={`p-2.5 rounded-xl border text-right text-xs font-black transition-all flex items-center gap-2 ${
                          isCurrent
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border border-black/15"
                          style={{ backgroundColor: th.primaryHex }}
                        />
                        <span className="truncate">{th.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LEFT/CENTER STAGE: LIVE 16:9 PREVIEW + INLINE EDITOR (8 cols) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Interactive On-Slide Placement & Visual Improvement Bar */}
              <div className="bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Text Alignment */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          updateActiveSlide({ textAlign: 'right' });
                        }}
                        title="محاذاة لليمين"
                        className={`p-1.5 rounded-lg transition-colors ${
                          (activeSlide.textAlign || 'right') === 'right'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          updateActiveSlide({ textAlign: 'center' });
                        }}
                        title="توسيط النصوص"
                        className={`p-1.5 rounded-lg transition-colors ${
                          activeSlide.textAlign === 'center'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          updateActiveSlide({ textAlign: 'left' });
                        }}
                        title="محاذاة لليسار"
                        className={`p-1.5 rounded-lg transition-colors ${
                          activeSlide.textAlign === 'left'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Swap Positions Inside Page */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        if (activeSlide.kind === 'cover' || activeSlide.kind === 'closing' || activeSlide.layoutVariant === 'list-clean') {
                          updateActiveSlide({ swapPositions: !activeSlide.swapPositions });
                        } else {
                          const nextSide =
                            activeSlide.headerLetterSide === 'right'
                              ? 'left'
                              : activeSlide.headerLetterSide === 'hidden'
                              ? 'right'
                              : 'right';
                          updateActiveSlide({ headerLetterSide: nextSide });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-black transition-colors"
                      title="تبديل أماكن العناصر داخل الشريحة"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-amber-700" />
                      <span>تبديل الأماكن يمين/يسار</span>
                    </button>

                    {/* Column count override for cards/images */}
                    {activeSlide.kind !== 'cover' && activeSlide.layoutVariant !== 'list-clean' && (
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <Columns className="w-3.5 h-3.5 text-slate-500 mx-1" />
                        {[undefined, 2, 3, 4].map(cols => (
                          <button
                            key={String(cols)}
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              updateActiveSlide({ columnsOverride: cols as 2 | 3 | 4 | undefined });
                            }}
                            className={`px-2 py-1 rounded-lg text-xs font-black transition-colors ${
                              activeSlide.columnsOverride === cols
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {cols ? `${cols} أعمدة` : 'تلقائي'}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Font Size Scale */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <Type className="w-3.5 h-3.5 text-slate-500 mx-1" />
                      {(
                        [
                          { id: 'sm', label: 'صغير' },
                          { id: 'md', label: 'متوسط' },
                          { id: 'lg', label: 'كبير' },
                        ] as const
                      ).map(sz => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            updateActiveSlide({ fontScale: sz.id });
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-black transition-colors ${
                            (activeSlide.fontScale || 'md') === sz.id
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs font-bold text-slate-500">
                  تلميح التعديل السريع: اضغط على أي نص أو كلمة داخل الشريحة بالأسفل لتصحيحها وتعديلها مباشرة، أو اسحب البطاقات والصور (أو استخدم الأسهم فوقها) لتغيير أماكنها داخل الصفحة.
                </p>
              </div>

              {/* Live WYSIWYG Preview (Interactive!) */}
              <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
                <div
                  ref={previewContainerRef}
                  dir="ltr"
                  className="w-full aspect-video relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                >
                  <div
                    style={{
                      width: 1280,
                      height: 720,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <SlideRenderer
                      slide={activeSlide}
                      theme={theme}
                      letter={selectedLetter}
                      slideIndex={activeSlideIndex}
                      totalSlides={slides.length}
                      isEditable={true}
                      onUpdateSlide={updateActiveSlide}
                      onSwapItems={handleSwapItems}
                      onSwapImages={handleSwapImages}
                    />
                  </div>
                </div>
              </div>

              {/* Contextual Edit Controls for Active Slide */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-black text-slate-900">
                      تعديل محتوى الشريحة {activeSlideIndex + 1}
                    </h3>
                  </div>

                  {/* Layout variant switcher */}
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-slate-400" />
                    <select
                      value={activeSlide.layoutVariant}
                      onChange={e =>
                        updateActiveSlide({ layoutVariant: e.target.value as SlideLayoutVariant })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800"
                    >
                      {activeSlide.kind === 'cover' ? (
                        <>
                          <option value="hero-split">تخطيط: غلاف منقسم</option>
                          <option value="hero-centered">تخطيط: غلاف متمركز</option>
                          <option value="hero-arch">تخطيط: غلاف قوسي</option>
                        </>
                      ) : activeSlide.kind === 'uploaded_gallery' || activeSlide.kind === 'vocabulary' ? (
                        <>
                          <option value="gallery-grid">تخطيط: شبكة الصور</option>
                        </>
                      ) : (
                        <>
                          <option value="cards-4">تخطيط: بطاقات متجاورة</option>
                          <option value="cards-3">تخطيط: 3 أعمدة</option>
                          <option value="list-clean">تخطيط: قائمة أفقية</option>
                          <option value="activity-sheet">تخطيط: ورقة نشاط</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Title, Subtitle, Badge, Teacher Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">
                      عنوان الشريحة
                    </label>
                    <input
                      type="text"
                      value={activeSlide.title}
                      onChange={e => updateActiveSlide({ title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">
                      عنوان القسم العلوي
                    </label>
                    <input
                      type="text"
                      value={activeSlide.badgeText || ''}
                      onChange={e => updateActiveSlide({ badgeText: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-600 mb-1">
                      الوصف / العنوان الفرعي
                    </label>
                    <input
                      type="text"
                      value={activeSlide.subtitle}
                      onChange={e => updateActiveSlide({ subtitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {(activeSlide.kind === 'cover' ||
                    activeSlide.kind === 'closing' ||
                    activeSlide.kind === 'custom') && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-slate-600 mb-1">
                        النص الرئيسي داخل الشريحة
                      </label>
                      <textarea
                        rows={3}
                        value={activeSlide.bodyText || ''}
                        onChange={e => updateActiveSlide({ bodyText: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">
                      تذييل وتوقيع المعلم
                    </label>
                    <input
                      type="text"
                      value={activeSlide.teacherNote}
                      onChange={e => updateActiveSlide({ teacherNote: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">
                      الحرف البارز في الزاوية
                    </label>
                    <input
                      type="text"
                      value={activeSlide.highlightLetter || ''}
                      onChange={e => updateActiveSlide({ highlightLetter: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Items / Cards Editor */}
                {activeSlide.kind !== 'cover' && activeSlide.kind !== 'uploaded_gallery' && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-800">
                        البطاقات والعناصر ({activeSlide.items.length})
                      </span>
                      <button
                        type="button"
                        onClick={addSlideItem}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة بطاقة</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeSlide.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-500">
                              عنصر {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSlideItem(item.id)}
                              className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg"
                              title="حذف العنصر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={item.label}
                            onChange={e => updateSlideItem(item.id, 'label', e.target.value)}
                            placeholder="العنوان"
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                          />
                          <input
                            type="text"
                            value={item.value}
                            onChange={e => updateSlideItem(item.id, 'value', e.target.value)}
                            placeholder="القيمة أو الحرف"
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-black"
                          />
                          <input
                            type="text"
                            value={item.subtext || ''}
                            onChange={e => updateSlideItem(item.id, 'subtext', e.target.value)}
                            placeholder="ملاحظة أو مثال"
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uploaded Images Editor on Current Slide */}
                {(activeSlide.kind === 'uploaded_gallery' ||
                  (activeSlide.uploadedImages && activeSlide.uploadedImages.length > 0)) && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-800">
                        الصور داخل هذه الشريحة ({activeSlide.uploadedImages?.length || 0})
                      </span>
                      <input
                        ref={slideFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddImageToActiveSlide}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => slideFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-black flex items-center gap-1"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>إضافة صور لهذه الشريحة</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(activeSlide.uploadedImages || []).map(img => (
                        <div
                          key={img.id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200"
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.caption}
                            className="w-16 h-16 object-contain rounded-xl bg-white border border-slate-200 shrink-0"
                          />
                          <input
                            type="text"
                            value={img.caption}
                            onChange={e => {
                              const nextImgs = (activeSlide.uploadedImages || []).map(im =>
                                im.id === img.id ? { ...im, caption: e.target.value } : im
                              );
                              updateActiveSlide({ uploadedImages: nextImgs });
                            }}
                            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextImgs = (activeSlide.uploadedImages || []).filter(
                                im => im.id !== img.id
                              );
                              updateActiveSlide({ uploadedImages: nextImgs });
                            }}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HIDDEN FULL-SIZE 1280x720 RENDER STAGE FOR PDF EXPORT */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              left: '-20000px',
              top: 0,
              pointerEvents: 'none',
              zIndex: -1,
            }}
          >
            {slides.map((s, idx) => (
              <div
                key={`export-${s.id}`}
                ref={el => {
                  exportSlideRefs.current[idx] = el;
                }}
              >
                <SlideRenderer
                  slide={s}
                  theme={theme}
                  letter={selectedLetter}
                  slideIndex={idx}
                  totalSlides={slides.length}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
