import React, { useState, useCallback } from 'react';
import { Frame } from '@react95/core';
import { useStore } from '../state/store.jsx';
import PrintPreview from './PrintPreview.jsx';
import { getOverLimitLines, getLineInfo } from '../utils/constraints.js';

const LINE_HEIGHT = 17;
const CHAR_WIDTH_CH = 40;
const CANVAS_HEIGHT = 400;

export default function ReceiptCanvas({ textareaRef }) {
  const { state, dispatch } = useStore();
  const [cursorPos, setCursorPos] = useState(0);

  const overLimitLines = getOverLimitLines(state.canvasText);
  const lineInfo = getLineInfo(state.canvasText, cursorPos);

  const handleChange = useCallback((e) => {
    dispatch({ type: 'SET_CANVAS_TEXT', payload: e.target.value });
  }, [dispatch]);

  const handleSelect = useCallback((e) => {
    setCursorPos(e.target.selectionStart);
  }, []);

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {/* ── Edit pane ── */}
      <div>
        <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px', fontFamily: 'ms_sans_serif, sans-serif' }}>
          EDIT
        </div>
        <Frame
          boxShadow="$input"
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* Red highlight overlay for over-limit lines */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {overLimitLines.map((lineIdx) => (
              <div
                key={lineIdx}
                style={{
                  position: 'absolute',
                  top: `${lineIdx * LINE_HEIGHT + 2}px`,
                  left: '2px',
                  right: '2px',
                  height: `${LINE_HEIGHT}px`,
                  backgroundColor: 'rgba(255, 60, 60, 0.18)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={state.canvasText}
            onChange={handleChange}
            onSelect={handleSelect}
            onClick={handleSelect}
            onKeyUp={handleSelect}
            spellCheck={false}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '13px',
              lineHeight: `${LINE_HEIGHT}px`,
              width: `${CHAR_WIDTH_CH}ch`,
              minWidth: `${CHAR_WIDTH_CH}ch`,
              maxWidth: `${CHAR_WIDTH_CH}ch`,
              height: `${CANVAS_HEIGHT}px`,
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              padding: '2px',
              position: 'relative',
              zIndex: 2,
              overflowX: 'hidden',
              overflowY: 'auto',
              display: 'block',
              backgroundColor: '#ffffff',
            }}
            wrap="off"
          />

          {/* Col / limit indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '4px',
              fontSize: '10px',
              color: lineInfo.stripped.length > lineInfo.limit ? '#cc0000' : '#888',
              zIndex: 3,
              pointerEvents: 'none',
              backgroundColor: 'rgba(255,255,255,0.8)',
              padding: '0 2px',
            }}
          >
            Col: {lineInfo.col} / {lineInfo.limit}
          </div>
        </Frame>
      </div>

      {/* ── Preview pane ── */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px', fontFamily: 'ms_sans_serif, sans-serif' }}>
          PREVIEW
        </div>
        <Frame
          boxShadow="$input"
          style={{ height: `${CANVAS_HEIGHT}px`, overflowY: 'auto' }}
        >
          <PrintPreview text={state.canvasText} />
        </Frame>
      </div>
    </div>
  );
}
