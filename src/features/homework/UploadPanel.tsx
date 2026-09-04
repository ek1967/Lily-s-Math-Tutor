import { useEffect, useRef } from 'react';
import { Button, Card, Icon } from '@/components/ui';
import { useUpload, type PendingPage } from './useUpload';

interface Props {
  onReady: (pages: PendingPage[]) => void;
  busyLabelHe?: string;
  working?: boolean;
  /** Files handed over by the system share sheet, added automatically. */
  initialFiles?: readonly File[];
}

/**
 * Every way a worksheet actually reaches her.
 *
 * The camera is the primary route and gets the big button: the common case is
 * a printed sheet on the table in front of her. Everything else exists because
 * the sheet arrives differently depending on the teacher — a photo in a
 * WhatsApp group, a PDF from the school site, a screenshot on a laptop.
 * Paste and drag are wired globally by the hook, so on a laptop she can just
 * drop the screenshot anywhere on the page.
 */
export function UploadPanel({
  onReady,
  busyLabelHe = 'רגע, קוראת את הדף…',
  working = false,
  initialFiles,
}: Props) {
  const upload = useUpload();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const added = useRef(false);
  useEffect(() => {
    if (added.current || !initialFiles?.length) return;
    added.current = true;
    upload.addFiles([...initialFiles]);
  }, [initialFiles, upload]);

  const anyBlurry = upload.pages.some((p) => p.blurry);

  if (working) {
    return (
      <Card className="text-center">
        <p className="text-lg">{busyLabelHe}</p>
        <p className="mt-2 text-ink-soft">זה לוקח כמה שניות</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        // `capture` opens the camera directly on a phone — one tap from the
        // home screen to a photo of the sheet.
        capture="environment"
        hidden
        onChange={(e) => e.target.files && upload.addFiles(e.target.files)}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && upload.addFiles(e.target.files)}
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*,application/pdf"
        multiple
        hidden
        onChange={(e) => e.target.files && upload.addFiles(e.target.files)}
      />

      {upload.pages.length === 0 ? (
        <>
          <Button size="hero" block onClick={() => cameraInput.current?.click()}>
            <Icon name="camera" className="h-7 w-7" />
            לצלם את הדף
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" onClick={() => galleryInput.current?.click()}>
              מהגלריה
            </Button>
            <Button variant="ghost" onClick={() => fileInput.current?.click()}>
              קובץ או PDF
            </Button>
          </div>

          <p className="text-center text-sm text-ink-soft">
            במחשב אפשר גם פשוט להדביק צילום מסך, או לגרור קובץ לכאן
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {upload.pages.map((page, i) => (
              <div key={page.previewUrl} className="relative">
                <img
                  src={page.previewUrl}
                  alt={`עמוד ${i + 1}`}
                  className="aspect-[3/4] w-full rounded-md border border-line object-cover"
                />
                {page.blurry && (
                  <span className="absolute inset-x-1 bottom-1 rounded bg-almost px-1 py-0.5 text-center text-xs text-white">
                    מטושטש
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => upload.removePage(i)}
                  aria-label={`להסיר עמוד ${i + 1}`}
                  className="tap absolute end-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-surface/90 text-ink shadow-soft"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {anyBlurry && (
            <div className="rounded-lg bg-almost-tint px-4 py-3 text-almost">
              <p className="font-medium">אחד העמודים יצא קצת מטושטש</p>
              <p className="mt-1 text-sm text-ink-soft">
                כדאי אור טוב, הדף שטוח על השולחן, והטלפון ישר מעליו. אפשר גם
                להמשיך ככה ולראות אם הצלחתי לקרוא.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" onClick={() => cameraInput.current?.click()}>
              להוסיף עמוד
            </Button>
            <Button variant="ghost" onClick={upload.reset}>
              להתחיל מחדש
            </Button>
          </div>

          <Button size="hero" block onClick={() => onReady(upload.pages)}>
            זהו, בואי נעבור על זה
          </Button>
        </>
      )}

      {upload.busy && <p className="text-center text-ink-soft">רגע, מכינה את התמונות…</p>}
      {upload.errorHe && <p className="text-center text-almost">{upload.errorHe}</p>}
    </div>
  );
}
