import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RichTextProvider } from './contexts/RichTextContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RichTextProvider>
      <App />
    </RichTextProvider>
  </StrictMode>,
);
