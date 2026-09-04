import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card } from '@/components/ui';
import { UploadPanel } from '@/features/homework/UploadPanel';
import type { PendingPage } from '@/features/homework/useUpload';
import { takeSharedFiles } from '@/lib/files/sharedIntake';
import { listMaterials, saveMaterial } from '@/lib/db/repos/materialRepo';
import { readWorksheet } from '@/lib/ai/homework';
import { makeThumbnail } from '@/lib/files/imagePipeline';
import { hasApiKey } from '@/lib/security/apiKey';
import { ConsentGate } from '@/features/consent/ConsentGate';
import { storageUnderPressure } from '@/lib/db/prune';
import { useSettings } from '@/stores/settingsStore';
import { relativeDayHe, dayKey } from '@/lib/time';
import type { UploadedMaterial } from '@/types/material';
import { paths } from '@/router';

export function HomeworkRoute() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [materials, setMaterials] = useState<UploadedMaterial[] | null>(null);
  const [working, setWorking] = useState(false);
  const [errorHe, setError] = useState('');

  const [shared, setShared] = useState<File[]>([]);

  useEffect(() => {
    void listMaterials().then(setMaterials).catch(() => setMaterials([]));
    // A sheet shared from WhatsApp arrives here, parked by the service worker.
    void takeSharedFiles().then((files) => files.length > 0 && setShared(files));
  }, []);

  const handle = useCallback(
    async (pages: PendingPage[]) => {
      if (pages.length === 0) return;
      setWorking(true);
      setError('');

      // Checked before spending a request on reading the sheet: a quota error
      // used to be swallowed, leaving a worksheet in the list with no pages
      // behind it and no explanation.
      if (await storageUnderPressure()) {
        setError(
          'האחסון במכשיר כמעט מלא, אז לא אוכל לשמור את הדף. אפשר לפנות מקום במסך ההורים.',
        );
        setWorking(false);
        return;
      }

      const result = await readWorksheet(
        pages.map((p) => p.base64),
        settings.model,
      );

      if (result.status === 'error') {
        setError(result.error.he);
        setWorking(false);
        return;
      }

      const id = `hw-${Date.now().toString(36)}`;
      const topicIds = [
        ...new Set(result.reading.exercises.flatMap((e) => (e.topicId ? [e.topicId] : []))),
      ];
      const thumb = pages[0] ? await makeThumbnail(pages[0].blob).catch(() => '') : '';

      const material: UploadedMaterial = {
        id,
        kind: 'image',
        titleHe: result.reading.titleHe,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pageCount: pages.length,
        bytes: pages.reduce((sum, p) => sum + p.blob.size, 0),
        status: 'new',
        detectedTopicIds: topicIds,
        exercises: result.reading.exercises,
        thumbDataUrl: thumb,
      };

      try {
        await saveMaterial(
          material,
          pages.map((p) => ({ blob: p.blob, width: p.width, height: p.height, index: 0 })),
        );
      } catch {
        setError('לא הצלחתי לשמור את הדף במכשיר. כנראה נגמר המקום.');
        setWorking(false);
        return;
      }

      setWorking(false);
      navigate(paths.material(id));
    },
    [settings.model, navigate],
  );

  return (
    <div className="space-y-5">
      <PageHeader title="שיעורי בית" subtitle="מצלמים את הדף ועוברים עליו יחד" />

      {!hasApiKey() && (
        <Card>
          <p>כדי לקרוא דף עבודה צריך מפתח בהגדרות.</p>
          <Button className="mt-3" onClick={() => navigate(paths.settings())}>
            להגדרות
          </Button>
        </Card>
      )}

      {hasApiKey() && (
        <ConsentGate>
          <UploadPanel
            onReady={(pages) => void handle(pages)}
            working={working}
            initialFiles={shared}
          />
        </ConsentGate>
      )}

      {errorHe && (
        <div className="rounded-lg bg-almost-tint px-4 py-3 text-almost">{errorHe}</div>
      )}

      {materials && materials.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg">דפים קודמים</h2>
          <ul className="space-y-2">
            {materials.map((m) => (
              <li key={m.id}>
                <Link
                  to={paths.material(m.id)}
                  className="card tap flex items-center gap-3 p-3 hover:bg-surface-2"
                >
                  {m.thumbDataUrl ? (
                    <img
                      src={m.thumbDataUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span className="h-14 w-14 shrink-0 rounded-md bg-surface-2" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{m.titleHe}</span>
                    <span className="block text-sm text-ink-soft">
                      {m.exercises.filter((e) => e.done).length} מתוך {m.exercises.length} ·{' '}
                      {relativeDayHe(dayKey(m.createdAt))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
