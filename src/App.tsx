import { Suspense, lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { HomeRoute } from '@/routes/HomeRoute';

/**
 * HashRouter, not BrowserRouter: GitHub Pages cannot rewrite unknown paths to
 * index.html, so a real path would 404 on refresh and on any deep link.
 *
 * Every route except the home screen is loaded on demand. That keeps the
 * Anthropic SDK, KaTeX and pdf.js out of the first load — daily practice is
 * what she opens every day, and it should not wait on the homework machinery.
 */
const LearnRoute = lazy(() => import('@/routes/LearnRoute').then((m) => ({ default: m.LearnRoute })));
const TopicRoute = lazy(() => import('@/routes/TopicRoute').then((m) => ({ default: m.TopicRoute })));
const PracticeRoute = lazy(() => import('@/routes/PracticeRoute').then((m) => ({ default: m.PracticeRoute })));
const ReviewRoute = lazy(() => import('@/routes/ReviewRoute').then((m) => ({ default: m.ReviewRoute })));
const StudyRoute = lazy(() => import('@/routes/StudyRoute').then((m) => ({ default: m.StudyRoute })));
const ChatRoute = lazy(() => import('@/routes/ChatRoute').then((m) => ({ default: m.ChatRoute })));
const HomeworkRoute = lazy(() => import('@/routes/HomeworkRoute').then((m) => ({ default: m.HomeworkRoute })));
const MaterialRoute = lazy(() => import('@/routes/MaterialRoute').then((m) => ({ default: m.MaterialRoute })));
const SettingsRoute = lazy(() => import('@/routes/SettingsRoute').then((m) => ({ default: m.SettingsRoute })));
const ParentRoute = lazy(() => import('@/routes/ParentRoute').then((m) => ({ default: m.ParentRoute })));
const DevGeneratorsRoute = lazy(() => import('@/routes/DevGeneratorsRoute').then((m) => ({ default: m.DevGeneratorsRoute })));
const NotFoundRoute = lazy(() => import('@/routes/NotFoundRoute').then((m) => ({ default: m.NotFoundRoute })));

export function App() {
  return (
    <HashRouter>
      <AppShell>
        {/* No spinner: on a fast connection the chunk arrives before a spinner
            would finish fading in, and a flash of one reads as breakage. */}
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/learn" element={<LearnRoute />} />
            <Route path="/learn/:topicId" element={<TopicRoute />} />
            <Route path="/practice/:topicId" element={<PracticeRoute />} />
            <Route path="/review" element={<ReviewRoute />} />
            <Route path="/study/:sessionId" element={<StudyRoute />} />
            <Route path="/chat/:threadId" element={<ChatRoute />} />
            <Route path="/homework" element={<HomeworkRoute />} />
            <Route path="/homework/:materialId" element={<MaterialRoute />} />
            <Route path="/settings" element={<SettingsRoute />} />
            <Route path="/parent" element={<ParentRoute />} />
            <Route path="/dev/generators" element={<DevGeneratorsRoute />} />
            <Route path="*" element={<NotFoundRoute />} />
          </Routes>
        </Suspense>
      </AppShell>
    </HashRouter>
  );
}
