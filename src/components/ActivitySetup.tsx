import React, { useState } from 'react';
import { 
  ArrowRight, Play, CheckSquare, Sparkles, Sliders, 
  Hand, HelpCircle, Volume2, MapPin, Puzzle, Image as ImageIcon, 
  Layers
} from 'lucide-react';
import { ArabicLetter, QuestionType, QuizConfig, Student } from '../types';
import { QUESTION_TYPES_INFO } from '../data/arabicData';
import { sound } from '../utils/audio';

interface ActivitySetupProps {
  student: Student;
  letter: ArabicLetter;
  onStartQuiz: (config: QuizConfig) => void;
  onBack: () => void;
}

const ALL_QUESTION_TYPES: QuestionType[] = [
  'drag_drop',
  'choose_letter',
  'choose_madd',
  'letter_position',
  'short_vowel',
  'build_word',
  'picture_match'
];

export const ActivitySetup: React.FC<ActivitySetupProps> = ({
  student,
  letter,
  onStartQuiz,
  onBack,
}) => {
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'drag_drop',
    'choose_letter',
    'choose_madd',
    'letter_position',
    'short_vowel'
  ]);

  const toggleType = (type: QuestionType) => {
    sound.playClick();
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return; // keep at least one
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const selectAll = () => {
    sound.playClick();
    setSelectedTypes([...ALL_QUESTION_TYPES]);
  };

  const handleStart = () => {
    sound.playClick();
    onStartQuiz({
      student,
      letter,
      questionCount,
      selectedTypes,
      includeMadd: selectedTypes.includes('choose_madd'),
    });
  };

  // Helper icons for question types
  const renderIcon = (type: QuestionType) => {
    switch (type) {
      case 'drag_drop': return <Hand className="w-5 h-5 text-orange-500" />;
      case 'choose_letter': return <HelpCircle className="w-5 h-5 text-blue-500" />;
      case 'choose_madd': return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'letter_position': return <MapPin className="w-5 h-5 text-emerald-500" />;
      case 'short_vowel': return <Volume2 className="w-5 h-5 text-amber-500" />;
      case 'build_word': return <Puzzle className="w-5 h-5 text-rose-500" />;
      case 'picture_match': return <ImageIcon className="w-5 h-5 text-cyan-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-5 rounded-3xl shadow-md border border-amber-100">
        <button
          id="btn-back-to-letters"
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all active:scale-95 text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تغيير الحرف ({letter.char})</span>
        </button>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1 rounded-xl text-xs font-black text-orange-800">
            <span>👨‍🏫 المعلم وائل حمدي</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">بطل النشاط:</span>
            <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
              {student.name}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">الحرف المختار:</span>
            <span className="font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-xl text-lg">
              حرف {letter.name} ({letter.char})
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
          <Sliders className="w-4 h-4 text-purple-600" />
          الخطوة الثالثة: إعداد النشاط
        </div>
      </div>

      {/* Madd & Long Vowel Focus Card for the selected letter */}
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 rounded-3xl border-2 border-purple-200/70 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-black text-purple-900">
            أصوات الحرف والمدود الطويلة لحرف ({letter.char}):
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/90 p-3.5 rounded-2xl border border-purple-100 shadow-xs flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">الفتحة مع الألف (مَدّ بالألف):</span>
            <span className="text-2xl font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
              {letter.longSounds.alif}
            </span>
          </div>
          <div className="bg-white/90 p-3.5 rounded-2xl border border-purple-100 shadow-xs flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">الضمة مع الواو (مَدّ بالواو):</span>
            <span className="text-2xl font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
              {letter.longSounds.waw}
            </span>
          </div>
          <div className="bg-white/90 p-3.5 rounded-2xl border border-purple-100 shadow-xs flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">الكسرة مع الياء (مَدّ بالياء):</span>
            <span className="text-2xl font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
              {letter.longSounds.yaa}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Question Count Selector (1 to 10) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" />
              <span>اختر عدد الأسئلة (من 1 إلى 10)</span>
            </h3>
            <p className="text-sm text-slate-500">حدد عدد الأسئلة التي سيجيب عليها الطالب</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600">العدد المحدد:</span>
            <span className="w-10 h-10 rounded-2xl bg-orange-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-orange-500/30">
              {questionCount}
            </span>
          </div>
        </div>

        {/* Quick pill buttons 1 to 10 */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
            const isSelected = questionCount === num;
            return (
              <button
                key={num}
                id={`btn-question-count-${num}`}
                onClick={() => {
                  sound.playClick();
                  setQuestionCount(num);
                }}
                className={`py-3 rounded-2xl font-black text-lg transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 scale-105'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Question Types / Activities Multi-Selection */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>أنواع الأنشطة والأسئلة التفاعلية</span>
            </h3>
            <p className="text-sm text-slate-500">
              اختر الأنماط المرغوبة لضمان تنوع الأسئلة وعدم تكرار نفس الشكل
            </p>
          </div>

          <button
            id="btn-select-all-types"
            onClick={selectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-sm border border-purple-200 active:scale-95 transition-all self-start sm:self-auto"
          >
            <CheckSquare className="w-4 h-4" />
            <span>تحديد جميع الأنشطة</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {ALL_QUESTION_TYPES.map((type) => {
            const info = QUESTION_TYPES_INFO[type];
            const isSelected = selectedTypes.includes(type);

            return (
              <div
                key={type}
                id={`type-card-${type}`}
                onClick={() => toggleType(type)}
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-orange-50/70 border-orange-400 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100/60 border-slate-200 opacity-60'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white shadow-xs' : 'bg-slate-200'}`}>
                  {renderIcon(type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 text-base">{info.label}</h4>
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-orange-500 text-white' : 'border border-slate-300'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {info.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center">
        <button
          id="btn-start-quiz-engine"
          onClick={handleStart}
          className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-3xl font-black text-2xl shadow-xl shadow-teal-500/30 hover:shadow-2xl active:scale-95 transition-all inline-flex items-center justify-center gap-4"
        >
          <Play className="w-8 h-8 fill-current" />
          <span>ابدأ النشاط مع ({student.name}) • فصل المعلم وائل حمدي 🎯</span>
        </button>
      </div>
    </div>
  );
};
