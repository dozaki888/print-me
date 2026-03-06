/**
 * PrintMe — ESC/P Print Server
 * Epson TM-U220D (M188D) via USB-serial (FTDI) on Raspberry Pi
 *
 * Usage:
 *   node server.js            → live mode, writes to serial port
 *   USE_MOCK=true node server.js  → mock mode, logs to console only
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const USE_MOCK  = process.env.USE_MOCK === 'true';
const PORT      = parseInt(process.env.PORT  || '3001', 10);
const SERIAL_PATH = process.env.SERIAL_PATH || '/dev/ttyUSB0';
const BAUD_RATE   = parseInt(process.env.BAUD_RATE || '9600', 10);

// ── ESC/P constants ──────────────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

const INIT        = [ESC, 0x40];           // ESC @  — initialise
const BOLD_ON     = [ESC, 0x45, 0x01];    // ESC E 1
const BOLD_OFF    = [ESC, 0x45, 0x00];    // ESC E 0
const DBL_ON      = [ESC, 0x57, 0x01];    // ESC W 1 — double width
const DBL_OFF     = [ESC, 0x57, 0x00];    // ESC W 0
const ALIGN_LEFT  = [ESC, 0x61, 0x00];    // ESC a 0
const ALIGN_CTR   = [ESC, 0x61, 0x01];    // ESC a 1
const ALIGN_RIGHT = [ESC, 0x61, 0x02];    // ESC a 2
const FEED_3      = [ESC, 0x64, 0x03];    // ESC d 3 — feed 3 lines
const CUT_FULL    = [GS,  0x56, 0x00];    // GS V 0  — full cut

function strBytes(str) {
  return Array.from(str).map(ch => ch.charCodeAt(0) & 0xff);
}

/**
 * Build a raw ESC/P buffer from the markdown-style receipt text.
 * Syntax:
 *   ---        → 40-dash divider
 *   ///        → full paper cut
 *   ~~~        → 3-line feed
 *   ^text      → centre-align line
 *   >text      → right-align line
 *   *text*     → bold inline
 *   **text**   → double-width inline
 *   ||val||    → CODE39 barcode
 */
function buildEscPosBuffer(text) {
  const bytes = [...INIT];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();

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

    // Split on inline tokens; process ** before *
    const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\|\|[^|]+\|\|)/);
    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('**') && part.endsWith('**')) {
        bytes.push(...DBL_ON, ...strBytes(part.slice(2, -2)), ...DBL_OFF);
      } else if (part.startsWith('*') && part.endsWith('*')) {
        bytes.push(...BOLD_ON, ...strBytes(part.slice(1, -1)), ...BOLD_OFF);
      } else if (part.startsWith('||') && part.endsWith('||')) {
        const val = part.slice(2, -2);
        // GS k — CODE39 barcode, NUL-terminated
        bytes.push(GS, 0x6b, 0x04, ...strBytes(val), 0x00);
      } else {
        bytes.push(...strBytes(part));
      }
    }

    bytes.push(...ALIGN_LEFT, LF);
  }

  return Buffer.from(bytes);
}

// ── Serial port (only opened in live mode) ───────────────────────────────────
let serialPort = null;

function openPort() {
  const { SerialPort } = require('serialport');
  serialPort = new SerialPort(
    { path: SERIAL_PATH, baudRate: BAUD_RATE },
    (err) => {
      if (err) {
        console.error(`[SERIAL] Failed to open ${SERIAL_PATH}: ${err.message}`);
        serialPort = null;
      } else {
        console.log(`[SERIAL] Opened ${SERIAL_PATH} @ ${BAUD_RATE} baud`);
      }
    }
  );

  serialPort.on('error', (err) => {
    console.error(`[SERIAL] Error: ${err.message}`);
  });
}

function writeToPort(buffer) {
  return new Promise((resolve, reject) => {
    if (!serialPort || !serialPort.isOpen) {
      return reject(new Error('Serial port is not open'));
    }
    serialPort.write(buffer, (err) => {
      if (err) return reject(err);
      serialPort.drain((err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  });
}

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// GET /status — health check
app.get('/status', (req, res) => {
  const online = USE_MOCK ? false : (serialPort?.isOpen ?? false);
  res.json({
    online,
    mock: USE_MOCK,
    port: SERIAL_PATH,
    baudRate: BAUD_RATE,
  });
});

// POST /print — receive receipt and send to printer
app.post('/print', async (req, res) => {
  const { rawText, escapedBuffer } = req.body;

  if (!rawText && !escapedBuffer) {
    return res.status(400).json({ error: 'rawText or escapedBuffer required' });
  }

  // Prefer the pre-built buffer from the frontend; fall back to building from rawText
  let printBuffer;
  if (escapedBuffer && Array.isArray(escapedBuffer)) {
    printBuffer = Buffer.from(escapedBuffer);
  } else {
    printBuffer = buildEscPosBuffer(rawText);
  }

  if (USE_MOCK) {
    console.log('\n[MOCK] ── Print job received ─────────────────────');
    console.log(`[MOCK] Buffer size: ${printBuffer.length} bytes`);
    console.log('[MOCK] ESC/P hex dump (first 64 bytes):');
    console.log(
      '[MOCK] ' +
      [...printBuffer.slice(0, 64)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ')
    );
    if (rawText) {
      console.log('[MOCK] Receipt text:\n');
      console.log(rawText.split('\n').map(l => '  ' + l).join('\n'));
    }
    console.log('[MOCK] ──────────────────────────────────────────\n');
    return res.json({ ok: true, mock: true, bytes: printBuffer.length });
  }

  // Live mode
  try {
    console.log(`[PRINT] Sending ${printBuffer.length} bytes to ${SERIAL_PATH}`);
    await writeToPort(printBuffer);
    console.log('[PRINT] Done');
    res.json({ ok: true, mock: false, bytes: printBuffer.length });
  } catch (err) {
    console.error(`[PRINT] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Static frontend (built app) ──────────────────────────────────────────────
const DIST = path.join(__dirname, '..', 'dist');
app.use(express.static(DIST));
app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));

// ── Start ────────────────────────────────────────────────────────────────────
if (!USE_MOCK) {
  openPort();
}

app.listen(PORT, () => {
  const mode = USE_MOCK ? 'MOCK (no serial writes)' : `LIVE → ${SERIAL_PATH} @ ${BAUD_RATE}`;
  console.log(`[SERVER] PrintMe print server running on port ${PORT}`);
  console.log(`[SERVER] Mode: ${mode}`);
});
