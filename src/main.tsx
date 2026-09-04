import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyTheme, useSettings, watchSystemTheme } from '@/stores/settingsStore';
import './styles/index.css';

// The document is authored RTL; assert it so a stray edit cannot silently flip
// the whole layout to LTR.
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'he');

applyTheme(useSettings.getState().settings);
watchSystemTheme();

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
