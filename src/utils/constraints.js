// Strip markup tokens before counting printable characters
export function stripTags(line) {
  return line
    .replace(/\*\*([^*]*)\*\*/g, '$1') // **double** → content
    .replace(/\*([^*]*)\*/g, '$1')      // *bold* → content
    .replace(/\|\|([^|]*)\|\|/g, '$1') // ||barcode|| → content
    .replace(/^\^/, '')                 // ^ center prefix
    .replace(/^>/, '');                 // > right prefix
}

export function getLineLimit(line) {
  // Double-width (**text**) halves the character capacity
  return /\*\*[^*]+\*\*/.test(line) ? 20 : 40;
}

export function getOverLimitLines(text) {
  return text.split('\n').reduce((acc, line, i) => {
    const trimmed = line.trim();
    // Standalone tokens have no char limit
    if (trimmed === '---' || trimmed === '///' || trimmed === '~~~') return acc;
    const stripped = stripTags(line);
    if (stripped.length > getLineLimit(line)) acc.push(i);
    return acc;
  }, []);
}

export function getLineInfo(text, cursorPos) {
  const before = text.slice(0, cursorPos);
  const lineIdx = (before.match(/\n/g) || []).length;
  const lines = text.split('\n');
  const currentLine = lines[lineIdx] || '';
  const lineStart = before.lastIndexOf('\n') + 1;
  const col = cursorPos - lineStart;
  const stripped = stripTags(currentLine);
  return {
    lineIdx,
    col,
    lineCount: lines.length,
    stripped,
    limit: getLineLimit(currentLine),
  };
}
