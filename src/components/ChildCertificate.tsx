import React from 'react';
import { Award } from 'lucide-react';
import { ArabicLetter, Student } from '../types';

export interface CertificateTheme {
  id: string;
  colorName: string;
  colorHex: string;
  waveColor: string;
  waveSecondary: string;
  bgGradient: string;
  outerBorder: string;
  innerBorder: string;
  headerRibbon: string;
  badgeBg: string;
  badgeTextColor: string;
  nameBg: string;
  nameBorder: string;
  nameTextColor: string;
  statCardBg: string;
  statCardBorder: string;
  statAccentColor: string;
  sealBg: string;
  sealBorder: string;
  sealTextColor: string;
  signatureBorder: string;
  cornerStyle: string;
}

export const CERTIFICATE_THEMES: CertificateTheme[] = [
  {
    id: 'gold',
    colorName: 'الذهبي الملكي',
    colorHex: '#f59e0b',
    waveColor: '#f59e0b',
    waveSecondary: '#d97706',
    bgGradient: 'from-amber-50/95 via-orange-50/80 to-yellow-50/95',
    outerBorder: 'border-amber-400',
    innerBorder: 'border-amber-300',
    headerRibbon: 'from-amber-500 via-orange-500 to-amber-600',
    badgeBg: 'bg-amber-100',
    badgeTextColor: 'text-amber-900',
    nameBg: 'from-amber-100/90 via-orange-100/80 to-amber-100/90',
    nameBorder: 'border-amber-300',
    nameTextColor: 'text-amber-950',
    statCardBg: 'bg-white/95',
    statCardBorder: 'border-amber-200',
    statAccentColor: 'text-amber-700',
    sealBg: 'from-amber-400 to-yellow-400',
    sealBorder: 'border-amber-500',
    sealTextColor: 'text-amber-950',
    signatureBorder: 'border-amber-300',
    cornerStyle: 'bg-amber-400',
  },
  {
    id: 'navy',
    colorName: 'الأزرق الكحلي',
    colorHex: '#2563eb',
    waveColor: '#2563eb',
    waveSecondary: '#1d4ed8',
    bgGradient: 'from-blue-50/95 via-sky-50/80 to-indigo-50/95',
    outerBorder: 'border-blue-500',
    innerBorder: 'border-blue-300',
    headerRibbon: 'from-blue-600 via-indigo-600 to-cyan-600',
    badgeBg: 'bg-blue-100',
    badgeTextColor: 'text-blue-900',
    nameBg: 'from-blue-100/90 via-sky-100/80 to-indigo-100/90',
    nameBorder: 'border-blue-300',
    nameTextColor: 'text-blue-950',
    statCardBg: 'bg-white/95',
    statCardBorder: 'border-blue-200',
    statAccentColor: 'text-blue-700',
    sealBg: 'from-blue-500 to-cyan-400',
    sealBorder: 'border-blue-600',
    sealTextColor: 'text-white',
    signatureBorder: 'border-blue-300',
    cornerStyle: 'bg-blue-500',
  },
  {
    id: 'emerald',
    colorName: 'الأخضر الزمردي',
    colorHex: '#059669',
    waveColor: '#059669',
    waveSecondary: '#047857',
    bgGradient: 'from-emerald-50/95 via-teal-50/80 to-green-50/95',
    outerBorder: 'border-emerald-500',
    innerBorder: 'border-emerald-300',
    headerRibbon: 'from-emerald-600 via-teal-600 to-green-600',
    badgeBg: 'bg-emerald-100',
    badgeTextColor: 'text-emerald-900',
    nameBg: 'from-emerald-100/90 via-teal-100/80 to-emerald-100/90',
    nameBorder: 'border-emerald-300',
    nameTextColor: 'text-emerald-950',
    statCardBg: 'bg-white/95',
    statCardBorder: 'border-emerald-200',
    statAccentColor: 'text-emerald-700',
    sealBg: 'from-emerald-500 to-teal-400',
    sealBorder: 'border-emerald-600',
    sealTextColor: 'text-white',
    signatureBorder: 'border-emerald-300',
    cornerStyle: 'bg-emerald-500',
  },
  {
    id: 'ruby',
    colorName: 'العنابي الياقوتي',
    colorHex: '#e11d48',
    waveColor: '#e11d48',
    waveSecondary: '#be123c',
    bgGradient: 'from-rose-50/95 via-pink-50/80 to-red-50/95',
    outerBorder: 'border-rose-400',
    innerBorder: 'border-rose-300',
    headerRibbon: 'from-rose-600 via-red-600 to-rose-700',
    badgeBg: 'bg-rose-100',
    badgeTextColor: 'text-rose-900',
    nameBg: 'from-rose-100/90 via-pink-100/80 to-rose-100/90',
    nameBorder: 'border-rose-300',
    nameTextColor: 'text-rose-950',
    statCardBg: 'bg-white/95',
    statCardBorder: 'border-rose-200',
    statAccentColor: 'text-rose-700',
    sealBg: 'from-rose-500 to-red-400',
    sealBorder: 'border-rose-600',
    sealTextColor: 'text-white',
    signatureBorder: 'border-rose-300',
    cornerStyle: 'bg-rose-500',
  },
  {
    id: 'purple',
    colorName: 'البنفسجي الفاخر',
    colorHex: '#7c3aed',
    waveColor: '#7c3aed',
    waveSecondary: '#6d28d9',
    bgGradient: 'from-purple-50/95 via-violet-50/80 to-fuchsia-50/95',
    outerBorder: 'border-purple-400',
    innerBorder: 'border-purple-300',
    headerRibbon: 'from-purple-600 via-violet-600 to-fuchsia-600',
    badgeBg: 'bg-purple-100',
    badgeTextColor: 'text-purple-900',
    nameBg: 'from-purple-100/90 via-violet-100/80 to-purple-100/90',
    nameBorder: 'border-purple-300',
    nameTextColor: 'text-purple-950',
    statCardBg: 'bg-white/95',
    statCardBorder: 'border-purple-200',
    statAccentColor: 'text-purple-700',
    sealBg: 'from-purple-500 to-violet-400',
    sealBorder: 'border-purple-600',
    sealTextColor: 'text-white',
    signatureBorder: 'border-purple-300',
    cornerStyle: 'bg-purple-500',
  },
  {
    id: 'sunset',
    colorName: 'البرتقالي الدافئ',
    colorHex: '#ea580c',
    waveColor: '#ea580c',
    waveSecondary: '#c2410c',
    bgGradient: 'from-orange-50/95 via-amber-50/80 to-red-50/95',
    outerBorder: 'border-orange-400',
    innerBorder: 'border-orange-300',
    headerRibbon: 'from-orange-500 via-amber-600 to-red-500',
    badgeBg: 'bg-orange-100',
    badgeTextColor: 'text-orange-900',
    nameBg: 'from-orange-100/90 via-amber-100/80 to-orange-100/90',
    nameBorder: 'border-orange-300',
    nameTextColor: 'text-orange-950',
    statCardBg: 'bg-white/95',
    statCardBorder: 'border-orange-200',
    statAccentColor: 'text-orange-700',
    sealBg: 'from-orange-400 to-amber-500',
    sealBorder: 'border-orange-500',
    sealTextColor: 'text-white',
    signatureBorder: 'border-orange-300',
    cornerStyle: 'bg-orange-500',
  },
];

interface ChildCertificateProps {
  student: Student;
  letter: ArabicLetter;
  score: number;
  total: number;
  percentage: number;
  theme: CertificateTheme;
  certificateRef: React.RefObject<HTMLDivElement | null>;
}

export const ChildCertificate: React.FC<ChildCertificateProps> = ({
  student,
  letter,
  score,
  total,
  percentage,
  theme,
  certificateRef,
}) => {
  const currentDate = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div
      ref={certificateRef}
      id="certificate-print-area"
      /* Landscape horizontal layout: compact, beautiful, no excess height */
      className={`relative w-full max-w-3xl mx-auto rounded-3xl p-4 sm:p-6 bg-gradient-to-br ${theme.bgGradient} border-[6px] sm:border-8 ${theme.outerBorder} shadow-xl overflow-hidden transition-all duration-500 select-none text-right flex flex-col justify-between min-h-[370px] sm:min-h-[410px]`}
      dir="rtl"
    >
      {/* ------------------------------------------------------------- */}
      {/* ORGANIC VECTOR WAVE MOTIFS IN CHOSEN THEME COLOR (زي أمواج) */}
      {/* ------------------------------------------------------------- */}
      
      {/* Top Waves Ribbon */}
      <div className="absolute top-0 inset-x-0 h-24 sm:h-28 pointer-events-none overflow-hidden z-0 opacity-20">
        <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,0 L1200,0 L1200,45 C1020,95 860,25 700,65 C540,105 360,30 200,75 C100,100 40,60 0,40 Z"
            fill={theme.waveColor}
          />
          <path
            d="M0,0 L1200,0 L1200,25 C1060,65 920,10 760,45 C600,80 440,20 280,60 C140,95 60,35 0,20 Z"
            fill={theme.waveSecondary}
            opacity="0.55"
          />
        </svg>
      </div>

      {/* Bottom Waves Ribbon */}
      <div className="absolute bottom-0 inset-x-0 h-24 sm:h-28 pointer-events-none overflow-hidden z-0 opacity-20">
        <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,140 L1200,140 L1200,95 C1040,45 880,120 720,80 C560,40 380,115 220,70 C120,40 50,85 0,105 Z"
            fill={theme.waveColor}
          />
          <path
            d="M0,140 L1200,140 L1200,115 C1080,75 940,130 780,95 C620,60 460,120 300,80 C160,45 70,105 0,120 Z"
            fill={theme.waveSecondary}
            opacity="0.55"
          />
        </svg>
      </div>

      {/* Subtle Side Curved Wave Accents */}
      <div className="absolute top-1/4 -right-8 w-28 h-48 pointer-events-none overflow-hidden z-0 opacity-15">
        <svg viewBox="0 0 100 200" className="w-full h-full">
          <path d="M100,0 C20,50 20,150 100,200 Z" fill={theme.waveColor} />
        </svg>
      </div>
      <div className="absolute top-1/3 -left-8 w-28 h-48 pointer-events-none overflow-hidden z-0 opacity-15">
        <svg viewBox="0 0 100 200" className="w-full h-full">
          <path d="M0,0 C80,50 80,150 0,200 Z" fill={theme.waveSecondary} />
        </svg>
      </div>

      {/* Double Geometric Inner Frame */}
      <div className={`absolute inset-2 sm:inset-2.5 border-2 ${theme.innerBorder} rounded-2xl pointer-events-none z-0`} />
      <div className={`absolute inset-3 sm:inset-3.5 border border-dashed ${theme.innerBorder} opacity-50 rounded-xl pointer-events-none z-0`} />

      {/* Sleek Corner Accents */}
      <div className={`absolute top-2 right-2 w-4 h-4 ${theme.cornerStyle} rounded-br-none rounded-tl-lg opacity-80 z-10`} />
      <div className={`absolute top-2 left-2 w-4 h-4 ${theme.cornerStyle} rounded-bl-none rounded-tr-lg opacity-80 z-10`} />
      <div className={`absolute bottom-2 right-2 w-4 h-4 ${theme.cornerStyle} rounded-tr-none rounded-bl-lg opacity-80 z-10`} />
      <div className={`absolute bottom-2 left-2 w-4 h-4 ${theme.cornerStyle} rounded-tl-none rounded-br-lg opacity-80 z-10`} />

      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER: Clean Academic Branding & Title Banner */}
      {/* ------------------------------------------------------------- */}
      <div className="relative text-center mb-2 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 shadow-xs border border-slate-200 text-[11px] sm:text-xs font-black text-slate-800 mb-1.5">
          <span>مَنَصَّةُ لُغَتِي الْجَمِيلَة 🌟 أَبْطَالُ الصَّفِّ الأَوَّل</span>
        </div>

        {/* Certificate Title Banner (Unified title, no theme name!) */}
        <div className={`py-1.5 px-7 rounded-xl bg-gradient-to-r ${theme.headerRibbon} text-white shadow-md mx-auto inline-block`}>
          <h1 className="text-xl sm:text-2xl font-black tracking-wide drop-shadow-xs">
            شَهَادَةُ تَفَوُّقٍ وَإِتْقَان
          </h1>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STUDENT COMMENDATION SECTION (Prominent, dignified, focused) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 text-center my-auto py-1">
        <p className="text-xs sm:text-sm font-bold text-slate-700 mb-1">
          يَسُرُّ <strong className="text-slate-900 font-black">المعلم وائل حمدي</strong> أن يمنح هذه الشهادة للبطل الرائع:
        </p>

        {/* Student Name Banner */}
        <div className={`py-1.5 px-8 inline-block bg-gradient-to-r ${theme.nameBg} rounded-xl border-2 ${theme.nameBorder} shadow-xs my-1 max-w-lg w-full sm:w-auto`}>
          <span className={`text-2xl sm:text-3xl font-black ${theme.nameTextColor} tracking-wide`}>
            {student.name}
          </span>
        </div>

        {/* Commendation text */}
        <p className="text-xs sm:text-sm text-slate-700 font-bold mt-1.5 max-w-xl mx-auto leading-relaxed">
          تقديراً لجهوده المتميزة وإتقانه الباهر لمهارات وأصوات حرف <span className="font-black text-slate-900 px-2 py-0.5 rounded-md bg-white/90 border border-slate-300">({letter.char} - {letter.name})</span> بالمدود القصيرة والطويلة.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* COMPACT STATISTICS STRIP (Scores & Letter) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto w-full my-2 text-center relative z-10">
        <div className={`${theme.statCardBg} py-1.5 px-2.5 rounded-xl border ${theme.statCardBorder} shadow-xs`}>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block">الحرف المتقن</span>
          <span className={`text-lg sm:text-xl font-black ${theme.statAccentColor}`}>{letter.char}</span>
        </div>
        <div className={`${theme.statCardBg} py-1.5 px-2.5 rounded-xl border ${theme.statCardBorder} shadow-xs`}>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block">الدرجة المحققة</span>
          <span className="text-lg sm:text-xl font-black text-slate-800">
            {score} <span className="text-xs sm:text-sm font-bold text-slate-400">/ {total}</span>
          </span>
        </div>
        <div className={`${theme.statCardBg} py-1.5 px-2.5 rounded-xl border ${theme.statCardBorder} shadow-xs`}>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block">نسبة الإتقان</span>
          <span className="text-lg sm:text-xl font-black text-emerald-600">{percentage}%</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM FOOTER: Teacher Signature, Official Seal & Date */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-2 border-t border-slate-200/90 flex items-center justify-between flex-wrap gap-2 relative z-10">
        {/* Right: Official Teacher Seal */}
        <div className="flex items-center gap-2 bg-white/95 px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr ${theme.sealBg} flex items-center justify-center ${theme.sealTextColor} font-black shadow-inner border ${theme.sealBorder}`}>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-black text-slate-800 leading-tight">ختم التميز ⭐</span>
            <span className="block text-[10px] sm:text-[11px] font-black text-emerald-700">معتمد من المعلم وائل حمدي</span>
          </div>
        </div>

        {/* Center: Academic Date */}
        <div className="text-center">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 block">تاريخ الإنجاز</span>
          <span className="text-[11px] sm:text-xs font-black text-slate-700">{currentDate}</span>
        </div>

        {/* Left: Teacher Signature */}
        <div className={`text-left bg-white/95 px-3 py-1 rounded-xl border ${theme.signatureBorder} shadow-xs`}>
          <span className="block text-[9px] sm:text-[10px] font-bold text-slate-500">إشراف وتكريم:</span>
          <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1">
            <span>المعلم وائل حمدي</span>
            <span>✍️</span>
          </span>
        </div>
      </div>
    </div>
  );
};
