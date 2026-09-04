import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';

export function LearnRoute() {
  return (
    <div>
      <PageHeader title="מפת הנושאים" subtitle="כל מה שאפשר ללמוד ולחזור עליו" />
      <Card>
        <p className="text-ink-soft">מפת הנושאים תופיע כאן.</p>
      </Card>
    </div>
  );
}
