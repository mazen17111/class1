import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentSelector } from './components/StudentSelector';
import { LetterPicker } from './components/LetterPicker';
import { ActivitySetup } from './components/ActivitySetup';
import { QuizEngine } from './components/QuizEngine';
import { QuizResultModal } from './components/QuizResultModal';
import { WordManagerModal } from './components/WordManagerModal';
import { PresentationStudio } from './components/PresentationStudio';
import { FileText, Presentation, ArrowLeft } from 'lucide-react';
import { 
  AppStage, ArabicLetter, Question, QuizConfig, Student, WordItem 
} from './types';
import { 
  loadStudents, saveStudents, loadWords, saveCustomWord, deleteCustomWord 
} from './utils/storage';
import { generateQuizQuestions } from './utils/questionGenerator';
import { sound } from './utils/audio';

export default function App() {
  const [stage, setStage] = useState<AppStage>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [words, setWords] = useState<WordItem[]>([]);
  
  // Track students who have already been selected in this raffle round
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Active session state
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentLetter, setCurrentLetter] = useState<ArabicLetter | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [usedWordHistory, setUsedWordHistory] = useState<Record<string, string[]>>({});

  // Settings & Modals
  const [isWordManagerOpen, setIsWordManagerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize data from storage
  useEffect(() => {
    setStudents(loadStudents());
    setWords(loadWords());
  }, []);

  // Save student updates
  const handleAddStudent = (name: string) => {
    const newStudent: Student = {
      id: `s-${Date.now()}`,
      name,
      avatarColor: ['#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444'][
        Math.floor(Math.random() * 7)
      ],
    };
    const updated = [newStudent, ...students];
    setStudents(updated);
    saveStudents(updated);
  };

  const handleRemoveStudent = (id: string) => {
    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    saveStudents(updated);
    setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
  };

  const handleClearAllStudents = () => {
    setStudents([]);
    saveStudents([]);
    setSelectedStudentIds([]);
    setCurrentStudent(null);
  };

  // Word manager updates
  const handleAddWord = (newWord: WordItem) => {
    const updated = saveCustomWord(newWord);
    setWords(updated);
  };

  const handleDeleteWord = (id: string) => {
    const updated = deleteCustomWord(id);
    setWords(updated);
  };

  // Sound toggle
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sound.enabled = nextState;
  };

  // Flow handlers
  const handleSelectStudent = (student: Student) => {
    setCurrentStudent(student);
    // Mark student as selected for the current cycle so they do not repeat
    setSelectedStudentIds(prev => {
      if (prev.includes(student.id)) return prev;
      return [...prev, student.id];
    });
    setStage('letter_select');
  };

  const handleResetRaffleCycle = () => {
    setSelectedStudentIds([]);
    setUsedWordHistory({});
  };

  const handleSelectLetter = (letter: ArabicLetter) => {
    setCurrentLetter(letter);
    setStage('quiz_setup');
  };

  const handleStartQuiz = (config: QuizConfig) => {
    // Generate questions avoiding recently used words and prioritizing custom words/images
    const letterKey = config.letter.char;
    const historyForLetter = usedWordHistory[letterKey] || [];

    const generated = generateQuizQuestions(
      config.letter,
      words,
      config.questionCount,
      config.selectedTypes,
      historyForLetter
    );

    // Track used words for this letter to prevent repetition for subsequent students
    const newWordIds = generated.map(q => q.targetWord.id);
    setUsedWordHistory(prev => ({
      ...prev,
      [letterKey]: [...(prev[letterKey] || []), ...newWordIds]
    }));

    setQuestions(generated);
    setStage('quiz_active');
  };

  const handleQuizComplete = (score: number, total: number) => {
    setQuizScore({ score, total });
    setStage('quiz_result');
  };

  // Navigation callbacks
  const handleResetToStudents = () => {
    setCurrentStudent(null);
    setCurrentLetter(null);
    setQuestions([]);
    setQuizScore(null);
    setStage('students');
  };

  const handleBackToLetters = () => {
    setCurrentLetter(null);
    setStage('letter_select');
  };

  const handleRetrySameQuiz = () => {
    if (currentLetter && currentStudent) {
      // Regenerate fresh, non-repeating questions
      const letterKey = currentLetter.char;
      const historyForLetter = usedWordHistory[letterKey] || [];

      const generated = generateQuizQuestions(
        currentLetter,
        words,
        questions.length || 5,
        ['drag_drop', 'choose_letter', 'choose_madd', 'letter_position', 'short_vowel'],
        historyForLetter
      );

      const newWordIds = generated.map(q => q.targetWord.id);
      setUsedWordHistory(prev => ({
        ...prev,
        [letterKey]: [...(prev[letterKey] || []), ...newWordIds]
      }));

      setQuestions(generated);
      setStage('quiz_active');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-200">
      
      {/* Top Navigation */}
      <Navbar
        stage={stage}
        currentStudent={currentStudent}
        currentLetter={currentLetter}
        onOpenWordManager={() => setIsWordManagerOpen(true)}
        onResetToStudents={handleResetToStudents}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Stage Step Indicator Banner (hidden when inside presentation studio) */}
      {stage !== 'presentation_studio' && (
        <div className="bg-amber-50/70 border-b border-amber-100 py-2 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-black flex-wrap">
            <span className={stage === 'students' ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full' : 'text-slate-400'}>
              1. القرعة والطلاب
            </span>
            <span className="text-slate-300">←</span>
            <span className={stage === 'letter_select' ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full' : 'text-slate-400'}>
              2. اختيار الحرف
            </span>
            <span className="text-slate-300">←</span>
            <span className={stage === 'quiz_setup' ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full' : 'text-slate-400'}>
              3. نوع وعدد الأسئلة
            </span>
            <span className="text-slate-300">←</span>
            <span className={stage === 'quiz_active' ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full' : 'text-slate-400'}>
              4. الأنشطة التفاعلية
            </span>
            <span className="text-slate-300">←</span>
            <span className={stage === 'quiz_result' ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full' : 'text-slate-400'}>
              5. النتيجة والاحتفال
            </span>
          </div>
        </div>
      )}

      {/* Prominent Large Rectangular Top Button: إصدار باوربوينت أو PDF */}
      {stage !== 'presentation_studio' && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-5">
          <button
            id="btn-open-presentation-studio"
            type="button"
            onClick={() => {
              sound.playClick();
              setStage('presentation_studio');
            }}
            className="w-full text-right rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 sm:px-8 sm:py-5 shadow-md border border-slate-800 transition-all active:scale-[0.995] flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                <Presentation className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  إصدار باوربوينت أو PDF
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-300 mt-0.5">
                  اختر الحرف وأضف صورك لإصدار عرض PPTX أو ملف PDF متجدد ومرتب وقابل للتعديل · بقيادة المعلم وائل حمدي
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-black text-sm shrink-0 self-end sm:self-center transition-colors whitespace-nowrap">
              <FileText className="w-4 h-4" />
              <span>ابدأ الإصدار الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {/* Presentation & PDF Studio */}
        {stage === 'presentation_studio' && (
          <PresentationStudio
            words={words}
            onBackToPlatform={handleResetToStudents}
          />
        )}

        {/* Stage 1: Students and Raffle */}
        {stage === 'students' && (
          <StudentSelector
            students={students}
            onAddStudent={handleAddStudent}
            onRemoveStudent={handleRemoveStudent}
            onClearAllStudents={handleClearAllStudents}
            onSelectStudent={handleSelectStudent}
            selectedStudentIds={selectedStudentIds}
            onResetRaffleCycle={handleResetRaffleCycle}
          />
        )}

        {/* Stage 2: Pick Arabic Letter */}
        {stage === 'letter_select' && currentStudent && (
          <LetterPicker
            student={currentStudent}
            onSelectLetter={handleSelectLetter}
            onBack={handleResetToStudents}
          />
        )}

        {/* Stage 3: Setup Activity and Questions Count */}
        {stage === 'quiz_setup' && currentStudent && currentLetter && (
          <ActivitySetup
            student={currentStudent}
            letter={currentLetter}
            onStartQuiz={handleStartQuiz}
            onBack={handleBackToLetters}
          />
        )}

        {/* Stage 4: Active Interactive Quiz */}
        {stage === 'quiz_active' && currentStudent && currentLetter && (
          <QuizEngine
            student={currentStudent}
            letter={currentLetter}
            questions={questions}
            allWords={words}
            onComplete={handleQuizComplete}
            onExit={handleResetToStudents}
          />
        )}

        {/* Stage 5: Final Result Modal */}
        {stage === 'quiz_result' && currentStudent && currentLetter && quizScore && (
          <QuizResultModal
            student={currentStudent}
            letter={currentLetter}
            score={quizScore.score}
            total={quizScore.total}
            onNewStudent={handleResetToStudents}
            onRetry={handleRetrySameQuiz}
            onChangeLetter={handleBackToLetters}
          />
        )}
      </main>

      {/* Word & Image Database Management Modal */}
      <WordManagerModal
        isOpen={isWordManagerOpen}
        onClose={() => setIsWordManagerOpen(false)}
        words={words}
        onAddWord={handleAddWord}
        onDeleteWord={handleDeleteWord}
      />

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-bold">
          <div className="flex items-center gap-2 text-slate-700">
            <span>🌟 أبطال الصف الأول</span>
            <span className="text-slate-300">•</span>
            <span className="text-orange-600 font-black">بقيادة المعلم وائل حمدي 👨‍🏫</span>
          </div>
          <div className="text-slate-400 font-medium">
            أنشطة الحروف والمدود التفاعلية • مخصص للسبورات الذكية والفصول المتميزة
          </div>
        </div>
      </footer>
    </div>
  );
}
