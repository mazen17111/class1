import React, { useEffect, useState, useRef } from 'react';
import { Trophy, Star, RotateCcw, ArrowRight, Sparkles, Download, Printer, Palette, Shuffle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { ArabicLetter, Student } from '../types';
import { sound } from '../utils/audio';
import { ChildCertificate, CERTIFICATE_THEMES, CertificateTheme } from './ChildCertificate';

interface QuizResultModalProps {
  student: Student;
  letter: ArabicLetter;
  score: number;
  total: number;
  onNewStudent: () => void;
  onRetry: () => void;
  onChangeLetter: () => void;
}

// Module-level tracker to guarantee a different theme on every completion
let lastThemeIndex = -1;

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
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Automatically select a different theme each time
  const [currentThemeIndex, setCurrentThemeIndex] = useState(() => {
    let nextIndex = 0;
    if (lastThemeIndex === -1) {
      nextIndex = Math.floor(Math.random() * CERTIFICATE_THEMES.length);
    } else {
      nextIndex = (lastThemeIndex + 1) % CERTIFICATE_THEMES.length;
    }
    lastThemeIndex = nextIndex;
    return nextIndex;
  });

  const currentTheme = CERTIFICATE_THEMES[currentThemeIndex];

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

  const handleNextTheme = () => {
    sound.playSnap();
    const nextIdx = (currentThemeIndex + 1) % CERTIFICATE_THEMES.length;
    lastThemeIndex = nextIdx;
    setCurrentThemeIndex(nextIdx);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleSelectTheme = (index: number) => {
    sound.playClick();
    lastThemeIndex = index;
    setCurrentThemeIndex(index);
  };

  // Canvas-based fallback generator in case DOM rasterization fails (Landscape 1200x750)
  const downloadCanvasFallback = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 750;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 1200, 750);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#f8fafc');
      grad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 750);

      // Decorative wave accents in theme color (like waves / أمواج)
      ctx.save();
      ctx.globalAlpha = 0.22;
      
      // Top wave
      ctx.fillStyle = currentTheme.waveColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1200, 0);
      ctx.lineTo(1200, 50);
      ctx.bezierCurveTo(950, 120, 750, 20, 500, 70);
      ctx.bezierCurveTo(300, 120, 150, 30, 0, 60);
      ctx.closePath();
      ctx.fill();

      // Top secondary wave
      ctx.fillStyle = currentTheme.waveSecondary;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1200, 0);
      ctx.lineTo(1200, 30);
      ctx.bezierCurveTo(850, 80, 600, 15, 350, 50);
      ctx.bezierCurveTo(200, 90, 80, 20, 0, 30);
      ctx.closePath();
      ctx.fill();

      // Bottom wave
      ctx.fillStyle = currentTheme.waveColor;
      ctx.beginPath();
      ctx.moveTo(0, 750);
      ctx.lineTo(1200, 750);
      ctx.lineTo(1200, 690);
      ctx.bezierCurveTo(950, 630, 750, 730, 500, 680);
      ctx.bezierCurveTo(300, 630, 150, 720, 0, 690);
      ctx.closePath();
      ctx.fill();

      // Bottom secondary wave
      ctx.fillStyle = currentTheme.waveSecondary;
      ctx.beginPath();
      ctx.moveTo(0, 750);
      ctx.lineTo(1200, 750);
      ctx.lineTo(1200, 715);
      ctx.bezierCurveTo(900, 670, 700, 740, 400, 700);
      ctx.bezierCurveTo(200, 670, 80, 730, 0, 715);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Outer border using theme color
      ctx.strokeStyle = currentTheme.colorHex;
      ctx.lineWidth = 16;
      ctx.strokeRect(15, 15, 1170, 720);

      // Inner double border
      ctx.strokeStyle = currentTheme.colorHex;
      ctx.lineWidth = 3;
      ctx.strokeRect(32, 32, 1136, 686);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(42, 42, 1116, 666);
      ctx.setLineDash([]);

      // Arabic font setup
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';

      // Header Branding
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('مَنَصَّةُ لُغَتِي الْجَمِيلَة 🌟 أَبْطَالُ الصَّفِّ الأَوَّل', 600, 85);

      // Certificate Title (No theme name!)
      ctx.fillStyle = currentTheme.colorHex;
      ctx.font = '900 42px sans-serif';
      ctx.fillText('شَهَادَةُ تَفَوُّقٍ وَإِتْقَان', 600, 150);

      // Commendation line
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('يَسُرُّ المعلم وائل حمدي أن يمنح هذه الشهادة للبطل الرائع:', 600, 220);

      // Student Name Box (Landscape wide)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 12;
      ctx.fillRect(200, 255, 800, 90);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = currentTheme.colorHex;
      ctx.lineWidth = 3;
      ctx.strokeRect(200, 255, 800, 90);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 44px sans-serif';
      ctx.fillText(student.name, 600, 316);

      // Details
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`تقديراً لجهوده المتميزة وإتقانه الباهر لمهارات وأصوات حرف (${letter.char} - ${letter.name})`, 600, 400);

      // Horizontal stats card
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(250, 445, 700, 75);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(250, 445, 700, 75);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`الحرف: (${letter.char})   |   النتيجة: ${score} من ${total}   |   نسبة الإتقان: ${percentage}%`, 600, 492);

      // Footer - Teacher signature & official seal
      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 22px sans-serif';
      ctx.fillText('ختم التميز والاعتماد ⭐', 1080, 620);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText('معتمد من المعلم وائل حمدي', 1080, 655);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('إشراف وتكريم:', 120, 620);
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('المعلم وائل حمدي ✍️', 120, 655);

      const link = document.createElement('a');
      link.download = `شهادة_تفوق_${student.name.replace(/\s+/g, '_')}_حرف_${letter.char}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      sound.playSuccess();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error('Canvas export error:', e);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    sound.playClick();

    try {
      // Use html-to-image with 2x pixel ratio for sharp landscape image
      const dataUrl = await toPng(certificateRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `شهادة_تفوق_${student.name.replace(/\s+/g, '_')}_حرف_${letter.char}.png`;
      link.href = dataUrl;
      link.click();

      sound.playSuccess();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.warn('html-to-image error, using Canvas fallback:', err);
      downloadCanvasFallback();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintCertificate = () => {
    sound.playClick();
    window.print();
  };

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
    <div className="max-w-4xl mx-auto px-3 sm:px-5 py-5">
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-amber-200 text-center relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl" />

        {/* Trophy Icon with celebratory ring */}
        <div className="relative w-16 h-16 mx-auto mb-2.5 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 animate-bounce" style={{ animationDuration: '2.5s' }}>
          <Trophy className="w-8 h-8" />
        </div>

        {/* Title & Congratulations */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1.5">
          {title}
        </h2>

        <p className="text-slate-600 text-base mb-3 max-w-md mx-auto font-medium">
          {message}
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((starIdx) => {
            const isFilled = starIdx <= stars;
            return (
              <Star
                key={starIdx}
                className={`w-9 h-9 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-md scale-110 animate-pulse'
                    : 'text-slate-200'
                } transition-all`}
              />
            );
          })}
        </div>

        {/* Score Badge */}
        <div className="inline-flex items-center gap-6 px-7 py-2.5 bg-slate-50 border-2 border-amber-100 rounded-3xl mb-6">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-0.5">النتيجة المحققة</span>
            <div className="text-2xl sm:text-3xl font-black text-orange-600">
              {score} <span className="text-lg text-slate-400">/ {total}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-0.5">نسبة الإتقان</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {percentage}%
            </div>
          </div>
        </div>

        {/* CERTIFICATE THEME PICKER (Color swatches - theme name not inside certificate) */}
        <div className="mb-4 bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200 max-w-2xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
            <span className="text-xs sm:text-sm font-black text-slate-700 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-orange-600" />
              <span>لون الشهادة (يتغير تلقائياً لكل بطل):</span>
            </span>

            <button
              onClick={handleNextTheme}
              className="px-3 py-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-sm flex items-center gap-1 active:scale-95 transition-all"
              title="تغيير لون الشهادة لشكل جديد"
            >
              <Shuffle className="w-3 h-3" />
              <span>لون جديد 🎲</span>
            </button>
          </div>

          {/* Color Swatches */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {CERTIFICATE_THEMES.map((th, idx) => {
              const isActive = idx === currentThemeIndex;
              return (
                <button
                  key={th.id}
                  onClick={() => handleSelectTheme(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md scale-105 ring-2 ring-orange-400'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: th.colorHex }}
                  />
                  <span>{th.colorName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LANDSCAPE CERTIFICATE VIEW (Uncluttered, Wide) */}
        <div className="mb-6 w-full overflow-x-auto pb-2">
          <ChildCertificate
            student={student}
            letter={letter}
            score={score}
            total={total}
            percentage={percentage}
            theme={currentTheme}
            certificateRef={certificateRef}
          />
        </div>
        {/* CERTIFICATE DOWNLOAD & PRINT ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            id="btn-download-certificate"
            onClick={handleDownloadCertificate}
            disabled={isDownloading}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 ${
              downloadSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25'
            }`}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-100 animate-bounce" />
                <span>تم تحميل الشهادة بنجاح! 🎉</span>
              </>
            ) : (
              <>
                <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'جاري تجهيز الصورة...' : 'تحميل الشهادة صورة (PNG) 📥'}</span>
              </>
            )}
          </button>

          <button
            id="btn-print-certificate"
            onClick={handlePrintCertificate}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5 text-amber-700" />
            <span>طباعة الشهادة 🖨️</span>
          </button>
        </div>

        {/* Action Buttons for Classroom Navigation */}
        <div className="space-y-3 pt-4 border-t-2 border-slate-100">
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
