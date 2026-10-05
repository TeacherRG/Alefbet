export interface HebrewCluster {
  id: string; // "l{lineIndex}-c{clusterIndex}"
  originalText: string; // The complete string with base char + diacritics
  baseChar: string; // The base Hebrew char (e.g. "ב")
  letterId: number; // Mapped to 0..31 in LETTERS list
  isSpace: boolean;
  lineIndex: number;
  clusterIndex: number;
}

export function parseHebrewLineToClusters(lineText: string, lineIndex: number): HebrewCluster[] {
  const clusters: HebrewCluster[] = [];
  let clusterIndex = 0;

  let currentBaseChar = "";
  let currentDiacritics: string[] = [];

  const flushCluster = () => {
    if (currentBaseChar) {
      const originalText = currentBaseChar + currentDiacritics.join("");
      const hasDagesh = currentDiacritics.some(d => d === "\u05BC");
      const hasSinDot = currentDiacritics.some(d => d === "\u05C2");
      const letterId = mapToLetterId(currentBaseChar, hasDagesh, hasSinDot);

      clusters.push({
        id: `l${lineIndex}-c${clusterIndex}`,
        originalText,
        baseChar: currentBaseChar,
        letterId,
        isSpace: false,
        lineIndex,
        clusterIndex
      });
      clusterIndex++;
      currentBaseChar = "";
      currentDiacritics = [];
    }
  };

  for (let i = 0; i < lineText.length; i++) {
    const char = lineText[i];
    const code = char.charCodeAt(0);

    // Hebrew letter ranges (Alef 0x05D0 to Tav 0x05EA)
    const isHebrewLetter = code >= 0x05D0 && code <= 0x05EA;

    if (isHebrewLetter) {
      flushCluster();
      currentBaseChar = char;
    } else if (code >= 0x05B0 && code <= 0x05C7) {
      // It's a Hebrew vocalisation point (niqqud, dagesh, shin/sin dot)
      if (currentBaseChar) {
        currentDiacritics.push(char);
      } else {
        // Stray vowel point, treat as static punctuation/vowel
        clusters.push({
          id: `l${lineIndex}-c${clusterIndex}-stray-${i}`,
          originalText: char,
          baseChar: "",
          letterId: -1,
          isSpace: true,
          lineIndex,
          clusterIndex
        });
        clusterIndex++;
      }
    } else {
      // It's a space or another general punctuation character
      flushCluster();
      clusters.push({
        id: `l${lineIndex}-c${clusterIndex}-space-${i}`,
        originalText: char,
        baseChar: char,
        letterId: -1,
        isSpace: true,
        lineIndex,
        clusterIndex
      });
      clusterIndex++;
    }
  }

  // Flush the last cluster
  flushCluster();

  return clusters;
}

function mapToLetterId(baseChar: string, hasDagesh: boolean, hasSinDot: boolean): number {
  switch (baseChar) {
    case "א": return 0;
    case "ב": return hasDagesh ? 1 : 2; // 1 = Bet, 2 = Vet
    case "ג": return 3;
    case "ד": return 4;
    case "ה": return 5;
    case "ו": return 6;
    case "ז": return 7;
    case "ח": return 8;
    case "ט": return 9;
    case "י": return 10;
    case "כ": return hasDagesh ? 11 : 12; // 11 = Kaf, 12 = Khaf
    case "ך": return 13; // Khaf Sofit
    case "ל": return 14;
    case "מ": return 15;
    case "ם": return 16; // Mem Sofit
    case "נ": return 17;
    case "ן": return 18; // Nun Sofit
    case "ס": return 19;
    case "ע": return 20;
    case "פ": return hasDagesh ? 21 : 22; // 21 = Pei, 22 = Fei
    case "ף": return 23; // Fei Sofit
    case "צ": return 24;
    case "ץ": return 25; // Tsadi Sofit
    case "ק": return 26;
    case "ר": return 27;
    case "ש": return hasSinDot ? 29 : 28; // 28 = Shin, 29 = Sin
    case "ת": return hasDagesh ? 30 : 31; // 30 = Tav, 31 = Sav
    default: return -1;
  }
}
