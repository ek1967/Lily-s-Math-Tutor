import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/**
 * Phone-first column. The bottom nav disappears inside a study session: while
 * she is working, nothing else on screen may compete for her attention.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // While she is working on a question, nothing else may compete for attention
  // — and the nav bar would otherwise sit on top of the submit button.
  const inSession = pathname.startsWith('/study/') || pathname.startsWith('/practice/');

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <main className="mx-auto w-full max-w-[var(--shell-max)] flex-1 px-4 pb-6 pt-4">
        {children}
      </main>
      {!inSession && <BottomNav />}
    </div>
  );
}
