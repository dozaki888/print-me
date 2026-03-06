import React from 'react';
import { useStore } from '../state/store.jsx';
import { Printer, LogView } from '@react95/icons';

const DESKTOP_STYLE = {
  position: 'fixed',
  inset: 0,
  bottom: '28px',
  backgroundColor: '#008080',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='2' height='2' fill='%23008080'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23007070'/%3E%3C/svg%3E")`,
  overflow: 'hidden',
};

const ICON_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '72px',
  cursor: 'default',
  userSelect: 'none',
  padding: '4px',
  color: '#fff',
  fontSize: '11px',
  textAlign: 'center',
  fontFamily: 'ms_sans_serif, sans-serif',
};

function DesktopIcon({ icon, label, onDoubleClick }) {
  return (
    <div style={ICON_STYLE} onDoubleClick={onDoubleClick}>
      {icon}
      <span style={{ marginTop: '4px', textShadow: '1px 1px 1px #000' }}>{label}</span>
    </div>
  );
}

export default function Desktop() {
  const { dispatch } = useStore();

  return (
    <div style={DESKTOP_STYLE}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', width: 'fit-content' }}>
        <DesktopIcon
          icon={<Printer variant="32x32_4" width={32} height={32} />}
          label="PrintMe"
          onDoubleClick={() => dispatch({ type: 'OPEN_WINDOW', payload: 'main' })}
        />
        <DesktopIcon
          icon={<LogView variant="32x32_4" width={32} height={32} />}
          label="Print Log"
          onDoubleClick={() => dispatch({ type: 'OPEN_WINDOW', payload: 'log' })}
        />
      </div>
    </div>
  );
}
