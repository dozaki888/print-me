import React, { useEffect, useRef } from 'react';
import { Modal, Button, Frame, TitleBar } from '@react95/core';
import { useStore } from '../state/store.jsx';

const LOG_COLORS = {
  default: '#c0c0c0',
  ok:      '#00c000',
  error:   '#ff4040',
  info:    '#4080ff',
  warning: '#c0a000',
};

export default function LogWindow() {
  const { state, dispatch } = useStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.log]);

  return (
    <Modal
      id="log-window"
      title="Print Log"
      hasWindowButton={true}
      titleBarOptions={
        <TitleBar.Close onClick={() => dispatch({ type: 'CLOSE_WINDOW', payload: 'log' })} />
      }
      dragOptions={{ defaultPosition: { x: 400, y: 200 } }}
      style={{ width: '480px' }}
    >
      <Modal.Content>
        <Frame
          boxShadow="$input"
          style={{
            height: '280px',
            overflowY: 'auto',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '11px',
            padding: '4px 6px',
            backgroundColor: '#000',
          }}
        >
          {state.log.length === 0 ? (
            <span style={{ color: '#555' }}>No log entries yet.</span>
          ) : (
            state.log.map((entry, i) => (
              <div key={i} style={{ color: LOG_COLORS[entry.type] || LOG_COLORS.default }}>
                <span style={{ color: '#666' }}>[{entry.ts}]</span>{' '}
                {entry.message}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </Frame>

        <Frame display="flex" style={{ gap: '6px', marginTop: '6px', padding: '2px 0' }}>
          <Button onClick={() => dispatch({ type: 'CLEAR_LOG' })}>Clear Log</Button>
          <Button onClick={() => dispatch({ type: 'CLOSE_WINDOW', payload: 'log' })}>Close</Button>
        </Frame>
      </Modal.Content>
    </Modal>
  );
}
