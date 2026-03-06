import React, { createContext, useContext, useReducer } from 'react';

export const RECEIPT_TEMPLATE = `ACME GENERAL STORE
^123 Main Street
^(555) 867-5309
---
^EST. 1987 - OPEN 7 DAYS
---
Date: 01/01/2025      Rcpt: 0001
Cashier: USER1
---
Coffee - Large  x2         $9.00
Croissant       x1         $3.25
Orange Juice    x1         $3.75
---
Subtotal                  $16.00
Tax (8.5%)                 $1.36
---
*TOTAL                     $17.36*
---
^THANK YOU! COME AGAIN!
^30-day returns with receipt
~~~
///`;

export const TICKET_TEMPLATE = `^ADMIT ONE
---
^**EVENT TICKET**
^General Admission
---
Event: Summer Concert
Date:  07/04/2025
Time:  8:00 PM
Venue: City Park
---
Ticket #: 00042
||00042||
---
^NO REFUNDS
///`;

export const KITCHEN_TEMPLATE = `^**KITCHEN ORDER**
---
Table: 7          Order: #112
Server: Maria
Time: 11:45 AM
---
1x  Burger - med-rare
    no onions, add bacon
1x  Caesar Salad
    dressing on side
2x  Fries - well done
---
^** RUSH **
~~~
///`;

const initialState = {
  canvasText: RECEIPT_TEMPLATE,
  mode: 'edit',
  isMock: true,
  jobCount: 0,
  log: [],
  windows: {
    main: { open: true },
    palette: { open: true },
    log: { open: false },
    about: { open: false },
    progress: { open: false },
  },
  printerStatus: 'mock',
  piAddress: 'https://api.printme.club',
  serialPort: '/dev/ttyUSB0',
  baudRate: 19200,
  progressPercent: 0,
  progressMessage: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CANVAS_TEXT':
      return { ...state, canvasText: action.payload };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'TOGGLE_MOCK':
      return {
        ...state,
        isMock: !state.isMock,
        printerStatus: !state.isMock ? 'mock' : 'offline',
      };
    case 'ADD_LOG': {
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
      return { ...state, log: [...state.log, { ts, ...action.payload }] };
    }
    case 'CLEAR_LOG':
      return { ...state, log: [] };
    case 'INCREMENT_JOBS':
      return { ...state, jobCount: state.jobCount + 1 };
    case 'OPEN_WINDOW':
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload]: { ...state.windows[action.payload], open: true },
        },
      };
    case 'CLOSE_WINDOW':
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload]: { ...state.windows[action.payload], open: false },
        },
      };
    case 'SET_PRINTER_STATUS':
      return { ...state, printerStatus: action.payload };
    case 'SET_PI_ADDRESS':
      return { ...state, piAddress: action.payload };
    case 'SET_PROGRESS':
      return {
        ...state,
        progressPercent: action.payload.percent,
        progressMessage: action.payload.message,
      };
    case 'LOAD_TEMPLATE': {
      const templates = {
        receipt: RECEIPT_TEMPLATE,
        ticket: TICKET_TEMPLATE,
        kitchen: KITCHEN_TEMPLATE,
      };
      return { ...state, canvasText: templates[action.payload] || state.canvasText };
    }
    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
