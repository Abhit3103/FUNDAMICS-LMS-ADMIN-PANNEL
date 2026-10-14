import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Validate environment at startup — throws if VITE_API_BASE_URL is missing
import './config/env';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('[FUNDAMICS] Root element #root not found in the DOM.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
