import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { sound } from '../utils/audio';

export type StudioToolId =
  | 'pen1'
  | 'pen2'
  | 'pen3'
  | 'highlighter'
  | 'laser'
  | 'eraser'
  | 'hand';

export interface StudioToolSettings {
  color: string;
  size: number;
}

export interface PageActionHandles {
  undo: () => void;
  redo: () => void;
  clearPage: () => void;
  downloadPage: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface LaserPoint {
  x: number;
  y: number;
  time: number;
  isStart?: boolean;
}

interface PdfPageCanvasViewProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  bookTitle: string;
  zoom: number;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  activeTool: StudioToolId;
  toolSettings: Record<Exclude<StudioToolId, 'hand'>, StudioToolSettings>;
  initialAnnotationDataUrl?: string;
  onSaveAnnotation: (pageNumber: number, dataUrl: string) => void;
  onActivatePage: (pageNumber: number, handles: PageActionHandles) => void;
  onVisiblePageChange?: (pageNumber: number) => void;
  registerPageElement: (pageNumber: number, el: HTMLDivElement | null) => void;
  onCloseColorPicker?: () => void;
}

const LASER_LIFETIME_MS = 1200;

export const PdfPageCanvasView: React.FC<PdfPageCanvasViewProps> = ({
  pdf,
  pageNumber,
  bookTitle,
  zoom,
  scrollRootRef,
  activeTool,
  toolSettings,
  initialAnnotationDataUrl,
  onSaveAnnotation,
  onActivatePage,
  onVisiblePageChange,
  registerPageElement,
  onCloseColorPicker,
}) => {
  const pageBoxRef = useRef<HTMLDivElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const eraserCursorRef = useRef<HTMLDivElement>(null);
  const pageImgRef = useRef<HTMLImageElement>(null);

  const [isNearViewport, setIsNearViewport] = useState(pageNumber <= 2);
  const [renderedPageUrl, setRenderedPageUrl] = useState<string>('');
  const [pageDims, setPageDims] = useState<{ width: number; height: number }>({
    width: Math.round(800 * zoom),
    height: Math.round(1080 * zoom),
  });
  const [isRendering, setIsRendering] = useState(true);

  const renderedUrlRef = useRef<string>('');
  const renderSeqRef = useRef<number>(0);
  const dprRef = useRef<number>(1);
  const canvasRectRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

  const activeToolRef = useRef(activeTool);
  const toolSettingsRef = useRef(toolSettings);
  activeToolRef.current = activeTool;
  toolSettingsRef.current = toolSettings;

  // Preserve latest ink locally across zoom changes
  const latestInkRef = useRef<string | undefined>(initialAnnotationDataUrl);
  useEffect(() => {
    if (initialAnnotationDataUrl && !latestInkRef.current) {
      latestInkRef.current = initialAnnotationDataUrl;
    }
  }, [initialAnnotationDataUrl]);

  // Undo/Redo snapshots
  const historyRef = useRef<HTMLCanvasElement[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Pointer & Laser refs
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const midPointRef = useRef<{ x: number; y: number } | null>(null);
  const laserTrailRef = useRef<LaserPoint[]>([]);
  const laserPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const exportCompactDataUrl = useCallback((canvas: HTMLCanvasElement): string => {
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

  const persistInk = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const url = exportCompactDataUrl(canvas);
    latestInkRef.current = url;
    onSaveAnnotation(pageNumber, url);
  }, [exportCompactDataUrl, onSaveAnnotation, pageNumber]);

  const notifyHandles = useCallback(() => {
    onActivatePage(pageNumber, {
      undo: () => {
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
        persistInk();
        notifyHandles();
      },
      redo: () => {
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
        persistInk();
        notifyHandles();
      },
      clearPage: () => {
        sound.playSnap();
        const canvas = drawCanvasRef.current;
        const ctx = drawCtxRef.current;
        if (!canvas || !ctx) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
        pushSnapshot(true);
      },
      downloadPage: () => {
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
        if (pageImgRef.current && pageImgRef.current.complete) {
          ctx.drawImage(pageImgRef.current, 0, 0, exportCanvas.width, exportCanvas.height);
        }
        ctx.drawImage(drawCanvas, 0, 0);
        const link = document.createElement('a');
        link.download = `${bookTitle}_صفحة_${pageNumber}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
      },
      canUndo: historyIndexRef.current > 0,
      canRedo:
        historyIndexRef.current >= 0 &&
        historyIndexRef.current < historyRef.current.length - 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookTitle, onActivatePage, pageNumber, persistInk]);

  const pushSnapshot = useCallback(
    (shouldPersist = true) => {
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

      if (shouldPersist) {
        persistInk();
      }
      notifyHandles();
    },
    [notifyHandles, persistInk]
  );

  // Lazy visibility + active scroll tracking via IntersectionObserver
  useEffect(() => {
    const el = pageBoxRef.current;
    if (!el) return;

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsNearViewport(true);
          }
        }
      },
      {
        root: scrollRootRef.current,
        rootMargin: '1100px 0px',
      }
    );
    preloadObserver.observe(el);

    const visibleObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            onVisiblePageChange?.(pageNumber);
          }
        }
      },
      {
        root: scrollRootRef.current,
        threshold: [0.35, 0.6],
      }
    );
    visibleObserver.observe(el);

    return () => {
      preloadObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, [pageNumber, scrollRootRef, onVisiblePageChange]);

  // Render PDF page cleanly onto isolated offscreen canvas (exact 1:1 pixel viewport, zero transform distortion)
  useEffect(() => {
    if (!isNearViewport) return;

    let cancelled = false;
    const mySeq = ++renderSeqRef.current;
    let activeTask: pdfjsLib.RenderTask | null = null;

    const renderPage = async () => {
      setIsRendering(true);
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled || renderSeqRef.current !== mySeq) return;

        // Calculate clean fit scale based on container width (~820px max) * zoom
        const unscaledViewport = page.getViewport({ scale: 1 });
        const containerBaseWidth = Math.min(
          860,
          Math.max(320, (scrollRootRef.current?.clientWidth || 880) - 48)
        );
        const fitScale = (containerBaseWidth / unscaledViewport.width) * zoom;
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);

        // Pass fitScale * outputScale directly into getViewport so pdf.js handles all transforms cleanly
        const renderViewport = page.getViewport({ scale: fitScale * outputScale });
        const pixelW = Math.max(1, Math.floor(renderViewport.width));
        const pixelH = Math.max(1, Math.floor(renderViewport.height));
        const cssW = Math.round(pixelW / outputScale);
        const cssH = Math.round(pixelH / outputScale);

        const offscreen = document.createElement('canvas');
        offscreen.width = pixelW;
        offscreen.height = pixelH;
        const offCtx = offscreen.getContext('2d');
        if (!offCtx) return;

        offCtx.setTransform(1, 0, 0, 1, 0, 0);
        offCtx.fillStyle = '#FFFFFF';
        offCtx.fillRect(0, 0, pixelW, pixelH);

        activeTask = page.render({
          canvasContext: offCtx,
          viewport: renderViewport,
          canvas: offscreen,
        });
        await activeTask.promise;

        if (cancelled || renderSeqRef.current !== mySeq) return;

        const blob = await new Promise<Blob | null>((resolve) =>
          offscreen.toBlob((b) => resolve(b), 'image/png')
        );
        if (!blob || cancelled || renderSeqRef.current !== mySeq) return;

        const nextUrl = URL.createObjectURL(blob);
        if (renderedUrlRef.current) {
          URL.revokeObjectURL(renderedUrlRef.current);
        }
        renderedUrlRef.current = nextUrl;

        setPageDims({ width: cssW, height: cssH });
        setRenderedPageUrl(nextUrl);
        setIsRendering(false);

        // Size & restore overlay drawing canvases in exact sync
        requestAnimationFrame(() => {
          if (cancelled || renderSeqRef.current !== mySeq) return;
          const drawCanvas = drawCanvasRef.current;
          const laserCanvas = laserCanvasRef.current;
          if (!drawCanvas || !laserCanvas) return;

          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          dprRef.current = dpr;
          drawCanvas.width = Math.max(1, Math.floor(cssW * dpr));
          drawCanvas.height = Math.max(1, Math.floor(cssH * dpr));
          laserCanvas.width = Math.max(1, Math.floor(cssW * dpr));
          laserCanvas.height = Math.max(1, Math.floor(cssH * dpr));

          const dCtx = drawCanvas.getContext('2d', { alpha: true });
          const lCtx = laserCanvas.getContext('2d', { alpha: true });
          drawCtxRef.current = dCtx;
          laserCtxRef.current = lCtx;
          if (lCtx) lCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

          historyRef.current = [];
          historyIndexRef.current = -1;

          const inkToRestore = latestInkRef.current || initialAnnotationDataUrl;
          if (dCtx) {
            dCtx.setTransform(1, 0, 0, 1, 0, 0);
            dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            if (inkToRestore) {
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
                dCtx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
                pushSnapshot(false);
              };
              img.src = inkToRestore;
            } else {
              dCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
              pushSnapshot(false);
            }
          }
        });
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'RenderingCancelledException'
        ) {
          return;
        }
        if (!cancelled) {
          console.error(`Error rendering PDF page ${pageNumber}:`, err);
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (activeTask) {
        try {
          activeTask.cancel();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearViewport, pdf, pageNumber, zoom]);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (renderedUrlRef.current) {
        URL.revokeObjectURL(renderedUrlRef.current);
        renderedUrlRef.current = '';
      }
    };
  }, []);

  // On-demand Laser animation loop
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
    tool: Exclude<StudioToolId, 'hand'>
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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const tool = activeToolRef.current;
    if (tool === 'hand') return;

    e.currentTarget.setPointerCapture(e.pointerId);
    onCloseColorPicker?.();
    notifyHandles();

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

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
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
    if (eraserCursorRef.current) {
      eraserCursorRef.current.style.opacity = '0';
    }
    if (isDrawingRef.current) {
      handlePointerUp();
    }
  };

  return (
    <div
      ref={(el) => {
        pageBoxRef.current = el;
        registerPageElement(pageNumber, el);
      }}
      className="flex flex-col items-center shrink-0"
    >
      <div className="mb-1.5 text-xs font-black text-slate-500">
        صفحة {pageNumber}
      </div>

      <div
        style={{
          width: `${pageDims.width}px`,
          height: `${pageDims.height}px`,
          isolation: 'isolate',
        }}
        className={`relative bg-white rounded-xl shadow-xl border border-slate-300 overflow-hidden select-none ${
          activeTool === 'hand'
            ? 'cursor-grab'
            : activeTool === 'eraser'
            ? 'cursor-none'
            : 'cursor-crosshair'
        }`}
      >
        {renderedPageUrl ? (
          <img
            ref={pageImgRef}
            src={renderedPageUrl}
            alt={`${bookTitle} - صفحة ${pageNumber}`}
            draggable={false}
            className="absolute inset-0 w-full h-full object-fill bg-white z-0 pointer-events-none select-none"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white text-slate-400 text-sm font-bold z-0">
            {isRendering ? `جاري تحميل صفحة ${pageNumber}...` : `صفحة ${pageNumber}`}
          </div>
        )}

        <canvas
          ref={drawCanvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
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
  );
};
