import React, { useRef } from 'react';
import { Modal, Button, TitleBar, Frame } from '@react95/core';
import { useStore } from '../state/store.jsx';

// Tool definitions: label, tooltip, action type
const TOOLS = [
  { label: 'B',  title: 'Bold',         action: 'bold' },
  { label: '2×', title: 'Double Width', action: 'dbl' },
  { label: '↔',  title: 'Center',       action: 'center' },
  { label: '→',  title: 'Right Align',  action: 'right' },
  { label: '─',  title: 'Divider',      action: 'divider' },
  { label: '▮',  title: 'Barcode',      action: 'barcode' },
  { label: '✂',  title: 'Cut Mark',     action: 'cut' },
  { label: '¶',  title: 'Feed',         action: 'feed' },
];

export default function ToolPalette() {
  const { state, dispatch } = useStore();

  function applyTool(action, textareaEl) {
    if (!textareaEl) return;

    const text = state.canvasText;
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const selectedText = text.slice(start, end);

    // Find current line boundaries
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', start);
    const lineEndFinal = lineEnd === -1 ? text.length : lineEnd;
    const currentLine = text.slice(lineStart, lineEndFinal);

    let newText, newCursor;

    switch (action) {
      case 'bold': {
        const sel = selectedText || currentLine;
        const selStart = selectedText ? start : lineStart;
        const selEnd = selectedText ? end : lineEndFinal;
        const tag = `[BOLD]${sel}[/BOLD]`;
        newText = text.slice(0, selStart) + tag + text.slice(selEnd);
        newCursor = selStart + tag.length;
        break;
      }
      case 'dbl': {
        const sel = selectedText || currentLine;
        const selStart = selectedText ? start : lineStart;
        const selEnd = selectedText ? end : lineEndFinal;
        const tag = `[DBL]${sel}[/DBL]`;
        newText = text.slice(0, selStart) + tag + text.slice(selEnd);
        newCursor = selStart + tag.length;
        break;
      }
      case 'center': {
        const wrapped = `[CENTER]${currentLine.replace(/^\[CENTER\]|\[\/CENTER\]$/g, '')}[/CENTER]`;
        newText = text.slice(0, lineStart) + wrapped + text.slice(lineEndFinal);
        newCursor = lineStart + wrapped.length;
        break;
      }
      case 'right': {
        const wrapped = `[RIGHT]${currentLine.replace(/^\[RIGHT\]|\[\/RIGHT\]$/g, '')}[/RIGHT]`;
        newText = text.slice(0, lineStart) + wrapped + text.slice(lineEndFinal);
        newCursor = lineStart + wrapped.length;
        break;
      }
      case 'divider': {
        const insert = '\n[DIVIDER]\n';
        newText = text.slice(0, start) + insert + text.slice(end);
        newCursor = start + insert.length;
        break;
      }
      case 'barcode': {
        const val = window.prompt('Enter barcode value:');
        if (!val) return;
        const insert = `\n[BARCODE]${val}[/BARCODE]\n`;
        newText = text.slice(0, start) + insert + text.slice(end);
        newCursor = start + insert.length;
        break;
      }
      case 'cut': {
        const insert = '\n[CUT]\n';
        newText = text.slice(0, start) + insert + text.slice(end);
        newCursor = start + insert.length;
        break;
      }
      case 'feed': {
        const insert = '\n[FEED]\n';
        newText = text.slice(0, start) + insert + text.slice(end);
        newCursor = start + insert.length;
        break;
      }
      default:
        return;
    }

    dispatch({ type: 'SET_CANVAS_TEXT', payload: newText });

    setTimeout(() => {
      textareaEl.selectionStart = textareaEl.selectionEnd = newCursor;
      textareaEl.focus();
    }, 0);
  }

  function handleToolClick(action) {
    // Find the textarea in the document
    const ta = document.querySelector('textarea');
    applyTool(action, ta);
  }

  return (
    <Modal
      id="palette-window"
      title="Tools"
      hasWindowButton={false}
      titleBarOptions={
        <TitleBar.Close onClick={() => dispatch({ type: 'CLOSE_WINDOW', payload: 'palette' })} />
      }
      dragOptions={{ defaultPosition: { x: 20, y: 80 } }}
      style={{ width: '86px' }}
    >
      <Modal.Content style={{ padding: '4px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2px',
          }}
        >
          {TOOLS.map((tool) => (
            <Button
              key={tool.action}
              title={tool.title}
              onClick={() => handleToolClick(tool.action)}
              style={{
                width: '34px',
                height: '30px',
                fontSize: '13px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Courier New', monospace",
                fontWeight: tool.action === 'bold' ? 'bold' : 'normal',
              }}
            >
              {tool.label}
            </Button>
          ))}
        </div>
      </Modal.Content>
    </Modal>
  );
}
