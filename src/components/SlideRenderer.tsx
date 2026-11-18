import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, GripVertical } from 'lucide-react';
import { ArabicLetter, DeckTheme, PresentationSlide } from '../types';

interface SlideRendererProps {
  slide: PresentationSlide;
  theme: DeckTheme;
  letter: ArabicLetter;
  slideIndex: number;
  totalSlides: number;
  isEditable?: boolean;
  onUpdateSlide?: (patch: Partial<PresentationSlide>) => void;
  onSwapItems?: (fromIdx: number, toIdx: number) => void;
  onSwapImages?: (fromIdx: number, toIdx: number) => void;
}

interface InlineEditableTextProps {
  value: string;
  isEditable?: boolean;
  onChange?: (val: string) => void;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  value,
  isEditable,
  onChange,
  multiline = false,
  className = '',
  style,
  placeholder = 'اضغط للتعديل...',
}) => {
  const [editing, setEditing] = useState(false);

  if (!isEditable || !onChange) {
    return (
      <div className={className} style={style}>
        {value}
      </div>
    );
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onClick={e => e.stopPropagation()}
          className={`w-full rounded-xl bg-white/95 text-slate-900 border-2 border-amber-500 px-3 py-1.5 shadow-sm focus:outline-none ${className}`}
          style={{ ...style, color: '#0f172a' }}
        />
      );
    }

    return (
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={e => {
          if (e.key === 'Enter') setEditing(false);
        }}
        onClick={e => e.stopPropagation()}
        className={`w-full rounded-xl bg-white/95 text-slate-900 border-2 border-amber-500 px-3 py-0.5 shadow-sm focus:outline-none ${className}`}
        style={{ ...style, color: '#0f172a' }}
      />
    );
  }

  return (
    <div
      onClick={e => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="اضغط هنا لتعديل النص مباشرة"
      className={`cursor-text rounded-lg transition-all hover:outline-2 hover:outline-dashed hover:outline-amber-500/80 hover:bg-amber-400/10 px-1 -mx-1 ${className}`}
      style={style}
    >
      {value || <span className="opacity-40">{placeholder}</span>}
    </div>
  );
};

const PatternBackground: React.FC<{ theme: DeckTheme }> = ({ theme }) => {
  switch (theme.patternType) {
    case 'waves':
      return (
        <>
          <svg
            viewBox="0 0 1280 160"
            preserveAspectRatio="none"
            className="absolute top-0 inset-x-0 w-full h-32 pointer-events-none opacity-15"
          >
            <path
              d="M0,0 L1280,0 L1280,65 C1060,130 820,25 620,90 C420,150 210,35 0,95 Z"
              fill={theme.primaryHex}
            />
            <path
              d="M0,0 L1280,0 L1280,35 C1020,90 800,15 580,65 C360,115 180,20 0,55 Z"
              fill={theme.secondaryHex}
              opacity="0.6"
            />
          </svg>
          <svg
            viewBox="0 0 1280 160"
            preserveAspectRatio="none"
            className="absolute bottom-0 inset-x-0 w-full h-28 pointer-events-none opacity-15"
          >
            <path
              d="M0,160 L1280,160 L1280,95 C1050,35 840,135 640,75 C440,15 220,125 0,65 Z"
              fill={theme.secondaryHex}
            />
          </svg>
        </>
      );

    case 'arches':
      return (
        <>
          <div
            className="absolute -top-28 -right-28 w-80 h-80 rounded-full opacity-12 pointer-events-none"
            style={{ backgroundColor: theme.primaryHex }}
          />
          <div
            className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full opacity-12 pointer-events-none"
            style={{ backgroundColor: theme.secondaryHex }}
          />
          <div
            className="absolute top-12 left-12 w-32 h-32 rounded-full border-8 opacity-10 pointer-events-none"
            style={{ borderColor: theme.accentHex }}
          />
        </>
      );

    case 'diagonal':
      return (
        <svg
          viewBox="0 0 1280 720"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
        >
          <polygon points="0,0 440,0 160,720 0,720" fill={theme.primaryHex} />
          <polygon points="1040,0 1280,0 1280,720 900,720" fill={theme.secondaryHex} />
        </svg>
      );

    case 'geometric':
      return (
        <svg
          viewBox="0 0 1280 720"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
        >
          <rect x="30" y="30" width="1220" height="660" rx="28" fill="none" stroke={theme.primaryHex} strokeWidth="6" />
          <polygon points="1180,30 1250,30 1250,140" fill={theme.accentHex} />
          <polygon points="30,580 30,690 140,690" fill={theme.secondaryHex} />
        </svg>
      );

    case 'ribbons':
      return (
        <>
          <div
            className="absolute top-0 inset-x-0 h-5 pointer-events-none"
            style={{ background: `linear-gradient(90deg, ${theme.primaryHex}, ${theme.secondaryHex}, ${theme.accentHex})` }}
          />
          <div
            className="absolute bottom-0 inset-x-0 h-4 pointer-events-none opacity-80"
            style={{ background: `linear-gradient(90deg, ${theme.accentHex}, ${theme.primaryHex})` }}
          />
        </>
      );

    case 'dots':
    default:
      return (
        <svg
          viewBox="0 0 1280 720"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-15"
        >
          {[0, 1, 2, 3, 4].map(row =>
            [0, 1, 2, 3].map(col => (
              <circle
                key={`${row}-${col}`}
                cx={60 + col * 36}
                cy={60 + row * 36}
                r="6"
                fill={theme.primaryHex}
              />
            ))
          )}
          {[0, 1, 2, 3, 4].map(row =>
            [0, 1, 2, 3].map(col => (
              <circle
                key={`b-${row}-${col}`}
                cx={1100 + col * 36}
                cy={520 + row * 36}
                r="6"
                fill={theme.accentHex}
              />
            ))
          )}
        </svg>
      );
  }
};

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  theme,
  letter,
  slideIndex,
  totalSlides,
  isEditable = false,
  onUpdateSlide,
  onSwapItems,
  onSwapImages,
}) => {
  const [dragItemIndex, setDragItemIndex] = useState<number | null>(null);
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);

  const isCover = slide.kind === 'cover';
  const isClosing = slide.kind === 'closing';
  const hasUploadedImages = slide.uploadedImages && slide.uploadedImages.length > 0;
  const isGallery =
    slide.kind === 'vocabulary' ||
    slide.kind === 'uploaded_gallery' ||
    (slide.kind === 'custom' && hasUploadedImages);

  const textAlign = slide.textAlign || (isCover && slide.layoutVariant !== 'hero-split' ? 'center' : 'right');
  const alignClass =
    textAlign === 'center' ? 'text-center' : textAlign === 'left' ? 'text-left' : 'text-right';

  const headerLetterSide = slide.headerLetterSide || 'left';
  const fontScale = slide.fontScale || 'md';
  const titleSizeClass =
    fontScale === 'lg' ? 'text-5xl' : fontScale === 'sm' ? 'text-3xl' : 'text-4xl';
  const subtitleSizeClass =
    fontScale === 'lg' ? 'text-xl' : fontScale === 'sm' ? 'text-base' : 'text-lg';

  const updateItemField = (itemId: string, field: 'label' | 'value' | 'subtext', val: string) => {
    if (!onUpdateSlide) return;
    onUpdateSlide({
      items: slide.items.map(it => (it.id === itemId ? { ...it, [field]: val } : it)),
    });
  };

  const updateImageCaption = (imgId: string, val: string) => {
    if (!onUpdateSlide || !slide.uploadedImages) return;
    onUpdateSlide({
      uploadedImages: slide.uploadedImages.map(im =>
        im.id === imgId ? { ...im, caption: val } : im
      ),
    });
  };

  // Compute smart grid classes for uploaded images (handles 1 to 12+ merged images neatly!)
  const getUploadedGridMeta = (count: number) => {
    const cols = slide.columnsOverride || (count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : count <= 4 ? 4 : count <= 6 ? 3 : 4);
    const colClass =
      cols === 1
        ? 'grid-cols-1 max-w-xl mx-auto'
        : cols === 2
        ? 'grid-cols-2'
        : cols === 3
        ? 'grid-cols-3'
        : 'grid-cols-4';
    const imgHeightClass =
      count === 1
        ? 'h-80'
        : count <= 4 && cols >= count
        ? 'h-56'
        : count <= 6
        ? 'h-32'
        : 'h-24';
    const padClass = count > 4 ? 'p-2.5' : 'p-4';
    const captionClass = count > 4 ? 'text-base' : 'text-xl';
    return { colClass, imgHeightClass, padClass, captionClass };
  };

  const getItemsGridClass = (count: number) => {
    const cols = slide.columnsOverride || (count >= 4 ? 4 : count === 3 ? 3 : count === 2 ? 2 : 1);
    if (cols === 1) return 'grid-cols-1';
    if (cols === 2) return 'grid-cols-2';
    if (cols === 3) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const letterHeaderBox = headerLetterSide !== 'hidden' && (
    <div
      className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center shadow-md shrink-0"
      style={{
        backgroundColor: theme.primaryHex,
        color: '#FFFFFF',
      }}
    >
      <InlineEditableText
        value={slide.highlightLetter || letter.char}
        isEditable={isEditable}
        onChange={val => onUpdateSlide?.({ highlightLetter: val })}
        className="text-5xl font-black leading-none text-center"
        style={{ color: '#FFFFFF' }}
      />
    </div>
  );

  if (slide.fullBleedImage && hasUploadedImages && slide.uploadedImages) {
    const heroImg = slide.uploadedImages[0];
    return (
      <div
        dir="rtl"
        className="relative w-[1280px] h-[720px] overflow-hidden bg-white select-none flex items-center justify-center"
      >
        <img
          src={heroImg.dataUrl}
          alt={slide.title || 'شريحة'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain bg-white"
        />
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="relative w-[1280px] h-[720px] overflow-hidden flex flex-col justify-between p-12 select-none"
      style={{
        backgroundColor: theme.bgHex,
        color: theme.textHex,
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      {/* Dynamic Pattern Background */}
      <PatternBackground theme={theme} />

      {/* Outer subtle editorial border */}
      <div
        className="absolute inset-5 rounded-3xl pointer-events-none"
        style={{ border: `2px solid ${theme.borderHex}` }}
      />

      {/* TOP HEADER BAR (non-cover slides) */}
      {!isCover && (
        <div
          className={`relative z-10 flex items-start justify-between gap-6 border-b pb-4 ${
            headerLetterSide === 'right' ? 'flex-row-reverse' : 'flex-row'
          }`}
          style={{ borderColor: theme.borderHex }}
        >
          <div className={`flex-1 ${alignClass}`}>
            {(slide.badgeText || isEditable) && (
              <InlineEditableText
                value={slide.badgeText || ''}
                isEditable={isEditable}
                onChange={val => onUpdateSlide?.({ badgeText: val })}
                placeholder="عنوان القسم..."
                className="text-base font-extrabold mb-1 tracking-wide"
                style={{ color: theme.accentHex }}
              />
            )}
            <InlineEditableText
              value={slide.title}
              isEditable={isEditable}
              onChange={val => onUpdateSlide?.({ title: val })}
              className={`${titleSizeClass} font-black leading-tight`}
              style={{ color: theme.primaryHex }}
            />
            {(slide.subtitle || isEditable) && (
              <InlineEditableText
                value={slide.subtitle}
                isEditable={isEditable}
                onChange={val => onUpdateSlide?.({ subtitle: val })}
                placeholder="أضف وصفاً للشريحة..."
                className={`${subtitleSizeClass} font-medium mt-1`}
                style={{ color: theme.mutedTextHex }}
              />
            )}
          </div>

          {letterHeaderBox}
        </div>
      )}

      {/* MAIN CONTENT BODY */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-3 overflow-hidden">
        {/* 1. COVER SLIDE VARIANTS */}
        {isCover && (
          <div className="h-full flex flex-col justify-center">
            {slide.layoutVariant === 'hero-split' ? (
              <div className="grid grid-cols-12 gap-8 items-center">
                <div
                  className={`col-span-7 ${alignClass} space-y-5 ${
                    slide.swapPositions ? 'order-2' : 'order-1'
                  }`}
                >
                  {(slide.badgeText || isEditable) && (
                    <InlineEditableText
                      value={slide.badgeText || ''}
                      isEditable={isEditable}
                      onChange={val => onUpdateSlide?.({ badgeText: val })}
                      className="text-lg font-black tracking-wide"
                      style={{ color: theme.accentHex }}
                    />
                  )}
                  <InlineEditableText
                    value={slide.title}
                    isEditable={isEditable}
                    onChange={val => onUpdateSlide?.({ title: val })}
                    className={`${
                      fontScale === 'lg' ? 'text-6xl' : fontScale === 'sm' ? 'text-4xl' : 'text-5xl'
                    } font-black leading-snug`}
                    style={{ color: theme.primaryHex }}
                  />
                  <InlineEditableText
                    value={slide.subtitle}
                    isEditable={isEditable}
                    onChange={val => onUpdateSlide?.({ subtitle: val })}
                    className="text-2xl font-bold leading-relaxed"
                    style={{ color: theme.mutedTextHex }}
                  />
                  {(slide.bodyText || isEditable) && (
                    <InlineEditableText
                      value={slide.bodyText || ''}
                      isEditable={isEditable}
                      onChange={val => onUpdateSlide?.({ bodyText: val })}
                      multiline
                      className="text-xl font-bold px-5 py-4 rounded-2xl border"
                      style={{
                        backgroundColor: theme.surfaceHex,
                        borderColor: theme.borderHex,
                        color: theme.textHex,
                      }}
                    />
                  )}
                </div>

                <div
                  className={`col-span-5 flex flex-col items-center justify-center ${
                    slide.swapPositions ? 'order-1' : 'order-2'
                  }`}
                >
                  <div
                    className="w-72 h-72 rounded-[2.5rem] flex flex-col items-center justify-center shadow-xl border-4"
                    style={{
                      backgroundColor: theme.surfaceHex,
                      borderColor: theme.primaryHex,
                    }}
                  >
                    <InlineEditableText
                      value={slide.highlightLetter || letter.char}
                      isEditable={isEditable}
                      onChange={val => onUpdateSlide?.({ highlightLetter: val })}
                      className="text-[148px] font-black leading-none text-center"
                      style={{ color: theme.primaryHex }}
                    />
                    <span
                      className="text-2xl font-black mt-2"
                      style={{ color: theme.secondaryHex }}
                    >
                      {letter.name}
                    </span>
                  </div>
                </div>
              </div>
            ) : slide.layoutVariant === 'hero-arch' ? (
              <div className="flex flex-col items-center text-center space-y-5">
                <InlineEditableText
                  value={slide.badgeText || 'منصة أبطال الصف الأول'}
                  isEditable={isEditable}
                  onChange={val => onUpdateSlide?.({ badgeText: val })}
                  className="px-8 py-2 rounded-t-3xl text-lg font-black text-white"
                  style={{ backgroundColor: theme.secondaryHex }}
                />
                <div
                  className={`w-48 h-48 rounded-t-full rounded-b-3xl flex flex-col items-center justify-center shadow-lg border-4 ${
                    slide.swapPositions ? 'order-3' : ''
                  }`}
                  style={{
                    backgroundColor: theme.surfaceHex,
                    borderColor: theme.primaryHex,
                  }}
                >
                  <InlineEditableText
                    value={slide.highlightLetter || letter.char}
                    isEditable={isEditable}
                    onChange={val => onUpdateSlide?.({ highlightLetter: val })}
                    className="text-8xl font-black text-center"
                    style={{ color: theme.primaryHex }}
                  />
                </div>
                <InlineEditableText
                  value={slide.title}
                  isEditable={isEditable}
                  onChange={val => onUpdateSlide?.({ title: val })}
                  className="text-5xl font-black max-w-4xl"
                  style={{ color: theme.primaryHex }}
                />
                <InlineEditableText
                  value={slide.subtitle}
                  isEditable={isEditable}
                  onChange={val => onUpdateSlide?.({ subtitle: val })}
                  className="text-2xl font-bold max-w-3xl"
                  style={{ color: theme.mutedTextHex }}
                />
              </div>
            ) : (
              /* hero-centered */
              <div className="flex flex-col items-center text-center space-y-5">
                <InlineEditableText
                  value={slide.badgeText || ''}
                  isEditable={isEditable}
                  onChange={val => onUpdateSlide?.({ badgeText: val })}
                  className="text-xl font-black"
                  style={{ color: theme.accentHex }}
                />
                <div
                  className={`w-44 h-44 rounded-3xl flex items-center justify-center shadow-xl text-white ${
                    slide.swapPositions ? 'order-3' : ''
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryHex}, ${theme.secondaryHex})`,
                  }}
                >
                  <InlineEditableText
                    value={slide.highlightLetter || letter.char}
                    isEditable={isEditable}
                    onChange={val => onUpdateSlide?.({ highlightLetter: val })}
                    className="text-8xl font-black text-center"
                    style={{ color: '#FFFFFF' }}
                  />
                </div>
                <InlineEditableText
                  value={slide.title}
                  isEditable={isEditable}
                  onChange={val => onUpdateSlide?.({ title: val })}
                  className="text-5xl font-black max-w-4xl leading-tight"
                  style={{ color: theme.primaryHex }}
                />
                <InlineEditableText
                  value={slide.subtitle}
                  isEditable={isEditable}
                  onChange={val => onUpdateSlide?.({ subtitle: val })}
                  className="text-2xl font-bold max-w-3xl"
                  style={{ color: theme.mutedTextHex }}
                />
                {(slide.bodyText || isEditable) && (
                  <InlineEditableText
                    value={slide.bodyText || ''}
                    isEditable={isEditable}
                    onChange={val => onUpdateSlide?.({ bodyText: val })}
                    className="text-xl font-bold px-8 py-3 rounded-2xl border"
                    style={{
                      backgroundColor: theme.surfaceHex,
                      borderColor: theme.borderHex,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. CLOSING SLIDE */}
        {isClosing && (
          <div className="flex flex-col gap-5">
            {(slide.bodyText || isEditable) && (
              <div className={slide.swapPositions ? 'order-2' : 'order-1'}>
                <InlineEditableText
                  value={slide.bodyText || ''}
                  isEditable={isEditable}
                  onChange={val => onUpdateSlide?.({ bodyText: val })}
                  multiline
                  className="p-5 rounded-2xl text-2xl font-bold text-center border"
                  style={{
                    backgroundColor: theme.surfaceHex,
                    borderColor: theme.borderHex,
                    color: theme.textHex,
                  }}
                />
              </div>
            )}

            <div className={`grid ${getItemsGridClass(slide.items.length)} gap-5 ${slide.swapPositions ? 'order-1' : 'order-2'}`}>
              {slide.items.map((item, idx) => (
                <div
                  key={item.id}
                  draggable={isEditable}
                  onDragStart={() => setDragItemIndex(idx)}
                  onDragOver={e => isEditable && e.preventDefault()}
                  onDrop={() => {
                    if (isEditable && dragItemIndex !== null && dragItemIndex !== idx) {
                      onSwapItems?.(dragItemIndex, idx);
                    }
                    setDragItemIndex(null);
                  }}
                  className={`relative group p-5 rounded-2xl border flex flex-col justify-between shadow-xs ${
                    isEditable ? 'hover:border-amber-500 cursor-grab active:cursor-grabbing' : ''
                  }`}
                  style={{
                    backgroundColor: theme.surfaceHex,
                    borderColor: theme.borderHex,
                  }}
                >
                  {isEditable && (
                    <div className="absolute -top-3 left-2 hidden group-hover:flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded-lg text-xs shadow-md z-20">
                      <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={e => {
                          e.stopPropagation();
                          onSwapItems?.(idx, idx - 1);
                        }}
                        className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                        title="تحريك يميناً"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === slide.items.length - 1}
                        onClick={e => {
                          e.stopPropagation();
                          onSwapItems?.(idx, idx + 1);
                        }}
                        className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                        title="تحريك يساراً"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <InlineEditableText
                    value={item.label}
                    isEditable={isEditable}
                    onChange={val => updateItemField(item.id, 'label', val)}
                    className={`text-lg font-black mb-1.5 ${alignClass}`}
                    style={{ color: theme.accentHex }}
                  />
                  <InlineEditableText
                    value={item.value}
                    isEditable={isEditable}
                    onChange={val => updateItemField(item.id, 'value', val)}
                    className={`text-2xl font-black mb-1.5 ${alignClass}`}
                    style={{ color: theme.primaryHex }}
                  />
                  {(item.subtext || isEditable) && (
                    <InlineEditableText
                      value={item.subtext || ''}
                      isEditable={isEditable}
                      onChange={val => updateItemField(item.id, 'subtext', val)}
                      className={`text-base font-medium ${alignClass}`}
                      style={{ color: theme.mutedTextHex }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. GALLERY / VOCABULARY / UPLOADED TEACHER IMAGES */}
        {!isCover && !isClosing && isGallery && (
          <div className="w-full space-y-3">
            {slide.bodyText && (
              <div
                className={`px-5 py-3 rounded-2xl border text-lg font-bold leading-relaxed whitespace-pre-line max-h-40 overflow-hidden ${alignClass}`}
                style={{
                  backgroundColor: theme.surfaceHex,
                  borderColor: theme.borderHex,
                  color: theme.textHex,
                }}
              >
                {slide.bodyText}
              </div>
            )}
            {hasUploadedImages ? (
              (() => {
                const imgs = slide.uploadedImages!;
                const meta = getUploadedGridMeta(imgs.length);
                return (
                  <div className={`grid gap-4 ${meta.colClass}`}>
                    {imgs.map((img, idx) => (
                      <div
                        key={img.id}
                        draggable={isEditable}
                        onDragStart={() => setDragImageIndex(idx)}
                        onDragOver={e => isEditable && e.preventDefault()}
                        onDrop={() => {
                          if (isEditable && dragImageIndex !== null && dragImageIndex !== idx) {
                            onSwapImages?.(dragImageIndex, idx);
                          }
                          setDragImageIndex(null);
                        }}
                        className={`relative group rounded-2xl border ${meta.padClass} flex flex-col items-center justify-between shadow-xs ${
                          isEditable ? 'hover:border-amber-500 cursor-grab active:cursor-grabbing' : ''
                        }`}
                        style={{
                          backgroundColor: theme.surfaceHex,
                          borderColor: theme.borderHex,
                        }}
                      >
                        {isEditable && (
                          <div className="absolute -top-3 left-2 hidden group-hover:flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded-lg text-xs shadow-md z-20">
                            <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={e => {
                                e.stopPropagation();
                                onSwapImages?.(idx, idx - 1);
                              }}
                              className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                              title="تحريك للأمام"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === imgs.length - 1}
                              onClick={e => {
                                e.stopPropagation();
                                onSwapImages?.(idx, idx + 1);
                              }}
                              className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                              title="تحريك للخلف"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div
                          className={`w-full ${meta.imgHeightClass} flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 mb-2`}
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.caption}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <InlineEditableText
                          value={img.caption}
                          isEditable={isEditable}
                          onChange={val => updateImageCaption(img.id, val)}
                          className={`${meta.captionClass} font-black text-center w-full`}
                          style={{ color: theme.primaryHex }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <div className={`grid gap-5 ${getItemsGridClass(slide.items.length)}`}>
                {slide.items.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable={isEditable}
                    onDragStart={() => setDragItemIndex(idx)}
                    onDragOver={e => isEditable && e.preventDefault()}
                    onDrop={() => {
                      if (isEditable && dragItemIndex !== null && dragItemIndex !== idx) {
                        onSwapItems?.(dragItemIndex, idx);
                      }
                      setDragItemIndex(null);
                    }}
                    className={`relative group rounded-2xl border p-4 flex flex-col items-center text-center shadow-xs ${
                      isEditable ? 'hover:border-amber-500 cursor-grab active:cursor-grabbing' : ''
                    }`}
                    style={{
                      backgroundColor: theme.surfaceHex,
                      borderColor: theme.borderHex,
                    }}
                  >
                    {isEditable && (
                      <div className="absolute -top-3 left-2 hidden group-hover:flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded-lg text-xs shadow-md z-20">
                        <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={e => {
                            e.stopPropagation();
                            onSwapItems?.(idx, idx - 1);
                          }}
                          className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === slide.items.length - 1}
                          onClick={e => {
                            e.stopPropagation();
                            onSwapItems?.(idx, idx + 1);
                          }}
                          className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {item.image && (
                      <div className="w-full h-44 flex items-center justify-center rounded-xl bg-slate-50 mb-3 overflow-hidden p-2">
                        <img
                          src={item.image}
                          alt={item.label}
                          referrerPolicy="no-referrer"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <InlineEditableText
                      value={item.label}
                      isEditable={isEditable}
                      onChange={val => updateItemField(item.id, 'label', val)}
                      className="text-3xl font-black mb-1"
                      style={{ color: theme.primaryHex }}
                    />
                    <InlineEditableText
                      value={item.value}
                      isEditable={isEditable}
                      onChange={val => updateItemField(item.id, 'value', val)}
                      className="text-base font-extrabold mb-1"
                      style={{ color: theme.accentHex }}
                    />
                    {(item.subtext || isEditable) && (
                      <InlineEditableText
                        value={item.subtext || ''}
                        isEditable={isEditable}
                        onChange={val => updateItemField(item.id, 'subtext', val)}
                        className="text-sm font-medium"
                        style={{ color: theme.mutedTextHex }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. CUSTOM TEXT SLIDE (if no uploadedImages) */}
        {!isCover && !isClosing && !isGallery && slide.kind === 'custom' && (
          <div
            className="p-8 rounded-3xl border space-y-5 shadow-xs"
            style={{
              backgroundColor: theme.surfaceHex,
              borderColor: theme.borderHex,
            }}
          >
            {(slide.bodyText || isEditable) && (
              <InlineEditableText
                value={slide.bodyText || ''}
                isEditable={isEditable}
                onChange={val => onUpdateSlide?.({ bodyText: val })}
                multiline
                className={`text-2xl font-bold leading-relaxed whitespace-pre-line ${alignClass}`}
                style={{ color: theme.textHex }}
              />
            )}
            {slide.items.length > 0 && (
              <div className={`grid ${getItemsGridClass(slide.items.length)} gap-4 pt-2`}>
                {slide.items.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable={isEditable}
                    onDragStart={() => setDragItemIndex(idx)}
                    onDragOver={e => isEditable && e.preventDefault()}
                    onDrop={() => {
                      if (isEditable && dragItemIndex !== null && dragItemIndex !== idx) {
                        onSwapItems?.(dragItemIndex, idx);
                      }
                      setDragItemIndex(null);
                    }}
                    className="relative group p-4 rounded-xl border"
                    style={{ borderColor: theme.borderHex, backgroundColor: theme.bgHex }}
                  >
                    <InlineEditableText
                      value={item.label}
                      isEditable={isEditable}
                      onChange={val => updateItemField(item.id, 'label', val)}
                      className={`text-lg font-black ${alignClass}`}
                      style={{ color: theme.primaryHex }}
                    />
                    <InlineEditableText
                      value={item.value}
                      isEditable={isEditable}
                      onChange={val => updateItemField(item.id, 'value', val)}
                      className={`text-xl font-bold ${alignClass}`}
                      style={{ color: theme.textHex }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. STRUCTURED CARDS / LISTS / ACTIVITY SLIDES */}
        {!isCover && !isClosing && !isGallery && slide.kind !== 'custom' && (
          <div>
            {slide.layoutVariant === 'list-clean' ? (
              <div className="grid grid-cols-1 gap-3.5">
                {slide.items.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable={isEditable}
                    onDragStart={() => setDragItemIndex(idx)}
                    onDragOver={e => isEditable && e.preventDefault()}
                    onDrop={() => {
                      if (isEditable && dragItemIndex !== null && dragItemIndex !== idx) {
                        onSwapItems?.(dragItemIndex, idx);
                      }
                      setDragItemIndex(null);
                    }}
                    className={`relative group flex items-center justify-between gap-6 px-7 py-3.5 rounded-2xl border shadow-xs ${
                      slide.swapPositions ? 'flex-row-reverse' : 'flex-row'
                    } ${isEditable ? 'hover:border-amber-500 cursor-grab active:cursor-grabbing' : ''}`}
                    style={{
                      backgroundColor: theme.surfaceHex,
                      borderColor: theme.borderHex,
                    }}
                  >
                    {isEditable && (
                      <div className="absolute -top-3 left-3 hidden group-hover:flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded-lg text-xs shadow-md z-20">
                        <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={e => {
                            e.stopPropagation();
                            onSwapItems?.(idx, idx - 1);
                          }}
                          className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                          title="تحريك لأعلى"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === slide.items.length - 1}
                          onClick={e => {
                            e.stopPropagation();
                            onSwapItems?.(idx, idx + 1);
                          }}
                          className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                          title="تحريك لأسفل"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-5 flex-1">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0"
                        style={{ backgroundColor: idx % 2 === 0 ? theme.primaryHex : theme.secondaryHex }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <InlineEditableText
                          value={item.label}
                          isEditable={isEditable}
                          onChange={val => updateItemField(item.id, 'label', val)}
                          className={`text-xl font-black ${alignClass}`}
                          style={{ color: theme.textHex }}
                        />
                        {(item.subtext || isEditable) && (
                          <InlineEditableText
                            value={item.subtext || ''}
                            isEditable={isEditable}
                            onChange={val => updateItemField(item.id, 'subtext', val)}
                            className={`text-base font-medium ${alignClass}`}
                            style={{ color: theme.mutedTextHex }}
                          />
                        )}
                      </div>
                    </div>

                    <div
                      className="text-4xl font-black px-6 py-2 rounded-xl border min-w-[140px] text-center"
                      style={{
                        color: theme.primaryHex,
                        backgroundColor: theme.bgHex,
                        borderColor: theme.borderHex,
                      }}
                    >
                      <InlineEditableText
                        value={item.value}
                        isEditable={isEditable}
                        onChange={val => updateItemField(item.id, 'value', val)}
                        className="text-center"
                        style={{ color: theme.primaryHex }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-6 ${getItemsGridClass(slide.items.length)}`}>
                {slide.items.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable={isEditable}
                    onDragStart={() => setDragItemIndex(idx)}
                    onDragOver={e => isEditable && e.preventDefault()}
                    onDrop={() => {
                      if (isEditable && dragItemIndex !== null && dragItemIndex !== idx) {
                        onSwapItems?.(dragItemIndex, idx);
                      }
                      setDragItemIndex(null);
                    }}
                    className={`relative group rounded-3xl border p-6 flex flex-col items-center justify-between text-center shadow-xs min-h-[275px] ${
                      isEditable ? 'hover:border-amber-500 cursor-grab active:cursor-grabbing' : ''
                    }`}
                    style={{
                      backgroundColor: theme.surfaceHex,
                      borderColor: theme.borderHex,
                    }}
                  >
                    {isEditable && (
                      <div className="absolute -top-3 left-2 hidden group-hover:flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded-lg text-xs shadow-md z-20">
                        <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={e => {
                            e.stopPropagation();
                            onSwapItems?.(idx, idx - 1);
                          }}
                          className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                          title="تحريك يميناً"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === slide.items.length - 1}
                          onClick={e => {
                            e.stopPropagation();
                            onSwapItems?.(idx, idx + 1);
                          }}
                          className="p-0.5 disabled:opacity-30 hover:text-amber-300"
                          title="تحريك يساراً"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <InlineEditableText
                      value={item.label}
                      isEditable={isEditable}
                      onChange={val => updateItemField(item.id, 'label', val)}
                      className="text-lg font-black pb-2 border-b w-full text-center"
                      style={{
                        color: idx % 2 === 0 ? theme.primaryHex : theme.secondaryHex,
                        borderColor: theme.borderHex,
                      }}
                    />

                    <InlineEditableText
                      value={item.value}
                      isEditable={isEditable}
                      onChange={val => updateItemField(item.id, 'value', val)}
                      className={`my-3 ${
                        item.value.length > 10 ? 'text-3xl' : 'text-6xl'
                      } font-black leading-tight text-center w-full`}
                      style={{ color: theme.textHex }}
                    />

                    {(item.subtext || isEditable) && (
                      <InlineEditableText
                        value={item.subtext || ''}
                        isEditable={isEditable}
                        onChange={val => updateItemField(item.id, 'subtext', val)}
                        className="w-full py-2 px-3 rounded-xl text-lg font-bold text-center"
                        style={{
                          backgroundColor: theme.bgHex,
                          color: theme.accentHex,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER BAR */}
      <div
        className="relative z-10 flex items-center justify-between pt-3.5 border-t text-base font-bold"
        style={{
          borderColor: theme.borderHex,
          color: theme.mutedTextHex,
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <InlineEditableText
            value={slide.teacherNote || 'بقيادة المعلم وائل حمدي'}
            isEditable={isEditable}
            onChange={val => onUpdateSlide?.({ teacherNote: val })}
            className="font-black"
            style={{ color: theme.primaryHex }}
          />
        </div>

        <div className="tabular-nums font-extrabold shrink-0" style={{ color: theme.secondaryHex }}>
          شريحة {slideIndex + 1} من {totalSlides}
        </div>
      </div>
    </div>
  );
};
