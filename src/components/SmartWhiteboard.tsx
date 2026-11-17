import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  PenTool,
  Highlighter,
  Eraser,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Palette,
  Grid3X3,
  AlignJustify,
  Square,
  Monitor,
  Check,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface SmartWhiteboardProps {
  onBack: () => void;
}

type ToolId = 'pen1' | 'pen2' | 'pen3' | 'highlighter' | 'laser' | 'eraser';
type BoardSurface = 'white' | 'lined' | 'grid' | 'green';

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

const SIZE_PRESETS: Record<ToolId, { label: string; size: number }[]> = {
  pen1: [
    { label: 'رفيع', size: 3 },
    { label: 'متوسط', size: 6 },
    { label: 'كبير', size: 11 },
    { label: 'عريض', size: 18 },
  ],
  pen2: [
    { label: 'رفيع', size: 3 },
    { label: 'متوسط', size: 6 },
    { label: 'كبير', size: 11 },
    { label: 'عريض', size: 18 },
  ],
  pen3: [
    { label: 'رفيع', size: 3 },
    { label: 'متوسط', size: 6 },
    { label: 'كبير', size: 11 },
    { label: 'عريض', size: 18 },
  ],
  highlighter: [
    { label: 'رفيع', size: 14 },
    { label: 'متوسط', size: 22 },
    { label: 'كبير', size: 34 },
    { label: 'عريض', size: 48 },
  ],
  laser: [
    { label: 'صغير', size: 4 },
    { label: 'متوسط', size: 7 },
    { label: 'كبير', size: 11 },
    { label: 'ضخم', size: 16 },
  ],
  eraser: [
    { label: 'صغير', size: 14 },
    { label: 'متوسط', size: 26 },
    { label: 'كبير', size: 44 },
    { label: 'عريض', size: 68 },
  ],
};

const SIZE_RANGES: Record<ToolId, { min: number; max: number }> = {
  pen1: { min: 2, max: 28 },
  pen2: { min: 2, max: 28 },
  pen3: { min: 2, max: 28 },
  highlighter: { min: 10, max: 60 },
  laser: { min: 3, max: 22 },
  eraser: { min: 10, max: 90 },
};

const LASER_LIFETIME_MS = 1200;

export const SmartWhiteboard: React.FC<SmartWhiteboardProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const eraserCursorRef = useRef<HTMLDivElement>(null);
  const dprRef = useRef<number>(1);
  const canvasRectRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

  const [activeTool, setActiveTool] = useState<ToolId>('pen1');
  const [boardSurface, setBoardSurface] = useState<BoardSurface>('white');
  const [colorPickerTool, setColorPickerTool] = useState<ToolId | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const [toolSettings, setToolSettings] = useState<Record<ToolId, ToolSettings>>({
    pen1: { color: '#0F172A', size: 5 },
    pen2: { color: '#2563EB', size: 5 },
    pen3: { color: '#DC2626', size: 5 },
    highlighter: { color: '#FACC15', size: 24 },
    laser: { color: '#EF4444', size: 7 },
    eraser: { color: '#FFFFFF', size: 32 },
  });

  const activeToolRef = useRef(activeTool);
  const toolSettingsRef = useRef(toolSettings);
  activeToolRef.current = activeTool;
  toolSettingsRef.current = toolSettings;

  // GPU-accelerated offscreen canvas snapshots (zero CPU getImageData stalls)
  const historyRef = useRef<HTMLCanvasElement[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Fast pointer interaction refs
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const midPointRef = useRef<{ x: number; y: number } | null>(null);

  // On-demand laser loop refs (zero overhead when idle or using pens/eraser)
  const laserTrailRef = useRef<LaserPoint[]>([]);
  const laserPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(
      historyIndexRef.current >= 0 &&
        historyIndexRef.current < historyRef.current.length - 1
    );
  }, []);

  const pushSnapshot = useCallback(() => {
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
    if (nextHistory.length > 25) {
      nextHistory.shift();
    }
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  // Setup canvases & responsive ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const drawCanvas = drawCanvasRef.current;
    const laserCanvas = laserCanvasRef.current;
    if (!container || !drawCanvas || !laserCanvas) return;

    drawCtxRef.current = drawCanvas.getContext('2d', { desynchronized: true });
    laserCtxRef.current = laserCanvas.getContext('2d', { desynchronized: true });

    const resizeCanvases = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      canvasRectRef.current = { left: rect.left, top: rect.top };

      // Cap DPR at 1.5 for ultra-fast crisp rendering on smartboards
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      dprRef.current = dpr;
      const targetW = Math.floor(rect.width * dpr);
      const targetH = Math.floor(rect.height * dpr);

      if (drawCanvas.width === targetW && drawCanvas.height === targetH) return;

      let tempCanvas: HTMLCanvasElement | null = null;
      if (drawCanvas.width > 0 && drawCanvas.height > 0) {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = drawCanvas.width;
        tempCanvas.height = drawCanvas.height;
        tempCanvas.getContext('2d')?.drawImage(drawCanvas, 0, 0);
      }

      drawCanvas.width = targetW;
      drawCanvas.height = targetH;
      laserCanvas.width = targetW;
      laserCanvas.height = targetH;

      const dCtx = drawCtxRef.current;
      if (dCtx) {
        dCtx.setTransform(1, 0, 0, 1, 0, 0);
        if (tempCanvas) {
          dCtx.drawImage(tempCanvas, 0, 0, targetW, targetH);
        }
        dCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const lCtx = laserCtxRef.current;
      if (lCtx) {
        lCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      if (historyRef.current.length === 0) {
        pushSnapshot();
      }
    };

    resizeCanvases();
    const observer = new ResizeObserver(resizeCanvases);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pushSnapshot]);

  // On-demand Laser animation loop — stops automatically when nothing is visible
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
        ctx.shadowBlur = laserSize * 2.6;
        ctx.globalAlpha = 0.85;
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

  const applyActiveContextStyle = (ctx: CanvasRenderingContext2D, tool: ToolId) => {
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
    e.currentTarget.setPointerCapture(e.pointerId);
    if (colorPickerTool !== null) setColorPickerTool(null);

    const rect = e.currentTarget.getBoundingClientRect();
    canvasRectRef.current = { left: rect.left, top: rect.top };
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    isDrawingRef.current = true;
    lastPointRef.current = pt;
    midPointRef.current = pt;

    const tool = activeToolRef.current;
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

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { left, top } = canvasRectRef.current;
    const tool = activeToolRef.current;

    // Direct DOM update for eraser ring (ZERO React re-renders)
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

    // Process coalesced hardware pointer events for ultra-smooth handwriting with zero lag
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

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    midPointRef.current = null;

    if (activeToolRef.current !== 'laser') {
      pushSnapshot();
    }
  };

  const handlePointerLeave = () => {
    laserPointerPosRef.current = null;
    if (eraserCursorRef.current) {
      eraserCursorRef.current.style.opacity = '0';
    }
    if (isDrawingRef.current) {
      handlePointerUp();
    }
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
  };

  const handleClearBoard = () => {
    sound.playSnap();
    const canvas = drawCanvasRef.current;
    const ctx = drawCtxRef.current;
    if (!canvas || !ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    pushSnapshot();
    setConfirmClear(false);
  };

  const handleDownloadBoard = () => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    sound.playSuccess();

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = drawCanvas.width;
    exportCanvas.height = drawCanvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = boardSurface === 'green' ? '#0F3D2E' : '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    if (boardSurface === 'lined') {
      ctx.strokeStyle = '#DBEAFE';
      ctx.lineWidth = 2;
      for (let y = 72; y < exportCanvas.height; y += 72) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(exportCanvas.width, y);
        ctx.stroke();
      }
    } else if (boardSurface === 'grid') {
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      for (let x = 60; x < exportCanvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, exportCanvas.height);
        ctx.stroke();
      }
      for (let y = 60; y < exportCanvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(exportCanvas.width, y);
        ctx.stroke();
      }
    }

    ctx.drawImage(drawCanvas, 0, 0);

    ctx.fillStyle = boardSurface === 'green' ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.45)';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('السبورة الذكية · المعلم وائل حمدي', 32, exportCanvas.height - 24);

    const link = document.createElement('a');
    link.download = `السبورة_الذكية_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const updateToolColor = (tool: ToolId, color: string) => {
    setToolSettings((prev) => ({
      ...prev,
      [tool]: { ...prev[tool], color },
    }));
  };

  const updateToolSize = (tool: ToolId, size: number) => {
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

  const activeSettings = toolSettings[activeTool];
  const activePresets = SIZE_PRESETS[activeTool];
  const activeRange = SIZE_RANGES[activeTool];

  const boardBackgroundStyle: React.CSSProperties =
    boardSurface === 'green'
      ? { backgroundColor: '#0F3D2E' }
      : boardSurface === 'lined'
      ? {
          backgroundColor: '#FFFFFF',
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 43px, #DBEAFE 43px, #DBEAFE 45px)',
        }
      : boardSurface === 'grid'
      ? {
          backgroundColor: '#FFFFFF',
          backgroundImage:
            'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }
      : { backgroundColor: '#FFFFFF' };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-5" dir="rtl">
      {/* Studio Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-whiteboard-back"
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black text-sm border border-slate-200 shadow-xs active:scale-95 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمنصة</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-amber-400 flex items-center justify-center shadow-md">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                السبورة الذكية التفاعلية
              </h2>
              <p className="text-xs font-bold text-orange-600">
                فصل المعلم وائل حمدي · استجابة فورية عالية السرعة
              </p>
            </div>
          </div>
        </div>

        {/* History, Surface & Export Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-xs">
            <button
              onClick={() => {
                sound.playClick();
                setBoardSurface('white');
              }}
              title="سبورة بيضاء"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                boardSurface === 'white' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">سادة</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setBoardSurface('lined');
              }}
              title="سبورة مسطرة"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                boardSurface === 'lined' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مسطّرة</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setBoardSurface('grid');
              }}
              title="شبكة مربعات"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                boardSurface === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">شبكة</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setBoardSurface('green');
              }}
              title="سبورة خضراء"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                boardSurface === 'green' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-3 h-3 rounded-sm bg-emerald-700 border border-emerald-900" />
              <span className="hidden sm:inline">خضراء</span>
            </button>
          </div>

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="تراجع"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 active:scale-95 transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="إعادة"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 active:scale-95 transition-all"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {confirmClear ? (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl">
              <span className="text-xs font-black text-red-700">مسح السبورة؟</span>
              <button
                onClick={handleClearBoard}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black"
              >
                نعم
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs sm:text-sm active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح الكل</span>
            </button>
          )}

          <button
            onClick={handleDownloadBoard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>حفظ السبورة</span>
          </button>
        </div>
      </div>

      {/* TOP DRAWING TOOLBAR (3 Pens + Highlighter + Laser + Eraser + Sizes + Color Customization) */}
      <div className="relative z-20 bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-3 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {penTools.map((pen) => {
              const isSelected = activeTool === pen.id;
              const settings = toolSettings[pen.id];
              return (
                <div key={pen.id} className="relative flex items-center">
                  <button
                    id={`btn-tool-${pen.id}`}
                    onClick={() => {
                      sound.playClick();
                      setActiveTool(pen.id);
                    }}
                    className={`flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
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
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: settings.color }}
                    />
                  </button>
                </div>
              );
            })}

            <div className="w-px h-8 bg-slate-200 hidden sm:block mx-0.5" />

            <button
              id="btn-tool-highlighter"
              onClick={() => {
                sound.playClick();
                setActiveTool('highlighter');
              }}
              className={`flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                activeTool === 'highlighter'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md'
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
                  setColorPickerTool(colorPickerTool === 'highlighter' ? null : 'highlighter');
                }}
                title="تغيير لون المظلل"
                className="w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: toolSettings.highlighter.color }}
              />
            </button>

            <button
              id="btn-tool-laser"
              onClick={() => {
                sound.playClick();
                setActiveTool('laser');
              }}
              className={`flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                activeTool === 'laser'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md'
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
                title="تغيير لون مؤشر الليزر"
                className="w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: toolSettings.laser.color }}
              />
            </button>

            <button
              id="btn-tool-eraser"
              onClick={() => {
                sound.playClick();
                setActiveTool('eraser');
                setColorPickerTool(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                activeTool === 'eraser'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span>مساحة</span>
            </button>

            {activeTool !== 'eraser' && (
              <button
                onClick={() => {
                  sound.playClick();
                  setColorPickerTool(colorPickerTool === activeTool ? null : activeTool);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs active:scale-95 transition-all"
              >
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>تغيير اللون</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex-wrap">
            <span className="text-xs font-black text-slate-600">الحجم:</span>
            <div className="flex items-center gap-1">
              {activePresets.map((preset) => {
                const isSizeActive = Math.abs(activeSettings.size - preset.size) <= 1;
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      sound.playClick();
                      updateToolSize(activeTool, preset.size);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isSizeActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pr-1">
              <input
                type="range"
                min={activeRange.min}
                max={activeRange.max}
                value={activeSettings.size}
                onChange={(e) => updateToolSize(activeTool, Number(e.target.value))}
                className="w-20 sm:w-24 accent-orange-500 cursor-pointer"
                aria-label="حجم الأداة"
              />
              <span className="text-xs font-black text-slate-700 w-9 text-center bg-white border border-slate-200 rounded-md py-0.5">
                {activeSettings.size}
              </span>
            </div>
          </div>
        </div>

        {colorPickerTool && colorPickerTool !== 'eraser' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 p-3 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-700">
                اختر لون{' '}
                {colorPickerTool === 'pen1'
                  ? 'القلم ١'
                  : colorPickerTool === 'pen2'
                  ? 'القلم ٢'
                  : colorPickerTool === 'pen3'
                  ? 'القلم ٣'
                  : colorPickerTool === 'highlighter'
                  ? 'المظلل'
                  : 'مؤشر الليزر'}
                :
              </span>
              {QUICK_PALETTE.map((hex) => {
                const selected = toolSettings[colorPickerTool].color.toUpperCase() === hex;
                return (
                  <button
                    key={hex}
                    onClick={() => {
                      sound.playClick();
                      updateToolColor(colorPickerTool, hex);
                    }}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${
                      selected ? 'ring-2 ring-orange-500 border-slate-900 scale-110' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  >
                    {selected && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          hex === '#FFFFFF' || hex === '#FACC15' ? 'text-slate-900' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}

              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 cursor-pointer hover:bg-slate-100 text-xs font-bold text-slate-700">
                <input
                  type="color"
                  value={toolSettings[colorPickerTool].color}
                  onChange={(e) => updateToolColor(colorPickerTool, e.target.value)}
                  className="w-5 h-5 border-0 bg-transparent cursor-pointer p-0"
                />
                <span>لون مخصص</span>
              </label>
            </div>

            <button
              onClick={() => setColorPickerTool(null)}
              className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-black"
            >
              تم
            </button>
          </div>
        )}
      </div>

      {/* CLASSROOM SMART WHITEBOARD FRAME */}
      <div className="rounded-3xl p-2.5 sm:p-4 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-400 shadow-2xl border-2 border-slate-400/70">
        <div className="flex items-center justify-between px-3 pb-2 text-xs font-black text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span>السبورة الذكية · أبطال الصف الأول</span>
          </div>
          <span className="text-orange-800">بقيادة المعلم وائل حمدي 👨‍🏫</span>
        </div>

        <div
          ref={containerRef}
          style={boardBackgroundStyle}
          className={`relative w-full h-[62vh] min-h-[430px] max-h-[760px] rounded-2xl overflow-hidden border-2 border-slate-400/80 shadow-inner select-none ${
            activeTool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'
          }`}
        >
          <canvas
            ref={drawCanvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            style={{ touchAction: 'none', willChange: 'contents' }}
            className="absolute inset-0 w-full h-full z-10"
          />

          <canvas
            ref={laserCanvasRef}
            className="absolute inset-0 w-full h-full z-20 pointer-events-none"
          />

          {/* Zero-rerender DOM cursor for Eraser */}
          <div
            ref={eraserCursorRef}
            className="pointer-events-none absolute top-0 left-0 z-30 rounded-full border-2 border-slate-700 bg-white/40 shadow-sm opacity-0"
            style={{ willChange: 'transform' }}
          />
        </div>

        {/* Bottom Physical Whiteboard Pen Tray */}
        <div className="mt-2.5 px-4 py-1.5 rounded-xl bg-gradient-to-b from-slate-200 to-slate-300 border border-slate-400/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {penTools.map((pen) => (
              <button
                key={pen.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTool(pen.id);
                }}
                title={`اختيار ${pen.label}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  activeTool === pen.id ? 'bg-white shadow-sm ring-2 ring-amber-500 -translate-y-0.5' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <span
                  className="w-8 h-2.5 rounded-full border border-black/15"
                  style={{ backgroundColor: toolSettings[pen.id].color }}
                />
              </button>
            ))}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTool('highlighter');
              }}
              title="المظلل"
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTool === 'highlighter' ? 'bg-white shadow-sm ring-2 ring-amber-500 -translate-y-0.5' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <span
                className="block w-8 h-3 rounded-sm border border-black/15"
                style={{ backgroundColor: toolSettings.highlighter.color, opacity: 0.75 }}
              />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTool('eraser');
              }}
              title="المساحة"
              className={`px-3 py-1 rounded-lg bg-slate-700 text-white text-[10px] font-black transition-all ${
                activeTool === 'eraser' ? 'ring-2 ring-amber-500 -translate-y-0.5' : 'opacity-80 hover:opacity-100'
              }`}
            >
              مساحة
            </button>
          </div>
          <span className="text-[11px] font-bold text-slate-600">
            اضغط على الدائرة الملونة بجانب أي قلم أو المظلل أو الليزر لتغيير لونه 🎨
          </span>
        </div>
      </div>
    </div>
  );
};
