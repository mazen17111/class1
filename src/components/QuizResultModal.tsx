import React, { useEffect } from 'react';
import { Trophy, Star, RotateCcw, ArrowRight, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ArabicLetter, Student } from '../types';
import { sound } from '../utils/audio';

interface QuizResultModalProps {
  student: Student;
  letter: ArabicLetter;
  score: number;
  total: number;
  onNewStudent: () => void;
  onRetry: () => void;
  onChangeLetter: () => void;
}

export const QuizResultModal: React.FC<QuizResultModalProps> = ({
  student,
  letter,
  score,
  total,
  onNewStudent,
  onRetry,
  onChangeLetter,
}) => {
  const percentage = Math.round((score / total) * 100);

  useEffect(() => {
    sound.playVictory();
    // Confetti shower
    const end = Date.now() + 1.5 * 1000;
    const interval: NodeJS.Timeout = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Determine star rating and message
  let stars = 3;
  let title = 'بطل الحروف الخارق! 👑';
  let message = `ما شاء الله عليك يا ${student.name}! إنجاز ممتاز وإتقان رائع لحرف (${letter.char}).`;

  if (percentage < 50) {
    stars = 1;
    title = 'محاولة طيبة يا بطل! 👏';
    message = `عمل جيد يا ${student.name}، بالتدريب والمحاولة ستصبح أفضل وأسرع!`;
  } else if (percentage < 80) {
    stars = 2;
    title = 'أداء رائع ومتميز! 🌟';
    message = `أحسنت يا ${student.name}، خطوة رائعة نحو إتقان الحروف والمدود العربية!`;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border-2 border-amber-200 text-center relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl" />

        {/* Trophy Icon */}
        <div className="relative w-24 h-24 mx-auto mb-5 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/30">
          <Trophy className="w-12 h-12" />
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
          {title}
        </h2>

        <p className="text-slate-600 text-lg mb-6 max-w-md mx-auto">
          {message}
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((starIdx) => {
            const isFilled = starIdx <= stars;
            return (
              <Star
                key={starIdx}
                className={`w-12 h-12 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-md scale-110'
                    : 'text-slate-200'
                } transition-all`}
              />
            );
          })}
        </div>

        {/* Score Badge */}
        <div className="inline-flex items-center gap-6 px-8 py-4 bg-slate-50 border-2 border-amber-100 rounded-3xl mb-8">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">النتيجة المحققة</span>
            <div className="text-4xl font-black text-orange-600">
              {score} <span className="text-2xl text-slate-400">/ {total}</span>
            </div>
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">نسبة الإتقان</span>
            <div className="text-4xl font-black text-emerald-600">
              {percentage}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Main required button: «طالب جديد» */}
          <button
            id="btn-result-new-student"
            onClick={() => {
              sound.playClick();
              onNewStudent();
            }}
            className="w-full py-4.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <RotateCcw className="w-6 h-6" />
            <span>طالب جديد 🔄 (العودة للقرعة)</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              id="btn-result-retry-same"
              onClick={() => {
                sound.playClick();
                onRetry();
              }}
              className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة النشاط لـ ({student.name})</span>
            </button>

            <button
              id="btn-result-change-letter"
              onClick={() => {
                sound.playClick();
                onChangeLetter();
              }}
              className="py-3.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 border border-orange-200"
            >
              <ArrowRight className="w-4 h-4" />
              <span>اختيار حرف آخر 🔤</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
