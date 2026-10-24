import React from 'react';
import { Volume2, VolumeX, ImagePlus, RotateCcw, Sparkles, Lock } from 'lucide-react';
import { sound } from '../utils/audio';
import { AppStage, Student, ArabicLetter } from '../types';

interface NavbarProps {
  stage: AppStage;
  currentStudent: Student | null;
  currentLetter: ArabicLetter | null;
  onOpenWordManager: () => void;
  onResetToStudents: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLock: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stage,
  currentStudent,
  currentLetter,
  onOpenWordManager,
  onResetToStudents,
  soundEnabled,
  onToggleSound,
  onLock,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        
        {/* App Title & Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onResetToStudents}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-black text-2xl">
            ض
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              أبطال الصف الأول 🌟
            </h1>
            <p className="text-xs font-bold text-orange-600 hidden sm:block">
              بقيادة المعلم وائل حمدي • أنشطة الحروف والمدود التفاعلية
            </p>
          </div>
        </div>

        {/* Current status chip */}
        {currentStudent && (
          <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-full text-sm">
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

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Lock Screen toggle */}
          <button
            id="btn-lock-screen"
            onClick={onLock}
            title="قفل المنصة (شاشة 404)"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-slate-500 hover:text-slate-700"
          >
            <Lock className="w-5 h-5" />
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-900 font-bold text-sm transition-all active:scale-95 border border-amber-300"
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all active:scale-95 border border-slate-200"
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
