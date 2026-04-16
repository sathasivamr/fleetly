import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import { LiveDataProvider } from './context/LiveDataContext.jsx';
import { FlashProvider } from './context/FlashContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <FlashProvider>
          <SessionProvider>
            <LiveDataProvider>
              <App />
            </LiveDataProvider>
          </SessionProvider>
        </FlashProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
