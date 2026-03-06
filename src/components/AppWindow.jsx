import React, { useRef } from 'react';
import { Modal, Button, Frame, List, ProgressBar, TitleBar } from '@react95/core';
import { Printer } from '@react95/icons';
import { useStore } from '../state/store.jsx';
import ReceiptCanvas from './ReceiptCanvas.jsx';
import { buildEscPosBuffer } from '../utils/escpos.js';
import { getOverLimitLines } from '../utils/constraints.js';

const TOOLS = [
  { label: 'B',  title: 'Bold',         action: 'bold',    style: { fontWeight: 'bold' } },
  { label: '2×', title: 'Double Width', action: 'dbl',     style: {} },
  { label: '↔',  title: 'Center',       action: 'center',  style: {} },
  { label: '→',  title: 'Right Align',  action: 'right',   style: {} },
  { label: '─',  title: 'Divider',      action: 'divider', style: {} },
  { label: '▮',  title: 'Barcode',      action: 'barcode', style: {} },
  { label: '✂',  title: 'Cut Mark',     action: 'cut',     style: {} },
  { label: '¶',  title: 'Feed',         action: 'feed',    style: {} },
];

const STEPS = [
  { message: 'Opening serial port...', percent: 20 },
  { message: 'ESC/P init sequence (1B 40)...', percent: 40 },
  { message: 'Writing data buffer...', percent: 65 },
  { message: 'Flushing buffer...', percent: 80 },
  { message: 'Paper feed...', percent: 95 },
  { message: 'Done!', percent: 100 },
];

export default function AppWindow() {
  const { state, dispatch } = useStore();
  const textareaRef = useRef(null);

  const addLog = (message, type = 'default') =>
    dispatch({ type: 'ADD_LOG', payload: { message, type } });

  async function runPrintJob() {
    dispatch({ type: 'OPEN_WINDOW', payload: 'progress' });

    const overLimit = getOverLimitLines(state.canvasText);
    if (overLimit.length > 0) {
      addLog(`[WARN] ${overLimit.length} line(s) exceed char limit — printing anyway`, 'warning');
    }

    const buffer = buildEscPosBuffer(state.canvasText);

    if (state.isMock) {
      for (const step of STEPS) {
        dispatch({ type: 'SET_PROGRESS', payload: step });
        addLog(`[INFO] ${step.message}`, 'info');
        await new Promise(r => setTimeout(r, 400));
      }
      dispatch({ type: 'INCREMENT_JOBS' });
      addLog('[OK] Print job completed (mock)', 'ok');
      dispatch({ type: 'CLOSE_WINDOW', payload: 'progress' });
    } else {
      try {
        for (let i = 0; i < STEPS.length - 1; i++) {
          dispatch({ type: 'SET_PROGRESS', payload: STEPS[i] });
          addLog(`[INFO] ${STEPS[i].message}`, 'info');
          await new Promise(r => setTimeout(r, 200));
        }
        const res = await fetch(`http://${state.piAddress}/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: state.canvasText,
            escapedBuffer: Array.from(buffer),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        dispatch({ type: 'SET_PROGRESS', payload: STEPS[STEPS.length - 1] });
        dispatch({ type: 'INCREMENT_JOBS' });
        addLog('[OK] Print job sent to printer', 'ok');
        dispatch({ type: 'CLOSE_WINDOW', payload: 'progress' });
      } catch (err) {
        addLog(`[ERR] ${err.message}`, 'error');
        dispatch({ type: 'SET_PROGRESS', payload: { percent: 0, message: `Error: ${err.message}` } });
        dispatch({ type: 'CLOSE_WINDOW', payload: 'progress' });
      }
    }
  }

  function handleInsertTag(tag) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = state.canvasText;
    const newText = text.slice(0, start) + tag + text.slice(end);
    dispatch({ type: 'SET_CANVAS_TEXT', payload: newText });
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + tag.length;
      ta.focus();
    }, 0);
  }

  function applyTool(action) {
    const ta = textareaRef.current;
    if (!ta) return;
    const text = state.canvasText;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selectedText = text.slice(start, end);
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', start);
    const lineEndFinal = lineEnd === -1 ? text.length : lineEnd;
    const currentLine = text.slice(lineStart, lineEndFinal);

    let newText, newCursor;

    switch (action) {
      case 'bold': {
        const sel = selectedText || currentLine;
        const s = selectedText ? start : lineStart;
        const e = selectedText ? end : lineEndFinal;
        const tag = `*${sel}*`;
        newText = text.slice(0, s) + tag + text.slice(e);
        newCursor = s + tag.length;
        break;
      }
      case 'dbl': {
        const sel = selectedText || currentLine;
        const s = selectedText ? start : lineStart;
        const e = selectedText ? end : lineEndFinal;
        const tag = `**${sel}**`;
        newText = text.slice(0, s) + tag + text.slice(e);
        newCursor = s + tag.length;
        break;
      }
      case 'center': {
        const inner = currentLine.replace(/^\^/, '');
        const wrapped = `^${inner}`;
        newText = text.slice(0, lineStart) + wrapped + text.slice(lineEndFinal);
        newCursor = lineStart + wrapped.length;
        break;
      }
      case 'right': {
        const inner = currentLine.replace(/^>/, '');
        const wrapped = `>${inner}`;
        newText = text.slice(0, lineStart) + wrapped + text.slice(lineEndFinal);
        newCursor = lineStart + wrapped.length;
        break;
      }
      case 'divider': {
        const ins = '\n---\n';
        newText = text.slice(0, start) + ins + text.slice(end);
        newCursor = start + ins.length;
        break;
      }
      case 'barcode': {
        const val = window.prompt('Enter barcode value:');
        if (!val) return;
        const ins = `\n||${val}||\n`;
        newText = text.slice(0, start) + ins + text.slice(end);
        newCursor = start + ins.length;
        break;
      }
      case 'cut': {
        const ins = '\n///\n';
        newText = text.slice(0, start) + ins + text.slice(end);
        newCursor = start + ins.length;
        break;
      }
      case 'feed': {
        const ins = '\n~~~\n';
        newText = text.slice(0, start) + ins + text.slice(end);
        newCursor = start + ins.length;
        break;
      }
      default:
        return;
    }

    dispatch({ type: 'SET_CANVAS_TEXT', payload: newText });
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = newCursor;
      ta.focus();
    }, 0);
  }

  const statusLED = { mock: '🟡', online: '🟢', offline: '🔴', checking: '🟡' };

  const fileMenu = (
    <List>
      <List.Item onClick={() => dispatch({ type: 'LOAD_TEMPLATE', payload: 'receipt' })}>
        New Receipt
      </List.Item>
      <List.Item onClick={() => dispatch({ type: 'LOAD_TEMPLATE', payload: 'ticket' })}>
        New Ticket
      </List.Item>
      <List.Item onClick={() => dispatch({ type: 'LOAD_TEMPLATE', payload: 'kitchen' })}>
        New Kitchen Order
      </List.Item>
      <List.Divider />
      <List.Item onClick={() => dispatch({ type: 'SET_CANVAS_TEXT', payload: '' })}>
        Clear Canvas
      </List.Item>
      <List.Divider />
      <List.Item onClick={() => dispatch({ type: 'CLOSE_WINDOW', payload: 'main' })}>
        Exit
      </List.Item>
    </List>
  );

  const formatMenu = (
    <List>
      <List.Item onClick={() => handleInsertTag('**')}>Bold  (*text*)</List.Item>
      <List.Item onClick={() => handleInsertTag('****')}>Double Width  (**text**)</List.Item>
      <List.Item onClick={() => handleInsertTag('^')}>Center  (^ prefix)</List.Item>
      <List.Item onClick={() => handleInsertTag('>')}>Right Align  (&gt; prefix)</List.Item>
      <List.Divider />
      <List.Item onClick={() => handleInsertTag('\n---\n')}>Insert Divider  (---)</List.Item>
      <List.Item onClick={() => {
        const val = prompt('Barcode value:');
        if (val) handleInsertTag(`||${val}||`);
      }}>Insert Barcode  (||val||)</List.Item>
      <List.Item onClick={() => handleInsertTag('\n///\n')}>Insert Cut Mark  (///)</List.Item>
      <List.Item onClick={() => handleInsertTag('\n~~~\n')}>Insert Feed  (~~~)</List.Item>
    </List>
  );

  const printerMenu = (
    <List>
      <List.Item onClick={async () => {
        if (state.isMock) { addLog('[INFO] Mock mode — no real status', 'info'); return; }
        dispatch({ type: 'SET_PRINTER_STATUS', payload: 'checking' });
        try {
          const res = await fetch(`http://${state.piAddress}/status`);
          const data = await res.json();
          dispatch({ type: 'SET_PRINTER_STATUS', payload: data.online ? 'online' : 'offline' });
          addLog(`[INFO] Printer ${data.online ? 'ONLINE' : 'OFFLINE'} on ${data.port}`, 'info');
        } catch {
          dispatch({ type: 'SET_PRINTER_STATUS', payload: 'offline' });
          addLog('[ERR] Could not reach printer server', 'error');
        }
      }}>Check Printer Status</List.Item>
      <List.Item onClick={runPrintJob}>Print Now</List.Item>
      <List.Divider />
      <List.Item onClick={() => dispatch({ type: 'TOGGLE_MOCK' })}>
        Toggle Mock Mode {state.isMock ? '(ON)' : '(OFF)'}
      </List.Item>
    </List>
  );

  const helpMenu = (
    <List>
      <List.Item onClick={() => dispatch({ type: 'OPEN_WINDOW', payload: 'about' })}>
        About PrintMaster 95...
      </List.Item>
    </List>
  );

  const lines = state.canvasText.split('\n').length;

  return (
    <>
      <Modal
        id="main-window"
        title="PrintMaster 95 — Epson TM-U220D"
        icon={<Printer variant="16x16_4" width={16} height={16} />}
        hasWindowButton={true}
        menu={[
          { name: 'File', list: fileMenu },
          { name: 'Format', list: formatMenu },
          { name: 'Printer', list: printerMenu },
          { name: 'Help', list: helpMenu },
        ]}
        titleBarOptions={
          <>
            <Modal.Minimize />
            <TitleBar.Close onClick={() => dispatch({ type: 'CLOSE_WINDOW', payload: 'main' })} />
          </>
        }
        dragOptions={{ defaultPosition: { x: 60, y: 30 } }}
        style={{ width: '720px', height: '620px' }}
      >
        <Modal.Content>
          {/* Toolbar row */}
          <Frame
            boxShadow="$out"
            style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '3px 6px', flexWrap: 'wrap' }}
          >
            {TOOLS.map((tool, i) => (
              <React.Fragment key={tool.action}>
                {/* Separator before Divider tool */}
                {i === 4 && (
                  <div style={{ width: '1px', height: '20px', background: '#888', margin: '0 4px' }} />
                )}
                <Button
                  title={tool.title}
                  onClick={() => applyTool(tool.action)}
                  style={{
                    minWidth: '32px',
                    height: '24px',
                    padding: '0 6px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Courier New', monospace",
                    ...tool.style,
                  }}
                >
                  {tool.label}
                </Button>
              </React.Fragment>
            ))}
          </Frame>

          {/* Canvas — flex: 1 so it fills remaining height */}
          <div style={{ flex: 1, minHeight: 0, padding: '2px 4px', overflow: 'hidden' }}>
            <ReceiptCanvas textareaRef={textareaRef} />
          </div>

          {/* Bottom action row */}
          <Frame
            display="flex"
            alignItems="center"
            padding="$2"
            style={{ gap: '8px', marginTop: '4px' }}
          >
            <Button onClick={runPrintJob} style={{ fontWeight: 'bold' }}>
              Send to Printer
            </Button>
            <Button onClick={() => dispatch({ type: 'LOAD_TEMPLATE', payload: 'receipt' })}>
              Reset
            </Button>
            <ProgressBar
              percent={state.progressPercent}
              width="140px"
              style={{ flex: 1 }}
            />
          </Frame>

          {/* Status bar */}
          <Frame
            display="flex"
            padding="$2"
            style={{ gap: '8px', fontSize: '11px', borderTop: '1px solid #999' }}
          >
            <Frame boxShadow="$in" style={{ padding: '1px 6px', fontSize: '11px', minWidth: '64px' }}>
              {state.mode.toUpperCase()}
            </Frame>
            <Frame boxShadow="$in" style={{ padding: '1px 6px', fontSize: '11px' }}>
              Lines: {lines}
            </Frame>
            <Frame boxShadow="$in" style={{ padding: '1px 6px', fontSize: '11px', flex: 1 }}>
              {statusLED[state.printerStatus] || '🟡'}{' '}
              {state.printerStatus.toUpperCase()}
            </Frame>
            <Frame boxShadow="$in" style={{ padding: '1px 6px', fontSize: '11px' }}>
              Jobs: {state.jobCount}
            </Frame>
          </Frame>
        </Modal.Content>
      </Modal>

      {/* Progress window */}
      {state.windows.progress.open && (
        <Modal
          id="progress-window"
          title="Printing..."
          hasWindowButton={false}
          dragOptions={{ defaultPosition: { x: 250, y: 220 } }}
          style={{ width: '320px' }}
          buttons={[{ value: 'Cancel', onClick: () => dispatch({ type: 'CLOSE_WINDOW', payload: 'progress' }) }]}
        >
          <Modal.Content style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ marginBottom: '8px', fontSize: '12px' }}>
              {state.progressMessage || 'Preparing...'}
            </div>
            <ProgressBar percent={state.progressPercent} width="260px" />
          </Modal.Content>
        </Modal>
      )}
    </>
  );
}
