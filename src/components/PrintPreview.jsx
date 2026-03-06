import React from 'react';
import { parseTagsToReact } from '../utils/tagParser.js';

const PAPER_STYLE = {
  background: '#fffef9',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '13px',
  lineHeight: '17px',
  padding: '8px 2px 2px 2px', // matches textarea's 2px side padding
  width: '100%',
  boxSizing: 'border-box',
  position: 'relative',
};

const TORN_TOP = {
  content: '""',
  display: 'block',
  height: '12px',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='12'%3E%3Cpath d='M0 12 Q5 0 10 12 Q15 0 20 12' fill='%23fffef9' stroke='%23ccc' stroke-width='1'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat-x',
  marginBottom: '8px',
};

export default function PrintPreview({ text }) {
  const elements = parseTagsToReact(text || '');

  return (
    <div style={PAPER_STYLE}>
      <div style={TORN_TOP} />
      {elements}
    </div>
  );
}
