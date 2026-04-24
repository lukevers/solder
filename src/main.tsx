import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@xyflow/react/dist/style.css';
import './index.css';
import App from './App';
import { installRuntimeLogging } from './lib/runtime-log';

/**
 * Install runtime logging before the first React render.
 *
 * This preserves the in-app log viewer for worker, audio, and lifecycle
 * issues without introducing a second dynamic module load during bootstrap.
 */
installRuntimeLogging();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
