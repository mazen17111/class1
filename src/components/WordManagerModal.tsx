import React, { useState, useRef } from 'react';
import { 
  X, Plus, Upload, Trash2, Image as ImageIcon, Sparkles, 
  Check, Filter, Search, BookOpen
} from 'lucide-react';
import { ArabicLetter, LetterPosition, MaddType, ShortVowel, WordItem } from '../types';
import { ARABIC_LETTERS, createSvgIllustration } from '../data/arabicData';
import { removeTashkeel } from '../utils/questionGenerator';
import { sound } from '../utils/audio';

interface WordManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: WordItem[];
  onAddWord: (word: WordItem) => void;
  onDeleteWord: (id: string) => void;
}

export const WordManagerModal: React.FC<WordManagerModalProps> = ({
  isOpen,
  onClose,
  words,
  onAddWord,
  onDeleteWord,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [filterLetter, setFilterLetter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add word form state
  const [newWordText, setNewWordText] = useState('');
  const [targetLetter, setTargetLetter] = useState('أ');
  const [position, setPosition] = useState<LetterPosition>('beginning');
  const [maddType, setMaddType] = useState<MaddType>('none');
  const [shortVowel, setShortVowel] = useState<ShortVowel>('fatha');
  const [meaning, setMeaning] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle local file image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      return;
    }

    // Read as Base64 Data URL
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setImageError('');
      sound.playSuccess();
    };
    reader.onerror = () => {
      setImageError('حدث خطأ أثناء قراءة الصورة من الجهاز.');
    };
    reader.readAsDataURL(file);
  };

  // Quick fallback emoji illustration generator if user wants an instant icon
  const handleGeneratePresetIcon = (emoji: string) => {
    sound.playClick();
    const svg = createSvgIllustration(emoji, ['#FED7AA', '#EA580C'], newWordText || 'كلمة جديدة');
    setImagePreview(svg);
    setImageError('');
  };

  const handleSaveWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordText.trim()) return;

    if (!imagePreview) {
      // If no image uploaded, provide a clean default illustration
      const fallbackSvg = createSvgIllustration('📖', ['#BAE6FD', '#0284C7'], newWordText.trim());
      setImagePreview(fallbackSvg);
    }

    const newItem: WordItem = {
      id: `custom-${Date.now()}`,
      word: newWordText.trim(),
      cleanWord: removeTashkeel(newWordText.trim()),
      targetLetter,
      position,
      maddType,
      shortVowel,
      image: imagePreview || createSvgIllustration('📖', ['#BAE6FD', '#0284C7'], newWordText.trim()),
      meaning: meaning.trim() || undefined,
      isCustom: true,
    };

    sound.playSuccess();
    onAddWord(newItem);

    // Reset form
    setNewWordText('');
    setMeaning('');
    setImagePreview('');
    setActiveTab('list');
    setFilterLetter(targetLetter);
  };

  // Filter words
  const filteredWords = words.filter((w) => {
    const matchesLetter = filterLetter === 'all' || w.targetLetter === filterLetter;
    const matchesSearch = !searchQuery || w.word.includes(searchQuery) || w.cleanWord.includes(searchQuery);
    return matchesLetter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-amber-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black">
                إدارة الكلمات والصور التعليمية 📚
              </h3>
              <p className="text-xs sm:text-sm text-amber-100">
                قاعدة كلمات الحروف والمدود وإمكانية رفع صور جديدة من الجهاز
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white active:scale-95 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('list');
            }}
            className={`px-5 py-3 font-black text-sm rounded-t-2xl transition-all ${
              activeTab === 'list'
                ? 'bg-white text-orange-600 border-t-2 border-x-2 border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            قائمة الكلمات الحالية ({words.length})
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('add');
            }}
            className={`px-5 py-3 font-black text-sm rounded-t-2xl transition-all flex items-center gap-2 ${
              activeTab === 'add'
                ? 'bg-white text-orange-600 border-t-2 border-x-2 border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>إضافة كلمة وصورة جديدة ➕</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: WORDS LIST */}
          {activeTab === 'list' && (
            <div>
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن كلمة..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">تصفية بالحرف:</span>
                  <select
                    value={filterLetter}
                    onChange={(e) => setFilterLetter(e.target.value)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="all">جميع الحروف (28)</option>
                    {ARABIC_LETTERS.map((l) => (
                      <option key={l.id} value={l.char}>
                        حرف {l.name} ({l.char})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid of words */}
              {filteredWords.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="font-bold text-base">لا توجد كلمات مطابقة للبحث أو الحرف المختار!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredWords.map((item) => {
                    const posLabel = 
                      item.position === 'beginning' ? 'بداية' :
                      item.position === 'middle' ? 'وسط' : 'نهاية';

                    const maddLabel = 
                      item.maddType === 'alif' ? 'مد بالألف' :
                      item.maddType === 'waw' ? 'مد بالواو' :
                      item.maddType === 'yaa' ? 'مد بالياء' : 'بدون مد';

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-col items-center text-center relative group hover:shadow-md transition-all"
                      >
                        <img
                          src={item.image}
                          alt={item.word}
                          className="w-full h-24 object-contain rounded-xl bg-white p-1 mb-2"
                        />
                        <span className="text-xl font-black text-slate-900 mb-1">
                          {item.word}
                        </span>

                        <div className="flex flex-wrap gap-1 justify-center text-[10px] font-bold text-slate-500 mb-1">
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                            حرف: {item.targetLetter}
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md">
                            {posLabel}
                          </span>
                          {item.maddType !== 'none' && (
                            <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md">
                              {maddLabel}
                            </span>
                          )}
                        </div>

                        {item.isCustom && (
                          <button
                            onClick={() => {
                              sound.playClick();
                              onDeleteWord(item.id);
                            }}
                            title="حذف الكلمة المضافة"
                            className="absolute top-2 left-2 p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD NEW WORD & UPLOAD IMAGE */}
          {activeTab === 'add' && (
            <form onSubmit={handleSaveWord} className="max-w-2xl mx-auto space-y-6">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-semibold leading-relaxed">
                🌟 يتيح لك هذا النموذج إضافة كلمات مخصصة جديدة وربطها بصورة خاصة يتم رفعها مباشرة من جهازك (كمبيوتر، تابلت، أو جوال)، مع تحديد الحرف، موضع الحرف، ونوع المد.
              </div>

              {/* 1. Word text & Target Letter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-slate-800 mb-1">
                    الكلمة (مع التشكيل أو بدونه) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWordText}
                    onChange={(e) => setNewWordText(e.target.value)}
                    placeholder="مثال: غَزَالٌ أو بَابٌ"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 font-bold text-lg focus:border-amber-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-800 mb-1">
                    الحرف المستهدف *
                  </label>
                  <select
                    value={targetLetter}
                    onChange={(e) => setTargetLetter(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 font-black text-lg focus:border-amber-500 focus:bg-white focus:outline-hidden"
                  >
                    {ARABIC_LETTERS.map((l) => (
                      <option key={l.id} value={l.char}>
                        حرف {l.name} ({l.char})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Position & Madd Type & Short Vowel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    موضع الحرف في الكلمة
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as LetterPosition)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-sm focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="beginning">أول الكلمة (في البداية)</option>
                    <option value="middle">وسط الكلمة (في المنتصف)</option>
                    <option value="end">آخر الكلمة (في النهاية)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    نوع المد (إن وجد)
                  </label>
                  <select
                    value={maddType}
                    onChange={(e) => setMaddType(e.target.value as MaddType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-sm focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="none">بدون مد (حركة قصيرة)</option>
                    <option value="alif">مد بالألف (ـَا)</option>
                    <option value="waw">مد بالواو (ـُو)</option>
                    <option value="yaa">مد بالياء (ـِي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    الحركة القصيرة
                  </label>
                  <select
                    value={shortVowel}
                    onChange={(e) => setShortVowel(e.target.value as ShortVowel)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-sm focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="fatha">فَتْحَة (ـَ)</option>
                    <option value="damma">ضَمَّة (ـُ)</option>
                    <option value="kasra">كَسْرَة (ـِ)</option>
                    <option value="sukoon">سُكُون (ـْ)</option>
                  </select>
                </div>
              </div>

              {/* 3. Meaning / description */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  معنى توضيحي بسيط للأطفال (اختياري)
                </label>
                <input
                  type="text"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder="مثال: حيوان سريع يعيش في الغابة"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* 4. REQUIREMENT: «إضافة صورة للكلمة» من الجهاز */}
              <div className="border-2 border-dashed border-amber-300 rounded-3xl p-6 bg-amber-50/40 text-center">
                <h4 className="text-base font-black text-slate-900 mb-1 flex items-center justify-center gap-2">
                  <ImageIcon className="w-5 h-5 text-orange-600" />
                  <span>إضافة صورة للكلمة (رفع من الجهاز) *</span>
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  اختر صورة من جهازك لربطها بالكلمة وعرضها في الأسئلة والأنشطة التفاعلية
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                  <button
                    type="button"
                    id="btn-upload-image-file"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-white border-2 border-amber-400 hover:bg-amber-100/60 text-amber-950 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xs active:scale-95 transition-all"
                  >
                    <Upload className="w-4 h-4 text-orange-600" />
                    <span>تصفح واختيار صورة من جهازي 📁</span>
                  </button>
                </div>

                {/* Quick preset emojis if user wants an instant image */}
                <div className="text-[11px] text-slate-400 font-semibold mb-2">
                  أو اختر أيقونة توضيحية سريعة بنقرة واحدة:
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
                  {['🦁', '🐻', '🍎', '🚗', '🚀', '⭐', '🎈', '⛵', '🏠', '🎁'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleGeneratePresetIcon(emoji)}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-amber-400 text-lg flex items-center justify-center shadow-xs active:scale-95 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Image Preview Box */}
                {imagePreview ? (
                  <div className="p-3 bg-white rounded-2xl border border-amber-200 inline-block shadow-md">
                    <span className="text-xs font-bold text-slate-500 block mb-1">معاينة الصورة المختارة:</span>
                    <img
                      src={imagePreview}
                      alt="معاينة"
                      className="w-48 h-32 object-contain rounded-xl bg-slate-50 mx-auto"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    لم يتم تحديد صورة بعد (سيتم استخدام رسم توضيحي تلقائي إن لم ترفع صورة)
                  </div>
                )}

                {imageError && (
                  <div className="text-xs font-bold text-red-600 mt-2">
                    {imageError}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={!newWordText.trim()}
                  className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  حفظ الكلمة والصورة في قاعدة البيانات ✅
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
