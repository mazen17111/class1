import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PresentationSlide } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PDFJS_COMMON_OPTIONS = {
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/pdfjs/standard_fonts/',
  wasmUrl: '/pdfjs/wasm/',
  useSystemFonts: true,
};

function compressCanvasToDataUrl(
  canvas: HTMLCanvasElement,
  maxBytes = 240000
): string {
  let out = canvas.toDataURL('image/jpeg', 0.85);
  if (out.length > maxBytes) {
    out = canvas.toDataURL('image/jpeg', 0.68);
  }
  if (out.length > maxBytes) {
    out = canvas.toDataURL('image/jpeg', 0.5);
  }
  return out;
}

function compressBlobToDataUrl(blob: Blob, maxDim = 960): Promise<string> {
  return new Promise((resolve, reject) => {
    const objUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth || maxDim;
        let h = img.naturalHeight || maxDim;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(compressCanvasToDataUrl(canvas, 210000));
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error('Image decode failed'));
    };
    img.src = objUrl;
  });
}

function guessMimeFromExt(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

function resolveRelativeZipPath(baseFile: string, target: string): string {
  const cleanTarget = target.replace(/^\/+/, '');
  if (target.startsWith('/')) return cleanTarget;
  const parts = baseFile.split('/').slice(0, -1);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

function extractParagraphsFromElement(el: Element): string[] {
  const paragraphs: string[] = [];
  const pNodes = Array.from(el.getElementsByTagNameNS('*', 'p'));
  if (pNodes.length === 0) {
    const textNodes = Array.from(el.getElementsByTagNameNS('*', 't'));
    const combined = textNodes.map((t) => t.textContent || '').join('').trim();
    if (combined) paragraphs.push(combined);
    return paragraphs;
  }
  for (const p of pNodes) {
    const tNodes = Array.from(p.getElementsByTagNameNS('*', 't'));
    const line = tNodes.map((t) => t.textContent || '').join('').trim();
    if (line) paragraphs.push(line);
  }
  return paragraphs;
}

export async function importPptxToSlides(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PresentationSlide[]> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const parser = new DOMParser();

  // Determine exact slide order via ppt/presentation.xml + ppt/_rels/presentation.xml.rels
  let orderedSlidePaths: string[] = [];
  const presXmlFile = zip.file('ppt/presentation.xml');
  const presRelsFile = zip.file('ppt/_rels/presentation.xml.rels');

  if (presXmlFile && presRelsFile) {
    try {
      const presXml = parser.parseFromString(
        await presXmlFile.async('text'),
        'application/xml'
      );
      const relsXml = parser.parseFromString(
        await presRelsFile.async('text'),
        'application/xml'
      );

      const relMap = new Map<string, string>();
      const relNodes = Array.from(relsXml.getElementsByTagName('Relationship'));
      for (const rel of relNodes) {
        const id = rel.getAttribute('Id');
        const target = rel.getAttribute('Target');
        if (id && target) {
          relMap.set(id, resolveRelativeZipPath('ppt/presentation.xml', target));
        }
      }

      const sldIds = Array.from(presXml.getElementsByTagNameNS('*', 'sldId'));
      for (const node of sldIds) {
        const rId =
          node.getAttribute('r:id') ||
          node.getAttributeNS(
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            'id'
          );
        if (rId && relMap.has(rId)) {
          const slidePath = relMap.get(rId)!;
          if (zip.file(slidePath)) {
            orderedSlidePaths.push(slidePath);
          }
        }
      }
    } catch {
      orderedSlidePaths = [];
    }
  }

  if (orderedSlidePaths.length === 0) {
    orderedSlidePaths = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const na = Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0);
        const nb = Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0);
        return na - nb;
      });
  }

  if (orderedSlidePaths.length === 0) {
    throw new Error('لم يتم العثور على شرائح صالحة داخل ملف PowerPoint.');
  }

  const cappedPaths = orderedSlidePaths.slice(0, 60);
  const slides: PresentationSlide[] = [];

  for (let idx = 0; idx < cappedPaths.length; idx++) {
    onProgress?.(idx + 1, cappedPaths.length);
    const slidePath = cappedPaths[idx];
    const slideXmlStr = await zip.file(slidePath)!.async('text');
    const slideDoc = parser.parseFromString(slideXmlStr, 'application/xml');

    // Parse slide relationships for embedded images
    const slideFileName = slidePath.split('/').pop() || '';
    const relsPath = `ppt/slides/_rels/${slideFileName}.rels`;
    const slideRelMap = new Map<string, string>();
    const relsZipFile = zip.file(relsPath);
    if (relsZipFile) {
      try {
        const relsDoc = parser.parseFromString(
          await relsZipFile.async('text'),
          'application/xml'
        );
        for (const rel of Array.from(relsDoc.getElementsByTagName('Relationship'))) {
          const id = rel.getAttribute('Id');
          const target = rel.getAttribute('Target');
          const type = rel.getAttribute('Type') || '';
          if (id && target && type.includes('image')) {
            slideRelMap.set(id, resolveRelativeZipPath(slidePath, target));
          }
        }
      } catch {
        // ignore rel parse warning
      }
    }

    // Extract title & body text shapes
    let title = '';
    let subtitle = '';
    const bodyLines: string[] = [];

    const spNodes = Array.from(slideDoc.getElementsByTagNameNS('*', 'sp'));
    for (const sp of spNodes) {
      const ph = sp.getElementsByTagNameNS('*', 'ph')[0];
      const phType = ph?.getAttribute('type') || '';
      const paras = extractParagraphsFromElement(sp);
      if (paras.length === 0) continue;

      if (!title && (phType === 'title' || phType === 'ctrTitle')) {
        title = paras.join(' ').slice(0, 280);
      } else if (!subtitle && phType === 'subTitle') {
        subtitle = paras.join(' ').slice(0, 480);
      } else {
        bodyLines.push(...paras);
      }
    }

    // Also include table cells if slide contains PowerPoint tables
    const tblNodes = Array.from(slideDoc.getElementsByTagNameNS('*', 'tbl'));
    for (const tbl of tblNodes) {
      const rows = Array.from(tbl.getElementsByTagNameNS('*', 'tr'));
      for (const row of rows) {
        const cells = Array.from(row.getElementsByTagNameNS('*', 'tc')).map((tc) =>
          extractParagraphsFromElement(tc).join(' ').trim()
        );
        const nonEmpty = cells.filter(Boolean);
        if (nonEmpty.length > 0) {
          bodyLines.push(nonEmpty.join(' · '));
        }
      }
    }

    if (!title) {
      if (bodyLines.length > 0) {
        title = bodyLines.shift()!.slice(0, 280);
      } else {
        title = `شريحة ${idx + 1}`;
      }
    }

    // Extract embedded slide pictures
    const uploadedImages: { id: string; dataUrl: string; caption: string }[] = [];
    const seenTargets = new Set<string>();
    const blipNodes = Array.from(slideDoc.getElementsByTagNameNS('*', 'blip'));
    for (const blip of blipNodes) {
      const embedId =
        blip.getAttribute('r:embed') ||
        blip.getAttributeNS(
          'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
          'embed'
        );
      if (!embedId || !slideRelMap.has(embedId)) continue;
      const mediaPath = slideRelMap.get(embedId)!;
      if (seenTargets.has(mediaPath)) continue;
      seenTargets.add(mediaPath);

      const mediaZipFile = zip.file(mediaPath);
      if (!mediaZipFile) continue;
      try {
        const bytes = await mediaZipFile.async('arraybuffer');
        const blob = new Blob([bytes], { type: guessMimeFromExt(mediaPath) });
        const dataUrl = await compressBlobToDataUrl(blob, 900);
        uploadedImages.push({
          id: `pptx_img_${idx}_${uploadedImages.length}`,
          dataUrl,
          caption: uploadedImages.length === 0 && bodyLines.length > 0 ? bodyLines[0].slice(0, 120) : '',
        });
        if (uploadedImages.length >= 6) break;
      } catch {
        // skip unsupported EMF/WMF metafile images cleanly
      }
    }

    const bodyText = bodyLines.join('\n').slice(0, 3800);
    const hasImagesOnly = uploadedImages.length > 0 && !bodyText && title === `شريحة ${idx + 1}`;

    slides.push({
      id: `ext_pptx_${Date.now()}_${idx}`,
      kind: uploadedImages.length > 0 ? 'uploaded_gallery' : 'custom',
      layoutVariant: hasImagesOnly && uploadedImages.length === 1 ? 'custom-photo' : 'custom-photo',
      title,
      subtitle,
      badgeText: `شريحة ${idx + 1}`,
      bodyText: bodyText || undefined,
      items: [],
      uploadedImages: uploadedImages.length > 0 ? uploadedImages : undefined,
      teacherNote: 'شريحة مستوردة من ملف PowerPoint خارجي',
      fullBleedImage: hasImagesOnly && uploadedImages.length === 1,
    });
  }

  return slides;
}

export async function importPdfToPresentationSlides(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PresentationSlide[]> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: buffer.slice(0),
    ...PDFJS_COMMON_OPTIONS,
  });
  const pdf = await loadingTask.promise;
  const total = Math.min(50, Math.max(1, pdf.numPages));
  const slides: PresentationSlide[] = [];

  try {
    for (let pageNum = 1; pageNum <= total; pageNum++) {
      onProgress?.(pageNum, total);
      const page = await pdf.getPage(pageNum);
      const baseVp = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 1240 / Math.max(300, baseVp.width));
      const vp = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(vp.width));
      canvas.height = Math.max(1, Math.floor(vp.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport: vp,
        canvas,
      }).promise;

      const dataUrl = compressCanvasToDataUrl(canvas, 240000);
      slides.push({
        id: `ext_pdf_${Date.now()}_${pageNum}`,
        kind: 'uploaded_gallery',
        layoutVariant: 'custom-photo',
        title: `شريحة ${pageNum}`,
        subtitle: '',
        items: [],
        uploadedImages: [
          {
            id: `ext_pdf_img_${pageNum}`,
            dataUrl,
            caption: '',
          },
        ],
        teacherNote: 'شريحة مستوردة من عرض PDF خارجي',
        fullBleedImage: true,
      });
    }
  } finally {
    await loadingTask.destroy().catch(() => {});
  }

  return slides;
}

export async function importImagesToPresentationSlides(
  files: FileList | File[],
  onProgress?: (current: number, total: number) => void
): Promise<PresentationSlide[]> {
  const list = Array.from(files).slice(0, 50);
  const slides: PresentationSlide[] = [];

  for (let i = 0; i < list.length; i++) {
    onProgress?.(i + 1, list.length);
    const dataUrl = await compressBlobToDataUrl(list[i], 1240);
    slides.push({
      id: `ext_img_${Date.now()}_${i}`,
      kind: 'uploaded_gallery',
      layoutVariant: 'custom-photo',
      title: `شريحة ${i + 1}`,
      subtitle: '',
      items: [],
      uploadedImages: [
        {
          id: `ext_img_item_${i}`,
          dataUrl,
          caption: '',
        },
      ],
      teacherNote: 'شريحة صورة مستوردة',
      fullBleedImage: true,
    });
  }

  return slides;
}

export function normalizeExternalPresentationUrl(rawInput: string): {
  embedUrl: string;
  originalUrl: string;
  providerLabel: string;
} {
  let cleaned = rawInput.trim();

  // Extract src="..." if teacher pasted a full <iframe ...> embed snippet
  const iframeSrcMatch = cleaned.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeSrcMatch?.[1]) {
    cleaned = iframeSrcMatch[1].trim();
  }

  // Google Slides: /presentation/d/<ID>/... -> /embed
  const gSlidesMatch = cleaned.match(
    /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i
  );
  if (gSlidesMatch?.[1]) {
    return {
      embedUrl: `https://docs.google.com/presentation/d/${gSlidesMatch[1]}/embed?start=false&loop=false&delayms=3000`,
      originalUrl: cleaned,
      providerLabel: 'Google Slides',
    };
  }

  // Google Drive PowerPoint file link -> /preview
  const gDriveMatch = cleaned.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gDriveMatch?.[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${gDriveMatch[1]}/preview`,
      originalUrl: cleaned,
      providerLabel: 'Google Drive',
    };
  }

  // Canva Design link -> ?embed
  const canvaMatch = cleaned.match(
    /^(https?:\/\/(?:www\.)?canva\.com\/design\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/i
  );
  if (canvaMatch?.[1]) {
    return {
      embedUrl: `${canvaMatch[1]}/view?embed`,
      originalUrl: cleaned,
      providerLabel: 'Canva',
    };
  }

  // Direct .pptx / .ppt / .ppsx file URL -> Microsoft Office Online Viewer
  if (/\.(pptx?|ppsx?)(\?.*)?$/i.test(cleaned)) {
    return {
      embedUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        cleaned
      )}`,
      originalUrl: cleaned,
      providerLabel: 'PowerPoint Online',
    };
  }

  return {
    embedUrl: cleaned,
    originalUrl: cleaned,
    providerLabel: 'عرض خارجي',
  };
}
