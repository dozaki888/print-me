// ESC/P commands for Epson TM-U220D
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

const INIT        = [ESC, 0x40];
const BOLD_ON     = [ESC, 0x45, 0x01];
const BOLD_OFF    = [ESC, 0x45, 0x00];
const DBL_ON      = [ESC, 0x57, 0x01];
const DBL_OFF     = [ESC, 0x57, 0x00];
const ALIGN_LEFT  = [ESC, 0x61, 0x00];
const ALIGN_CTR   = [ESC, 0x61, 0x01];
const ALIGN_RIGHT = [ESC, 0x61, 0x02];
const FEED_3      = [ESC, 0x64, 0x03];
const CUT_FULL    = [GS,  0x56, 0x00];

function strBytes(str) {
  return Array.from(str).map(ch => ch.charCodeAt(0) & 0xff);
}

export function buildEscPosBuffer(text) {
  const bytes = [...INIT];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();

    // Standalone tokens
    if (trimmed === '---') {
      bytes.push(...ALIGN_LEFT, ...strBytes('----------------------------------------'), LF);
      continue;
    }
    if (trimmed === '///') {
      bytes.push(...CUT_FULL);
      continue;
    }
    if (trimmed === '~~~') {
      bytes.push(...FEED_3);
      continue;
    }

    // Alignment prefix
    let content = line;
    if (line.startsWith('^')) {
      bytes.push(...ALIGN_CTR);
      content = line.slice(1);
    } else if (line.startsWith('>')) {
      bytes.push(...ALIGN_RIGHT);
      content = line.slice(1);
    } else {
      bytes.push(...ALIGN_LEFT);
    }

    // Inline markup — split on **...** *...* ||...||
    const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\|\|[^|]+\|\|)/);

    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('**') && part.endsWith('**')) {
        bytes.push(...DBL_ON, ...strBytes(part.slice(2, -2)), ...DBL_OFF);
      } else if (part.startsWith('*') && part.endsWith('*')) {
        bytes.push(...BOLD_ON, ...strBytes(part.slice(1, -1)), ...BOLD_OFF);
      } else if (part.startsWith('||') && part.endsWith('||')) {
        const val = part.slice(2, -2);
        bytes.push(GS, 0x6b, 0x04, ...strBytes(val), 0x00);
      } else {
        bytes.push(...strBytes(part));
      }
    }

    bytes.push(...ALIGN_LEFT, LF);
  }

  return new Uint8Array(bytes);
}

export function bufferToBase64(buf) {
  return btoa(String.fromCharCode(...buf));
}
