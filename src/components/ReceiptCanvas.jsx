import React, { useState, useCallback } from 'react';
import { Frame } from '@react95/core';
import { useStore } from '../state/store.jsx';
import PrintPreview from './PrintPreview.jsx';
import { getOverLimitLines, getLineInfo } from '../utils/constraints.js';

const LINE_HEIGHT = 17;

// Set font on the pane wrapper so '40ch' is always measured in Courier New.
const PANE_WRAPPER = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '13px',
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const LABEL = {
  fontSize: '10px',
  color: '#666',
  marginBottom: '2px',
  fontFamily: 'ms_sans_serif, sans-serif',
  flexShrink: 0,
};

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
    <div style={{ display: 'flex', gap: '6px', height: '100%' }}>

      {/* ── Edit pane ── */}
      <div style={PANE_WRAPPER}>
        <div style={LABEL}>EDIT</div>
        <Frame
          boxShadow="$input"
          style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}
        >
          {/* Red highlight overlay */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
            {overLimitLines.map((lineIdx) => (
              <div
                key={lineIdx}
                style={{
                  position: 'absolute',
                  top: `${lineIdx * LINE_HEIGHT + 2}px`,
                  left: 0,
                  right: 0,
                  height: `${LINE_HEIGHT}px`,
                  backgroundColor: 'rgba(255, 60, 60, 0.18)',
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
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: `${LINE_HEIGHT}px`,
              width: '100%',
              height: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
              padding: '2px',
              display: 'block',
              backgroundColor: '#ffffff',
              overflowY: 'auto',
              overflowX: 'hidden',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              position: 'relative',
              zIndex: 2,
            }}
          />

          {/* Col / limit indicator */}
          <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '4px',
            fontSize: '10px',
            color: lineInfo.stripped.length > lineInfo.limit ? '#cc0000' : '#888',
            zIndex: 3,
            pointerEvents: 'none',
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '0 2px',
          }}>
            Col: {lineInfo.col} / {lineInfo.limit}
          </div>
        </Frame>
      </div>

      {/* ── Preview pane ── */}
      <div style={PANE_WRAPPER}>
        <div style={LABEL}>PREVIEW</div>
        <Frame
          boxShadow="$input"
          style={{ width: '100%', flex: 1, minHeight: 0, overflowY: 'auto' }}
        >
          <PrintPreview text={state.canvasText} />
        </Frame>
      </div>

    </div>
  );
}
