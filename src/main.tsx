import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyTheme, useSettings, watchSystemTheme } from '@/stores/settingsStore';
import { openDb } from '@/lib/db/open';
import { registerServiceWorker } from '@/lib/files/sharedIntake';
import './styles/index.css';

// The document is authored RTL; assert it so a stray edit cannot silently flip
// the whole layout to LTR.
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'he');

applyTheme(useSettings.getState().settings);
watchSystemTheme();

// Opening can fail in a private window or with site data blocked; the app runs
// from memory in that case rather than refusing to start.
void openDb();

// Handles the Android share sheet and lets the app open with no network.
registerServiceWorker();

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
