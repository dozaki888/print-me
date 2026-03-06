import React from 'react';
import { Modal, Frame, Button, TitleBar } from '@react95/core';
import { Printer } from '@react95/icons';
import { useStore } from '../state/store.jsx';

export default function AboutWindow() {
  const { dispatch } = useStore();

  return (
    <Modal
      id="about-window"
      title="About PrintMe"
      hasWindowButton={false}
      titleBarOptions={
        <TitleBar.Close onClick={() => dispatch({ type: 'CLOSE_WINDOW', payload: 'about' })} />
      }
      dragOptions={{ defaultPosition: { x: 280, y: 150 } }}
      style={{ width: '340px' }}
      buttons={[{ value: 'OK', onClick: () => dispatch({ type: 'CLOSE_WINDOW', payload: 'about' }) }]}
      buttonsAlignment="center"
    >
      <Modal.Content style={{ textAlign: 'center', padding: '12px' }}>
        <Printer variant="32x32_4" width={48} height={48} />
        <div style={{ fontWeight: 'bold', fontSize: '16px', marginTop: '8px' }}>
          PrintMe
        </div>
        <div style={{ fontSize: '12px', color: '#444', marginBottom: '12px' }}>
          Version 1.0.0
        </div>
        <Frame
          boxShadow="$input"
          style={{
            padding: '8px',
            fontSize: '11px',
            fontFamily: "'Courier New', monospace",
            textAlign: 'left',
            lineHeight: '1.6',
            backgroundColor: '#fff',
          }}
        >
          <div>Printer: Epson TM-U220D (M188D)</div>
          <div>Interface: USB-Serial (FTDI)</div>
          <div>Host: Raspberry Pi 3B+</div>
          <div>Protocol: ESC/P</div>
          <div style={{ marginTop: '6px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
            UI: React + React95
          </div>
          <div>Dev: Vite + GitHub Codespaces</div>
        </Frame>
      </Modal.Content>
    </Modal>
  );
}
