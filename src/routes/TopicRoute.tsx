import { Link, useParams } from 'react-router-dom';
import { Button, Card, Icon } from '@/components/ui';
import { STRAND_BY_ID, getTopic } from '@/data/curriculum';
import { allPrerequisitesOf } from '@/data/curriculum/graph';
import { asTopicId } from '@/types/curriculum';
import { paths } from '@/router';
import { NotFoundRoute } from './NotFoundRoute';

export function TopicRoute() {
  const { topicId = '' } = useParams();
  const topic = getTopic(asTopicId(topicId));
  if (!topic) return <NotFoundRoute />;

  const strand = STRAND_BY_ID.get(topic.strand);
  const direct = topic.prerequisites.map(getTopic).filter((t) => t !== undefined);

  return (
    <div className="space-y-5">
      <Link
        to={paths.learn()}
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
      >
        <Icon name="arrow-back" className="h-4 w-4 rotate-180" />
        מפת הנושאים
      </Link>

      <header>
        {strand && (
          <span
            className="text-sm font-medium"
            style={{ color: `rgb(var(${strand.cssVar}))` }}
          >
            {strand.titleHe}
          </span>
        )}
        <h1 className="mt-1 text-2xl">{topic.titleHe}</h1>
        <p className="mt-1 text-ink-soft">{topic.oneLinerHe}</p>
      </header>

      <Card>
        <h2 className="mb-3 text-lg">מה נדע בסוף</h2>
        <ul className="space-y-2">
          {topic.goals.map((g) => (
            <li key={g} className="flex items-start gap-2">
              <Icon name="check" className="mt-1 h-5 w-5 shrink-0 text-yes" />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </Card>

      {direct.length > 0 && (
        <Card>
          <h2 className="mb-1 text-lg">כדאי לדעת קודם</h2>
          <p className="mb-3 text-sm text-ink-soft">
            אם משהו כאן לא ברור — נתחיל משם, וזה יהפוך את הנושא הזה להרבה יותר קל.
          </p>
          <ul className="flex flex-wrap gap-2">
            {direct.map((p) => (
              <li key={p.id}>
                <Link
                  to={paths.topic(p.id)}
                  className="tap inline-flex items-center rounded-md bg-surface-2 px-3 py-2 text-sm hover:bg-primary-tint"
                >
                  {p.titleHe}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            סך הכול {allPrerequisitesOf(topic.id).length} נושאים מובילים לכאן.
          </p>
        </Card>
      )}

      <Button size="hero" block disabled>
        לתרגל את הנושא
      </Button>
      <p className="text-center text-sm text-ink-soft">התרגילים לנושא הזה בדרך.</p>
    </div>
  );
}
