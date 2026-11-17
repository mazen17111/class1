import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Link2,
  Save,
  RotateCcw,
  ShieldCheck,
  Image as ImageIcon,
  CheckCircle2,
  Palette,
  Type,
  Check,
} from 'lucide-react';
import { BrandSettings } from '../types';
import { ARABIC_LETTERS } from '../data/arabicData';
import { sound } from '../utils/audio';

interface AdminControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: BrandSettings;
  onSaveSettings: (settings: BrandSettings) => Promise<void> | void;
}

const ADMIN_PASSWORD = 'waelhamdy';

const PRESET_COLORS = [
  { hex: '#F97316', label: 'برتقالي' },
  { hex: '#2563EB', label: 'أزرق' },
  { hex: '#059669', label: 'أخضر' },
  { hex: '#DC2626', label: 'أحمر' },
  { hex: '#7C3AED', label: 'بنفسجي' },
  { hex: '#D97706', label: 'ذهبي' },
  { hex: '#0891B2', label: 'سماوي' },
  { hex: '#DB2777', label: 'وردي' },
  { hex: '#0F172A', label: 'داكن' },
];

export const AdminControlModal: React.FC<AdminControlModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [logoInput, setLogoInput] = useState(currentSettings.logoUrl);
  const [badgeCharInput, setBadgeCharInput] = useState(currentSettings.badgeChar || 'ض');
  const [badgeColorInput, setBadgeColorInput] = useState(currentSettings.badgeColor || '#F97316');
  const [uploadError, setUploadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setPasswordInput('');
      setPasswordError('');
      setIsUnlocked(false);
      setLogoInput(currentSettings.logoUrl);
      setBadgeCharInput(currentSettings.badgeChar || 'ض');
      setBadgeColorInput(currentSettings.badgeColor || '#F97316');
      setUploadError('');
      setSaveSuccess(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === ADMIN_PASSWORD) {
      sound.playSuccess();
      setIsUnlocked(true);
      setPasswordError('');
    } else {
      sound.playClick();
      setPasswordError('كلمة المرور غير صحيحة! يرجى التأكد والمحاولة مرة أخرى.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/png');
        if (dataUrl.length > 300000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
        setLogoInput(dataUrl);
        sound.playClick();
      };
      img.onerror = () => {
        setUploadError('تعذر قراءة الصورة المختارة.');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const trimmedLogo = logoInput.trim();
    if (trimmedLogo.length > 490000) {
      setUploadError('حجم الصورة أو الرابط كبير جداً، يرجى اختيار صورة أصغر.');
      return;
    }

    const cleanChar = badgeCharInput.trim().slice(0, 4) || 'ض';
    const cleanColor = badgeColorInput.trim() || '#F97316';

    setIsSaving(true);
    setUploadError('');
    try {
      await onSaveSettings({
        logoUrl: trimmedLogo,
        badgeChar: cleanChar,
        badgeColor: cleanColor,
      });
      sound.playSuccess();
      setSaveSuccess(true);
      // Do NOT auto-close: teacher explicitly closes with the X button
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setUploadError('حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLogoOnly = () => {
    sound.playClick();
    setLogoInput('');
  };

  return (
    /* Backdrop does NOT close modal — only X button closes it */
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border-2 border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header with explicit X close button */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">قسم التحكم وإدارة المنصة</h2>
              <p className="text-xs font-bold text-slate-500">إعدادات المعلم وائل حمدي</p>
            </div>
          </div>
          <button
            id="btn-close-admin-modal"
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 transition-colors"
            title="إغلاق قسم التحكم"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Password Gate */}
        {!isUnlocked ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-amber-600 shrink-0" />
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                يرجى إدخال كلمة المرور الخاصة بالمعلم للدخول إلى قسم التحكم.
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="input-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="أدخل كلمة المرور..."
                  autoFocus
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-hidden font-bold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs font-black text-red-600 mt-2">{passwordError}</p>
              )}
            </div>

            <button
              id="btn-unlock-admin"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-lg active:scale-95 transition-all"
            >
              دخول إلى قسم التحكم 🔓
            </button>
          </form>
        ) : (
          /* Step 2: Unlocked Control Panel */
          <div className="space-y-4">
            {/* Live Preview Strip */}
            <div className="flex items-center justify-center gap-8 pt-6 pb-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-center">
                <span className="block text-[11px] font-bold text-slate-500 mb-2">أعلى اليمين</span>
                <div
                  className="w-14 h-14 mx-auto rounded-2xl text-white font-black text-2xl flex items-center justify-center shadow-md transition-colors"
                  style={{
                    backgroundColor: badgeColorInput,
                    boxShadow: `0 6px 16px -4px ${badgeColorInput}66`,
                  }}
                >
                  {badgeCharInput || 'ض'}
                </div>
              </div>

              <div className="text-center">
                <span className="block text-[11px] font-bold text-slate-500 mb-2">دائرة منتصف الشاشة</span>
                <div className="relative w-18 h-18 mx-auto flex items-center justify-center">
                  <span
                    className="absolute inset-0 rounded-full animate-water-ripple pointer-events-none"
                    style={{ backgroundColor: badgeColorInput }}
                  />
                  <div
                    className="relative z-10 w-18 h-18 animate-water-wave overflow-hidden shadow-md"
                    style={{
                      backgroundColor: badgeColorInput,
                      boxShadow: `0 6px 18px -4px ${badgeColorInput}99, inset 0 -4px 10px rgba(0,0,0,0.16), inset 0 3px 8px rgba(255,255,255,0.28)`,
                    }}
                  >
                    <span className="pointer-events-none absolute left-1/2 top-[60%] w-[160%] h-[160%] rounded-[42%] bg-white/18 animate-water-slosh" />
                  </div>
                  {logoInput && (
                    <div className="pointer-events-none absolute -top-4 bottom-1 inset-x-1.5 z-20 rounded-b-full overflow-hidden flex items-end justify-center">
                      <img
                        src={logoInput}
                        alt="معاينة الدائرة"
                        className="w-full h-full object-contain object-bottom drop-shadow-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 1: الشعار المتواجد (رفع صورة أو رابط) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-orange-600" />
                  <span>الشعار المتواجد (صورة أو رابط)</span>
                </h3>
                {logoInput && (
                  <button
                    type="button"
                    onClick={handleClearLogoOnly}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إزالة الصورة (عرض الحرف)</span>
                  </button>
                )}
              </div>

              <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-950 border border-amber-300 font-black text-sm cursor-pointer transition-all active:scale-[0.99]">
                <Upload className="w-4 h-4 text-amber-700" />
                <span>رفع الشعار من الجهاز</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>أو وضع رابط الصورة:</span>
                </label>
                <input
                  id="input-brand-logo-url"
                  type="text"
                  dir="ltr"
                  value={logoInput.startsWith('data:') ? '' : logoInput}
                  onChange={(e) => {
                    setLogoInput(e.target.value);
                    setUploadError('');
                  }}
                  placeholder={
                    logoInput.startsWith('data:')
                      ? 'تم رفع صورة الشعار بنجاح ✓'
                      : 'https://example.com/logo.png'
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 focus:border-amber-500 focus:outline-hidden text-xs sm:text-sm font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Section 2: اختيار حرف مختلف */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <span>اختيار الحرف ({badgeCharInput || 'ض'})</span>
                </h3>
                <input
                  type="text"
                  maxLength={3}
                  value={badgeCharInput}
                  onChange={(e) => setBadgeCharInput(e.target.value)}
                  className="w-16 text-center py-1 px-2 rounded-lg bg-white border border-slate-300 font-black text-base text-slate-900"
                  title="أو اكتب حرفاً مخصصاً"
                />
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {ARABIC_LETTERS.map((l) => {
                  const selected = badgeCharInput === l.char;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setBadgeCharInput(l.char);
                      }}
                      className={`py-1.5 rounded-lg font-black text-sm transition-all ${
                        selected
                          ? 'text-white shadow-sm scale-105'
                          : 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-200'
                      }`}
                      style={selected ? { backgroundColor: badgeColorInput } : undefined}
                    >
                      {l.char}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: اختيار اللون */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>اختيار اللون</span>
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => {
                  const isActive = badgeColorInput.toUpperCase() === c.hex.toUpperCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setBadgeColorInput(c.hex);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 flex items-center justify-center"
                        style={{ backgroundColor: c.hex }}
                      >
                        {isActive && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span>{c.label}</span>
                    </button>
                  );
                })}

                <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 cursor-pointer hover:bg-slate-100 text-xs font-bold text-slate-700">
                  <input
                    type="color"
                    value={badgeColorInput}
                    onChange={(e) => setBadgeColorInput(e.target.value)}
                    className="w-5 h-5 border-0 bg-transparent cursor-pointer p-0"
                  />
                  <span>لون مخصص</span>
                </label>
              </div>
            </div>

            {uploadError && (
              <p className="text-xs font-black text-red-600">{uploadError}</p>
            )}

            {/* Save Button (stays open after save until X is clicked) */}
            <button
              id="btn-save-brand-settings"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full py-3.5 rounded-xl font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تم الحفظ بنجاح! (اضغط ✕ للإغلاق)</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الصورة والإعدادات'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
