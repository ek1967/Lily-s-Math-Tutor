import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { CURRICULUM, STRANDS } from '@/data/curriculum';
import { useSettings } from '@/stores/settingsStore';
import type { Topic } from '@/types/curriculum';
import { paths } from '@/router';

/**
 * The topic map exists for when she *wants* to choose — the daily flow never
 * asks her to. Grades are deliberately absent from the UI: a 13-year-old being
 * shown "grade 7" on a topic she is revising learns only that she is behind.
 */
export function LearnRoute() {
  const { settings } = useSettings();
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim();
    return CURRICULUM.filter((t) => {
      if (!settings.showExtensionTopics && t.tier === 'extension') return false;
      if (!q) return true;
      return (
        t.titleHe.includes(q) ||
        t.oneLinerHe.includes(q) ||
        t.keywords.some((k) => k.includes(q))
      );
    });
  }, [query, settings.showExtensionTopics]);

  return (
    <div>
      <PageHeader title="מפת הנושאים" subtitle="כל מה שאפשר ללמוד ולחזור עליו" />

      <label className="mb-5 block">
        <span className="sr-only">חיפוש נושא</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="לחפש נושא — למשל שברים, פיתגורס, אחוזים"
          className="tap w-full rounded-lg border border-line bg-surface px-4 py-3 text-base placeholder:text-ink-soft"
        />
      </label>

      {visible.length === 0 && (
        <p className="py-10 text-center text-ink-soft">לא מצאתי נושא כזה. אפשר לנסות מילה אחרת.</p>
      )}

      <div className="space-y-7">
        {STRANDS.map((strand) => {
          const topics = visible.filter((t) => t.strand === strand.id);
          if (topics.length === 0) return null;
          return (
            <section key={strand.id}>
              <h2 className="mb-3 flex items-center gap-2 text-lg">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: `rgb(var(${strand.cssVar}))` }}
                />
                {strand.titleHe}
                <span className="text-sm font-normal text-ink-soft">({topics.length})</span>
              </h2>
              <ul className="space-y-2">
                {topics.map((t) => (
                  <TopicRow key={t.id} topic={t} cssVar={strand.cssVar} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TopicRow({ topic, cssVar }: { topic: Topic; cssVar: string }) {
  return (
    <li>
      <Link
        to={paths.topic(topic.id)}
        className="card tap flex items-center gap-3 p-4 transition hover:bg-surface-2"
      >
        <span
          aria-hidden="true"
          className="h-10 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: `rgb(var(${cssVar}))` }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{topic.titleHe}</span>
          <span className="block truncate text-sm text-ink-soft">{topic.oneLinerHe}</span>
        </span>
        <span className="shrink-0 text-sm text-ink-soft">{topic.estimatedMinutes} דק׳</span>
      </Link>
    </li>
  );
}
