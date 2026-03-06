import '@react95/core/GlobalStyle';
import '@react95/core/themes/win95.css';

import React from 'react';
import { TaskBar, List } from '@react95/core';
import { AppProvider, useStore } from './state/store.jsx';
import Desktop from './components/Desktop';
import AppWindow from './components/AppWindow';
import LogWindow from './components/LogWindow';
import AboutWindow from './components/AboutWindow';

function AppContent() {
  const { state, dispatch } = useStore();

  return (
    <>
      <Desktop />

      {state.windows.main.open && <AppWindow />}
      {state.windows.log.open && <LogWindow />}
      {state.windows.about.open && <AboutWindow />}

      <TaskBar
        list={
          <List>
            <List.Item
              onClick={() => dispatch({ type: 'OPEN_WINDOW', payload: 'main' })}
            >
              PrintMe
            </List.Item>
            <List.Item
              onClick={() => dispatch({ type: 'OPEN_WINDOW', payload: 'log' })}
            >
              Print Log
            </List.Item>
          </List>
        }
      />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
