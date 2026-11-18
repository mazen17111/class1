import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  Presentation,
  Play,
  Edit3,
  Trash2,
  PenTool,
  Highlighter,
  Sparkles,
  Eraser,
  Undo2,
  Redo2,
  Check,
  Palette,
  X,
  Plus,
  Hand,
  Wand2,
  Maximize2,
  Minimize2,
  Loader2,
  Upload,
  Link2,
  FileUp,
  ExternalLink,
} from 'lucide-react';
import {
  ExternalPresentationType,
  PresentationSlide,
  SavedPresentation,
  SlideTransitionType,
  WordItem,
} from '../types';
import { ARABIC_LETTERS } from '../data/arabicData';
import { SlideRenderer } from './SlideRenderer';
import {
  SLIDE_TRANSITION_OPTIONS,
  getTransitionClassName,
  getTransitionLabel,
} from '../utils/slideTransitions';
import { DECK_THEMES, generateLetterPresentationDeck } from '../utils/deckGenerator';
import {
  importPptxToSlides,
  importPdfToPresentationSlides,
  importImagesToPresentationSlides,
  normalizeExternalPresentationUrl,
} from '../utils/pptxImporter';
import { sound } from '../utils/audio';
import {
  getLocalPresentationById,
  saveLocalPresentation,
  getLocalPresentationAnnotations,
  saveLocalPresentationAnnotation,
} from '../utils/presentationsDb';
import {
  fetchPresentationSlidesFromFirestore,
  fetchPresentationAnnotationsFromFirestore,
  savePresentationAnnotationToFirestore,
} from '../firebase';

interface PresentationsLibraryViewProps {
  presentations: SavedPresentation[];
  words?: WordItem[];
  onCreateNew: () => void;
  onImportExternalDeck: (deck: SavedPresentation) => Promise<void>;
  onEditPresentation: (presentation: SavedPresentation) => void;
  onDeletePresentation: (id: string) => Promise<void>;
  initialOpenExternalModal?: boolean;
  onClearInitialOpenExternalModal?: () => void;
  onBack: () => void;
}

type ExplainerToolId = 'pen1' | 'pen2' | 'pen3' | 'highlighter' | 'laser' | 'eraser' | 'hand';
type DrawToolId = Exclude<ExplainerToolId, 'hand'>;

interface ToolSettings {
  color: string;
  size: number;
}

interface LaserPoint {
  x: number;
  y: number;
  time: number;
  isStart?: boolean;
}

const QUICK_PALETTE = [
  '#DC2626',
  '#2563EB',
  '#059669',
  '#0F172A',
  '#D97706',
  '#7C3AED',
  '#DB2777',
  '#FACC15',
  '#06B6D4',
  '#FFFFFF',
];

const SIZE_PRESETS: Record<DrawToolId, { label: string; size: number }[]> = {
  pen1: [
    { label: 'رفيع', size: 3 },
    { label: 'متوسط', size: 5.5 },
    { label: 'كبير', size: 10 },
    { label: 'عريض', size: 16 },
  ],
  pen2: [
    { label: 'رفيع', size: 3 },
    { label: 'متوسط', size: 5.5 },
    { label: 'كبير', size: 10 },
    { label: 'عريض', size: 16 },
  ],
  pen3: [
    { label: 'رفيع', size: 3 },
    { label: 'متوسط', size: 5.5 },
    { label: 'كبير', size: 10 },
    { label: 'عريض', size: 16 },
  ],
  highlighter: [
    { label: 'رفيع', size: 18 },
    { label: 'متوسط', size: 28 },
    { label: 'كبير', size: 42 },
    { label: 'عريض', size: 58 },
  ],
  laser: [
    { label: 'صغير', size: 5 },
    { label: 'متوسط', size: 8 },
    { label: 'كبير', size: 13 },
    { label: 'ضخم', size: 18 },
  ],
  eraser: [
    { label: 'صغير', size: 18 },
    { label: 'متوسط', size: 32 },
    { label: 'كبير', size: 52 },
    { label: 'ضخم', size: 78 },
  ],
};

const LASER_LIFETIME_MS = 1200;

export const PresentationsLibraryView: React.FC<PresentationsLibraryViewProps> = ({
  presentations,
  words = [],
  onCreateNew,
  onImportExternalDeck,
  onEditPresentation,
  onDeletePresentation,
  initialOpenExternalModal = false,
  onClearInitialOpenExternalModal,
  onBack,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loadingDeckId, setLoadingDeckId] = useState<string | null>(null);
  const [explainerError, setExplainerError] = useState<string | null>(null);
  const [hydratedSlidesMap, setHydratedSlidesMap] = useState<Record<string, PresentationSlide[]>>({});

  // External PowerPoint Import Modal State
  const [showExternalModal, setShowExternalModal] = useState(initialOpenExternalModal);
  const [extTab, setExtTab] = useState<'file' | 'url'>('file');
  const [extTitle, setExtTitle] = useState('');
  const [extUrl, setExtUrl] = useState('');
  const [extTransitionType, setExtTransitionType] = useState<SlideTransitionType>('fade');
  const [extProgress, setExtProgress] = useState<{ current: number; total: number } | null>(null);
  const [extError, setExtError] = useState('');
  const [isImportingExternal, setIsImportingExternal] = useState(false);

  useEffect(() => {
    if (initialOpenExternalModal) {
      setShowExternalModal(true);
      setExtError('');
      onClearInitialOpenExternalModal?.();
    }
  }, [initialOpenExternalModal, onClearInitialOpenExternalModal]);

  // Full Explainer Mode State ("اشرح")
  const [explainingDeck, setExplainingDeck] = useState<SavedPresentation | null>(null);
  const [isExpandedFullscreen, setIsExpandedFullscreen] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'next' | 'prev'>('next');
  const [animSeq, setAnimSeq] = useState(0);

  // Annotation Tools State (at the very top of explainer stage)
  const [activeTool, setActiveTool] = useState<ExplainerToolId>('laser');
  const [colorPickerTool, setColorPickerTool] = useState<DrawToolId | null>(null);
  const [toolSettings, setToolSettings] = useState<Record<DrawToolId, ToolSettings>>({
    pen1: { color: '#DC2626', size: 5 },
    pen2: { color: '#2563EB', size: 5 },
    pen3: { color: '#0F172A', size: 5 },
    highlighter: { color: '#FACC15', size: 28 },
    laser: { color: '#EF4444', size: 8 },
    eraser: { color: '#FFFFFF', size: 36 },
  });
  const activeToolRef = useRef(activeTool);
  const toolSettingsRef = useRef(toolSettings);
  activeToolRef.current = activeTool;
  toolSettingsRef.current = toolSettings;

  // Annotations per slide inside current explaining deck
  const annotationsMapRef = useRef<Record<number, string>>({});
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Stage sizing & canvas refs
  const viewportBoxRef = useRef<HTMLDivElement>(null);
  const [stageDims, setStageDims] = useState({ width: 960, height: 540 });
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const eraserCursorRef = useRef<HTMLDivElement>(null);
  const dprRef = useRef(1);
  const canvasRectRef = useRef({ left: 0, top: 0 });

  // History per slide view
  const historyRef = useRef<HTMLCanvasElement[]>([]);
  const historyIndexRef = useRef(-1);

  // Pointer & Laser refs
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const midPointRef = useRef<{ x: number; y: number } | null>(null);
  const laserTrailRef = useRef<LaserPoint[]>([]);
  const laserPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Pre-hydrate first slide / local decks in background for crisp card previews
  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      for (const p of presentations) {
        if (hydratedSlidesMap[p.id] && hydratedSlidesMap[p.id].length > 0) continue;
        if (p.slides && p.slides.length > 0) {
          setHydratedSlidesMap((prev) => ({ ...prev, [p.id]: p.slides }));
          continue;
        }
        const local = await getLocalPresentationById(p.id);
        if (!active) return;
        if (local && local.slides.length > 0) {
          setHydratedSlidesMap((prev) => ({ ...prev, [p.id]: local.slides }));
        } else {
          try {
            const remoteSlides = await fetchPresentationSlidesFromFirestore(p.id);
            if (!active) return;
            if (remoteSlides.length > 0) {
              setHydratedSlidesMap((prev) => ({ ...prev, [p.id]: remoteSlides }));
              await saveLocalPresentation({ ...p, slides: remoteSlides });
            }
          } catch {
            // ignore
          }
        }
      }
    };
    hydrate();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentations]);

  const computeStageDims = useCallback((availW: number, availH: number) => {
    const wSafe = Math.max(320, availW);
    const hSafe = Math.max(180, availH);
    const ratio = 16 / 9;
    let w = wSafe;
    let h = w / ratio;
    if (h > hSafe) {
      h = hSafe;
      w = h * ratio;
    }
    return {
      width: Math.max(320, Math.floor(w)),
      height: Math.max(180, Math.floor(h)),
    };
  }, []);

  const tryEnterFullscreen = useCallback((el?: HTMLElement | null) => {
    try {
      const target = (el || document.documentElement) as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (document.fullscreenElement) return;
      const maybePromise = target.requestFullscreen?.() ?? target.webkitRequestFullscreen?.();
      if (maybePromise && typeof (maybePromise as Promise<void>).catch === 'function') {
        (maybePromise as Promise<void>).catch(() => {});
      }
    } catch {
      // Browser/iframe may restrict native fullscreen; CSS 100vw×100dvh portal fills viewport
    }
  }, []);

  const tryExitFullscreen = useCallback(() => {
    try {
      const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
      if (document.fullscreenElement) {
        const maybePromise = doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.();
        if (maybePromise && typeof (maybePromise as Promise<void>).catch === 'function') {
          (maybePromise as Promise<void>).catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const normalizeDeckWithTheme = useCallback(
    (deck: SavedPresentation, slidesList: PresentationSlide[]): SavedPresentation => {
      const safeTheme = {
        ...DECK_THEMES[0],
        ...(deck.theme && typeof deck.theme === 'object' ? deck.theme : {}),
      };
      return {
        ...deck,
        theme: safeTheme,
        slides: slidesList,
        slideCount: slidesList.length,
      };
    },
    []
  );

  const resolveDeckWithSlides = useCallback(
    async (deck: SavedPresentation): Promise<SavedPresentation> => {
      if (deck.externalType === 'embed_url' && deck.externalUrl) {
        const placeholderSlide: PresentationSlide =
          (deck.slides && deck.slides[0]) || {
            id: `embed_${deck.id}`,
            kind: 'custom',
            layoutVariant: 'custom-photo',
            title: deck.title,
            subtitle: 'عرض تقديمي خارجي تفاعلي',
            items: [],
            teacherNote: deck.externalUrl,
          };
        return normalizeDeckWithTheme(deck, [placeholderSlide]);
      }

      const cached = hydratedSlidesMap[deck.id] || deck.slides;
      if (cached && cached.length > 0) {
        return normalizeDeckWithTheme(deck, cached);
      }

      const local = await getLocalPresentationById(deck.id);
      if (local && local.slides && local.slides.length > 0) {
        setHydratedSlidesMap((prev) => ({ ...prev, [deck.id]: local.slides }));
        return normalizeDeckWithTheme(deck, local.slides);
      }

      try {
        const remoteSlides = await fetchPresentationSlidesFromFirestore(deck.id);
        if (remoteSlides.length > 0) {
          const full = normalizeDeckWithTheme(deck, remoteSlides);
          setHydratedSlidesMap((prev) => ({ ...prev, [deck.id]: remoteSlides }));
          await saveLocalPresentation(full);
          return full;
        }
      } catch (err) {
        console.warn('Could not fetch remote slides, using fallback:', err);
      }

      // Emergency reconstruction if slides subcollection is empty (never dead-click on "اشرح")
      const letterObj =
        ARABIC_LETTERS.find((l) => l.id === deck.letterId) || ARABIC_LETTERS[0];
      const generated = generateLetterPresentationDeck(letterObj, words, [], true, 4);
      const fallback = normalizeDeckWithTheme(
        {
          ...deck,
          theme:
            deck.theme && deck.theme.primaryHex ? deck.theme : generated.theme,
        },
        generated.slides
      );
      setHydratedSlidesMap((prev) => ({ ...prev, [deck.id]: fallback.slides }));
      await saveLocalPresentation(fallback);
      return fallback;
    },
    [hydratedSlidesMap, normalizeDeckWithTheme, words]
  );

  const handleImportExternalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setExtError('');
    setIsImportingExternal(true);
    setExtProgress(null);

    try {
      const files: File[] = Array.from(fileList);
      const firstFile = files[0];
      const lowerName = firstFile.name.toLowerCase();
      let importedSlides: PresentationSlide[] = [];
      let extType: ExternalPresentationType = 'pptx_file';

      if (files.length === 1 && lowerName.endsWith('.pptx')) {
        extType = 'pptx_file';
        importedSlides = await importPptxToSlides(firstFile, (cur, tot) =>
          setExtProgress({ current: cur, total: tot })
        );
      } else if (files.length === 1 && lowerName.endsWith('.ppt')) {
        throw new Error(
          'صيغة .ppt القديمة غير مدعومة مباشرة في المتصفح. يرجى حفظ الملف بصيغة .pptx أو .pdf ثم رفعه.'
        );
      } else if (
        files.length === 1 &&
        (firstFile.type === 'application/pdf' || lowerName.endsWith('.pdf'))
      ) {
        extType = 'pdf_slides';
        importedSlides = await importPdfToPresentationSlides(firstFile, (cur, tot) =>
          setExtProgress({ current: cur, total: tot })
        );
      } else if (files.every((f) => f.type.startsWith('image/'))) {
        extType = 'pptx_file';
        importedSlides = await importImagesToPresentationSlides(files, (cur, tot) =>
          setExtProgress({ current: cur, total: tot })
        );
      } else {
        throw new Error('يرجى اختيار ملف باوربوينت (.pptx) أو ملف PDF أو صور الشرائح.');
      }

      if (importedSlides.length === 0) {
        throw new Error('لم يتم استخراج أي شرائح من الملف المختار.');
      }

      const defaultTitle =
        extTitle.trim() ||
        firstFile.name.replace(/\.[^.]+$/, '') ||
        'عرض باوربوينت خارجي';
      const now = Date.now();
      const newDeck: SavedPresentation = {
        id: `pres_ext_${now}`,
        title: defaultTitle.slice(0, 120),
        letterId: ARABIC_LETTERS[0].id,
        letterChar: ARABIC_LETTERS[0].char,
        letterName: ARABIC_LETTERS[0].name,
        theme: DECK_THEMES[2] || DECK_THEMES[0],
        slideCount: importedSlides.length,
        slides: importedSlides,
        transitionEnabled: extTransitionType !== 'none',
        transitionType: extTransitionType,
        createdAtMs: now,
        updatedAtMs: now,
        isExternal: true,
        externalType: extType,
      };

      setHydratedSlidesMap((prev) => ({ ...prev, [newDeck.id]: importedSlides }));
      await onImportExternalDeck(newDeck);
      sound.playSuccess();
      setShowExternalModal(false);
      setExtTitle('');
      setExtUrl('');
      setExtProgress(null);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'تعذر استيراد ملف الباوربوينت الخارجي. تأكد من سلامة الملف وحاول مجدداً.';
      setExtError(msg);
    } finally {
      setIsImportingExternal(false);
      setExtProgress(null);
      e.target.value = '';
    }
  };

  const handleSaveExternalUrlDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtError('');
    const raw = extUrl.trim();
    if (!raw) {
      setExtError('يرجى إدخال رابط العرض الخارجي أو كود التضمين.');
      return;
    }

    const { embedUrl, providerLabel } = normalizeExternalPresentationUrl(raw);
    if (!/^https?:\/\//i.test(embedUrl)) {
      setExtError('يرجى إدخال رابط يبدأ بـ https:// أو http://');
      return;
    }

    setIsImportingExternal(true);
    try {
      const now = Date.now();
      const title = extTitle.trim() || `عرض خارجي (${providerLabel})`;
      const coverSlide: PresentationSlide = {
        id: `ext_url_cover_${now}`,
        kind: 'custom',
        layoutVariant: 'custom-photo',
        title,
        subtitle: `عرض مرتبط من ${providerLabel}`,
        badgeText: 'عرض خارجي',
        bodyText: embedUrl,
        items: [],
        teacherNote: 'افتح وضع «اشرح» للعرض المباشر بملء الشاشة والكتابة بالأقلام والليزر.',
      };

      const newDeck: SavedPresentation = {
        id: `pres_url_${now}`,
        title: title.slice(0, 120),
        letterId: ARABIC_LETTERS[0].id,
        letterChar: ARABIC_LETTERS[0].char,
        letterName: ARABIC_LETTERS[0].name,
        theme: DECK_THEMES[1] || DECK_THEMES[0],
        slideCount: 1,
        slides: [coverSlide],
        transitionEnabled: false,
        transitionType: 'none',
        createdAtMs: now,
        updatedAtMs: now,
        isExternal: true,
        externalType: 'embed_url',
        externalUrl: embedUrl,
      };

      setHydratedSlidesMap((prev) => ({ ...prev, [newDeck.id]: [coverSlide] }));
      await onImportExternalDeck(newDeck);
      sound.playSuccess();
      setShowExternalModal(false);
      setExtTitle('');
      setExtUrl('');
    } catch {
      setExtError('حدث خطأ أثناء حفظ رابط العرض الخارجي.');
    } finally {
      setIsImportingExternal(false);
    }
  };

  const closeExplainer = useCallback(() => {
    tryExitFullscreen();
    setExplainingDeck(null);
  }, [tryExitFullscreen]);

  const handleOpenExplain = async (deck: SavedPresentation) => {
    sound.playClick();
    setExplainerError(null);
    setLoadingDeckId(deck.id);
    setIsExpandedFullscreen(true);
    // Request fullscreen synchronously within user click gesture
    tryEnterFullscreen(document.documentElement);
    // Pre-set full viewport dimensions immediately so first rendered frame fills the screen
    setStageDims(computeStageDims(window.innerWidth, window.innerHeight));

    try {
      const full = await resolveDeckWithSlides(deck);
      if (!full || full.slides.length === 0) {
        tryExitFullscreen();
        setExplainerError('تعذر العثور على شرائح هذا العرض.');
        return;
      }

      const [localAnns, remoteAnns] = await Promise.all([
        getLocalPresentationAnnotations(full.id).catch(() => ({} as Record<number, string>)),
        fetchPresentationAnnotationsFromFirestore(full.id).catch(() => ({} as Record<number, string>)),
      ]);
      annotationsMapRef.current = { ...remoteAnns, ...localAnns };
      setExplainingDeck(full);
      setSlideIndex(0);
      setSlideDir('next');
      setAnimSeq(1);
      setActiveTool('laser');
      setColorPickerTool(null);
    } catch (err) {
      console.error('Failed to open presentation explainer:', err);
      tryExitFullscreen();
      setExplainerError('حدث خطأ أثناء فتح العرض التقديمي، حاول مرة أخرى.');
    } finally {
      setLoadingDeckId(null);
    }
  };

  const handleOpenEdit = async (deck: SavedPresentation) => {
    sound.playClick();
    setExplainerError(null);
    setLoadingDeckId(deck.id);
    try {
      const full = await resolveDeckWithSlides(deck);
      if (full && full.slides.length > 0) {
        onEditPresentation(full);
      }
    } finally {
      setLoadingDeckId(null);
    }
  };

  // Keep responsive 16:9 size filling either fullscreen viewport or minimized frame
  useEffect(() => {
    if (!explainingDeck) return;
    const measure = () => {
      const box = viewportBoxRef.current;
      const w = box && box.clientWidth > 0 ? box.clientWidth : window.innerWidth;
      const h = box && box.clientHeight > 0 ? box.clientHeight : window.innerHeight;
      setStageDims(computeStageDims(w, h));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (viewportBoxRef.current) observer.observe(viewportBoxRef.current);
    window.addEventListener('resize', measure);
    document.addEventListener('fullscreenchange', measure);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      document.removeEventListener('fullscreenchange', measure);
    };
  }, [computeStageDims, explainingDeck, isExpandedFullscreen]);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(
      historyIndexRef.current >= 0 && historyIndexRef.current < historyRef.current.length - 1
    );
  }, []);

  const persistCurrentSlideInk = useCallback(
    async (deckId: string, idx: number, canvas: HTMLCanvasElement) => {
      let dataUrl = canvas.toDataURL('image/png');
      if (dataUrl.length > 475000) {
        const temp = document.createElement('canvas');
        temp.width = Math.max(1, Math.round(canvas.width * 0.72));
        temp.height = Math.max(1, Math.round(canvas.height * 0.72));
        const tCtx = temp.getContext('2d');
        if (tCtx) {
          tCtx.drawImage(canvas, 0, 0, temp.width, temp.height);
          dataUrl = temp.toDataURL('image/png');
        }
      }
      annotationsMapRef.current[idx] = dataUrl;
      await saveLocalPresentationAnnotation(deckId, idx, dataUrl);
      savePresentationAnnotationToFirestore(deckId, idx, dataUrl).catch(() => {});
    },
    []
  );

  const pushSnapshot = useCallback(
    (persist = true) => {
      const canvas = drawCanvasRef.current;
      if (!canvas || canvas.width === 0 || canvas.height === 0) return;
      const snap = document.createElement('canvas');
      snap.width = canvas.width;
      snap.height = canvas.height;
      const sCtx = snap.getContext('2d');
      if (!sCtx) return;
      sCtx.drawImage(canvas, 0, 0);

      const next = historyRef.current.slice(0, historyIndexRef.current + 1);
      next.push(snap);
      if (next.length > 25) next.shift();
      historyRef.current = next;
      historyIndexRef.current = next.length - 1;
      syncHistoryFlags();

      if (persist && explainingDeck) {
        persistCurrentSlideInk(explainingDeck.id, slideIndex, canvas);
      }
    },
    [explainingDeck, persistCurrentSlideInk, slideIndex, syncHistoryFlags]
  );

  // Sync & restore transparent drawing canvas cleanly whenever slide or stage size changes
  useEffect(() => {
    if (!explainingDeck) return;
    const drawCanvas = drawCanvasRef.current;
    const laserCanvas = laserCanvasRef.current;
    if (!drawCanvas || !laserCanvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    drawCanvas.width = Math.max(1, Math.floor(stageDims.width * dpr));
    drawCanvas.height = Math.max(1, Math.floor(stageDims.height * dpr));
    laserCanvas.width = Math.max(1, Math.floor(stageDims.width * dpr));
    laserCanvas.height = Math.max(1, Math.floor(stageDims.height * dpr));

    const dCtx = drawCanvas.getContext('2d', { alpha: true });
    const lCtx = laserCanvas.getContext('2d', { alpha: true });
    drawCtxRef.current = dCtx;
    laserCtxRef.current = lCtx;
    if (lCtx) lCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    historyRef.current = [];
    historyIndexRef.current = -1;
    laserTrailRef.current = [];

    let cancelled = false;
    const savedInk = annotationsMapRef.current[slideIndex];
    if (dCtx) {
      dCtx.setTransform(1, 0, 0, 1, 0, 0);
      dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      if (savedInk) {
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          dCtx.setTransform(1, 0, 0, 1, 0, 0);
          dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
          dCtx.drawImage(img, 0, 0, drawCanvas.width, drawCanvas.height);
          dCtx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
          pushSnapshot(false);
        };
        img.onerror = () => {
          if (cancelled) return;
          dCtx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
          pushSnapshot(false);
        };
        img.src = savedInk;
      } else {
        dCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        pushSnapshot(false);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [explainingDeck, slideIndex, stageDims, pushSnapshot]);

  // Laser animation loop
  const stopLaserLoop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const startLaserLoop = useCallback(() => {
    if (animFrameRef.current !== null) return;
    const renderFrame = () => {
      const canvas = laserCanvasRef.current;
      const ctx = laserCtxRef.current;
      if (!canvas || !ctx) {
        animFrameRef.current = null;
        return;
      }
      const dpr = dprRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const now = Date.now();
      laserTrailRef.current = laserTrailRef.current.filter(
        (pt) => now - pt.time < LASER_LIFETIME_MS
      );

      const { color: laserColor, size: laserSize } = toolSettingsRef.current.laser;
      const pts = laserTrailRef.current;

      if (pts.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < pts.length; i++) {
          const p0 = pts[i - 1];
          const p1 = pts[i];
          if (p1.isStart) continue;
          const life = Math.max(0, 1 - (now - p1.time) / LASER_LIFETIME_MS);

          ctx.globalAlpha = life * 0.65;
          ctx.strokeStyle = laserColor;
          ctx.shadowColor = laserColor;
          ctx.shadowBlur = laserSize * 2;
          ctx.lineWidth = laserSize * (0.4 + life * 0.85);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();

          ctx.globalAlpha = life * 0.95;
          ctx.strokeStyle = '#FFFFFF';
          ctx.shadowBlur = 0;
          ctx.lineWidth = Math.max(1.5, laserSize * 0.35 * life);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }

      if (activeToolRef.current === 'laser' && laserPointerPosRef.current) {
        const pos = laserPointerPosRef.current;
        ctx.fillStyle = laserColor;
        ctx.shadowColor = laserColor;
        ctx.shadowBlur = laserSize * 2.5;
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, laserSize * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(2, laserSize * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      if (
        laserTrailRef.current.length > 0 ||
        (activeToolRef.current === 'laser' && laserPointerPosRef.current !== null)
      ) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      } else {
        animFrameRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(renderFrame);
  }, []);

  useEffect(() => {
    return () => stopLaserLoop();
  }, [stopLaserLoop]);

  const applyDrawStyle = (ctx: CanvasRenderingContext2D, tool: DrawToolId) => {
    const current = toolSettingsRef.current[tool];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = current.size;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = current.color;
      ctx.fillStyle = current.color;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = current.color;
      ctx.fillStyle = current.color;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const tool = activeToolRef.current;
    if (tool === 'hand') return;

    e.currentTarget.setPointerCapture(e.pointerId);
    if (colorPickerTool !== null) setColorPickerTool(null);

    const rect = e.currentTarget.getBoundingClientRect();
    canvasRectRef.current = { left: rect.left, top: rect.top };
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    isDrawingRef.current = true;
    lastPointRef.current = pt;
    midPointRef.current = pt;

    if (tool === 'laser') {
      laserPointerPosRef.current = pt;
      laserTrailRef.current.push({ x: pt.x, y: pt.y, time: Date.now(), isStart: true });
      startLaserLoop();
      return;
    }

    const ctx = drawCtxRef.current;
    if (!ctx) return;
    applyDrawStyle(ctx, tool);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, toolSettingsRef.current[tool].size / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const tool = activeToolRef.current;
    if (tool === 'hand') return;

    const rect = e.currentTarget.getBoundingClientRect();
    canvasRectRef.current = { left: rect.left, top: rect.top };
    const { left, top } = canvasRectRef.current;

    if (tool === 'eraser' && eraserCursorRef.current) {
      const size = toolSettingsRef.current.eraser.size;
      eraserCursorRef.current.style.opacity = '1';
      eraserCursorRef.current.style.width = `${size}px`;
      eraserCursorRef.current.style.height = `${size}px`;
      eraserCursorRef.current.style.transform = `translate3d(${e.clientX - left - size / 2}px, ${
        e.clientY - top - size / 2
      }px, 0)`;
    }

    if (tool === 'laser') {
      const pt = { x: e.clientX - left, y: e.clientY - top };
      laserPointerPosRef.current = pt;
      if (isDrawingRef.current) {
        laserTrailRef.current.push({ x: pt.x, y: pt.y, time: Date.now() });
      }
      startLaserLoop();
      return;
    }

    if (!isDrawingRef.current || !lastPointRef.current || !midPointRef.current) return;
    const ctx = drawCtxRef.current;
    if (!ctx) return;

    const coalesced = e.nativeEvent.getCoalescedEvents?.();
    const events = coalesced && coalesced.length > 0 ? coalesced : [e.nativeEvent];

    ctx.beginPath();
    ctx.moveTo(midPointRef.current.x, midPointRef.current.y);

    let last = lastPointRef.current;
    let mid = midPointRef.current;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const pt = { x: ev.clientX - left, y: ev.clientY - top };
      const newMid = { x: (last.x + pt.x) * 0.5, y: (last.y + pt.y) * 0.5 };
      ctx.quadraticCurveTo(last.x, last.y, newMid.x, newMid.y);
      last = pt;
      mid = newMid;
    }

    ctx.stroke();
    lastPointRef.current = last;
    midPointRef.current = mid;
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    midPointRef.current = null;

    if (activeToolRef.current !== 'laser' && activeToolRef.current !== 'hand') {
      pushSnapshot(true);
    }
  };

  const handlePointerLeave = () => {
    laserPointerPosRef.current = null;
    if (eraserCursorRef.current) eraserCursorRef.current.style.opacity = '0';
    if (isDrawingRef.current) handlePointerUp();
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    sound.playClick();
    const canvas = drawCanvasRef.current;
    const ctx = drawCtxRef.current;
    if (!canvas || !ctx) return;
    historyIndexRef.current -= 1;
    const snap = historyRef.current[historyIndexRef.current];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snap, 0, 0);
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    syncHistoryFlags();
    if (explainingDeck) persistCurrentSlideInk(explainingDeck.id, slideIndex, canvas);
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    sound.playClick();
    const canvas = drawCanvasRef.current;
    const ctx = drawCtxRef.current;
    if (!canvas || !ctx) return;
    historyIndexRef.current += 1;
    const snap = historyRef.current[historyIndexRef.current];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snap, 0, 0);
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    syncHistoryFlags();
    if (explainingDeck) persistCurrentSlideInk(explainingDeck.id, slideIndex, canvas);
  };

  const handleClearSlideInk = () => {
    sound.playSnap();
    const canvas = drawCanvasRef.current;
    const ctx = drawCtxRef.current;
    if (!canvas || !ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    pushSnapshot(true);
  };

  const goToSlide = useCallback(
    (nextIdx: number) => {
      if (!explainingDeck) return;
      const total = explainingDeck.slides.length;
      const clamped = Math.max(0, Math.min(total - 1, nextIdx));
      if (clamped === slideIndex) return;
      sound.playClick();
      setSlideDir(clamped > slideIndex ? 'next' : 'prev');
      setSlideIndex(clamped);
      setAnimSeq((s) => s + 1);
    },
    [explainingDeck, slideIndex]
  );

  // Keyboard navigation in explainer mode
  useEffect(() => {
    if (!explainingDeck) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeExplainer();
      } else if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowDown' ||
        e.key === 'PageDown' ||
        e.key === ' '
      ) {
        e.preventDefault();
        goToSlide(slideIndex + 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToSlide(slideIndex - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeExplainer, explainingDeck, goToSlide, slideIndex]);

  const updateToolColor = (tool: DrawToolId, color: string) => {
    setToolSettings((prev) => ({ ...prev, [tool]: { ...prev[tool], color } }));
  };

  const updateToolSize = (tool: DrawToolId, size: number) => {
    setToolSettings((prev) => ({ ...prev, [tool]: { ...prev[tool], size } }));
  };

  // =========================================================================
  // EXPLAINER FULLSCREEN STAGE ("اشرح") RENDERED VIA BODY PORTAL
  // =========================================================================
  if (explainingDeck) {
    const activeSlide = explainingDeck.slides[slideIndex] || explainingDeck.slides[0];
    const activeLetter =
      ARABIC_LETTERS.find((l) => l.id === explainingDeck.letterId) || ARABIC_LETTERS[0];
    const transitionCls = getTransitionClassName(
      explainingDeck.transitionEnabled,
      explainingDeck.transitionType,
      slideDir
    );
    const slideScale = stageDims.width / 1280;
    const isDrawTool = activeTool !== 'hand';
    const activeSettings = isDrawTool ? toolSettings[activeTool] : toolSettings.pen1;
    const activePresets = isDrawTool ? SIZE_PRESETS[activeTool] : SIZE_PRESETS.pen1;

    return (
      <div
        dir="rtl"
        style={{ backgroundColor: explainingDeck.theme?.bgHex || '#FFFFFF' }}
        className={
          isExpandedFullscreen
            ? 'fixed inset-0 z-[9999] w-screen h-[100dvh] overflow-hidden select-none'
            : 'relative max-w-6xl mx-auto my-3 h-[78vh] rounded-3xl border-2 border-slate-300 shadow-2xl overflow-hidden select-none'
        }
      >
        {/* TRANSPARENT FLOATING ANNOTATION TOOLBAR AT THE VERY TOP OF THE PRESENTATION */}
        <div className="absolute top-2 inset-x-0 z-40 px-2 sm:px-4 flex flex-col items-center pointer-events-none">
          <div
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            className={`pointer-events-auto max-w-full rounded-2xl border border-white/25 px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-all duration-200 ${
              colorPickerTool
                ? 'bg-slate-950/80'
                : 'bg-slate-950/30 hover:bg-slate-950/70'
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {/* Exit Explainer */}
              <button
                id="btn-exit-explainer"
                type="button"
                onClick={() => {
                  sound.playClick();
                  closeExplainer();
                }}
                title="إنهاء العرض"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-black text-xs shadow-xs active:scale-95 transition-all whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>إنهاء</span>
              </button>

              {/* Fullscreen Maximize / Minimize Toggle */}
              <button
                id="btn-toggle-native-fullscreen"
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (isExpandedFullscreen) {
                    setIsExpandedFullscreen(false);
                    tryExitFullscreen();
                  } else {
                    setIsExpandedFullscreen(true);
                    tryEnterFullscreen(document.documentElement);
                  }
                }}
                title={isExpandedFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة'}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/50 hover:bg-slate-900/85 text-white border border-white/25 font-black text-xs transition-all whitespace-nowrap shrink-0"
              >
                {isExpandedFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>تصغير الشاشة</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>تكبير الشاشة</span>
                  </>
                )}
              </button>

              {/* Compact Slide Counter / External Link */}
              {explainingDeck.externalType === 'embed_url' && explainingDeck.externalUrl ? (
                <a
                  href={explainingDeck.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-600/80 hover:bg-sky-600 border border-white/25 text-white font-black text-xs whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح خارجياً</span>
                </a>
              ) : (
                <span className="px-2 py-1 rounded-xl bg-slate-900/40 border border-white/15 text-white/95 font-black text-xs tabular-nums whitespace-nowrap shrink-0">
                  {slideIndex + 1} / {explainingDeck.slides.length}
                </span>
              )}

              {/* Laser Pointer */}
              <button
                id="btn-explainer-laser"
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTool('laser');
                }}
                className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl border font-black text-xs transition-all whitespace-nowrap shrink-0 ${
                  activeTool === 'laser'
                    ? 'bg-rose-600/90 text-white border-rose-300 shadow-sm'
                    : 'bg-slate-900/35 hover:bg-slate-900/75 text-white border-white/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>مؤشر ليزر</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    setActiveTool('laser');
                    setColorPickerTool(colorPickerTool === 'laser' ? null : 'laser');
                  }}
                  title="لون المؤشر"
                  className="w-3 h-3 rounded-full border border-white cursor-pointer"
                  style={{ backgroundColor: toolSettings.laser.color }}
                />
              </button>

              {/* 3 Pens */}
              {(
                [
                  { id: 'pen1', label: 'قلم ١' },
                  { id: 'pen2', label: 'قلم ٢' },
                  { id: 'pen3', label: 'قلم ٣' },
                ] as const
              ).map((pen) => {
                const selected = activeTool === pen.id;
                return (
                  <button
                    key={pen.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setActiveTool(pen.id);
                    }}
                    className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl border font-black text-xs transition-all whitespace-nowrap shrink-0 ${
                      selected
                        ? 'bg-white/95 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-900/35 hover:bg-slate-900/75 text-white border-white/20'
                    }`}
                  >
                    <PenTool
                      className="w-3.5 h-3.5"
                      style={{ color: toolSettings[pen.id].color }}
                    />
                    <span>{pen.label}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        setActiveTool(pen.id);
                        setColorPickerTool(colorPickerTool === pen.id ? null : pen.id);
                      }}
                      title="تغيير لون القلم"
                      className="w-3 h-3 rounded-full border border-white/80 cursor-pointer"
                      style={{ backgroundColor: toolSettings[pen.id].color }}
                    />
                  </button>
                );
              })}

              {/* Highlighter */}
              <button
                id="btn-explainer-highlighter"
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTool('highlighter');
                }}
                className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl border font-black text-xs transition-all whitespace-nowrap shrink-0 ${
                  activeTool === 'highlighter'
                    ? 'bg-amber-400/95 text-slate-950 border-amber-200 shadow-sm'
                    : 'bg-slate-900/35 hover:bg-slate-900/75 text-amber-200 border-white/20'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>تظليل</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    setActiveTool('highlighter');
                    setColorPickerTool(colorPickerTool === 'highlighter' ? null : 'highlighter');
                  }}
                  title="لون التظليل"
                  className="w-3 h-3 rounded-full border border-slate-900 cursor-pointer"
                  style={{ backgroundColor: toolSettings.highlighter.color }}
                />
              </button>

              {/* Eraser */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTool('eraser');
                  setColorPickerTool(null);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-black text-xs transition-all whitespace-nowrap shrink-0 ${
                  activeTool === 'eraser'
                    ? 'bg-white/95 text-slate-950 border-white shadow-sm'
                    : 'bg-slate-900/35 hover:bg-slate-900/75 text-white border-white/20'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>مساحة</span>
              </button>

              {/* Normal Pointer (Click Screen to Advance) */}
              <button
                id="btn-explainer-hand"
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTool('hand');
                  setColorPickerTool(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-black text-xs transition-all whitespace-nowrap shrink-0 ${
                  activeTool === 'hand'
                    ? 'bg-sky-500/95 text-white border-sky-200 shadow-sm'
                    : 'bg-slate-900/35 hover:bg-slate-900/75 text-sky-100 border-white/20'
                }`}
                title="اضغط على الشاشة للانتقال للشريحة التالية (وكلك يمين للسابقة)"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>مؤشر عادي</span>
              </button>

              {/* Color button */}
              {isDrawTool && activeTool !== 'eraser' && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setColorPickerTool(colorPickerTool === activeTool ? null : activeTool);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white border border-white/20 text-xs font-black whitespace-nowrap shrink-0"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>اللون</span>
                </button>
              )}

              {/* Compact Size Presets */}
              {isDrawTool && (
                <div className="hidden md:flex items-center gap-0.5 bg-slate-900/35 px-1.5 py-1 rounded-xl border border-white/15">
                  {activePresets.map((preset) => {
                    const active = Math.abs(activeSettings.size - preset.size) <= 1.5;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          updateToolSize(activeTool, preset.size);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all ${
                          active
                            ? 'bg-amber-400 text-slate-950'
                            : 'text-white/90 hover:bg-white/15'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Undo / Redo / Clear */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                title="تراجع"
                className="p-1.5 rounded-xl bg-slate-900/35 hover:bg-slate-900/75 text-white disabled:opacity-35 border border-white/20"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                title="إعادة"
                className="p-1.5 rounded-xl bg-slate-900/35 hover:bg-slate-900/75 text-white disabled:opacity-35 border border-white/20"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearSlideInk}
                title="مسح الكتابة عن هذه الشريحة"
                className="p-1.5 rounded-xl bg-rose-900/45 hover:bg-rose-700/85 text-rose-100 border border-rose-300/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Color Palette Popout */}
            {colorPickerTool && (
              <div className="mt-2 pt-2 border-t border-white/20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-white">اختر اللون:</span>
                  {QUICK_PALETTE.map((hex) => {
                    const selected = toolSettings[colorPickerTool].color.toUpperCase() === hex;
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          updateToolColor(colorPickerTool, hex);
                        }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selected
                            ? 'ring-2 ring-amber-400 border-white scale-110'
                            : 'border-white/50'
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {selected && (
                          <Check
                            className={`w-3 h-3 ${
                              hex === '#FFFFFF' || hex === '#FACC15'
                                ? 'text-slate-900'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                  <label className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/60 border border-white/25 cursor-pointer text-xs font-bold text-white">
                    <input
                      type="color"
                      value={toolSettings[colorPickerTool].color}
                      onChange={(e) => updateToolColor(colorPickerTool, e.target.value)}
                      className="w-4 h-4 border-0 bg-transparent cursor-pointer p-0"
                    />
                    <span>مخصص</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setColorPickerTool(null)}
                  className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black"
                >
                  تم
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FULL-SCREEN PRESENTATION STAGE */}
        <div
          ref={viewportBoxRef}
          onClick={() => {
            if (activeTool === 'hand' && explainingDeck.externalType !== 'embed_url') {
              goToSlide(slideIndex + 1);
            }
          }}
          onContextMenu={(e) => {
            if (activeTool === 'hand' && explainingDeck.externalType !== 'embed_url') {
              e.preventDefault();
              goToSlide(slideIndex - 1);
            }
          }}
          className={`w-full h-full flex items-center justify-center overflow-hidden ${
            activeTool === 'hand'
              ? 'cursor-pointer'
              : activeTool === 'eraser'
              ? 'cursor-none'
              : 'cursor-crosshair'
          }`}
        >
          {/* Full-Screen 16:9 Presentation Canvas Container */}
          <div
            key={`explain-slide-${explainingDeck.id}-${slideIndex}-${animSeq}`}
            dir="ltr"
            style={{
              width: `${stageDims.width}px`,
              height: `${stageDims.height}px`,
              isolation: 'isolate',
            }}
            className={`relative overflow-hidden bg-white shrink-0 ${transitionCls}`}
          >
            {explainingDeck.externalType === 'embed_url' && explainingDeck.externalUrl ? (
              <iframe
                src={explainingDeck.externalUrl}
                title={explainingDeck.title}
                className="w-full h-full border-0 bg-white"
                allowFullScreen
              />
            ) : (
              /* Scaled Full-Crisp Slide Renderer */
              <div
                style={{
                  width: 1280,
                  height: 720,
                  transform: `scale(${slideScale})`,
                  transformOrigin: 'top left',
                }}
                className="pointer-events-none select-none"
              >
                {activeSlide && (
                  <SlideRenderer
                    slide={activeSlide}
                    theme={explainingDeck.theme}
                    letter={activeLetter}
                    slideIndex={slideIndex}
                    totalSlides={explainingDeck.slides.length}
                    isEditable={false}
                  />
                )}
              </div>
            )}

            {/* Transparent Annotation Ink Layer */}
            <canvas
              ref={drawCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              style={{
                touchAction: 'none',
                backgroundColor: 'transparent',
                pointerEvents: activeTool === 'hand' ? 'none' : 'auto',
              }}
              className="absolute inset-0 w-full h-full z-10"
            />

            {/* Laser Pointer Trail Layer */}
            <canvas
              ref={laserCanvasRef}
              className="absolute inset-0 w-full h-full z-20 pointer-events-none"
            />

            {/* Visual Eraser Cursor */}
            <div
              ref={eraserCursorRef}
              className="pointer-events-none absolute top-0 left-0 z-30 rounded-full border-2 border-slate-700 bg-white/40 shadow-sm opacity-0"
              style={{ willChange: 'transform' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SAVED PRESENTATIONS LIBRARY VIEW ("العروض التقديمية")
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            العروض التقديمية المحفوظة
          </h2>
          <p className="text-sm font-bold text-slate-500 mt-1">
            جميع عروض الباوربوينت التي أعدّها المعلم وائل حمدي وحفظها في المنصة · اضغط «اشرح» للتكبير والكتابة والمؤشر
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-library-import-external-pptx"
            type="button"
            onClick={() => {
              sound.playClick();
              setExtError('');
              setShowExternalModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>إضافة باوربوينت خارجي</span>
          </button>

          <button
            id="btn-library-create-pptx"
            type="button"
            onClick={() => {
              sound.playClick();
              onCreateNew();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء باوربوينت جديد</span>
          </button>

          <button
            id="btn-library-back-platform"
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-300 shadow-xs transition-all whitespace-nowrap shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمنصة</span>
          </button>
        </div>
      </div>

      {explainerError && (
        <div className="mb-5 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center justify-between gap-3">
          <span>{explainerError}</span>
          <button
            type="button"
            onClick={() => setExplainerError(null)}
            className="p-1 rounded-lg hover:bg-rose-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {presentations.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-amber-200 p-12 sm:p-16 text-center shadow-xs">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
            <Presentation className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">
            لا توجد عروض تقديمية محفوظة بعد
          </h3>
          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto mb-6">
            أنشئ باوربوينت جديداً، أو استورد ملف باوربوينت خارجي (PPTX / PDF / صور) أو رابط Google Slides ليظهر هنا جاهزاً للشرح الفوري أمام الطلاب.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setExtError('');
                setShowExternalModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-base shadow-md active:scale-95 transition-all"
            >
              <Upload className="w-5 h-5" />
              <span>إضافة باوربوينت خارجي</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onCreateNew();
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base shadow-lg active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5 text-amber-400" />
              <span>إصدار وحفظ أول باوربوينت</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((deck) => {
            const slidesList = hydratedSlidesMap[deck.id] || deck.slides;
            const firstSlide = slidesList?.[0];
            const letterObj =
              ARABIC_LETTERS.find((l) => l.id === deck.letterId) || ARABIC_LETTERS[0];
            const isBusy = loadingDeckId === deck.id;

            return (
              <div
                key={deck.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
              >
                {/* Live Responsive Cover Slide Thumbnail Preview */}
                <ScaledThumbnailSlide
                  slide={firstSlide}
                  theme={deck.theme}
                  letter={letterObj}
                  totalSlides={deck.slideCount}
                  fallbackTitle={deck.title}
                  fallbackChar={deck.letterChar}
                />

                {/* Metadata & Actions */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-lg font-black text-slate-900 leading-snug">
                        {deck.title}
                      </h3>
                      {deck.isExternal && (
                        <span className="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-black shrink-0">
                          {deck.externalType === 'embed_url'
                            ? 'رابط خارجي'
                            : deck.externalType === 'pdf_slides'
                            ? 'PDF خارجي'
                            : 'PPTX خارجي'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      {deck.externalType === 'embed_url' ? (
                        <span>عرض مدمج جاهز للشرح</span>
                      ) : (
                        <>
                          <span className="tabular-nums">{deck.slideCount} شرائح</span>
                          {!deck.isExternal && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>حرف ({deck.letterChar})</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              {deck.transitionEnabled && deck.transitionType !== 'none'
                                ? `انتقال: ${getTransitionLabel(deck.transitionType)}`
                                : 'انتقال عادي'}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <button
                      id={`btn-explain-deck-${deck.id}`}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleOpenExplain(deck)}
                      className="w-full py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black text-base shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
                    >
                      {isBusy ? (
                        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                      ) : (
                        <>
                          <Play className="w-5 h-5 text-amber-400 fill-amber-400" />
                          <span>اشرح</span>
                          <Maximize2 className="w-4 h-4 text-slate-400" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {deck.externalType === 'embed_url' && deck.externalUrl ? (
                        <a
                          href={deck.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>فتح الرابط الأصلي</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleOpenEdit(deck)}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل الشرائح</span>
                        </button>
                      )}

                      {confirmDeleteId === deck.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              sound.playClick();
                              setConfirmDeleteId(null);
                              await onDeletePresentation(deck.id);
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-black"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(deck.id)}
                          title="حذف العرض"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EXTERNAL POWERPOINT IMPORT MODAL */}
      {showExternalModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            dir="rtl"
            className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">
                    إضافة باوربوينت خارجي
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    استيراد ملف PPTX / PDF / صور أو رابط Google Slides / PowerPoint
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isImportingExternal}
                onClick={() => setShowExternalModal(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setExtTab('file');
                    setExtError('');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    extTab === 'file'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileUp className="w-4 h-4 text-amber-600" />
                  <span>رفع ملف PPTX / PDF / صور</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExtTab('url');
                    setExtError('');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    extTab === 'url'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-4 h-4 text-sky-600" />
                  <span>رابط باوربوينت / Google Slides</span>
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  عنوان العرض التقديمي (اختياري — يُؤخذ تلقائياً من اسم الملف)
                </label>
                <input
                  type="text"
                  value={extTitle}
                  onChange={(e) => setExtTitle(e.target.value)}
                  placeholder="مثال: درس حروف المد - مراجعة"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden text-sm font-bold text-slate-900"
                />
              </div>

              {extTab === 'file' ? (
                <div className="space-y-4">
                  {/* Slide transition choice */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      حركة الانتقال بين الشرائح عند الشرح
                    </label>
                    <select
                      value={extTransitionType}
                      onChange={(e) =>
                        setExtTransitionType(e.target.value as SlideTransitionType)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 outline-hidden focus:border-amber-500"
                    >
                      <option value="none">بدون انتقال</option>
                      {SLIDE_TRANSITION_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Upload dropzone */}
                  <label
                    className={`block rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                      isImportingExternal
                        ? 'border-amber-400 bg-amber-50/70 cursor-wait'
                        : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50/40 cursor-pointer'
                    }`}
                  >
                    <input
                      id="input-upload-external-pptx"
                      type="file"
                      accept=".pptx,.ppt,.pdf,image/*"
                      multiple
                      disabled={isImportingExternal}
                      onChange={handleImportExternalFiles}
                      className="hidden"
                    />
                    {isImportingExternal ? (
                      <div className="space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
                        <div className="font-black text-sm text-slate-900">
                          {extProgress
                            ? `جاري استيراد شريحة ${extProgress.current} من ${extProgress.total}...`
                            : 'جاري قراءة الشرائح وتجهيزها للعرض...'}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="font-black text-sm text-slate-900">
                          اضغط لاختيار ملف باوربوينت (.pptx) أو PDF أو مجموعة صور شرائح
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          يتم تحويل الشرائح تلقائياً للعرض بملء الشاشة والكتابة عليها بالأقلام والليزر
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <form onSubmit={handleSaveExternalUrlDeck} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      رابط العرض الخارجي أو كود التضمين (Google Slides / Canva / OneDrive / رابط .pptx)
                    </label>
                    <input
                      id="input-external-pptx-url"
                      type="text"
                      dir="ltr"
                      value={extUrl}
                      onChange={(e) => setExtUrl(e.target.value)}
                      placeholder="https://docs.google.com/presentation/d/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-hidden text-sm font-medium text-slate-900"
                    />
                  </div>
                  <button
                    id="btn-submit-external-pptx-url"
                    type="submit"
                    disabled={isImportingExternal}
                    className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isImportingExternal ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <Link2 className="w-4 h-4 text-amber-400" />
                    )}
                    <span>حفظ العرض في العروض التقديمية</span>
                  </button>
                </form>
              )}

              {extError && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                  {extError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ScaledThumbnailSlide: React.FC<{
  slide?: PresentationSlide;
  theme: SavedPresentation['theme'];
  letter: (typeof ARABIC_LETTERS)[number];
  totalSlides: number;
  fallbackTitle: string;
  fallbackChar: string;
}> = ({ slide, theme, letter, totalSlides, fallbackTitle, fallbackChar }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.28);

  useEffect(() => {
    const update = () => {
      if (boxRef.current) {
        const w = boxRef.current.clientWidth;
        if (w > 0) setScale(w / 1280);
      }
    };
    update();
    const obs = new ResizeObserver(update);
    if (boxRef.current) obs.observe(boxRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      dir="ltr"
      className="relative w-full aspect-video bg-slate-100 border-b border-slate-200 overflow-hidden"
    >
      {slide ? (
        <div
          style={{
            width: 1280,
            height: 720,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="pointer-events-none select-none"
        >
          <SlideRenderer
            slide={slide}
            theme={{ ...DECK_THEMES[0], ...(theme || {}) }}
            letter={letter}
            slideIndex={0}
            totalSlides={totalSlides}
            isEditable={false}
          />
        </div>
      ) : (
        <div
          dir="rtl"
          className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
          style={{ backgroundColor: theme?.bgHex || '#F8FAFC' }}
        >
          <div
            className="w-16 h-16 rounded-2xl text-white font-black text-4xl flex items-center justify-center mb-2 shadow-sm"
            style={{ backgroundColor: theme?.primaryHex || '#F97316' }}
          >
            {fallbackChar}
          </div>
          <div className="font-black text-base text-slate-900 line-clamp-1">
            {fallbackTitle}
          </div>
        </div>
      )}
    </div>
  );
};
