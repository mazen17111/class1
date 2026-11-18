import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ArrowRight,
  BookOpen,
  Plus,
  Upload,
  Link2,
  PenTool,
  Highlighter,
  Eraser,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Palette,
  Check,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Monitor,
  FileText,
  ExternalLink,
  X,
  Hand,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { StudyMaterial, StudyMaterialSourceType } from '../types';
import { sound } from '../utils/audio';
import {
  saveLocalMaterialFile,
  getLocalMaterialFile,
  deleteLocalMaterialFile,
  saveLocalAnnotation,
  getLocalAnnotationsForMaterial,
  deleteLocalAnnotationsForMaterial,
} from '../utils/materialsDb';
import {
  saveStudyMaterialToFirestore,
  updateStudyMaterialProgressInFirestore,
  deleteStudyMaterialFromFirestore,
  fetchMaterialAnnotationsFromFirestore,
  saveMaterialAnnotationToFirestore,
} from '../firebase';
import {
  PdfPageCanvasView,
  StudioToolId,
  StudioToolSettings,
  PageActionHandles,
} from './PdfPageCanvasView';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PDFJS_COMMON_OPTIONS = {
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/pdfjs/standard_fonts/',
  wasmUrl: '/pdfjs/wasm/',
  useSystemFonts: true,
};

interface StudyMaterialsStudioProps {
  materials: StudyMaterial[];
  activeMaterialId: string | null;
  onSelectMaterial: (id: string | null) => void;
  onMaterialsChange: (updater: (prev: StudyMaterial[]) => StudyMaterial[]) => void;
  initialOpenAddModal?: boolean;
  onClearInitialOpenAddModal?: () => void;
  onSwitchToWhiteboard: () => void;
  onBack: () => void;
}

type DrawToolId = Exclude<StudioToolId, 'hand'>;

interface LaserPoint {
  x: number;
  y: number;
  time: number;
  isStart?: boolean;
}

const QUICK_PALETTE = [
  '#0F172A',
  '#2563EB',
  '#DC2626',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#DB2777',
  '#0891B2',
  '#FACC15',
  '#FFFFFF',
];

const SIZE_PRESETS: Record<DrawToolId, { label: string; size: number }[]> = {
  pen1: [
    { label: 'رفيع', size: 2.5 },
    { label: 'متوسط', size: 4.5 },
    { label: 'كبير', size: 8 },
    { label: 'عريض', size: 14 },
  ],
  pen2: [
    { label: 'رفيع', size: 2.5 },
    { label: 'متوسط', size: 4.5 },
    { label: 'كبير', size: 8 },
    { label: 'عريض', size: 14 },
  ],
  pen3: [
    { label: 'رفيع', size: 2.5 },
    { label: 'متوسط', size: 4.5 },
    { label: 'كبير', size: 8 },
    { label: 'عريض', size: 14 },
  ],
  highlighter: [
    { label: 'رفيع', size: 14 },
    { label: 'متوسط', size: 22 },
    { label: 'كبير', size: 32 },
    { label: 'عريض', size: 44 },
  ],
  laser: [
    { label: 'صغير', size: 4 },
    { label: 'متوسط', size: 7 },
    { label: 'كبير', size: 11 },
    { label: 'ضخم', size: 15 },
  ],
  eraser: [
    { label: 'صغير', size: 14 },
    { label: 'متوسط', size: 26 },
    { label: 'كبير', size: 42 },
    { label: 'عريض', size: 64 },
  ],
};

const SIZE_RANGES: Record<DrawToolId, { min: number; max: number }> = {
  pen1: { min: 1.5, max: 24 },
  pen2: { min: 1.5, max: 24 },
  pen3: { min: 1.5, max: 24 },
  highlighter: { min: 10, max: 56 },
  laser: { min: 3, max: 20 },
  eraser: { min: 10, max: 80 },
};

const LASER_LIFETIME_MS = 1200;

function normalizeExternalUrl(rawUrl: string): {
  resolvedUrl: string;
  likelyKind: 'image' | 'pdf' | 'iframe';
} {
  const trimmed = rawUrl.trim();
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return {
      resolvedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      likelyKind: 'iframe',
    };
  }
  if (/^data:image\//i.test(trimmed) || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(trimmed)) {
    return { resolvedUrl: trimmed, likelyKind: 'image' };
  }
  if (/^data:application\/pdf/i.test(trimmed) || /\.pdf(\?.*)?$/i.test(trimmed)) {
    return { resolvedUrl: trimmed, likelyKind: 'pdf' };
  }
  return { resolvedUrl: trimmed, likelyKind: 'iframe' };
}

function parseTypedPageNumber(raw: string): number | null {
  const normalized = raw
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^0-9]/g, '');
  if (!normalized) return null;
  const num = Number.parseInt(normalized, 10);
  return Number.isFinite(num) ? num : null;
}

function fileToCompressedImageDataUrl(
  file: File
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1400;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
        }
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas error'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        let url = c.toDataURL('image/jpeg', 0.86);
        if (url.length > 460000) {
          url = c.toDataURL('image/jpeg', 0.65);
        }
        resolve({ dataUrl: url, width: w, height: h });
      };
      img.onerror = () => reject(new Error('Image load error'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

export const StudyMaterialsStudio: React.FC<StudyMaterialsStudioProps> = ({
  materials,
  activeMaterialId,
  onSelectMaterial,
  onMaterialsChange,
  initialOpenAddModal = false,
  onClearInitialOpenAddModal,
  onSwitchToWhiteboard,
  onBack,
}) => {
  const activeMaterial =
    materials.find((m) => m.id === activeMaterialId) || materials[0] || null;

  // Add Material Modal state
  const [showAddModal, setShowAddModal] = useState(initialOpenAddModal);
  const [addMode, setAddMode] = useState<'device' | 'url'>('device');
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Book Viewer state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputStr, setPageInputStr] = useState('1');
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const isEditingPageRef = useRef(false);
  const programmaticScrollLockRef = useRef<number | null>(null);
  const pageJumpDebounceRef = useRef<number | null>(null);
  const [renderMode, setRenderMode] = useState<
    'pdf' | 'image' | 'iframe' | 'loading' | 'error'
  >('loading');
  const [viewerErrorMsg, setViewerErrorMsg] = useState('');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [iframeSrc, setIframeSrc] = useState<string>('');
  const [pageDims, setPageDims] = useState<{ width: number; height: number }>({
    width: 820,
    height: 1060,
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loadedPdf, setLoadedPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [annotationsByPage, setAnnotationsByPage] = useState<Record<number, string>>({});
  const [isBookFullscreen, setIsBookFullscreen] = useState<boolean>(() =>
    Boolean(activeMaterial && !initialOpenAddModal)
  );
  const hasAutoOpenedFullscreenRef = useRef<boolean>(
    Boolean(activeMaterial && !initialOpenAddModal)
  );

  // Scroll & page element refs for downward scrolling book mode
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageElementsRef = useRef<Record<number, HTMLDivElement | null>>({});
  const activePageHandlesRef = useRef<PageActionHandles | null>(null);
  const [activePageUndoRedo, setActivePageUndoRedo] = useState({
    canUndo: false,
    canRedo: false,
  });

  // Loaded PDF cleanup refs
  const objectUrlRef = useRef<string | null>(null);
  const annotationsMapRef = useRef<Record<number, string>>({});
  const activeMaterialRef = useRef<StudyMaterial | null>(activeMaterial);
  activeMaterialRef.current = activeMaterial;

  // Single-page (Image / Iframe) canvases
  const stageRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const eraserCursorRef = useRef<HTMLDivElement>(null);
  const dprRef = useRef<number>(1);
  const canvasRectRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

  // Drawing Tools state
  const [activeTool, setActiveTool] = useState<StudioToolId>('pen1');
  const [colorPickerTool, setColorPickerTool] = useState<DrawToolId | null>(null);
  const [toolSettings, setToolSettings] = useState<
    Record<DrawToolId, StudioToolSettings>
  >({
    pen1: { color: '#0F172A', size: 4 },
    pen2: { color: '#2563EB', size: 4 },
    pen3: { color: '#DC2626', size: 4 },
    highlighter: { color: '#FACC15', size: 22 },
    laser: { color: '#EF4444', size: 7 },
    eraser: { color: '#FFFFFF', size: 28 },
  });
  const activeToolRef = useRef(activeTool);
  const toolSettingsRef = useRef(toolSettings);
  activeToolRef.current = activeTool;
  toolSettingsRef.current = toolSettings;

  // Single-page Undo / Redo snapshots
  const historyRef = useRef<HTMLCanvasElement[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndoSingle, setCanUndoSingle] = useState(false);
  const [canRedoSingle, setCanRedoSingle] = useState(false);
  const [confirmClearPage, setConfirmClearPage] = useState(false);

  // Pointer & laser refs for single-page mode
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const midPointRef = useRef<{ x: number; y: number } | null>(null);
  const laserTrailRef = useRef<LaserPoint[]>([]);
  const laserPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const tryEnterFullscreen = useCallback((el?: HTMLElement | null) => {
    try {
      const target = (el || document.documentElement) as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (document.fullscreenElement) return;
      const maybePromise =
        target.requestFullscreen?.() ?? target.webkitRequestFullscreen?.();
      if (maybePromise && typeof (maybePromise as Promise<void>).catch === 'function') {
        (maybePromise as Promise<void>).catch(() => {});
      }
    } catch {
      // Sandboxed iframes may block native fullscreen; CSS fixed 100vw×100dvh still fills viewport
    }
  }, []);

  const tryExitFullscreen = useCallback(() => {
    try {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void> | void;
      };
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

  useEffect(() => {
    if (initialOpenAddModal) {
      setShowAddModal(true);
      onClearInitialOpenAddModal?.();
    }
  }, [initialOpenAddModal, onClearInitialOpenAddModal]);

  useEffect(() => {
    if (!activeMaterialId && materials.length > 0) {
      onSelectMaterial(materials[0].id);
    }
  }, [activeMaterialId, materials, onSelectMaterial]);

  useEffect(() => {
    if (activeMaterial && !showAddModal && !hasAutoOpenedFullscreenRef.current) {
      hasAutoOpenedFullscreenRef.current = true;
      setIsBookFullscreen(true);
    }
  }, [activeMaterial, showAddModal]);

  useEffect(() => {
    if (!isBookFullscreen || showAddModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBookFullscreen(false);
        tryExitFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isBookFullscreen, showAddModal, tryExitFullscreen]);

  useEffect(() => {
    return () => {
      tryExitFullscreen();
      if (programmaticScrollLockRef.current !== null) {
        window.clearTimeout(programmaticScrollLockRef.current);
      }
      if (pageJumpDebounceRef.current !== null) {
        window.clearTimeout(pageJumpDebounceRef.current);
      }
    };
  }, [tryExitFullscreen]);

  useEffect(() => {
    if (!isEditingPageRef.current && programmaticScrollLockRef.current === null) {
      setPageInputStr(String(currentPage));
    }
  }, [currentPage]);

  // Save per-page annotation to IndexedDB + Firestore
  const handleSavePageAnnotation = useCallback(
    async (pageNumber: number, imageData: string) => {
      const matId = activeMaterialRef.current?.id;
      if (!matId) return;

      annotationsMapRef.current[pageNumber] = imageData;
      setSaveStatus('saving');
      await saveLocalAnnotation(matId, pageNumber, imageData);
      try {
        await saveMaterialAnnotationToFirestore(matId, pageNumber, imageData);
      } catch (e) {
        console.warn('Firestore annotation sync deferred:', e);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1600);
    },
    []
  );

  // Register active PDF page handles for toolbar Undo / Redo / Clear / Download
  const handleActivatePdfPage = useCallback(
    (pageNum: number, handles: PageActionHandles) => {
      activePageHandlesRef.current = handles;
      setCurrentPage(pageNum);
      setActivePageUndoRedo({ canUndo: handles.canUndo, canRedo: handles.canRedo });
    },
    []
  );

  const handleVisiblePdfPageChange = useCallback(
    (pageNum: number) => {
      if (programmaticScrollLockRef.current !== null) return;
      setCurrentPage(pageNum);
      if (activeMaterialRef.current) {
        updateStudyMaterialProgressInFirestore(activeMaterialRef.current.id, {
          lastPage: pageNum,
        }).catch(() => {});
      }
    },
    []
  );

  const registerPageElement = useCallback(
    (pageNum: number, el: HTMLDivElement | null) => {
      pageElementsRef.current[pageNum] = el;
    },
    []
  );

  const scrollToPdfPage = useCallback(
    (pageNum: number) => {
      if (pageJumpDebounceRef.current !== null) {
        window.clearTimeout(pageJumpDebounceRef.current);
        pageJumpDebounceRef.current = null;
      }
      if (programmaticScrollLockRef.current !== null) {
        window.clearTimeout(programmaticScrollLockRef.current);
      }

      const clamped = Math.max(1, Math.min(totalPages, Math.round(pageNum)));
      setCurrentPage(clamped);
      setPageInputStr(String(clamped));

      // Lock observer briefly while smooth scroll glides past intermediate pages
      programmaticScrollLockRef.current = window.setTimeout(() => {
        programmaticScrollLockRef.current = null;
      }, 900);

      const el = pageElementsRef.current[clamped];
      const container = scrollContainerRef.current;
      if (el && container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const topOffset = isBookFullscreen ? 78 : 14;
        const targetTop = Math.max(
          0,
          container.scrollTop + (elRect.top - containerRect.top) - topOffset
        );
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (activeMaterialRef.current) {
        updateStudyMaterialProgressInFirestore(activeMaterialRef.current.id, {
          lastPage: clamped,
        }).catch(() => {});
      }
    },
    [isBookFullscreen, totalPages]
  );

  const handlePageInputChange = (raw: string) => {
    setPageInputStr(raw);
    if (pageJumpDebounceRef.current !== null) {
      window.clearTimeout(pageJumpDebounceRef.current);
      pageJumpDebounceRef.current = null;
    }
    const parsed = parseTypedPageNumber(raw);
    if (parsed !== null && parsed >= 1 && parsed <= totalPages) {
      pageJumpDebounceRef.current = window.setTimeout(() => {
        scrollToPdfPage(parsed);
      }, 500);
    }
  };

  const commitPageInput = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pageJumpDebounceRef.current !== null) {
      window.clearTimeout(pageJumpDebounceRef.current);
      pageJumpDebounceRef.current = null;
    }
    const parsed = parseTypedPageNumber(pageInputStr);
    if (parsed !== null) {
      sound.playClick();
      scrollToPdfPage(parsed);
    } else {
      setPageInputStr(String(currentPage));
    }
  };

  // Single-page overlay helpers (for Image & Iframe modes)
  const syncSingleHistoryFlags = useCallback(() => {
    setCanUndoSingle(historyIndexRef.current > 0);
    setCanRedoSingle(
      historyIndexRef.current >= 0 &&
        historyIndexRef.current < historyRef.current.length - 1
    );
  }, []);

  const exportCompactAnnotationDataUrl = useCallback((canvas: HTMLCanvasElement): string => {
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
    return dataUrl;
  }, []);

  const pushSingleSnapshot = useCallback(
    (persist = true) => {
      const canvas = drawCanvasRef.current;
      if (!canvas || canvas.width === 0 || canvas.height === 0) return;

      const snap = document.createElement('canvas');
      snap.width = canvas.width;
      snap.height = canvas.height;
      const sCtx = snap.getContext('2d');
      if (!sCtx) return;
      sCtx.drawImage(canvas, 0, 0);

      const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      nextHistory.push(snap);
      if (nextHistory.length > 25) nextHistory.shift();
      historyRef.current = nextHistory;
      historyIndexRef.current = nextHistory.length - 1;
      syncSingleHistoryFlags();

      if (persist) {
        handleSavePageAnnotation(1, exportCompactAnnotationDataUrl(canvas));
      }
    },
    [exportCompactAnnotationDataUrl, handleSavePageAnnotation, syncSingleHistoryFlags]
  );

  const syncSingleOverlayCanvases = useCallback(
    (w: number, h: number) => {
      const drawCanvas = drawCanvasRef.current;
      const laserCanvas = laserCanvasRef.current;
      if (!drawCanvas || !laserCanvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      dprRef.current = dpr;
      drawCanvas.width = Math.max(1, Math.floor(w * dpr));
      drawCanvas.height = Math.max(1, Math.floor(h * dpr));
      laserCanvas.width = Math.max(1, Math.floor(w * dpr));
      laserCanvas.height = Math.max(1, Math.floor(h * dpr));

      const dCtx = drawCanvas.getContext('2d', { alpha: true });
      const lCtx = laserCanvas.getContext('2d', { alpha: true });
      drawCtxRef.current = dCtx;
      laserCtxRef.current = lCtx;
      if (lCtx) lCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      historyRef.current = [];
      historyIndexRef.current = -1;

      const savedDataUrl = annotationsMapRef.current[1];
      if (dCtx) {
        dCtx.setTransform(1, 0, 0, 1, 0, 0);
        dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        if (savedDataUrl) {
          const img = new Image();
          img.onload = () => {
            dCtx.setTransform(1, 0, 0, 1, 0, 0);
            dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            dCtx.drawImage(img, 0, 0, drawCanvas.width, drawCanvas.height);
            dCtx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
            pushSingleSnapshot(false);
          };
          img.onerror = () => {
            dCtx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
            pushSingleSnapshot(false);
          };
          img.src = savedDataUrl;
        } else {
          dCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          pushSingleSnapshot(false);
        }
      }
    },
    [pushSingleSnapshot]
  );

  // Load material file + annotations whenever activeMaterial changes
  useEffect(() => {
    let cancelled = false;
    let activeLoadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const cleanupResources = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (activeLoadingTask) {
        activeLoadingTask.destroy().catch(() => {});
        activeLoadingTask = null;
      }
      setLoadedPdf((prev) => {
        if (prev) prev.cleanup().catch(() => {});
        return null;
      });
    };

    const loadMaterial = async () => {
      cleanupResources();
      pageElementsRef.current = {};
      activePageHandlesRef.current = null;
      setActivePageUndoRedo({ canUndo: false, canRedo: false });

      if (!activeMaterial) {
        setRenderMode('loading');
        return;
      }

      setRenderMode('loading');
      setViewerErrorMsg('');
      const initialPage = Math.max(1, activeMaterial.lastPage || 1);
      setCurrentPage(initialPage);
      setTotalPages(Math.max(1, activeMaterial.pageCount || 1));

      const [localAnns, remoteAnns] = await Promise.all([
        getLocalAnnotationsForMaterial(activeMaterial.id),
        fetchMaterialAnnotationsFromFirestore(activeMaterial.id).catch(
          () => ({} as Record<number, string>)
        ),
      ]);
      if (cancelled) return;
      const merged = { ...remoteAnns, ...localAnns };
      annotationsMapRef.current = merged;
      setAnnotationsByPage(merged);

      try {
        const localFile = await getLocalMaterialFile(activeMaterial.id);
        if (cancelled) return;

        if (localFile) {
          if (
            localFile.mimeType.includes('pdf') ||
            activeMaterial.sourceType === 'pdf_file'
          ) {
            const loadingTask = pdfjsLib.getDocument({
              data: localFile.buffer.slice(0),
              ...PDFJS_COMMON_OPTIONS,
            });
            activeLoadingTask = loadingTask;
            const pdf = await loadingTask.promise;
            if (cancelled) {
              loadingTask.destroy().catch(() => {});
              return;
            }
            setLoadedPdf(pdf);
            setTotalPages(pdf.numPages);
            setRenderMode('pdf');
            if (initialPage > 1 && initialPage <= pdf.numPages) {
              setTimeout(() => {
                if (!cancelled) {
                  pageElementsRef.current[initialPage]?.scrollIntoView({
                    behavior: 'auto',
                    block: 'start',
                  });
                }
              }, 150);
            }
            return;
          }

          const blob = new Blob([localFile.buffer], {
            type: localFile.mimeType || 'image/png',
          });
          const objUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objUrl;
          setImageSrc(objUrl);
          setTotalPages(1);
          setCurrentPage(1);
          setRenderMode('image');
          return;
        }

        if (activeMaterial.inlineImage) {
          setImageSrc(activeMaterial.inlineImage);
          setTotalPages(1);
          setCurrentPage(1);
          setRenderMode('image');
          return;
        }

        if (activeMaterial.fileUrl) {
          const { resolvedUrl, likelyKind } = normalizeExternalUrl(activeMaterial.fileUrl);
          if (likelyKind === 'image') {
            setImageSrc(resolvedUrl);
            setTotalPages(1);
            setCurrentPage(1);
            setRenderMode('image');
            return;
          }

          if (likelyKind === 'pdf') {
            try {
              const loadingTask = pdfjsLib.getDocument({
                url: resolvedUrl,
                ...PDFJS_COMMON_OPTIONS,
              });
              activeLoadingTask = loadingTask;
              const pdf = await loadingTask.promise;
              if (cancelled) {
                loadingTask.destroy().catch(() => {});
                return;
              }
              setLoadedPdf(pdf);
              setTotalPages(pdf.numPages);
              setRenderMode('pdf');
              return;
            } catch {
              // CORS blocked direct PDF bytes fetch — fallback to embedded iframe + annotation overlay
            }
          }

          setIframeSrc(resolvedUrl);
          setTotalPages(1);
          setCurrentPage(1);
          setRenderMode('iframe');
          const w = Math.round(860 * zoom);
          const h = Math.round(1040 * zoom);
          setPageDims({ width: w, height: h });
          requestAnimationFrame(() => {
            if (!cancelled) syncSingleOverlayCanvases(w, h);
          });
          return;
        }

        setRenderMode('error');
        setViewerErrorMsg(
          'تم حفظ بيانات هذا الملف على جهاز آخر. يرجى رفع الملف هنا أو استخدام رابط مباشر للمشاركة عبر الأجهزة.'
        );
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading study material:', err);
          setRenderMode('error');
          setViewerErrorMsg('تعذر عرض الملف، يرجى التأكد من صيغة الملف أو الرابط.');
        }
      }
    };

    loadMaterial();
    return () => {
      cancelled = true;
      cleanupResources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaterial?.id]);

  // Adjust image/iframe dimensions on zoom change
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const natW = img.naturalWidth || 820;
    const natH = img.naturalHeight || 1040;
    const baseW = Math.min(860, Math.max(540, natW));
    const ratio = natH / natW;
    const w = Math.round(baseW * zoom);
    const h = Math.round(baseW * ratio * zoom);
    setPageDims({ width: w, height: h });
    syncSingleOverlayCanvases(w, h);
  };

  useEffect(() => {
    if (renderMode === 'iframe') {
      const w = Math.round(860 * zoom);
      const h = Math.round(1040 * zoom);
      setPageDims({ width: w, height: h });
      syncSingleOverlayCanvases(w, h);
    }
  }, [renderMode, zoom, syncSingleOverlayCanvases]);

  // Single-page Laser loop (Image / Iframe mode)
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

      const settings = toolSettingsRef.current.laser;
      const laserColor = settings.color;
      const laserSize = settings.size;
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
        ctx.arc(pos.x, pos.y, laserSize * 0.85, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(2, laserSize * 0.38), 0, Math.PI * 2);
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

  const applyActiveContextStyle = (
    ctx: CanvasRenderingContext2D,
    tool: DrawToolId
  ) => {
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

  const handleSinglePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

    applyActiveContextStyle(ctx, tool);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, toolSettingsRef.current[tool].size / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleSinglePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const tool = activeToolRef.current;
    if (tool === 'hand') return;

    const rect = e.currentTarget.getBoundingClientRect();
    canvasRectRef.current = { left: rect.left, top: rect.top };
    const { left, top } = canvasRectRef.current;

    if (tool === 'eraser' && eraserCursorRef.current) {
      const size = toolSettingsRef.current.eraser.size;
      const x = e.clientX - left - size / 2;
      const y = e.clientY - top - size / 2;
      eraserCursorRef.current.style.opacity = '1';
      eraserCursorRef.current.style.width = `${size}px`;
      eraserCursorRef.current.style.height = `${size}px`;
      eraserCursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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
      const newMid = {
        x: (last.x + pt.x) * 0.5,
        y: (last.y + pt.y) * 0.5,
      };
      ctx.quadraticCurveTo(last.x, last.y, newMid.x, newMid.y);
      last = pt;
      mid = newMid;
    }

    ctx.stroke();
    lastPointRef.current = last;
    midPointRef.current = mid;
  };

  const handleSinglePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    midPointRef.current = null;

    if (activeToolRef.current !== 'laser' && activeToolRef.current !== 'hand') {
      pushSingleSnapshot(true);
    }
  };

  const handleSinglePointerLeave = () => {
    laserPointerPosRef.current = null;
    if (eraserCursorRef.current) {
      eraserCursorRef.current.style.opacity = '0';
    }
    if (isDrawingRef.current) {
      handleSinglePointerUp();
    }
  };

  // Unified Undo / Redo / Clear / Download actions across PDF multi-page scroll mode and single-page mode
  const handleToolbarUndo = () => {
    if (renderMode === 'pdf') {
      activePageHandlesRef.current?.undo();
      return;
    }
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
    syncSingleHistoryFlags();
    handleSavePageAnnotation(1, exportCompactAnnotationDataUrl(canvas));
  };

  const handleToolbarRedo = () => {
    if (renderMode === 'pdf') {
      activePageHandlesRef.current?.redo();
      return;
    }
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
    syncSingleHistoryFlags();
    handleSavePageAnnotation(1, exportCompactAnnotationDataUrl(canvas));
  };

  const handleToolbarClearPage = () => {
    if (renderMode === 'pdf') {
      activePageHandlesRef.current?.clearPage();
      setConfirmClearPage(false);
      return;
    }
    sound.playSnap();
    const canvas = drawCanvasRef.current;
    const ctx = drawCtxRef.current;
    if (!canvas || !ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    pushSingleSnapshot(true);
    setConfirmClearPage(false);
  };

  const handleToolbarDownloadPage = () => {
    if (renderMode === 'pdf') {
      activePageHandlesRef.current?.downloadPage();
      return;
    }
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    sound.playSuccess();

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = drawCanvas.width;
    exportCanvas.height = drawCanvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    if (renderMode === 'image' && imageSrc) {
      const img = stageRef.current?.querySelector('img');
      if (img) {
        try {
          ctx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);
        } catch {
          // cross-origin image fallback
        }
      }
    }

    ctx.drawImage(drawCanvas, 0, 0);
    const link = document.createElement('a');
    link.download = `${activeMaterial?.title || 'المادة_الدراسية'}_صفحة_1.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  // Upload from Device Handler
  const handleDeviceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);

    try {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (!isPdf && !isImage) {
        setUploadError('يرجى اختيار ملف PDF أو صورة صالحة (PNG, JPG, WebP).');
        setIsUploading(false);
        return;
      }

      const buffer = await file.arrayBuffer();
      const id = `mat_${Date.now()}`;
      const defaultTitle =
        titleInput.trim() ||
        file.name.replace(/\.[^/.]+$/, '').slice(0, 120) ||
        'مادة دراسية جديدة';

      let detectedPages = 1;
      let inlineImage: string | undefined;
      const sourceType: StudyMaterialSourceType = isPdf ? 'pdf_file' : 'image_file';

      if (isPdf) {
        const loadingTask = pdfjsLib.getDocument({
          data: buffer.slice(0),
          ...PDFJS_COMMON_OPTIONS,
        });
        const pdf = await loadingTask.promise;
        detectedPages = Math.max(1, pdf.numPages);
        await loadingTask.destroy();
      } else {
        const compressed = await fileToCompressedImageDataUrl(file);
        inlineImage = compressed.dataUrl;
      }

      await saveLocalMaterialFile(
        id,
        buffer,
        file.type || (isPdf ? 'application/pdf' : 'image/png')
      );

      const newMat: StudyMaterial = {
        id,
        title: defaultTitle,
        sourceType,
        fileUrl: '',
        inlineImage,
        pageCount: detectedPages,
        lastPage: 1,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
      };

      onMaterialsChange((prev) => [newMat, ...prev]);
      onSelectMaterial(id);
      await saveStudyMaterialToFirestore(newMat);

      sound.playSuccess();
      setTitleInput('');
      setShowAddModal(false);
      setIsBookFullscreen(true);
      hasAutoOpenedFullscreenRef.current = true;
      tryEnterFullscreen(document.documentElement);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('تعذر قراءة الملف المختار. يرجى التأكد من أن الملف غير تالف.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Add by URL Handler
  const handleAddByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = urlInput.trim();
    if (!rawUrl) {
      setUploadError('يرجى إدخال رابط الملف.');
      return;
    }
    if (!/^https?:\/\/|^data:/i.test(rawUrl)) {
      setUploadError('يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    try {
      const id = `mat_${Date.now()}`;
      const cleanTitle =
        titleInput.trim().slice(0, 120) ||
        rawUrl.split('/').pop()?.split('?')[0]?.slice(0, 80) ||
        'كتاب / ملف دراسي';

      const newMat: StudyMaterial = {
        id,
        title: cleanTitle,
        sourceType: 'url',
        fileUrl: rawUrl.slice(0, 2000),
        pageCount: 1,
        lastPage: 1,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
      };

      onMaterialsChange((prev) => [newMat, ...prev]);
      onSelectMaterial(id);
      await saveStudyMaterialToFirestore(newMat);

      sound.playSuccess();
      setTitleInput('');
      setUrlInput('');
      setShowAddModal(false);
      setIsBookFullscreen(true);
      hasAutoOpenedFullscreenRef.current = true;
      tryEnterFullscreen(document.documentElement);
    } catch (err) {
      console.error('URL add error:', err);
      setUploadError('حدث خطأ أثناء حفظ الرابط.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    sound.playClick();
    onMaterialsChange((prev) => prev.filter((m) => m.id !== id));
    if (activeMaterial?.id === id) {
      const nextMat = materials.find((m) => m.id !== id) || null;
      onSelectMaterial(nextMat ? nextMat.id : null);
    }
    setConfirmDeleteId(null);
    await Promise.all([
      deleteLocalMaterialFile(id),
      deleteLocalAnnotationsForMaterial(id),
      deleteStudyMaterialFromFirestore(id).catch(() => {}),
    ]);
  };

  const updateToolColor = (tool: DrawToolId, color: string) => {
    setToolSettings((prev) => ({
      ...prev,
      [tool]: { ...prev[tool], color },
    }));
  };

  const updateToolSize = (tool: DrawToolId, size: number) => {
    setToolSettings((prev) => ({
      ...prev,
      [tool]: { ...prev[tool], size },
    }));
  };

  const penTools: { id: 'pen1' | 'pen2' | 'pen3'; label: string }[] = [
    { id: 'pen1', label: 'قلم ١' },
    { id: 'pen2', label: 'قلم ٢' },
    { id: 'pen3', label: 'قلم ٣' },
  ];

  const isDrawTool = activeTool !== 'hand';
  const activeSettings = isDrawTool ? toolSettings[activeTool] : toolSettings.pen1;
  const activePresets = isDrawTool ? SIZE_PRESETS[activeTool] : SIZE_PRESETS.pen1;
  const activeRange = isDrawTool ? SIZE_RANGES[activeTool] : SIZE_RANGES.pen1;
  const canUndo = renderMode === 'pdf' ? activePageUndoRedo.canUndo : canUndoSingle;
  const canRedo = renderMode === 'pdf' ? activePageUndoRedo.canRedo : canRedoSingle;

  const inBookFullscreen = Boolean(activeMaterial && isBookFullscreen);

  return (
    <div
      dir="rtl"
      className={
        inBookFullscreen
          ? 'fixed inset-0 z-[9999] w-screen h-[100dvh] bg-slate-900 flex flex-col overflow-hidden'
          : 'max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-5'
      }
    >
      {/* Windowed Studio Top Bar (visible when not full-screen) */}
      {!inBookFullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="btn-materials-back"
              type="button"
              onClick={() => {
                sound.playClick();
                tryExitFullscreen();
                onBack();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black text-sm border border-slate-200 shadow-xs active:scale-95 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للمنصة</span>
            </button>

            <button
              id="btn-switch-book-to-whiteboard"
              type="button"
              onClick={() => {
                sound.playClick();
                tryExitFullscreen();
                onSwitchToWhiteboard();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-sm active:scale-95 transition-all"
            >
              <Monitor className="w-4 h-4" />
              <span>التبديل للسبورة الذكية</span>
            </button>

            <button
              id="btn-add-study-material"
              type="button"
              onClick={() => {
                sound.playClick();
                setUploadError('');
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة كتاب / ملف</span>
            </button>

            {activeMaterial && (
              <button
                id="btn-book-maximize-fullscreen"
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsBookFullscreen(true);
                  tryEnterFullscreen(document.documentElement);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-sm active:scale-95 transition-all"
              >
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span>تكبير الشاشة</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {saveStatus === 'saving' && (
              <span className="text-xs font-bold text-amber-700">جاري حفظ الكتابة...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ ما كُتب</span>
              </span>
            )}

            {activeMaterial && (
              <button
                type="button"
                onClick={handleToolbarDownloadPage}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-xs active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>حفظ الصفحة كصورة</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Saved Materials Library Strip (visible when not full-screen) */}
      {!inBookFullscreen && materials.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-2.5 mb-4 flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 px-2 text-xs font-black text-slate-500 shrink-0">
            <BookOpen className="w-4 h-4 text-sky-600" />
            <span>الكتب والملفات ({materials.length}):</span>
          </div>
          {materials.map((mat) => {
            const isSelected = activeMaterial?.id === mat.id;
            return (
              <div
                key={mat.id}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black shrink-0 border transition-all ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    if (!isSelected) {
                      onSelectMaterial(mat.id);
                    }
                    setIsBookFullscreen(true);
                    tryEnterFullscreen(document.documentElement);
                  }}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="max-w-[160px] truncate">{mat.title}</span>
                </button>
                {confirmDeleteId === mat.id ? (
                  <span className="flex items-center gap-1 mr-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px]"
                    >
                      حذف
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]"
                    >
                      إلغاء
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(mat.id)}
                    title="حذف الملف"
                    className={`p-0.5 rounded hover:bg-red-500/20 ${
                      isSelected ? 'text-sky-100 hover:text-white' : 'text-slate-400 hover:text-red-600'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!activeMaterial ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-sky-200 p-10 sm:p-16 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 border border-sky-200">
            <BookOpen className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">
            قسم المواد الدراسية والكتب التفاعلية
          </h3>
          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto mb-6">
            ارفع كتاب المدرسة أو أي ملف PDF أو صورة أو ضع رابطاً للكتابة والتأشير بالليزر والتظليل مباشرة مع التمرير السلس للأسفل وحفظ كل ما تكتبه تلقائياً.
          </p>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-base shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>رفع ملف أو إضافة رابط الآن</span>
          </button>
        </div>
      ) : (
        <>
          {/* FLOATING TRANSLUCENT TOP TOOLBAR (in Fullscreen) OR WINDOWED CARD TOOLBAR */}
          {inBookFullscreen ? (
            <div className="fixed top-2 inset-x-0 z-40 px-2 sm:px-4 flex flex-col items-center pointer-events-none">
              <div
                className={`pointer-events-auto max-w-full rounded-2xl border border-white/25 px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-all duration-200 ${
                  colorPickerTool || confirmClearPage
                    ? 'bg-slate-950/85'
                    : 'bg-slate-950/35 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {/* Exit to Platform */}
                  <button
                    id="btn-book-fs-exit"
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      tryExitFullscreen();
                      onBack();
                    }}
                    title="العودة للمنصة"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/85 hover:bg-rose-600 text-white font-black text-xs shadow-xs active:scale-95 transition-all whitespace-nowrap shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>إنهاء</span>
                  </button>

                  {/* Minimize Screen Button */}
                  <button
                    id="btn-book-minimize-fullscreen"
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsBookFullscreen(false);
                      tryExitFullscreen();
                    }}
                    title="تصغير الشاشة والعودة لإطار الكتاب"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/50 hover:bg-slate-900/85 text-white border border-white/25 font-black text-xs transition-all whitespace-nowrap shrink-0"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>تصغير الشاشة</span>
                  </button>

                  {/* Switch to Whiteboard */}
                  <button
                    id="btn-book-fs-whiteboard"
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      tryExitFullscreen();
                      onSwitchToWhiteboard();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/85 hover:bg-indigo-600 text-white border border-white/20 font-black text-xs transition-all whitespace-nowrap shrink-0"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>السبورة</span>
                  </button>

                  {/* Add Book/File */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setUploadError('');
                      setShowAddModal(true);
                    }}
                    title="إضافة كتاب / ملف"
                    className="p-1.5 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-slate-950 border border-amber-300 font-black text-xs transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* 3 Pens */}
                  {penTools.map((pen) => {
                    const isSelected = activeTool === pen.id;
                    const settings = toolSettings[pen.id];
                    return (
                      <button
                        key={pen.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setActiveTool(pen.id);
                        }}
                        className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl border font-black text-xs transition-all whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-white/95 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-900/35 hover:bg-slate-900/75 text-white border-white/20'
                        }`}
                      >
                        <PenTool
                          className="w-3.5 h-3.5"
                          style={{ color: settings.color }}
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
                          style={{ backgroundColor: settings.color }}
                        />
                      </button>
                    );
                  })}

                  {/* Highlighter */}
                  <button
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
                        setColorPickerTool(
                          colorPickerTool === 'highlighter' ? null : 'highlighter'
                        );
                      }}
                      title="تغيير لون المظلل"
                      className="w-3 h-3 rounded-full border border-slate-900 cursor-pointer"
                      style={{ backgroundColor: toolSettings.highlighter.color }}
                    />
                  </button>

                  {/* Laser Pointer */}
                  <button
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
                      title="تغيير لون المؤشر"
                      className="w-3 h-3 rounded-full border border-white cursor-pointer"
                      style={{ backgroundColor: toolSettings.laser.color }}
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

                  {/* Hand / Scroll */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setActiveTool('hand');
                      setColorPickerTool(null);
                    }}
                    title="تحريك وتمرير الصفحات باللمس"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-black text-xs transition-all whitespace-nowrap shrink-0 ${
                      activeTool === 'hand'
                        ? 'bg-sky-500/95 text-white border-sky-200 shadow-sm'
                        : 'bg-slate-900/35 hover:bg-slate-900/75 text-sky-100 border-white/20'
                    }`}
                  >
                    <Hand className="w-3.5 h-3.5" />
                    <span>تمرير</span>
                  </button>

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

                  {isDrawTool && (
                    <div className="hidden lg:flex items-center gap-0.5 bg-slate-900/40 px-1.5 py-1 rounded-xl border border-white/15">
                      {activePresets.map((preset) => {
                        const isSizeActive = Math.abs(activeSettings.size - preset.size) <= 1;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              updateToolSize(activeTool, preset.size);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all ${
                              isSizeActive
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
                    onClick={handleToolbarUndo}
                    disabled={!canUndo}
                    title="تراجع"
                    className="p-1.5 rounded-xl bg-slate-900/35 hover:bg-slate-900/75 text-white disabled:opacity-35 border border-white/20"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToolbarRedo}
                    disabled={!canRedo}
                    title="إعادة"
                    className="p-1.5 rounded-xl bg-slate-900/35 hover:bg-slate-900/75 text-white disabled:opacity-35 border border-white/20"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>

                  {confirmClearPage ? (
                    <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-300/40 px-2 py-1 rounded-xl">
                      <button
                        type="button"
                        onClick={handleToolbarClearPage}
                        className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-black"
                      >
                        مسح
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearPage(false)}
                        className="px-2 py-0.5 bg-slate-700 text-white rounded text-[11px] font-bold"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearPage(true)}
                      title="مسح الكتابة عن الصفحة الحالية"
                      className="p-1.5 rounded-xl bg-rose-900/45 hover:bg-rose-700/85 text-rose-100 border border-rose-300/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Page Navigation with Editable Smooth Page Jump */}
                  {totalPages > 1 && (
                    <form
                      onSubmit={commitPageInput}
                      className="flex items-center gap-1 bg-slate-900/45 px-2 py-1 rounded-xl border border-white/20 text-white"
                    >
                      <button
                        type="button"
                        onClick={() => scrollToPdfPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="p-0.5 rounded hover:bg-white/15 disabled:opacity-35"
                        title="الصفحة السابقة"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <input
                        id="input-pdf-page-fs"
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        aria-label="رقم الصفحة"
                        title="اكتب رقم الصفحة للانتقال إليها بسلاسة"
                        value={pageInputStr}
                        onFocus={(e) => {
                          isEditingPageRef.current = true;
                          e.currentTarget.select();
                        }}
                        onBlur={() => {
                          isEditingPageRef.current = false;
                          commitPageInput();
                        }}
                        onChange={(e) => handlePageInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.stopPropagation();
                            setPageInputStr(String(currentPage));
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-11 px-1 py-0.5 rounded-lg bg-white/15 focus:bg-white focus:text-slate-900 border border-white/25 text-center text-[11px] font-black tabular-nums text-white outline-hidden transition-colors"
                      />
                      <span className="text-[11px] font-black tabular-nums px-0.5 text-white/85 whitespace-nowrap">
                        / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => scrollToPdfPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="p-0.5 rounded hover:bg-white/15 disabled:opacity-35"
                        title="الصفحة التالية"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}

                  {/* Zoom */}
                  <div className="flex items-center gap-1 bg-slate-900/40 px-1.5 py-1 rounded-xl border border-white/15 text-white">
                    <button
                      type="button"
                      onClick={() =>
                        setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))
                      }
                      className="p-0.5 rounded hover:bg-white/15"
                      title="تصغير الصفحة"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-black tabular-nums w-9 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))
                      }
                      className="p-0.5 rounded hover:bg-white/15"
                      title="تكبير الصفحة"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Download Page */}
                  <button
                    type="button"
                    onClick={handleToolbarDownloadPage}
                    title="حفظ الصفحة كصورة"
                    className="p-1.5 rounded-xl bg-emerald-600/85 hover:bg-emerald-600 text-white border border-white/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {saveStatus === 'saving' && (
                    <span className="text-[11px] font-bold text-amber-300 px-1">جاري الحفظ...</span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-emerald-300 px-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تم الحفظ</span>
                    </span>
                  )}
                </div>

                {/* Color Picker Popout inside Translucent Bar */}
                {colorPickerTool && (
                  <div className="mt-2 pt-2 border-t border-white/20 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white">اختر اللون:</span>
                      {QUICK_PALETTE.map((hex) => {
                        const selected =
                          toolSettings[colorPickerTool].color.toUpperCase() === hex;
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
          ) : (
            /* WINDOWED ANNOTATION & SCROLL TOOLBAR */
            <div className="relative z-20 bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-3 mb-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Pens, Highlighter, Laser, Eraser, Hand Scroll */}
              <div className="flex flex-wrap items-center gap-1.5">
                {penTools.map((pen) => {
                  const isSelected = activeTool === pen.id;
                  const settings = toolSettings[pen.id];
                  return (
                    <button
                      key={pen.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setActiveTool(pen.id);
                      }}
                      className={`flex items-center gap-1.5 pl-2 pr-2.5 py-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <PenTool
                        className="w-4 h-4"
                        style={{ color: isSelected ? '#FBBF24' : settings.color }}
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
                        className="w-4 h-4 rounded-full border-2 border-white shadow-xs cursor-pointer"
                        style={{ backgroundColor: settings.color }}
                      />
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveTool('highlighter');
                  }}
                  className={`flex items-center gap-1.5 pl-2 pr-2.5 py-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                    activeTool === 'highlighter'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-amber-50/70 hover:bg-amber-100 text-amber-950 border-amber-200'
                  }`}
                >
                  <Highlighter className="w-4 h-4" />
                  <span>تظليل</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      setActiveTool('highlighter');
                      setColorPickerTool(
                        colorPickerTool === 'highlighter' ? null : 'highlighter'
                      );
                    }}
                    title="تغيير لون المظلل"
                    className="w-4 h-4 rounded-full border-2 border-white shadow-xs cursor-pointer"
                    style={{ backgroundColor: toolSettings.highlighter.color }}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveTool('laser');
                  }}
                  className={`flex items-center gap-1.5 pl-2 pr-2.5 py-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                    activeTool === 'laser'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                      : 'bg-rose-50/80 hover:bg-rose-100 text-rose-900 border-rose-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>مؤشر ليزر</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      setActiveTool('laser');
                      setColorPickerTool(colorPickerTool === 'laser' ? null : 'laser');
                    }}
                    title="تغيير لون المؤشر"
                    className="w-4 h-4 rounded-full border-2 border-white shadow-xs cursor-pointer"
                    style={{ backgroundColor: toolSettings.laser.color }}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveTool('eraser');
                    setColorPickerTool(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                    activeTool === 'eraser'
                      ? 'bg-slate-800 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  <span>مساحة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveTool('hand');
                    setColorPickerTool(null);
                  }}
                  title="تحريك وتمرير الصفحات باللمس"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                    activeTool === 'hand'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                      : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  <span>تصفح وتمرير</span>
                </button>

                {isDrawTool && activeTool !== 'eraser' && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setColorPickerTool(colorPickerTool === activeTool ? null : activeTool);
                    }}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs active:scale-95 transition-all"
                  >
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <span>اللون</span>
                  </button>
                )}
              </div>

              {/* Undo / Redo / Clear / Size */}
              <div className="flex flex-wrap items-center gap-2">
                {isDrawTool && (
                  <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    {activePresets.map((preset) => {
                      const isSizeActive = Math.abs(activeSettings.size - preset.size) <= 1;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            updateToolSize(activeTool, preset.size);
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSizeActive
                              ? 'bg-slate-900 text-white'
                              : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                    <input
                      type="range"
                      min={activeRange.min}
                      max={activeRange.max}
                      step={0.5}
                      value={activeSettings.size}
                      onChange={(e) => updateToolSize(activeTool, Number(e.target.value))}
                      className="w-16 sm:w-20 accent-orange-500 cursor-pointer mr-1"
                      aria-label="حجم القلم"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleToolbarUndo}
                  disabled={!canUndo}
                  title="تراجع"
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToolbarRedo}
                  disabled={!canRedo}
                  title="إعادة"
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                {confirmClearPage ? (
                  <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded-xl">
                    <button
                      type="button"
                      onClick={handleToolbarClearPage}
                      className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-black"
                    >
                      مسح الصفحة
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearPage(false)}
                      className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-bold"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearPage(true)}
                    title="مسح الكتابة عن الصفحة الحالية"
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Color Picker Popout */}
            {colorPickerTool && (
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-700">اختر اللون:</span>
                  {QUICK_PALETTE.map((hex) => {
                    const selected =
                      toolSettings[colorPickerTool].color.toUpperCase() === hex;
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
                            ? 'ring-2 ring-orange-500 border-slate-900 scale-110'
                            : 'border-slate-300'
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
                  <label className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-300 cursor-pointer text-xs font-bold">
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
                  className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-black"
                >
                  تم
                </button>
              </div>
            )}

            {/* Page Indicator, Quick Jump & Zoom Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  {activeMaterial.title}
                </span>
                {activeMaterial.fileUrl && (
                  <a
                    href={activeMaterial.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح الرابط</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {totalPages > 1 && (
                  <form
                    onSubmit={commitPageInput}
                    className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => scrollToPdfPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-40"
                      title="التمرير للأعلى (الصفحة السابقة)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black text-slate-600">صفحة</span>
                    <input
                      id="input-pdf-page-windowed"
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      aria-label="رقم الصفحة"
                      title="اكتب رقم الصفحة للانتقال إليها بسلاسة"
                      value={pageInputStr}
                      onFocus={(e) => {
                        isEditingPageRef.current = true;
                        e.currentTarget.select();
                      }}
                      onBlur={() => {
                        isEditingPageRef.current = false;
                        commitPageInput();
                      }}
                      onChange={(e) => handlePageInputChange(e.target.value)}
                      className="w-12 px-1.5 py-0.5 rounded-lg bg-white border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-center text-xs font-black text-slate-900 tabular-nums outline-hidden"
                    />
                    <span className="text-xs font-black text-slate-700 px-0.5 tabular-nums">
                      من {totalPages}
                    </span>
                    <button
                      type="submit"
                      className="px-2 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black transition-colors"
                    >
                      انتقال
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToPdfPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-40"
                      title="التمرير للأسفل (الصفحة التالية)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </form>
                )}

                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))
                    }
                    className="p-1 rounded-lg hover:bg-slate-200"
                    title="تصغير"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-slate-700 w-11 text-center tabular-nums">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))
                    }
                    className="p-1 rounded-lg hover:bg-slate-200"
                    title="تكبير"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* VERTICAL SCROLLABLE BOOK READER & ANNOTATIONS VIEWPORT */}
          <div
            ref={scrollContainerRef}
            className={
              inBookFullscreen
                ? 'flex-1 w-full h-full overflow-y-auto overflow-x-auto bg-slate-900 pt-20 pb-10 px-2 sm:px-6'
                : 'bg-slate-200/80 rounded-3xl p-3 sm:p-6 border border-slate-300 shadow-inner overflow-y-auto overflow-x-auto max-h-[78vh]'
            }
          >
            {renderMode === 'loading' ? (
              <div
                className={`py-24 text-center font-black ${
                  inBookFullscreen ? 'text-white/90' : 'text-slate-600'
                }`}
              >
                جاري تحميل صفحات الكتاب وتجهيز أدوات الكتابة...
              </div>
            ) : renderMode === 'error' ? (
              <div className="py-16 px-6 max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-800 font-black mb-3">{viewerErrorMsg}</p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-black text-sm"
                >
                  إضافة ملف أو رابط آخر
                </button>
              </div>
            ) : renderMode === 'pdf' && loadedPdf ? (
              <div className="flex flex-col items-center gap-6 pb-8">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <PdfPageCanvasView
                    key={`${activeMaterial.id}-p-${pageNum}`}
                    pdf={loadedPdf}
                    pageNumber={pageNum}
                    bookTitle={activeMaterial.title}
                    zoom={zoom}
                    scrollRootRef={scrollContainerRef}
                    activeTool={activeTool}
                    toolSettings={toolSettings}
                    initialAnnotationDataUrl={annotationsByPage[pageNum]}
                    onSaveAnnotation={handleSavePageAnnotation}
                    onActivatePage={handleActivatePdfPage}
                    onVisiblePageChange={handleVisiblePdfPageChange}
                    registerPageElement={registerPageElement}
                    onCloseColorPicker={() => setColorPickerTool(null)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  ref={stageRef}
                  style={{
                    width: `${pageDims.width}px`,
                    height: `${pageDims.height}px`,
                    isolation: 'isolate',
                  }}
                  className={`relative bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden shrink-0 select-none ${
                    activeTool === 'hand'
                      ? 'cursor-auto'
                      : activeTool === 'eraser'
                      ? 'cursor-none'
                      : 'cursor-crosshair'
                  }`}
                >
                  {renderMode === 'image' && imageSrc && (
                    <img
                      src={imageSrc}
                      alt={activeMaterial.title}
                      onLoad={handleImageLoaded}
                      className="absolute inset-0 w-full h-full object-contain bg-white z-0 pointer-events-none"
                    />
                  )}

                  {renderMode === 'iframe' && iframeSrc && (
                    <iframe
                      src={iframeSrc}
                      title={activeMaterial.title}
                      className="absolute inset-0 w-full h-full z-0 bg-white border-0"
                    />
                  )}

                  <canvas
                    ref={drawCanvasRef}
                    onPointerDown={handleSinglePointerDown}
                    onPointerMove={handleSinglePointerMove}
                    onPointerUp={handleSinglePointerUp}
                    onPointerCancel={handleSinglePointerUp}
                    onPointerLeave={handleSinglePointerLeave}
                    style={{
                      touchAction: activeTool === 'hand' ? 'pan-y' : 'none',
                      backgroundColor: 'transparent',
                      pointerEvents: activeTool === 'hand' ? 'none' : 'auto',
                    }}
                    className="absolute inset-0 w-full h-full z-10"
                  />

                  <canvas
                    ref={laserCanvasRef}
                    className="absolute inset-0 w-full h-full z-20 pointer-events-none"
                  />

                  <div
                    ref={eraserCursorRef}
                    className="pointer-events-none absolute top-0 left-0 z-30 rounded-full border-2 border-slate-700 bg-white/40 shadow-sm opacity-0"
                    style={{ willChange: 'transform' }}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ADD STUDY MATERIAL MODAL (Device Upload OR File Link) */}
      {showAddModal && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">إضافة مادة دراسية</h3>
                  <p className="text-xs font-bold text-slate-500">
                    ارفع كتاباً / PDF / صورة من جهازك أو ضع رابط الملف
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowAddModal(false);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAddMode('device');
                  setUploadError('');
                }}
                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                  addMode === 'device' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Upload className="w-4 h-4 text-sky-600" />
                <span>رفع من الجهاز</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAddMode('url');
                  setUploadError('');
                }}
                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                  addMode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Link2 className="w-4 h-4 text-orange-600" />
                <span>رابط الملف</span>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                اسم الكتاب أو الدرس (اختياري)
              </label>
              <input
                type="text"
                maxLength={140}
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="مثال: كتاب لغتي الصف الأول..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white focus:outline-hidden text-sm font-bold text-slate-900"
              />
            </div>

            {addMode === 'device' ? (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/70 hover:bg-sky-50 cursor-pointer transition-all text-center">
                  <Upload className="w-8 h-8 text-sky-600" />
                  <span className="text-sm font-black text-sky-950">
                    {isUploading
                      ? 'جاري تجهيز الملف...'
                      : 'اضغط لاختيار ملف PDF أو صورة من جهازك'}
                  </span>
                  <span className="text-xs font-medium text-sky-700">
                    يدعم ملفات PDF متعددة الصفحات والصور بجودة عالية
                  </span>
                  <input
                    id="input-upload-study-material"
                    type="file"
                    accept=".pdf,application/pdf,image/*"
                    disabled={isUploading}
                    onChange={handleDeviceFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <form onSubmit={handleAddByUrl} className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    رابط الملف (PDF أو صورة أو رابط Google Drive)
                  </label>
                  <input
                    id="input-url-study-material"
                    type="url"
                    dir="ltr"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/book.pdf"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white focus:outline-hidden text-sm font-medium text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-md active:scale-95 transition-all"
                >
                  {isUploading ? 'جاري الإضافة...' : 'فتح الملف والكتابة عليه'}
                </button>
              </form>
            )}

            {uploadError && (
              <p className="text-xs font-black text-red-600 mt-3">{uploadError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
