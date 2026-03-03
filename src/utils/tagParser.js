import React from 'react';

export function parseTagsToReact(text) {
  return text.split('\n').map((line, i) => parseLine(line, i));
}

function parseLine(line, key) {
  const trimmed = line.trim();

  if (trimmed === '---') {
    return React.createElement('hr', {
      key,
      style: { border: 'none', borderTop: '1px dashed #555', margin: '2px 0' },
    });
  }

  if (trimmed === '///') {
    return React.createElement(
      'div',
      { key, style: { textAlign: 'center', letterSpacing: '3px', fontSize: '11px', margin: '4px 0' } },
      '\u2702 - - - - - - - - - - - - - - - - - - - -'
    );
  }

  if (trimmed === '~~~') {
    return React.createElement('div', { key, style: { height: '24px' } });
  }

  // Alignment prefix
  const alignStyle = {};
  let content = line;

  if (line.startsWith('^')) {
    alignStyle.textAlign = 'center';
    content = line.slice(1);
  } else if (line.startsWith('>')) {
    alignStyle.textAlign = 'right';
    content = line.slice(1);
  }

  const segments = tokenizeInline(content);

  return React.createElement(
    'div',
    { key, style: { ...alignStyle, minHeight: '1.2em', whiteSpace: 'pre' } },
    segments.map((seg, si) => renderSegment(seg, si))
  );
}

function tokenizeInline(text) {
  // Order matters: check ** before *
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\|\|[^|]+\|\|)/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', content: text.slice(lastIdx, match.index) });
    }
    const full = match[0];
    if (full.startsWith('**')) {
      parts.push({ type: 'dbl', content: full.slice(2, -2) });
    } else if (full.startsWith('*')) {
      parts.push({ type: 'bold', content: full.slice(1, -1) });
    } else if (full.startsWith('||')) {
      parts.push({ type: 'barcode', content: full.slice(2, -2) });
    }
    lastIdx = match.index + full.length;
  }

  if (lastIdx < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIdx) });
  }

  return parts.length ? parts : [{ type: 'text', content: text }];
}

function renderSegment(seg, key) {
  switch (seg.type) {
    case 'bold':
      return React.createElement('strong', { key }, seg.content);
    case 'dbl':
      return React.createElement(
        'span',
        { key, style: { fontSize: '1.6em', lineHeight: 1.1, display: 'inline-block' } },
        seg.content
      );
    case 'barcode':
      return React.createElement(
        'span',
        { key, style: { display: 'block', textAlign: 'center', margin: '4px 0' } },
        React.createElement(
          'span',
          { style: { display: 'block' } },
          seg.content.split('').map((ch, i) =>
            React.createElement('span', {
              key: i,
              style: {
                display: 'inline-block',
                width: i % 2 === 0 ? '3px' : '2px',
                height: '40px',
                backgroundColor: '#000',
                marginRight: '1px',
                verticalAlign: 'middle',
              },
            })
          )
        ),
        React.createElement(
          'span',
          { style: { fontSize: '10px', display: 'block', marginTop: '2px' } },
          seg.content
        )
      );
    default:
      return React.createElement('span', { key }, seg.content);
  }
}
