import React, { useState } from 'react';
import { Volume2, ArrowRight, Sparkles, Check } from 'lucide-react';
import { ArabicLetter, Student } from '../types';
import { ARABIC_LETTERS } from '../data/arabicData';
import { sound } from '../utils/audio';

interface LetterPickerProps {
  student: Student;
  onSelectLetter: (letter: ArabicLetter) => void;
  onBack: () => void;
}

export const LetterPicker: React.FC<LetterPickerProps> = ({
  student,
  onSelectLetter,
  onBack,
}) => {
  const [hoveredLetter, setHoveredLetter] = useState<ArabicLetter | null>(null);

  const handleLetterClick = (letter: ArabicLetter) => {
    sound.playClick();
    sound.speakArabic(letter.name);
    onSelectLetter(letter);
  };

  const handleSpeak = (e: React.MouseEvent, letter: ArabicLetter) => {
    e.stopPropagation();
    sound.speakArabic(letter.char);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner with Student Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-5 rounded-3xl shadow-md border border-amber-100">
        <button
          id="btn-back-to-students"
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all active:scale-95 text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تغيير الطالب</span>
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md"
            style={{ backgroundColor: student.avatarColor || '#3B82F6' }}
          >
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="text-xs text-orange-600 font-bold flex items-center gap-1">
              <span>👨‍🏫 فصل المعلم وائل حمدي</span>
            </div>
            <div className="text-xl font-black text-slate-900">{student.name}</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          الخطوة الثانية: اختر الحرف المستهدف
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-800 rounded-full text-xs font-black mb-2 border border-orange-200">
          بقيادة المعلم وائل حمدي 🌟
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
          اختر الحرف المطلوب للنشاط 🔤
        </h2>
        <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto">
          اضغط على أي حرف من الحروف العربية لبدء تدريبات وتمارين الحرف مع البطل <strong>{student.name}</strong> في فصل المعلم وائل حمدي.
        </p>
      </div>

      {/* 28 Arabic Letters Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-4 mb-8">
        {ARABIC_LETTERS.map((letter) => {
          return (
            <button
              key={letter.id}
              id={`letter-btn-${letter.id}`}
              onClick={() => handleLetterClick(letter)}
              onMouseEnter={() => setHoveredLetter(letter)}
              className="group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border-2 border-slate-200 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/15 hover:-translate-y-1 active:scale-95 transition-all focus:outline-hidden"
            >
              {/* Audio pronounce button */}
              <div
                onClick={(e) => handleSpeak(e, letter)}
                title="استمع لصوت الحرف"
                className="absolute top-2 left-2 p-1 rounded-full text-slate-300 group-hover:text-orange-500 hover:bg-orange-50 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </div>

              {/* Big Arabic Letter Glyph */}
              <span className="text-4xl sm:text-5xl font-black text-slate-800 group-hover:text-orange-600 transition-colors my-1">
                {letter.char}
              </span>

              {/* Letter Name */}
              <span className="text-xs sm:text-sm font-bold text-slate-500 group-hover:text-orange-700 transition-colors">
                {letter.name}
              </span>

              {/* Short vowel pill preview */}
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-orange-500">
                <span>{letter.shortSounds.fatha}</span>
                <span>•</span>
                <span>{letter.shortSounds.damma}</span>
                <span>•</span>
                <span>{letter.shortSounds.kasra}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Letter Card Preview when hovering */}
      {hoveredLetter && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black text-orange-600 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-md">
              {hoveredLetter.char}
            </span>
            <div>
              <h4 className="text-xl font-black text-slate-800 mb-1">
                حرف {hoveredLetter.name} ({hoveredLetter.char})
              </h4>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                <span className="bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                  الأصوات القصيرة: {hoveredLetter.shortSounds.fatha} ، {hoveredLetter.shortSounds.damma} ، {hoveredLetter.shortSounds.kasra}
                </span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                  الأصوات الطويلة (المد): {hoveredLetter.longSounds.alif} ، {hoveredLetter.longSounds.waw} ، {hoveredLetter.longSounds.yaa}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleLetterClick(hoveredLetter)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all text-sm shrink-0"
          >
            اختيار حرف ({hoveredLetter.char})
          </button>
        </div>
      )}

      {/* Teacher Guidance Note */}
      <div className="mt-8 p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 font-bold flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg">👨‍🏫</span>
          <span>إشراف وتوجيه المعلم وائل حمدي: يفضل نطق صوت الحرف بحركاته الثلاث (ـَ ـُ ـِ) ومدوده قبل الانتقال إلى الأسئلة.</span>
        </div>
        <span className="text-orange-600 font-black">أبطال الصف الأول 🌟</span>
      </div>
    </div>
  );
};
