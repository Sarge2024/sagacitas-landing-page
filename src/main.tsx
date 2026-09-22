import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AdminSlideEditor } from './player/components/AdminSlideEditor.tsx';
import { ClassStudioIndex } from './player/components/ClassStudioIndex.tsx';
import './index.css';

// Roteamento mínimo (sem router): as rotas /class-studio e /class-studio/:lessonId
// saem do fluxo normal da landing page para abrir o Class Studio (ambiente de
// edição das aulas do Player).
const pathname = window.location.pathname;
const classStudioLessonMatch = pathname.match(/^\/class-studio\/([^/]+)\/?$/);
const isClassStudioIndex = /^\/class-studio\/?$/.test(pathname);

function renderRoute() {
  if (classStudioLessonMatch) {
    return <AdminSlideEditor lessonId={decodeURIComponent(classStudioLessonMatch[1])} />;
  }
  if (isClassStudioIndex) {
    return <ClassStudioIndex />;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{renderRoute()}</StrictMode>,
);
