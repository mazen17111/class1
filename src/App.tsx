import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StudentSelector } from './components/StudentSelector';
import { LetterPicker } from './components/LetterPicker';
import { ActivitySetup } from './components/ActivitySetup';
import { QuizEngine } from './components/QuizEngine';
import { QuizResultModal } from './components/QuizResultModal';
import { WordManagerModal } from './components/WordManagerModal';
import { PresentationStudio } from './components/PresentationStudio';
import { SmartWhiteboard } from './components/SmartWhiteboard';
import { IssuedCertificatesView } from './components/IssuedCertificatesView';
import { AdminControlModal } from './components/AdminControlModal';
import { StudyMaterialsStudio } from './components/StudyMaterialsStudio';
import { PresentationsLibraryView } from './components/PresentationsLibraryView';
import { CERTIFICATE_THEMES } from './components/ChildCertificate';
import {
  FileText,
  Presentation,
  ArrowLeft,
  Monitor,
  Award,
  Sparkles,
  BookOpen,
  Plus,
  Play,
} from 'lucide-react';
import {
  AppStage,
  ArabicLetter,
  BrandSettings,
  IssuedCertificate,
  Question,
  QuizConfig,
  SavedPresentation,
  Student,
  StudyMaterial,
  WordItem,
} from './types';
import {
  loadStudents,
  saveStudents,
  hasSavedStudentsLocally,
  loadWords,
  saveCustomWord,
  saveAllCustomWords,
  deleteCustomWord,
  loadCertificates,
  saveCertificatesLocal,
  upsertCertificateLocal,
  loadBrandSettings,
  saveBrandSettingsLocal,
} from './utils/storage';
import { generateQuizQuestions } from './utils/questionGenerator';
import { sound } from './utils/audio';
import {
  syncLocalDataToFirestore,
  subscribeStudents,
  subscribeCertificates,
  subscribeCustomWords,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  deleteStudentsBatchFromFirestore,
  saveCertificateToFirestore,
  updateCertificateThemeInFirestore,
  deleteCertificateFromFirestore,
  saveCustomWordToFirestore,
  deleteCustomWordFromFirestore,
  subscribeBrandSettings,
  saveBrandSettingsToFirestore,
  subscribeStudyMaterials,
  subscribePresentations,
  savePresentationToFirestore,
  deletePresentationFromFirestore,
} from './firebase';
import {
  saveLocalPresentation,
  getAllLocalPresentations,
  deleteLocalPresentation,
} from './utils/presentationsDb';

let lastAutoCertThemeIdx = -1;

export default function App() {
  const [stage, setStage] = useState<AppStage>('students');
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [words, setWords] = useState<WordItem[]>(() => loadWords());
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>(() =>
    loadCertificates()
  );

  // Direct Firebase Firestore connection status (no login required)
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Keep refs of initial local data for initial sync
  const studentsRef = useRef(students);
  const wordsRef = useRef(words);
  const certsRef = useRef(issuedCertificates);
  studentsRef.current = students;
  wordsRef.current = words;
  certsRef.current = issuedCertificates;

  // Track students who have already been selected in this raffle round
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Active session state
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentLetter, setCurrentLetter] = useState<ArabicLetter | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [activeCertificateId, setActiveCertificateId] = useState<string | null>(null);
  const [activeCertificateThemeId, setActiveCertificateThemeId] = useState<string>('gold');
  const [usedWordHistory, setUsedWordHistory] = useState<Record<string, string[]>>({});

  // Settings & Modals
  const [isWordManagerOpen, setIsWordManagerOpen] = useState(false);
  const [isAdminControlOpen, setIsAdminControlOpen] = useState(false);
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(() => loadBrandSettings());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Study Materials & Whiteboard session persistence
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [activeStudyMaterialId, setActiveStudyMaterialId] = useState<string | null>(null);
  const [openAddMaterialModal, setOpenAddMaterialModal] = useState(false);
  const [whiteboardDrawingUrl, setWhiteboardDrawingUrl] = useState<string | null>(null);

  // Saved PowerPoint Presentations ("العروض التقديمية")
  const [savedPresentations, setSavedPresentations] = useState<SavedPresentation[]>([]);
  const [editingPresentation, setEditingPresentation] = useState<SavedPresentation | null>(null);
  const [openExternalPptxModal, setOpenExternalPptxModal] = useState(false);

  // Track explicitly deleted certificate IDs so snapshot merges never resurrect them
  const deletedCertIdsRef = useRef<Set<string>>(new Set());

  // Direct Firestore startup sync & real-time subscriptions (no login)
  useEffect(() => {
    let isMounted = true;
    let unsubStudents: (() => void) | null = null;
    let unsubCerts: (() => void) | null = null;
    let unsubWords: (() => void) | null = null;
    let unsubBrand: (() => void) | null = null;
    let unsubMaterials: (() => void) | null = null;
    let unsubPresentations: (() => void) | null = null;

    // Immediately load locally cached presentations so the list appears right away
    getAllLocalPresentations().then((localDecks) => {
      if (isMounted && localDecks.length > 0) {
        setSavedPresentations((prev) => (prev.length > 0 ? prev : localDecks));
      }
    });

    const initFirestore = async () => {
      const ok = await syncLocalDataToFirestore(
        studentsRef.current,
        certsRef.current,
        wordsRef.current.filter((w) => w.isCustom),
        hasSavedStudentsLocally()
      );
      if (!isMounted) return;
      setIsFirebaseConnected(ok);

      unsubStudents = subscribeStudents((remoteStudents) => {
        setIsFirebaseConnected(true);
        setStudents(remoteStudents);
        saveStudents(remoteStudents);
      });

      unsubCerts = subscribeCertificates((remoteCerts) => {
        setIssuedCertificates((prev) => {
          const byId = new Map<string, IssuedCertificate>();
          for (const c of prev) {
            if (!deletedCertIdsRef.current.has(c.id)) byId.set(c.id, c);
          }
          for (const c of remoteCerts) {
            if (!deletedCertIdsRef.current.has(c.id)) byId.set(c.id, c);
          }
          const merged = Array.from(byId.values()).sort(
            (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
          );
          saveCertificatesLocal(merged);
          return merged;
        });
      });

      unsubWords = subscribeCustomWords((remoteCustomWords) => {
        const updated = saveAllCustomWords(remoteCustomWords);
        setWords(updated);
      });

      unsubBrand = subscribeBrandSettings((remoteSettings) => {
        setBrandSettings(remoteSettings);
        saveBrandSettingsLocal(remoteSettings);
      });

      unsubMaterials = subscribeStudyMaterials((remoteMaterials) => {
        setStudyMaterials(remoteMaterials);
      });

      unsubPresentations = subscribePresentations((remoteDecks) => {
        setSavedPresentations((prev) => {
          const prevSlidesById = new Map<string, SavedPresentation['slides']>();
          for (const item of prev) {
            if (item.slides && item.slides.length > 0) {
              prevSlidesById.set(item.id, item.slides);
            }
          }
          return remoteDecks.map((d) => ({
            ...d,
            slides: prevSlidesById.get(d.id) || d.slides,
          }));
        });
      });
    };

    initFirestore();

    return () => {
      isMounted = false;
      if (unsubStudents) unsubStudents();
      if (unsubCerts) unsubCerts();
      if (unsubWords) unsubWords();
      if (unsubBrand) unsubBrand();
      if (unsubMaterials) unsubMaterials();
      if (unsubPresentations) unsubPresentations();
    };
  }, []);

  // Permanent student creation (NEVER deleted)
  const handleAddStudent = (name: string) => {
    const cleanName = name.trim().slice(0, 100);
    if (!cleanName) return;
    if (students.some((s) => s.name.trim() === cleanName)) return;

    const newStudent: Student = {
      id: `s-${Date.now()}`,
      name: cleanName,
      avatarColor: ['#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444'][
        Math.floor(Math.random() * 7)
      ],
    };
    const updated = [newStudent, ...students];
    setStudents(updated);
    saveStudents(updated);

    saveStudentToFirestore(newStudent).catch((e) =>
      console.error('Failed to save student to Firebase:', e)
    );
  };

  const handleRemoveStudent = (id: string) => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    saveStudents(updated);
    setSelectedStudentIds((prev) => prev.filter((sid) => sid !== id));
    if (currentStudent?.id === id) {
      setCurrentStudent(null);
    }

    deleteStudentFromFirestore(id).catch((e) =>
      console.error('Failed to delete student from Firebase:', e)
    );
  };

  const handleClearAllStudents = () => {
    const idsToDelete = students.map((s) => s.id);
    setStudents([]);
    saveStudents([]);
    setSelectedStudentIds([]);
    setCurrentStudent(null);

    deleteStudentsBatchFromFirestore(idsToDelete).catch((e) =>
      console.error('Failed to delete all students from Firebase:', e)
    );
  };

  // Word manager updates
  const handleAddWord = (newWord: WordItem) => {
    const updated = saveCustomWord(newWord);
    setWords(updated);

    saveCustomWordToFirestore(newWord).catch((e) =>
      console.error('Failed to save word to Firebase:', e)
    );
  };

  const handleDeleteWord = (id: string) => {
    const updated = deleteCustomWord(id);
    setWords(updated);

    deleteCustomWordFromFirestore(id).catch((e) =>
      console.error('Failed to delete word from Firebase:', e)
    );
  };

  // Certificate theme & deletion updates
  const handleUpdateCertificateTheme = (certId: string, themeId: string) => {
    setIssuedCertificates((prev) => {
      const updated = prev.map((c) => (c.id === certId ? { ...c, themeId } : c));
      saveCertificatesLocal(updated);
      return updated;
    });
    if (certId === activeCertificateId) {
      setActiveCertificateThemeId(themeId);
    }
    updateCertificateThemeInFirestore(certId, themeId).catch((e) =>
      console.error('Failed to update certificate theme in Firebase:', e)
    );
  };

  const handleDeleteCertificate = async (certId: string) => {
    deletedCertIdsRef.current.add(certId);
    setIssuedCertificates((prev) => {
      const updated = prev.filter((c) => c.id !== certId);
      saveCertificatesLocal(updated);
      return updated;
    });
    if (certId === activeCertificateId) {
      setActiveCertificateId(null);
    }
    try {
      await deleteCertificateFromFirestore(certId);
    } catch (e) {
      console.error('Failed to delete certificate from Firebase:', e);
    }
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
    setSelectedStudentIds((prev) => {
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
    const letterKey = config.letter.char;
    const historyForLetter = usedWordHistory[letterKey] || [];

    const generated = generateQuizQuestions(
      config.letter,
      words,
      config.questionCount,
      config.selectedTypes,
      historyForLetter
    );

    const newWordIds = generated.map((q) => q.targetWord.id);
    setUsedWordHistory((prev) => ({
      ...prev,
      [letterKey]: [...(prev[letterKey] || []), ...newWordIds],
    }));

    setQuestions(generated);
    setStage('quiz_active');
  };

  const handleQuizComplete = (score: number, total: number) => {
    setQuizScore({ score, total });

    // Automatically issue and archive certificate
    if (currentStudent && currentLetter) {
      const nextIdx =
        lastAutoCertThemeIdx === -1
          ? Math.floor(Math.random() * CERTIFICATE_THEMES.length)
          : (lastAutoCertThemeIdx + 1) % CERTIFICATE_THEMES.length;
      lastAutoCertThemeIdx = nextIdx;
      const chosenThemeId = CERTIFICATE_THEMES[nextIdx].id;
      const certId = `cert_${Date.now()}`;
      const percentage = Math.round((score / Math.max(1, total)) * 100);
      const issuedDateLabel = new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date());

      const newCert: IssuedCertificate = {
        id: certId,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentAvatarColor: currentStudent.avatarColor,
        letterId: currentLetter.id,
        letterChar: currentLetter.char,
        letterName: currentLetter.name,
        score,
        total,
        percentage,
        themeId: chosenThemeId,
        issuedDateLabel,
        createdAtMs: Date.now(),
      };

      setActiveCertificateId(certId);
      setActiveCertificateThemeId(chosenThemeId);
      setIssuedCertificates(upsertCertificateLocal(newCert));

      saveCertificateToFirestore(newCert).catch((e) =>
        console.error('Failed to archive certificate in Firebase:', e)
      );
    }

    setStage('quiz_result');
  };

  // Navigation callbacks
  const handleResetToStudents = () => {
    setCurrentStudent(null);
    setCurrentLetter(null);
    setQuestions([]);
    setQuizScore(null);
    setActiveCertificateId(null);
    setStage('students');
  };

  const handleBackToLetters = () => {
    setCurrentLetter(null);
    setStage('letter_select');
  };

  const handleRetrySameQuiz = () => {
    if (currentLetter && currentStudent) {
      const letterKey = currentLetter.char;
      const historyForLetter = usedWordHistory[letterKey] || [];

      const generated = generateQuizQuestions(
        currentLetter,
        words,
        questions.length || 5,
        ['drag_drop', 'choose_letter', 'choose_madd', 'letter_position', 'short_vowel'],
        historyForLetter
      );

      const newWordIds = generated.map((q) => q.targetWord.id);
      setUsedWordHistory((prev) => ({
        ...prev,
        [letterKey]: [...(prev[letterKey] || []), ...newWordIds],
      }));

      setQuestions(generated);
      setStage('quiz_active');
    }
  };

  const handleSavePresentationToPlatform = async (deck: SavedPresentation) => {
    await saveLocalPresentation(deck);
    setSavedPresentations((prev) => {
      const filtered = prev.filter((p) => p.id !== deck.id);
      return [deck, ...filtered];
    });
    await savePresentationToFirestore(deck);
  };

  const handleDeleteSavedPresentation = async (id: string) => {
    setSavedPresentations((prev) => prev.filter((p) => p.id !== id));
    await Promise.all([
      deleteLocalPresentation(id),
      deletePresentationFromFirestore(id).catch((e) =>
        console.error('Failed to delete presentation from Firebase:', e)
      ),
    ]);
  };

  const isToolFullscreenStage =
    stage === 'presentation_studio' ||
    stage === 'presentations_library' ||
    stage === 'whiteboard' ||
    stage === 'issued_certificates' ||
    stage === 'study_materials';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-200">
      {/* Top Navigation (No login UI) */}
      <Navbar
        stage={stage}
        currentStudent={currentStudent}
        currentLetter={currentLetter}
        onOpenWordManager={() => setIsWordManagerOpen(true)}
        onResetToStudents={handleResetToStudents}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isFirebaseConnected={isFirebaseConnected}
        brandSettings={brandSettings}
        isAdminControlOpen={isAdminControlOpen}
        onOpenAdminControl={() => setIsAdminControlOpen(true)}
      />

      {/* Stage Step Indicator Banner */}
      {!isToolFullscreenStage && (
        <div className="bg-amber-50/70 border-b border-amber-100 py-2 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-black flex-wrap">
            <span
              className={
                stage === 'students'
                  ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full'
                  : 'text-slate-400'
              }
            >
              1. القرعة والطلاب
            </span>
            <span className="text-slate-300">←</span>
            <span
              className={
                stage === 'letter_select'
                  ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full'
                  : 'text-slate-400'
              }
            >
              2. اختيار الحرف
            </span>
            <span className="text-slate-300">←</span>
            <span
              className={
                stage === 'quiz_setup'
                  ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full'
                  : 'text-slate-400'
              }
            >
              3. نوع وعدد الأسئلة
            </span>
            <span className="text-slate-300">←</span>
            <span
              className={
                stage === 'quiz_active'
                  ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full'
                  : 'text-slate-400'
              }
            >
              4. الأنشطة التفاعلية
            </span>
            <span className="text-slate-300">←</span>
            <span
              className={
                stage === 'quiz_result'
                  ? 'text-orange-600 bg-orange-100 px-3 py-1 rounded-full'
                  : 'text-slate-400'
              }
            >
              5. النتيجة والاحتفال
            </span>
          </div>
        </div>
      )}

      {/* TOP TEACHER COMMAND TOOLS BAR: السبورة الذكية + الشهادات الصادرة + إصدار باوربوينت أو PDF */}
      {!isToolFullscreenStage && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-5 space-y-3">
          {/* Two New Prominent Top Teacher Tools: السبورة الذكية & الشهادات الصادرة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Smart Whiteboard Button */}
            <button
              id="btn-open-smart-whiteboard"
              type="button"
              onClick={() => {
                sound.playClick();
                setStage('whiteboard');
              }}
              className="w-full text-right rounded-2xl bg-gradient-to-l from-indigo-700 via-blue-700 to-slate-900 hover:brightness-110 text-white px-5 py-4 shadow-md border border-indigo-500/40 transition-all active:scale-[0.99] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs text-amber-300 flex items-center justify-center shrink-0 border border-white/20">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>السبورة الذكية</span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-xs font-medium text-blue-100 mt-0.5">
                    3 أقلام بألوان قابلة للتغيير · مظلل · مؤشر ليزر · مساحة وأحجام متنوعة
                  </div>
                </div>
              </div>
              <span className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-black text-xs shrink-0 group-hover:bg-amber-300 transition-colors">
                فتح السبورة
              </span>
            </button>

            {/* Issued Certificates Button */}
            <button
              id="btn-open-issued-certificates"
              type="button"
              onClick={() => {
                sound.playClick();
                setStage('issued_certificates');
              }}
              className="w-full text-right rounded-2xl bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-800 hover:brightness-110 text-white px-5 py-4 shadow-md border border-emerald-400/40 transition-all active:scale-[0.99] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs text-yellow-200 flex items-center justify-center shrink-0 border border-white/20">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>الشهادات الصادرة</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                      {issuedCertificates.length}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-emerald-100 mt-0.5">
                    أرشيف جميع الشهادات التي أصدرها المعلم وائل حمدي مع التحميل والطباعة
                  </div>
                </div>
              </div>
              <span className="px-3.5 py-2 rounded-xl bg-white text-emerald-900 font-black text-xs shrink-0 group-hover:bg-amber-300 group-hover:text-slate-950 transition-colors">
                عرض السجل
              </span>
            </button>
          </div>

          {/* Prominent Large Rectangular Button: إصدار باوربوينت أو PDF */}
          <button
            id="btn-open-presentation-studio"
            type="button"
            onClick={() => {
              sound.playClick();
              setEditingPresentation(null);
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

          {/* Prominent Rectangular Card: العروض التقديمية (Saved & External PowerPoints ready to Explain!) */}
          <div
            id="btn-open-presentations-library"
            role="button"
            tabIndex={0}
            onClick={() => {
              sound.playClick();
              setOpenExternalPptxModal(false);
              setStage('presentations_library');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sound.playClick();
                setOpenExternalPptxModal(false);
                setStage('presentations_library');
              }
            }}
            className="w-full text-right rounded-2xl bg-gradient-to-l from-orange-600 via-amber-600 to-orange-700 hover:brightness-105 text-white px-6 py-4 sm:px-8 sm:py-5 shadow-md border border-orange-400/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/15 backdrop-blur-xs text-white flex items-center justify-center shrink-0 border border-white/25 shadow-sm">
                <Play className="w-7 h-7 fill-white" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
                  <span>العروض التقديمية</span>
                  {savedPresentations.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-800 text-xs font-black tabular-nums">
                      {savedPresentations.length}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-medium text-amber-50 mt-0.5">
                  عروض الباوربوينت المحفوظة والمستوردة في المنصة · اضغط «اشرح» للتكبير والكتابة والليزر
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 flex-wrap">
              <button
                id="btn-add-external-pptx-card"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setOpenExternalPptxModal(true);
                  setStage('presentations_library');
                }}
                title="إضافة باوربوينت خارجي (PPTX أو PDF أو رابط)"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>باوربوينت خارجي</span>
              </button>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white group-hover:bg-amber-100 text-orange-900 font-black text-sm transition-colors whitespace-nowrap">
                <Presentation className="w-4 h-4" />
                <span>فتح العروض للشرح</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Prominent Large Rectangular Card: المواد الدراسية with + Upload/Link button */}
          <div
            id="card-study-materials"
            role="button"
            tabIndex={0}
            onClick={() => {
              sound.playClick();
              setOpenAddMaterialModal(false);
              setStage('study_materials');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sound.playClick();
                setOpenAddMaterialModal(false);
                setStage('study_materials');
              }
            }}
            className="w-full text-right rounded-2xl bg-gradient-to-l from-sky-700 via-sky-600 to-cyan-700 hover:brightness-105 text-white px-6 py-4 sm:px-8 sm:py-5 shadow-md border border-sky-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/15 backdrop-blur-xs text-white flex items-center justify-center shrink-0 border border-white/25 shadow-sm">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
                  <span>المواد الدراسية</span>
                  {studyMaterials.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-sky-900 text-xs font-black">
                      {studyMaterials.length}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-medium text-sky-100 mt-0.5">
                  ارفع كتاباً أو ملف PDF أو رابطاً للكتابة والتظليل والتأشير بالليزر وحفظ كل ما يكتب · تبديل فوري مع السبورة
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
              <button
                id="btn-study-materials-plus"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setOpenAddMaterialModal(true);
                  setStage('study_materials');
                }}
                title="إضافة ملف من الجهاز أو رابط"
                className="w-11 h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black flex items-center justify-center shadow-md active:scale-90 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sky-900 group-hover:bg-sky-50 font-black text-sm transition-colors whitespace-nowrap">
                <span>فتح المواد</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {/* Smart Whiteboard Studio */}
        {stage === 'whiteboard' && (
          <SmartWhiteboard
            onBack={handleResetToStudents}
            initialDrawingDataUrl={whiteboardDrawingUrl}
            onSaveDrawingDataUrl={setWhiteboardDrawingUrl}
            onSwitchToBook={() => {
              setOpenAddMaterialModal(false);
              setStage('study_materials');
            }}
            activeBookTitle={
              studyMaterials.find((m) => m.id === activeStudyMaterialId)?.title ||
              studyMaterials[0]?.title
            }
          />
        )}

        {/* Study Materials & Interactive Book Studio */}
        {stage === 'study_materials' && (
          <StudyMaterialsStudio
            materials={studyMaterials}
            activeMaterialId={activeStudyMaterialId}
            onSelectMaterial={setActiveStudyMaterialId}
            onMaterialsChange={setStudyMaterials}
            initialOpenAddModal={openAddMaterialModal}
            onClearInitialOpenAddModal={() => setOpenAddMaterialModal(false)}
            onSwitchToWhiteboard={() => setStage('whiteboard')}
            onBack={handleResetToStudents}
          />
        )}

        {/* Issued Certificates Archive */}
        {stage === 'issued_certificates' && (
          <IssuedCertificatesView
            certificates={issuedCertificates}
            onUpdateCertificateTheme={handleUpdateCertificateTheme}
            onDeleteCertificate={handleDeleteCertificate}
            onBack={handleResetToStudents}
          />
        )}

        {/* Presentation & PDF Studio */}
        {stage === 'presentation_studio' && (
          <PresentationStudio
            words={words}
            onBackToPlatform={handleResetToStudents}
            onSaveToPlatform={handleSavePresentationToPlatform}
            onOpenPresentationsLibrary={() => setStage('presentations_library')}
            editingPresentation={editingPresentation}
            onClearEditingPresentation={() => setEditingPresentation(null)}
          />
        )}

        {/* Saved Presentations Library & Explainer View ("العروض التقديمية") */}
        {stage === 'presentations_library' && (
          <PresentationsLibraryView
            presentations={savedPresentations}
            words={words}
            onCreateNew={() => {
              setEditingPresentation(null);
              setStage('presentation_studio');
            }}
            onImportExternalDeck={handleSavePresentationToPlatform}
            onEditPresentation={(deck) => {
              setEditingPresentation(deck);
              setStage('presentation_studio');
            }}
            onDeletePresentation={handleDeleteSavedPresentation}
            initialOpenExternalModal={openExternalPptxModal}
            onClearInitialOpenExternalModal={() => setOpenExternalPptxModal(false)}
            onBack={handleResetToStudents}
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
            isFirebaseSynced={isFirebaseConnected}
            brandSettings={brandSettings}
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
            initialThemeId={activeCertificateThemeId}
            onThemeChange={(newThemeId) => {
              if (activeCertificateId) {
                handleUpdateCertificateTheme(activeCertificateId, newThemeId);
              }
            }}
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

      {/* Secret Teacher Control Panel (Opened by clicking Firebase badge 10 times; closed only via X) */}
      <AdminControlModal
        isOpen={isAdminControlOpen}
        onClose={() => setIsAdminControlOpen(false)}
        currentSettings={brandSettings}
        onSaveSettings={async (newSettings) => {
          setBrandSettings(newSettings);
          saveBrandSettingsLocal(newSettings);
          await saveBrandSettingsToFirestore(newSettings);
        }}
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
