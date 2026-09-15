import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Volume2, ArrowLeft, RotateCcw, 
  Sparkles, HelpCircle, Star, Award, Eye, EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ArabicLetter, Question, Student, WordItem } from '../types';
import { sound } from '../utils/audio';
import { getMaskedWordSegments } from '../utils/wordMasker';

interface QuizEngineProps {
  student: Student;
  letter: ArabicLetter;
  questions: Question[];
  allWords: WordItem[];
  onComplete: (score: number, total: number) => void;
  onExit: () => void;
}

interface DraggableTile {
  id: string;
  char: string;
  originalIndex: number;
}

interface SlotState {
  index: number;
  expectedChar: string;
  isInitialEmpty: boolean;
  filledTile: DraggableTile | null;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  student,
  letter,
  questions,
  allWords,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  // Question state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Drag and Drop / Word building state
  const [availableTiles, setAvailableTiles] = useState<DraggableTile[]>([]);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [selectedTileForTap, setSelectedTileForTap] = useState<DraggableTile | null>(null);

  // Feedback state
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [revealWord, setRevealWord] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Initialize or reset question state whenever currentIndex changes
  useEffect(() => {
    if (!currentQuestion) return;

    setIsChecked(false);
    setIsCorrect(null);
    setSelectedOption(null);
    setSelectedTileForTap(null);
    setRevealWord(false);
    setFeedbackMessage('');

    if (currentQuestion.type === 'drag_drop' || currentQuestion.type === 'build_word') {
      const qSlots = currentQuestion.slots || [];
      const initSlots: SlotState[] = qSlots.map(s => ({
        index: s.index,
        expectedChar: s.char,
        isInitialEmpty: s.isEmpty,
        filledTile: null
      }));
      setSlots(initSlots);

      const qTiles = currentQuestion.draggableLetters || [];
      setAvailableTiles([...qTiles]);
    }
  }, [currentIndex, currentQuestion]);

  if (!currentQuestion) {
    return null;
  }

  // Speak target word
  const speakCurrentWord = () => {
    sound.speakArabic(currentQuestion.targetWord.word);
  };

  // Drag & Drop handlers (HTML5)
  const handleDragStart = (e: React.DragEvent, tile: DraggableTile) => {
    e.dataTransfer.setData('text/plain', tile.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (isChecked && isCorrect) return;

    const tileId = e.dataTransfer.getData('text/plain');
    const tile = availableTiles.find(t => t.id === tileId);
    if (!tile) return;

    placeTileInSlot(tile, slotIndex);
  };

  // Place tile logic (used by both drag & drop and tap-to-place)
  const placeTileInSlot = (tile: DraggableTile, slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot || !slot.isInitialEmpty) return;

    sound.playSnap();

    // If slot already had a tile, return it to availableTiles
    const currentOccupant = slot.filledTile;

    setSlots(prev => prev.map(s => {
      if (s.index === slotIndex) {
        return { ...s, filledTile: tile };
      }
      // If tile was in another slot, clear it
      if (s.filledTile?.id === tile.id) {
        return { ...s, filledTile: null };
      }
      return s;
    }));

    setAvailableTiles(prev => {
      const filtered = prev.filter(t => t.id !== tile.id);
      if (currentOccupant && currentOccupant.id !== tile.id) {
        return [...filtered, currentOccupant];
      }
      return filtered;
    });

    setSelectedTileForTap(null);
  };

  // Return tile from slot back to available pool
  const handleRemoveFromSlot = (slotIndex: number) => {
    if (isChecked && isCorrect) return;

    const slot = slots[slotIndex];
    if (!slot || !slot.filledTile || !slot.isInitialEmpty) return;

    const tile = slot.filledTile;
    sound.playClick();

    setSlots(prev => prev.map(s => s.index === slotIndex ? { ...s, filledTile: null } : s));
    setAvailableTiles(prev => [...prev, tile]);
  };

  // Tap-to-place for whiteboard and tablets
  const handleTileTap = (tile: DraggableTile) => {
    if (isChecked && isCorrect) return;

    sound.playClick();
    
    // Find the first empty unfilled slot
    const firstEmptySlot = slots.find(s => s.isInitialEmpty && !s.filledTile);
    if (firstEmptySlot) {
      placeTileInSlot(tile, firstEmptySlot.index);
    } else {
      // Toggle selection
      setSelectedTileForTap(prev => prev?.id === tile.id ? null : tile);
    }
  };

  const handleSlotTap = (slotIndex: number) => {
    if (isChecked && isCorrect) return;

    const slot = slots[slotIndex];
    if (!slot || !slot.isInitialEmpty) return;

    if (slot.filledTile) {
      // Remove it
      handleRemoveFromSlot(slotIndex);
    } else if (selectedTileForTap) {
      // Place currently selected tile
      placeTileInSlot(selectedTileForTap, slotIndex);
    }
  };

  // Validation logic
  const handleCheckAnswer = () => {
    sound.playClick();
    let correct = false;

    if (currentQuestion.type === 'drag_drop') {
      // Check if all empty slots are filled with the correct character!
      // Notice: If target letter is repeated (e.g. 'ب' in 'باب'), any tile with char 'ب' placed in a slot expecting 'ب' is valid!
      const emptySlots = slots.filter(s => s.isInitialEmpty);
      const allFilled = emptySlots.every(s => s.filledTile !== null);

      if (!allFilled) {
        sound.playError();
        setFeedbackMessage('يرجى سحب وإكمال جميع الأماكن الفارغة أولاً يا بطل!');
        return;
      }

      correct = emptySlots.every(s => s.filledTile?.char === s.expectedChar);

    } else if (currentQuestion.type === 'build_word') {
      const allFilled = slots.every(s => s.filledTile !== null);
      if (!allFilled) {
        sound.playError();
        setFeedbackMessage('يرجى ترتيب جميع الحروف في المربعات لتكوين الكلمة!');
        return;
      }
      correct = slots.every(s => s.filledTile?.char === s.expectedChar);

    } else {
      // Multiple choice, Madd, Position, Short Vowel, Picture match
      if (!selectedOption) {
        sound.playError();
        setFeedbackMessage('يرجى اختيار إجابة من الخيارات المعروضة أولاً!');
        return;
      }
      correct = selectedOption === currentQuestion.correctAnswer;
    }

    setIsChecked(true);
    setIsCorrect(correct);

    if (correct) {
      sound.playSuccess();
      setScore(prev => prev + 1);
      setFeedbackMessage(`أحسنت يا بطل! إجابة صحيحة وممتازة 🌟`);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      sound.playError();
      setFeedbackMessage(`إجابة غير صحيحة يا ${student.name}. لا بأس، حاول مرة أخرى أو راجع موضع الحرف! 💪`);
    }
  };

  const handleNextQuestion = () => {
    sound.playClick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished all questions!
      const finalScore = isCorrect ? score : score; // already incremented on check
      onComplete(finalScore, questions.length);
    }
  };

  const handleRetryCurrent = () => {
    sound.playClick();
    setIsChecked(false);
    setIsCorrect(null);
    setFeedbackMessage('');
    if (currentQuestion.type === 'drag_drop' || currentQuestion.type === 'build_word') {
      // return all filled tiles back to available
      const qSlots = currentQuestion.slots || [];
      setSlots(qSlots.map(s => ({
        index: s.index,
        expectedChar: s.char,
        isInitialEmpty: s.isEmpty,
        filledTile: null
      })));
      setAvailableTiles([...(currentQuestion.draggableLetters || [])]);
    } else {
      setSelectedOption(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Quiz Header with Student info and Progress Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-md border border-amber-100 mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xs"
              style={{ backgroundColor: student.avatarColor || '#3B82F6' }}
            >
              {student.name.charAt(0)}
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block">البطل المشارك:</span>
              <span className="text-lg font-black text-slate-800">{student.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">السؤال:</span>
            <span className="px-3 py-1 rounded-xl bg-orange-100 text-orange-700 font-black text-base">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <button
            id="btn-quit-quiz"
            onClick={() => {
              sound.playClick();
              onExit();
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            إنهاء النشاط
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border-2 border-slate-100 mb-6">
        
        {/* Question Prompt */}
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-sm mb-2">
            نشاط حرف ({letter.char})
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
            {currentQuestion.prompt}
          </h3>
        </div>

        {/* Target Word Image Card & Enlarged Display */}
        {currentQuestion.type !== 'picture_match' && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8 p-6 sm:p-7 bg-gradient-to-br from-amber-50/70 via-orange-50/50 to-slate-50 rounded-3xl border-2 border-amber-200/90 shadow-md">
            <div className="relative group shrink-0">
              <img
                src={currentQuestion.targetWord.image}
                alt={currentQuestion.targetWord.word}
                className="w-48 h-36 sm:w-56 sm:h-42 object-contain rounded-2xl bg-white shadow-md p-2 border border-amber-100"
              />
              <button
                onClick={speakCurrentWord}
                title="استمع لنطق الكلمة"
                className="absolute bottom-2 left-2 p-2.5 bg-white/95 hover:bg-white text-orange-600 rounded-xl shadow-md active:scale-90 transition-all border border-orange-100"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center sm:text-right flex-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs sm:text-sm font-bold text-slate-500">الكلمة الموضحة بالصورة:</span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setRevealWord(prev => !prev);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                  title={revealWord ? "إخفاء الحرف المستهدف للتحدي" : "إظهار الكلمة كاملة للمساعدة"}
                >
                  {revealWord ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>إخفاء الحرف المطلوب</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>كشف الكلمة كاملة</span>
                    </>
                  )}
                </button>
              </div>

              {/* Big Word Display with Hidden Letter or Letter+Madd */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 py-1">
                <div
                  dir="rtl"
                  className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-800 tracking-wider flex items-center gap-1 select-none"
                >
                  {revealWord || isChecked ? (
                    <span className="text-emerald-700 bg-emerald-50/70 px-4 py-1.5 rounded-2xl border border-emerald-200 shadow-xs">
                      {currentQuestion.targetWord.word}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getMaskedWordSegments(
                        currentQuestion.targetWord.word,
                        letter.char,
                        currentQuestion.targetWord.maddType
                      ).map((seg, sIdx) => {
                        if (seg.isMasked) {
                          return (
                            <span
                              key={sIdx}
                              title={seg.maddInfo ? `مخفي: حرف (${letter.char}) مع ${seg.maddInfo}` : `مخفي: حرف (${letter.char})`}
                              className="inline-flex items-center justify-center min-w-[3.5rem] px-3 py-1 text-3xl sm:text-4xl font-black text-amber-700 bg-amber-200/80 border-2 border-dashed border-amber-400 rounded-2xl shadow-inner animate-pulse"
                            >
                              ؟
                            </span>
                          );
                        }
                        return (
                          <span key={sIdx} className="text-slate-900">
                            {seg.text}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={speakCurrentWord}
                  title="استمع لنطق الكلمة"
                  className="p-3 rounded-2xl bg-orange-100 text-orange-600 hover:bg-orange-200 active:scale-95 transition-all shadow-xs"
                >
                  <Volume2 className="w-7 h-7" />
                </button>
              </div>

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {currentQuestion.targetWord.meaning && (
                  <p className="text-sm text-slate-500 font-medium bg-white/80 px-3 py-1 rounded-xl border border-amber-100">
                    💡 {currentQuestion.targetWord.meaning}
                  </p>
                )}
                {!revealWord && !isChecked && (
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200/80 px-2.5 py-1 rounded-xl">
                    {currentQuestion.targetWord.maddType !== 'none'
                      ? `تم إخفاء حرف (${letter.char}) مع صوته الطويل/المد للتحدي!`
                      : `تم إخفاء حرف (${letter.char}) للتحدي!`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE AREA BASED ON QUESTION TYPE */}
        {/* ------------------------------------------------------------- */}

        {/* 1. Drag and Drop & Build Word Interactive Area */}
        {(currentQuestion.type === 'drag_drop' || currentQuestion.type === 'build_word') && (
          <div className="space-y-8 my-4">
            
            {/* Target Word Slots */}
            <div>
              <p className="text-center text-sm font-bold text-slate-500 mb-3">
                {currentQuestion.type === 'drag_drop'
                  ? 'اسحب الحرف المناسب إلى المربع المنقط (أو انقر عليه للوضع التلقائي):'
                  : 'رتب حروف الكلمة بالترتيب الصحيح من اليمين إلى اليسار:'}
              </p>

              <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap" dir="rtl">
                {slots.map((slot) => {
                  const isOccupied = !!slot.filledTile;
                  const isTargetEmpty = slot.isInitialEmpty;

                  return (
                    <div
                      key={slot.index}
                      id={`word-slot-${slot.index}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnSlot(e, slot.index)}
                      onClick={() => handleSlotTap(slot.index)}
                      className={`w-18 h-20 sm:w-22 sm:h-24 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-black transition-all cursor-pointer ${
                        !isTargetEmpty
                          ? 'bg-slate-100 text-slate-800 border-2 border-slate-300'
                          : isOccupied
                          ? 'bg-amber-100 border-3 border-amber-500 text-orange-600 shadow-md scale-105'
                          : 'bg-amber-50/50 border-3 border-dashed border-amber-400 text-amber-300 hover:bg-amber-100/60'
                      }`}
                      title={isTargetEmpty ? (isOccupied ? 'انقر لإزالة الحرف' : 'أسقط الحرف هنا') : 'حرف ثابت'}
                    >
                      {isOccupied ? (
                        <span className="animate-in zoom-in duration-200">
                          {slot.filledTile?.char}
                        </span>
                      ) : !isTargetEmpty ? (
                        slot.expectedChar
                      ) : (
                        <span className="text-2xl text-amber-400 font-light">؟</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Draggable Letter Tiles Pool */}
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-4">
                الحروف المتاحة للسحب والإفلات (يدعم السحب أو النقر المباشر للسبورة الذكية):
              </span>

              {availableTiles.length === 0 ? (
                <div className="text-slate-400 font-bold text-sm py-3">
                  🎉 تم وضع جميع الحروف في مواضعها! اضغط «تحقق من الإجابة» بالأسفل.
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap" dir="rtl">
                  {availableTiles.map((tile) => {
                    const isSelected = selectedTileForTap?.id === tile.id;
                    return (
                      <div
                        key={tile.id}
                        id={`draggable-tile-${tile.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tile)}
                        onClick={() => handleTileTap(tile)}
                        className={`w-16 h-18 sm:w-20 sm:h-22 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-black cursor-grab active:cursor-grabbing select-none transition-all shadow-md active:scale-95 ${
                          isSelected
                            ? 'bg-orange-500 text-white border-3 border-orange-600 scale-110 shadow-lg'
                            : 'bg-white hover:bg-amber-50 text-slate-800 border-2 border-amber-300 hover:border-orange-400 hover:-translate-y-1'
                        }`}
                        title="اسحب أو انقر لوضع هذا الحرف"
                      >
                        {tile.char}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Multiple Choice Questions (Missing Letter, Madd, Position, Short Vowels) */}
        {currentQuestion.type !== 'drag_drop' && 
         currentQuestion.type !== 'build_word' && 
         currentQuestion.type !== 'picture_match' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            {currentQuestion.options?.map((option, idx) => {
              const isSelected = selectedOption === option;
              let btnClass = 'bg-slate-50 hover:bg-amber-50 text-slate-800 border-2 border-slate-200 hover:border-amber-300';
              
              if (isSelected) {
                btnClass = 'bg-orange-500 text-white border-2 border-orange-600 shadow-lg shadow-orange-500/25 scale-[1.02]';
              }

              return (
                <button
                  key={idx}
                  id={`option-btn-${idx}`}
                  disabled={isChecked && isCorrect === true}
                  onClick={() => {
                    sound.playClick();
                    setSelectedOption(option);
                  }}
                  className={`p-5 rounded-2xl font-black text-xl sm:text-2xl transition-all active:scale-95 flex items-center justify-between ${btnClass}`}
                >
                  <span>{option}</span>
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Picture Match Question Area */}
        {currentQuestion.type === 'picture_match' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-6">
            {currentQuestion.options?.map((wordId) => {
              const choiceWord = allWords.find(w => w.id === wordId);
              if (!choiceWord) return null;
              const isSelected = selectedOption === choiceWord.id;

              return (
                <div
                  key={choiceWord.id}
                  id={`pic-choice-${choiceWord.id}`}
                  onClick={() => {
                    if (isChecked && isCorrect) return;
                    sound.playClick();
                    setSelectedOption(choiceWord.id);
                  }}
                  className={`cursor-pointer p-4 rounded-3xl border-3 transition-all flex flex-col items-center gap-3 ${
                    isSelected
                      ? 'bg-amber-50 border-orange-500 shadow-xl scale-105'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <img
                    src={choiceWord.image}
                    alt={choiceWord.word}
                    className="w-full h-36 object-contain rounded-2xl bg-slate-50 p-2"
                  />
                  <span className="text-2xl font-black text-slate-800">
                    {choiceWord.word}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FEEDBACK BANNER */}
        {/* ------------------------------------------------------------- */}
        {feedbackMessage && (
          <div
            className={`p-5 rounded-2xl font-black text-lg sm:text-xl flex items-center gap-3 mt-6 animate-in fade-in zoom-in duration-200 ${
              isCorrect
                ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400'
                : 'bg-amber-100 text-amber-950 border-2 border-amber-400'
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-amber-600 shrink-0" />
            )}
            <div className="flex-1">
              <p>{feedbackMessage}</p>
            </div>
            {!isCorrect && isChecked && (
              <button
                id="btn-retry-question"
                onClick={handleRetryCurrent}
                className="px-4 py-2 bg-white text-amber-900 font-bold text-sm rounded-xl shadow-xs hover:bg-amber-50 active:scale-95 transition-all"
              >
                إعادة المحاولة 🔄
              </button>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ACTION BUTTONS (CHECK / NEXT) */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
          <button
            id="btn-check-answer"
            onClick={handleCheckAnswer}
            disabled={isChecked && isCorrect === true}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>تحقق من الإجابة 🔍</span>
          </button>

          {(isChecked && isCorrect) || (isChecked && isCorrect === false) ? (
            <button
              id="btn-next-question"
              onClick={handleNextQuestion}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-black text-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 animate-pulse"
            >
              <span>{currentIndex + 1 < questions.length ? 'السؤال التالي ➡️' : 'عرض النتيجة النهائية 🏆'}</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 font-medium hidden sm:block">
              اضغط على «تحقق من الإجابة» للتأكد من حلك
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
