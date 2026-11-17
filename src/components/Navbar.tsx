import React, { useRef } from 'react';
import { Volume2, VolumeX, ImagePlus, RotateCcw, Cloud } from 'lucide-react';
import { sound } from '../utils/audio';
import { AppStage, Student, ArabicLetter, BrandSettings } from '../types';

interface NavbarProps {
  stage: AppStage;
  currentStudent: Student | null;
  currentLetter: ArabicLetter | null;
  onOpenWordManager: () => void;
  onResetToStudents: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFirebaseConnected?: boolean;
  brandSettings: BrandSettings;
  isAdminControlOpen?: boolean;
  onOpenAdminControl?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stage,
  currentStudent,
  currentLetter,
  onOpenWordManager,
  onResetToStudents,
  soundEnabled,
  onToggleSound,
  isFirebaseConnected = false,
  brandSettings,
  isAdminControlOpen = false,
  onOpenAdminControl,
}) => {
  const clickCountRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFirebaseBadgeClick = () => {
    if (isAdminControlOpen) return;

    clickCountRef.current += 1;
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (clickCountRef.current >= 10) {
      clickCountRef.current = 0;
      sound.playClick();
      onOpenAdminControl?.();
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 5000);
  };

  const activeColor = brandSettings.badgeColor || '#F97316';
  const activeChar = brandSettings.badgeChar || 'ض';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-18 py-2 flex items-center justify-between gap-2 flex-wrap">
        
        {/* App Title, Top-Right Emblem (Logo or Chosen Letter in Chosen Color), and Moving Circle on the Left */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Far Right: Colored Square with Chosen Letter in Chosen Color (never shows uploaded image) */}
          <div className="cursor-pointer shrink-0" onClick={onResetToStudents}>
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-md font-black text-2xl transition-colors"
              style={{
                backgroundColor: activeColor,
                boxShadow: `0 6px 16px -4px ${activeColor}66`,
              }}
            >
              {activeChar}
            </div>
          </div>

          {/* Title & Teacher Name */}
          <div className="cursor-pointer" onClick={onResetToStudents}>
            <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              أبطال الصف الأول 🌟
            </h1>
            <p className="text-xs sm:text-sm font-black text-orange-600 flex items-center gap-1.5">
              <span>بقيادة المعلم وائل حمدي</span>
              <span className="hidden md:inline text-amber-400">•</span>
              <span className="hidden md:inline text-slate-500 font-semibold text-xs">أنشطة الحروف والمدود</span>
            </p>
          </div>
        </div>

        {/* Teacher & Current status chip */}
        <div className="hidden xl:flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/90 px-3.5 py-1.5 rounded-full text-xs sm:text-sm shadow-xs">
            <span className="text-base">👨‍🏫</span>
            <span className="text-orange-950 font-black">المعلم وائل حمدي</span>
          </div>

          {currentStudent && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-full text-sm">
              <span className="text-amber-800 font-semibold">الطالب:</span>
              <span className="font-black text-amber-950 px-2 py-0.5 bg-amber-200/60 rounded-full">
                {currentStudent.name}
              </span>
              {currentLetter && (
                <>
                  <span className="text-amber-400">|</span>
                  <span className="text-amber-800 font-semibold">الحرف:</span>
                  <span className="font-black text-orange-600 text-base bg-orange-100 px-2 py-0.5 rounded-full">
                    ({currentLetter.char})
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Green Firebase Connected badge — always stays visible; 10 clicks open Control Panel */}
          <button
            id="btn-firebase-status"
            type="button"
            onClick={handleFirebaseBadgeClick}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-black text-emerald-800 cursor-pointer select-none transition-colors"
            title={isFirebaseConnected ? 'متصل بقاعدة بيانات Firebase مباشرة' : 'قاعدة بيانات Firebase'}
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>Firebase متصل</span>
          </button>

          {/* Sound toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-slate-600"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Word Manager modal button */}
          <button
            id="btn-open-word-manager"
            onClick={() => {
              sound.playClick();
              onOpenWordManager();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-900 font-bold text-xs sm:text-sm transition-all active:scale-95 border border-amber-300"
          >
            <ImagePlus className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">إدارة الكلمات والصور</span>
            <span className="sm:hidden">الكلمات</span>
          </button>

          {/* Reset button if not on initial stage */}
          {stage !== 'students' && (
            <button
              id="btn-reset-stage"
              onClick={() => {
                sound.playClick();
                onResetToStudents();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all active:scale-95 border border-slate-200"
              title="العودة لاختيار طالب جديد"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">طالب جديد</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
