import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { ArabicLetter, DeckTheme, PresentationSlide } from '../types';

function stripHash(hex: string): string {
  return hex.replace('#', '').toUpperCase();
}

/**
 * Converts any image URL or SVG data URI to a clean PNG Data URL
 * so both pptxgenjs and PDF rasterization embed images reliably.
 */
export async function ensurePngDataUrl(src: string): Promise<string | null> {
  if (!src) return null;
  // Already PNG or JPEG data URI (not SVG)
  if (src.startsWith('data:image/png') || src.startsWith('data:image/jpeg')) {
    return src;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || 400;
        const h = img.naturalHeight || 300;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function exportToPptx(
  slides: PresentationSlide[],
  theme: DeckTheme,
  letter: ArabicLetter,
  onProgress?: (percent: number, message: string) => void
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.rtlMode = true;
  pptx.author = 'المعلم وائل حمدي';
  pptx.subject = `حرف ${letter.name}`;
  pptx.title = `عرض حرف ${letter.name} (${letter.char}) - أبطال الصف الأول`;

  const bg = stripHash(theme.bgHex);
  const surface = stripHash(theme.surfaceHex);
  const primary = stripHash(theme.primaryHex);
  const secondary = stripHash(theme.secondaryHex);
  const accent = stripHash(theme.accentHex);
  const border = stripHash(theme.borderHex);
  const textCol = stripHash(theme.textHex);
  const muted = stripHash(theme.mutedTextHex);

  const total = slides.length;

  for (let i = 0; i < total; i++) {
    const s = slides[i];
    onProgress?.(
      Math.round(((i + 0.5) / total) * 85),
      `جاري تجهيز شريحة باوربوينت ${i + 1} من ${total}...`
    );

    const slide = pptx.addSlide();
    slide.background = { color: bg };

    // Top & bottom decorative accent ribbons matching the theme
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 10,
      h: 0.14,
      fill: { color: primary },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 5.52,
      w: 10,
      h: 0.105,
      fill: { color: secondary },
      line: { type: 'none' },
    });

    // Subtle outer border frame
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.2,
      y: 0.22,
      w: 9.6,
      h: 5.18,
      fill: { type: 'none' },
      line: { color: border, width: 1.5 },
      rectRadius: 0.08,
    });

    if (s.kind === 'cover') {
      // Badge
      if (s.badgeText) {
        slide.addText(s.badgeText, {
          x: 0.6,
          y: 0.65,
          w: 8.8,
          h: 0.4,
          fontSize: 16,
          bold: true,
          color: accent,
          align: 'center',
          fontFace: 'Tahoma',
          rtlMode: true,
        });
      }

      // Central Large Letter Box
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.15,
        y: 1.15,
        w: 1.7,
        h: 1.7,
        fill: { color: primary },
        line: { color: secondary, width: 2 },
        rectRadius: 0.15,
      });
      slide.addText(s.highlightLetter || letter.char, {
        x: 4.15,
        y: 1.18,
        w: 1.7,
        h: 1.65,
        fontSize: 64,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
        fontFace: 'Tahoma',
        rtlMode: true,
      });

      // Main Title
      slide.addText(s.title, {
        x: 0.6,
        y: 3.05,
        w: 8.8,
        h: 0.8,
        fontSize: 30,
        bold: true,
        color: primary,
        align: 'center',
        fontFace: 'Tahoma',
        rtlMode: true,
      });

      // Subtitle
      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 0.8,
          y: 3.85,
          w: 8.4,
          h: 0.55,
          fontSize: 16,
          bold: true,
          color: muted,
          align: 'center',
          fontFace: 'Tahoma',
          rtlMode: true,
        });
      }

      // Teacher signature box
      if (s.bodyText) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 1.4,
          y: 4.48,
          w: 7.2,
          h: 0.5,
          fill: { color: surface },
          line: { color: border, width: 1 },
          rectRadius: 0.08,
        });
        slide.addText(s.bodyText, {
          x: 1.5,
          y: 4.5,
          w: 7.0,
          h: 0.46,
          fontSize: 14,
          bold: true,
          color: textCol,
          align: 'center',
          valign: 'middle',
          fontFace: 'Tahoma',
          rtlMode: true,
        });
      }
    } else {
      // Non-cover Header
      const letterSide = s.headerLetterSide || 'left';
      const headerAlign = s.textAlign || 'right';
      const headerTextX = letterSide === 'right' ? 0.45 : letterSide === 'hidden' ? 0.45 : 1.5;
      const headerTextW = letterSide === 'hidden' ? 9.1 : 8.0;

      if (letterSide !== 'hidden') {
        const boxX = letterSide === 'right' ? 8.67 : 0.45;
        slide.addShape(pptx.ShapeType.roundRect, {
          x: boxX,
          y: 0.38,
          w: 0.88,
          h: 0.88,
          fill: { color: primary },
          line: { type: 'none' },
          rectRadius: 0.12,
        });
        slide.addText(s.highlightLetter || letter.char, {
          x: boxX,
          y: 0.38,
          w: 0.88,
          h: 0.88,
          fontSize: 32,
          bold: true,
          color: 'FFFFFF',
          align: 'center',
          valign: 'middle',
          fontFace: 'Tahoma',
          rtlMode: true,
        });
      }

      if (s.badgeText) {
        slide.addText(s.badgeText, {
          x: headerTextX,
          y: 0.34,
          w: headerTextW,
          h: 0.28,
          fontSize: 12,
          bold: true,
          color: accent,
          align: headerAlign,
          fontFace: 'Tahoma',
          rtlMode: true,
        });
      }

      slide.addText(s.title, {
        x: headerTextX,
        y: 0.6,
        w: headerTextW,
        h: 0.44,
        fontSize: 22,
        bold: true,
        color: primary,
        align: headerAlign,
        fontFace: 'Tahoma',
        rtlMode: true,
      });

      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: headerTextX,
          y: 1.03,
          w: headerTextW,
          h: 0.34,
          fontSize: 12,
          color: muted,
          align: headerAlign,
          fontFace: 'Tahoma',
          rtlMode: true,
        });
      }

      // Header divider line
      slide.addShape(pptx.ShapeType.line, {
        x: 0.45,
        y: 1.42,
        w: 9.1,
        h: 0,
        line: { color: border, width: 1 },
      });

      // Body depending on slide type
      const uploadedImgs = s.uploadedImages || [];

      if (uploadedImgs.length > 0) {
        const count = uploadedImgs.length;
        const cols = s.columnsOverride || (count <= 4 ? count : count <= 6 ? 3 : 4);
        const rows = Math.ceil(count / cols);
        const gapX = 0.2;
        const gapY = 0.16;
        const totalW = 9.1;
        const totalH = 3.2;
        const cardW = (totalW - gapX * (cols - 1)) / cols;
        const cardH = (totalH - gapY * (rows - 1)) / rows;
        const startX = 0.45;
        const startY = 1.62;

        for (let k = 0; k < count; k++) {
          const imgObj = uploadedImgs[k];
          const r = Math.floor(k / cols);
          const c = k % cols;
          const itemsInThisRow = r === rows - 1 ? count - r * cols : cols;
          // RTL placement from right to left within row
          const x = startX + (cols - 1 - c - (cols - itemsInThisRow) * 0.5) * (cardW + gapX);
          const y = startY + r * (cardH + gapY);

          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y,
            w: cardW,
            h: cardH,
            fill: { color: surface },
            line: { color: border, width: 1 },
            rectRadius: 0.08,
          });

          const imgH = Math.max(0.75, cardH - 0.55);
          const pngData = await ensurePngDataUrl(imgObj.dataUrl);
          if (pngData) {
            slide.addImage({
              data: pngData,
              x: x + 0.1,
              y: y + 0.1,
              w: cardW - 0.2,
              h: imgH,
              sizing: { type: 'contain', w: cardW - 0.2, h: imgH },
            });
          }

          slide.addText(imgObj.caption || '', {
            x: x + 0.08,
            y: y + cardH - 0.42,
            w: cardW - 0.16,
            h: 0.36,
            fontSize: rows > 1 ? 11 : 14,
            bold: true,
            color: primary,
            align: 'center',
            valign: 'middle',
            fontFace: 'Tahoma',
            rtlMode: true,
          });
        }
      } else if (s.kind === 'vocabulary' && s.items.length > 0) {
        const count = Math.min(s.items.length, 4);
        const gap = 0.2;
        const totalW = 9.1;
        const cardW = (totalW - gap * (count - 1)) / count;
        const startX = 0.45;

        for (let k = 0; k < count; k++) {
          const item = s.items[k];
          const x = startX + (count - 1 - k) * (cardW + gap);
          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y: 1.65,
            w: cardW,
            h: 3.18,
            fill: { color: surface },
            line: { color: border, width: 1 },
            rectRadius: 0.08,
          });

          if (item.image) {
            const pngData = await ensurePngDataUrl(item.image);
            if (pngData) {
              slide.addImage({
                data: pngData,
                x: x + 0.14,
                y: 1.78,
                w: cardW - 0.28,
                h: 1.75,
                sizing: { type: 'contain', w: cardW - 0.28, h: 1.75 },
              });
            }
          }

          slide.addText(item.label, {
            x: x + 0.08,
            y: 3.62,
            w: cardW - 0.16,
            h: 0.46,
            fontSize: 20,
            bold: true,
            color: primary,
            align: 'center',
            fontFace: 'Tahoma',
            rtlMode: true,
          });

          slide.addText(item.value, {
            x: x + 0.08,
            y: 4.08,
            w: cardW - 0.16,
            h: 0.3,
            fontSize: 12,
            bold: true,
            color: accent,
            align: 'center',
            fontFace: 'Tahoma',
            rtlMode: true,
          });

          if (item.subtext) {
            slide.addText(item.subtext, {
              x: x + 0.08,
              y: 4.38,
              w: cardW - 0.16,
              h: 0.36,
              fontSize: 10,
              color: muted,
              align: 'center',
              fontFace: 'Tahoma',
              rtlMode: true,
            });
          }
        }
      } else if (s.kind === 'custom' && s.bodyText) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.45,
          y: 1.65,
          w: 9.1,
          h: 3.15,
          fill: { color: surface },
          line: { color: border, width: 1 },
          rectRadius: 0.1,
        });
        slide.addText(s.bodyText, {
          x: 0.7,
          y: 1.85,
          w: 8.6,
          h: 2.75,
          fontSize: 18,
          bold: true,
          color: textCol,
          align: 'right',
          valign: 'top',
          fontFace: 'Tahoma',
          rtlMode: true,
        });
      } else if (s.layoutVariant === 'list-clean' && s.items.length > 0) {
        const count = Math.min(s.items.length, 4);
        const rowH = 0.72;
        const gap = 0.12;
        const startY = 1.62;

        for (let k = 0; k < count; k++) {
          const item = s.items[k];
          const y = startY + k * (rowH + gap);

          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.45,
            y,
            w: 9.1,
            h: rowH,
            fill: { color: surface },
            line: { color: border, width: 1 },
            rectRadius: 0.06,
          });

          // Right side: label + subtext
          slide.addText(item.label, {
            x: 3.0,
            y: y + 0.06,
            w: 6.3,
            h: 0.32,
            fontSize: 15,
            bold: true,
            color: textCol,
            align: 'right',
            fontFace: 'Tahoma',
            rtlMode: true,
          });
          if (item.subtext) {
            slide.addText(item.subtext, {
              x: 3.0,
              y: y + 0.38,
              w: 6.3,
              h: 0.28,
              fontSize: 12,
              color: muted,
              align: 'right',
              fontFace: 'Tahoma',
              rtlMode: true,
            });
          }

          // Left side: highlighted value box
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.6,
            y: y + 0.1,
            w: 2.2,
            h: rowH - 0.2,
            fill: { color: bg },
            line: { color: border, width: 1 },
            rectRadius: 0.06,
          });
          slide.addText(item.value, {
            x: 0.6,
            y: y + 0.1,
            w: 2.2,
            h: rowH - 0.2,
            fontSize: 22,
            bold: true,
            color: primary,
            align: 'center',
            valign: 'middle',
            fontFace: 'Tahoma',
            rtlMode: true,
          });
        }
      } else {
        // Card grid (3 or 4 columns) + optional closing bodyText
        let cardTopY = 1.65;
        let cardH = 3.15;

        if (s.kind === 'closing' && s.bodyText) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.45,
            y: 1.56,
            w: 9.1,
            h: 0.78,
            fill: { color: surface },
            line: { color: border, width: 1 },
            rectRadius: 0.08,
          });
          slide.addText(s.bodyText, {
            x: 0.65,
            y: 1.6,
            w: 8.7,
            h: 0.7,
            fontSize: 15,
            bold: true,
            color: textCol,
            align: 'center',
            valign: 'middle',
            fontFace: 'Tahoma',
            rtlMode: true,
          });
          cardTopY = 2.5;
          cardH = 2.3;
        }

        const count = Math.min(s.items.length, 4);
        if (count > 0) {
          const gap = 0.2;
          const totalW = 9.1;
          const cardW = (totalW - gap * (count - 1)) / count;
          const startX = 0.45;

          for (let k = 0; k < count; k++) {
            const item = s.items[k];
            const x = startX + (count - 1 - k) * (cardW + gap);

            slide.addShape(pptx.ShapeType.roundRect, {
              x,
              y: cardTopY,
              w: cardW,
              h: cardH,
              fill: { color: surface },
              line: { color: border, width: 1 },
              rectRadius: 0.1,
            });

            slide.addText(item.label, {
              x: x + 0.1,
              y: cardTopY + 0.12,
              w: cardW - 0.2,
              h: 0.42,
              fontSize: 13,
              bold: true,
              color: k % 2 === 0 ? primary : secondary,
              align: 'center',
              fontFace: 'Tahoma',
              rtlMode: true,
            });

            slide.addText(item.value, {
              x: x + 0.1,
              y: cardTopY + 0.6,
              w: cardW - 0.2,
              h: cardH - 1.25,
              fontSize: item.value.length > 10 ? 18 : 34,
              bold: true,
              color: textCol,
              align: 'center',
              valign: 'middle',
              fontFace: 'Tahoma',
              rtlMode: true,
            });

            if (item.subtext) {
              slide.addShape(pptx.ShapeType.roundRect, {
                x: x + 0.12,
                y: cardTopY + cardH - 0.56,
                w: cardW - 0.24,
                h: 0.44,
                fill: { color: bg },
                line: { type: 'none' },
                rectRadius: 0.06,
              });
              slide.addText(item.subtext, {
                x: x + 0.14,
                y: cardTopY + cardH - 0.55,
                w: cardW - 0.28,
                h: 0.42,
                fontSize: 12,
                bold: true,
                color: accent,
                align: 'center',
                valign: 'middle',
                fontFace: 'Tahoma',
                rtlMode: true,
              });
            }
          }
        }
      }
    }

    // Slide Footer
    slide.addText(s.teacherNote || 'بقيادة المعلم وائل حمدي', {
      x: 2.2,
      y: 4.98,
      w: 7.35,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: primary,
      align: 'right',
      fontFace: 'Tahoma',
      rtlMode: true,
    });

    slide.addText(`شريحة ${i + 1} من ${total}`, {
      x: 0.45,
      y: 4.98,
      w: 1.8,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: secondary,
      align: 'left',
      fontFace: 'Tahoma',
      rtlMode: true,
    });
  }

  onProgress?.(95, 'جاري حفظ وتنزيل ملف الباوربوينت (.pptx)...');
  const fileName = `حرف_${letter.name}_المعلم_وائل_حمدي.pptx`;
  await pptx.writeFile({ fileName });
  onProgress?.(100, 'تم حفظ ملف الباوربوينت بنجاح!');
}

export async function exportToPdf(
  slideElements: HTMLElement[],
  letter: ArabicLetter,
  onProgress?: (percent: number, message: string) => void
): Promise<void> {
  if (slideElements.length === 0) {
    throw new Error('لا توجد شرائح لتصديرها');
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1280, 720],
    hotfixes: ['px_scaling'],
  });

  const total = slideElements.length;

  for (let i = 0; i < total; i++) {
    const el = slideElements[i];
    onProgress?.(
      Math.round(((i + 0.3) / total) * 90),
      `جاري تصدير صفحة PDF ${i + 1} من ${total}...`
    );

    const pngDataUrl = await toPng(el, {
      quality: 0.96,
      pixelRatio: 1.5,
      width: 1280,
      height: 720,
      cacheBust: true,
    });

    if (i > 0) {
      pdf.addPage([1280, 720], 'landscape');
    }
    pdf.addImage(pngDataUrl, 'PNG', 0, 0, 1280, 720, undefined, 'FAST');
  }

  onProgress?.(98, 'جاري حفظ وتنزيل ملف الـ PDF...');
  pdf.save(`حرف_${letter.name}_المعلم_وائل_حمدي.pdf`);
  onProgress?.(100, 'تم حفظ ملف الـ PDF بنجاح!');
}
