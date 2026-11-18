import { SlideTransitionType } from '../types';

export interface SlideTransitionOption {
  id: SlideTransitionType;
  label: string;
  description: string;
  previewHint: string;
}

export const SLIDE_TRANSITION_OPTIONS: SlideTransitionOption[] = [
  {
    id: 'slide',
    label: 'انزلاق جانبي',
    description: 'تتحرك الشريحة الجديدة بسلاسة من الجانب كشرائح الباوربوينت',
    previewHint: 'انسيابي',
  },
  {
    id: 'fade',
    label: 'تلاشي ناعم',
    description: 'تظهر الشريحة تدريجياً بهدوء ونعومة للعين',
    previewHint: 'هادئ',
  },
  {
    id: 'zoom',
    label: 'تكبير وتقريب',
    description: 'تبرز الشريحة للأمام بتكبير واضح وجذاب للطلاب',
    previewHint: 'ملفت',
  },
  {
    id: 'flip',
    label: 'تقليب ثلاثي الأبعاد',
    description: 'تلتف الشريحة كصفحة كتاب ثلاثية الأبعاد',
    previewHint: '3D',
  },
  {
    id: 'curtain',
    label: 'ستارة مسرحية',
    description: 'تنفتح الشريحة من المنتصف كستارة العرض المسرحي',
    previewHint: 'استعراضي',
  },
  {
    id: 'cube',
    label: 'التفاف دوّار',
    description: 'دوران مجسّم مميز عند الانتقال بين كل شريحة وأخرى',
    previewHint: 'مجسم',
  },
];

export function getTransitionClassName(
  enabled: boolean,
  type: SlideTransitionType,
  direction: 'next' | 'prev' = 'next'
): string {
  if (!enabled || type === 'none') return '';
  switch (type) {
    case 'fade':
      return 'ppt-anim-fade';
    case 'slide':
      return direction === 'prev' ? 'ppt-anim-slide-prev' : 'ppt-anim-slide-next';
    case 'zoom':
      return 'ppt-anim-zoom';
    case 'flip':
      return 'ppt-anim-flip';
    case 'curtain':
      return 'ppt-anim-curtain';
    case 'cube':
      return 'ppt-anim-cube';
    default:
      return '';
  }
}

export function getTransitionLabel(type: SlideTransitionType): string {
  if (type === 'none') return 'بدون انتقال';
  return SLIDE_TRANSITION_OPTIONS.find((o) => o.id === type)?.label || 'انزلاق جانبي';
}
