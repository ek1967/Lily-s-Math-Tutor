import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';

export function HomeworkRoute() {
  return (
    <div>
      <PageHeader title="שיעורי בית" subtitle="מצלמים את הדף ועוברים עליו יחד" />
      <Card>
        <p className="text-ink-soft">כאן יופיעו דפי העבודה שהעלית.</p>
      </Card>
    </div>
  );
}
