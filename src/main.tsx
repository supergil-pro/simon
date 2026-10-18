import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted Heebo (bundled into dist, no external font requests)
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/600.css';
import '@fontsource/heebo/700.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
