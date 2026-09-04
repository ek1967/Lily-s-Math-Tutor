import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { HomeRoute } from '@/routes/HomeRoute';
import { LearnRoute } from '@/routes/LearnRoute';
import { HomeworkRoute } from '@/routes/HomeworkRoute';
import { SettingsRoute } from '@/routes/SettingsRoute';
import { NotFoundRoute } from '@/routes/NotFoundRoute';

/**
 * HashRouter, not BrowserRouter: GitHub Pages cannot rewrite unknown paths to
 * index.html, so a real path would 404 on refresh and on any deep link.
 */
export function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/learn" element={<LearnRoute />} />
          <Route path="/homework" element={<HomeworkRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
