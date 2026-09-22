import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AdminSlideEditor } from './player/components/AdminSlideEditor.tsx';
import './index.css';

// Roteamento mínimo (sem router): apenas a rota /admin/editor/:lessonId sai do
// fluxo normal da landing page para abrir o Editor de Aulas do Player.
const adminEditorMatch = window.location.pathname.match(/^\/admin\/editor\/([^/]+)\/?$/);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {adminEditorMatch ? <AdminSlideEditor lessonId={decodeURIComponent(adminEditorMatch[1])} /> : <App />}
  </StrictMode>,
);
