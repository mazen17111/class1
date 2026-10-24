import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentSelector } from './components/StudentSelector';
import { LetterPicker } from './components/LetterPicker';
import { ActivitySetup } from './components/ActivitySetup';
import { QuizEngine } from './components/QuizEngine';
import { QuizResultModal } from './components/QuizResultModal';
import { WordManagerModal } from './components/WordManagerModal';
import { SecretLockScreen } from './components/SecretLockScreen';
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

  // Secret 404 Disguise & Lock screen state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('platform_secret_unlocked') === 'true';
  });

  const handleUnlock = () => {
    sessionStorage.setItem('platform_secret_unlocked', 'true');
    setIsUnlocked(true);
  };

  const handleLock = () => {
    sessionStorage.removeItem('platform_secret_unlocked');
    setIsUnlocked(false);
  };

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

  if (!isUnlocked) {
    return <SecretLockScreen onUnlock={handleUnlock} />;
  }

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
        onLock={handleLock}
      />

      {/* Stage Step Indicator Banner */}
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

      {/* Main View Area */}
      <main className="flex-1 pb-16">
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
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        تطبيق أنشطة الحروف العربية التفاعلية • مصمم خصيصًا للأطفال والمدارس والسبورات الذكية
      </footer>
    </div>
  );
}
