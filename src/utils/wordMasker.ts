// Utility to mask the target letter (or letter with madd) in a word
// for the large interactive word display in the quiz

export interface MaskSegment {
  text: string;
  isMasked: boolean;
  maddInfo?: string;
}

// Helper to remove harakat/diacritics for clean character comparison
export function stripHarakat(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u0651\u0652]/g, '');
}

/**
 * Creates segments of a word with the target letter (or letter + madd) masked.
 * @param fullWord The Tashkeel/original word, e.g. "بَابٌ" or "بَطَّةٌ" or "طَبِيبٌ"
 * @param targetLetter The char of the letter, e.g. "ب"
 * @param maddType The madd type: 'none' | 'alif' | 'waw' | 'yaa'
 */
export function getMaskedWordSegments(
  fullWord: string,
  targetLetter: string,
  maddType: 'none' | 'alif' | 'waw' | 'yaa' = 'none'
): MaskSegment[] {
  const cleanTarget = stripHarakat(targetLetter);

  // If there is a madd, we want to match and mask the target letter + its madd letter (e.g. ب + ا, or ب + و, or ب + ي)
  // Check if madd is specified and actually exists
  if (maddType !== 'none') {
    const maddLetterMap: Record<string, string> = {
      alif: 'ا',
      waw: 'و',
      yaa: 'ي'
    };
    const maddChar = maddLetterMap[maddType];

    if (maddChar) {
      // Build a regex that matches targetLetter (followed by optional harakat) followed by maddChar (and optional harakat)
      // Note: also handle alef variants like آ
      const pattern = new RegExp(
        `([${cleanTarget}][\\u064B-\\u065F\\u0670\\u0651\\u0652]*[${maddChar}\\u0649][\\u064B-\\u065F\\u0670\\u0651\\u0652]*)`,
        'g'
      );

      const parts = fullWord.split(pattern);
      if (parts.length > 1) {
        return parts
          .filter(part => part.length > 0)
          .map(part => {
            const cleanPart = stripHarakat(part);
            const isMatch = cleanPart.includes(cleanTarget) && (cleanPart.includes(maddChar) || cleanPart.includes('ى'));
            return {
              text: part,
              isMasked: isMatch,
              maddInfo: isMatch ? (maddType === 'alif' ? 'مد بالألف' : maddType === 'waw' ? 'مد بالواو' : 'مد بالياء') : undefined
            };
          });
      }
    }
  }

  // Fallback or plain letter without madd:
  // Match target letter with any attached harakat/shaddah
  const letterPattern = new RegExp(
    `([${cleanTarget}][\\u064B-\\u065F\\u0670\\u0651\\u0652]*)`,
    'g'
  );

  const parts = fullWord.split(letterPattern);
  if (parts.length > 1) {
    let maskedOnce = false; // mask first or all occurrences
    return parts
      .filter(part => part.length > 0)
      .map(part => {
        const cleanPart = stripHarakat(part);
        if (cleanPart.includes(cleanTarget) && !maskedOnce) {
          maskedOnce = true;
          return {
            text: part,
            isMasked: true
          };
        }
        return {
          text: part,
          isMasked: false
        };
      });
  }

  // If regex didn't split (e.g. slight unicode mismatch), return as-is
  return [{ text: fullWord, isMasked: false }];
}
