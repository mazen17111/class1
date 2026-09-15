import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Trash2, Sparkles, Trophy, Users, RefreshCw, ArrowLeft, Dices, RotateCcw, CheckCircle2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student } from '../types';
import { sound } from '../utils/audio';

interface StudentSelectorProps {
  students: Student[];
  onAddStudent: (name: string) => void;
  onRemoveStudent: (id: string) => void;
  onClearAllStudents?: () => void;
  onSelectStudent: (student: Student) => void;
  selectedStudentIds: string[];
  onResetRaffleCycle: () => void;
}

const AVATAR_COLORS = [
  '#3B82F6', '#EC4899', '#10B981', '#8B5CF6',
  '#F59E0B', '#06B6D4', '#EF4444', '#14B8A6',
  '#6366F1', '#D97706', '#059669', '#E11D48'
];

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  onAddStudent,
  onRemoveStudent,
  onClearAllStudents,
  onSelectStudent,
  selectedStudentIds,
  onResetRaffleCycle,
}) => {
  const [newStudentName, setNewStudentName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [chosenStudent, setChosenStudent] = useState<Student | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Remaining students in this cycle (who have NOT been selected yet)
  const remainingStudents = students.filter(s => !selectedStudentIds.includes(s.id));
  const isCycleCompleted = students.length > 0 && remainingStudents.length === 0;

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newStudentName.trim();
    if (!trimmed) return;
    sound.playClick();
    onAddStudent(trimmed);
    setNewStudentName('');
  };

  const startRaffle = () => {
    // If all students participated, alert user to start new round or auto-reset
    if (isCycleCompleted) {
      sound.playClick();
      onResetRaffleCycle();
      return;
    }

    if (remainingStudents.length === 0 || isSpinning) return;
    
    sound.playClick();
    setIsSpinning(true);
    setChosenStudent(null);

    let speed = 70; // ms
    let rounds = 0;
    const totalRounds = 20 + Math.floor(Math.random() * 12);
    let currentIndex = highlightedIndex ?? 0;

    const step = () => {
      currentIndex = (currentIndex + 1) % remainingStudents.length;
      setHighlightedIndex(currentIndex);
      sound.playTick();
      rounds++;

      if (rounds > totalRounds * 0.7) {
        speed += 25; // decelerate smoothly
      } else if (rounds > totalRounds * 0.85) {
        speed += 60;
      }

      if (rounds >= totalRounds) {
        // Winner chosen from REMAINING pool!
        const winner = remainingStudents[currentIndex];
        setChosenStudent(winner);
        setIsSpinning(false);
        sound.playSuccess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        timerRef.current = setTimeout(step, speed);
      }
    };

    timerRef.current = setTimeout(step, speed);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Classroom Hero Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 text-amber-900 text-sm font-black mb-3 border border-amber-200/80 shadow-xs">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>المنصة التعليمية التفاعلية • اللغة العربية</span>
        </div>

        {/* User Required Title: أبطال الصف الأول - بقيادة المعلم وائل حمدي */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-2">
          أبطال الصف الأول 🌟
        </h1>
        <p className="text-xl sm:text-2xl font-black text-orange-600 mb-4 drop-shadow-xs">
          بقيادة المعلم وائل حمدي 👨‍🏫
        </p>

        <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto">
          أضف أسماء أبطال الصف ثم اضغط على زر <strong>«انطلق 🚀»</strong> لبدء القرعة العشوائية. (الطالب الذي يخرج لا يتكرر حتى نهاية الدور لضمان مشاركة الجميع!)
        </p>
      </div>

      {/* Input Form for adding student */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-500/5 border-2 border-amber-100 mb-8">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              id="input-student-name"
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="اكتب اسم بطل الصف هنا... (مثال: زياد، ليلى، فهد)"
              className="w-full text-lg font-bold px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-hidden transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <button
            id="btn-add-student"
            type="submit"
            disabled={!newStudentName.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <UserPlus className="w-5 h-5" />
            <span>إضافة (+)</span>
          </button>
        </form>
      </div>

      {/* Cycle Completed Announcement Banner */}
      {isCycleCompleted && (
        <div className="mb-8 p-6 sm:p-7 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl shadow-xl text-white text-center animate-in fade-in zoom-in duration-300">
          <Award className="w-14 h-14 mx-auto mb-2 text-yellow-200 animate-bounce" />
          <h3 className="text-2xl sm:text-3xl font-black mb-1">
            اكتملت الدورة وشارك جميع أبطال الصف الأول! 🎉
          </h3>
          <p className="text-emerald-100 font-bold text-sm sm:text-base mb-5">
            لقد شارك جميع الطلاب ({students.length}) طالبًا. اضغط بالأسفل لبدء دورة قرعة جديدة.
          </p>
          <button
            id="btn-start-new-cycle"
            onClick={() => {
              sound.playSuccess();
              onResetRaffleCycle();
            }}
            className="px-8 py-3.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5 text-emerald-600" />
            <span>بدء قرعة جديدة (إعادة فتح الدور للجميع) 🔄</span>
          </button>
        </div>
      )}

      {/* Winner Spotlight Card if chosen */}
      {chosenStudent && (
        <div className="mb-8 p-6 sm:p-8 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 rounded-3xl shadow-2xl text-white text-center transform animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 mx-auto rounded-full bg-white text-orange-600 shadow-xl flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>
          <p className="text-amber-100 font-bold text-lg mb-1">وقع الاختيار على بطلنا الرائع:</p>
          <h3 className="text-4xl sm:text-5xl font-black mb-2 drop-shadow-sm tracking-wide">
            🌟 {chosenStudent.name} 🌟
          </h3>
          <p className="text-xs sm:text-sm text-amber-100/90 font-bold mb-6">
            (سيتم حفظ دور الطالب ولن يتكرر في القرعة إلا بعد انتهاء باقي زملائه أو بدء قرعة جديدة)
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              id="btn-proceed-letter"
              onClick={() => {
                sound.playClick();
                onSelectStudent(chosenStudent);
              }}
              className="px-8 py-4 bg-white hover:bg-amber-50 text-orange-600 rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center gap-3"
            >
              <span>المتابعة لاختيار الحرف</span>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              id="btn-re-spin"
              onClick={startRaffle}
              disabled={isSpinning || remainingStudents.length <= 1}
              className="px-6 py-4 bg-orange-600/60 hover:bg-orange-600/80 text-white border border-white/40 rounded-2xl font-bold text-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className="w-5 h-5" />
              <span>سحب بطل آخر</span>
            </button>
          </div>
        </div>
      )}

      {/* Raffle Action & Students Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-800">أبطال الصف</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  إجمالي ({students.length})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                المتبقين في القرعة الحالية: <strong className="text-emerald-600 font-black">{remainingStudents.length}</strong> طالب • شاركوا: <strong className="text-slate-700 font-bold">{selectedStudentIds.length}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {students.length > 0 && onClearAllStudents && (
              <>
                {showClearConfirm ? (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 p-1.5 rounded-xl">
                    <span className="text-xs font-black text-red-700 px-1">تأكيد حذف الكل؟</span>
                    <button
                      id="btn-confirm-delete-all"
                      onClick={() => {
                        sound.playSuccess();
                        onClearAllStudents();
                        setShowClearConfirm(false);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black active:scale-95 transition-all"
                    >
                      نعم، حذف
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold active:scale-95 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    id="btn-clear-all-students"
                    onClick={() => {
                      sound.playClick();
                      setShowClearConfirm(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-black transition-all active:scale-95 border border-red-200/60"
                    title="حذف جميع أسماء الطلاب المضافة"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>حذف الكل 🗑️</span>
                  </button>
                )}
              </>
            )}

            {selectedStudentIds.length > 0 && (
              <button
                id="btn-reset-cycle-small"
                onClick={() => {
                  sound.playClick();
                  onResetRaffleCycle();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-black transition-all active:scale-95"
                title="إعادة فتح القرعة لجميع الطلاب"
              >
                <RotateCcw className="w-4 h-4 text-orange-600" />
                <span>قرعة جديدة 🔄</span>
              </button>
            )}

            {/* Big Launch Button */}
            <button
              id="btn-launch-raffle"
              onClick={startRaffle}
              disabled={students.length === 0 || isSpinning}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-black text-white shadow-xl transition-all active:scale-95 ${
                isSpinning
                  ? 'bg-slate-400 cursor-wait'
                  : isCycleCompleted
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Dices className={`w-7 h-7 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>
                {isSpinning
                  ? 'جاري السحب...'
                  : isCycleCompleted
                  ? 'بدء قرعة جديدة 🔄'
                  : 'انطلق 🚀 (قرعة عشوائية)'}
              </span>
            </button>
          </div>
        </div>

        {/* Student Cards List */}
        {students.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-16 h-16 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-bold">لا يوجد طلاب في القائمة بعد!</p>
            <p className="text-sm">اكتب اسم الطالب في الأعلى واضغط (+) لإضافته.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-6">
            {students.map((student, index) => {
              const hasParticipated = selectedStudentIds.includes(student.id);
              const remainingIndex = remainingStudents.findIndex(s => s.id === student.id);
              const isHighlighted = isSpinning && remainingIndex === highlightedIndex;
              const isWinner = chosenStudent?.id === student.id;

              return (
                <div
                  key={student.id}
                  id={`student-card-${student.id}`}
                  className={`group relative p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-2 ${
                    isWinner
                      ? 'bg-amber-100 border-amber-500 shadow-lg scale-105'
                      : isHighlighted
                      ? 'bg-orange-50 border-orange-400 scale-105 shadow-md'
                      : hasParticipated
                      ? 'bg-slate-50/80 border-slate-200/80 opacity-70 hover:opacity-100'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => {
                      if (!isSpinning) {
                        sound.playClick();
                        setChosenStudent(student);
                      }
                    }}
                    className="flex items-center gap-2.5 flex-1 text-right focus:outline-hidden"
                    title={hasParticipated ? "هذا الطالب شارك بالفعل في هذه الدورة" : "انقر لاختيار هذا الطالب مباشرة"}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs relative"
                      style={{ backgroundColor: student.avatarColor || AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                    >
                      {student.name.charAt(0)}
                      {hasParticipated && (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs" title="تمت مشاركته في هذا الدور">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 text-base group-hover:text-orange-600 transition-colors truncate block">
                        {student.name}
                      </span>
                      {hasParticipated ? (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          شارك بالدور ✓
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          متاح في القرعة
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    id={`btn-delete-student-${student.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      onRemoveStudent(student.id);
                      if (chosenStudent?.id === student.id) {
                        setChosenStudent(null);
                      }
                    }}
                    title="حذف الطالب من القائمة"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all opacity-70 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
