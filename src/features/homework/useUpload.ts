import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_PAGES,
  looksTooBlurry,
  processImage,
  type ProcessedPage,
} from '@/lib/files/imagePipeline';

export interface PendingPage extends ProcessedPage {
  previewUrl: string;
  blurry: boolean;
}

export interface UploadState {
  pages: PendingPage[];
  busy: boolean;
  errorHe: string;
  addFiles: (files: FileList | File[]) => void;
  removePage: (index: number) => void;
  reset: () => void;
}

const ACCEPTED = /^image\/|^application\/pdf$/;

/**
 * Collects worksheet pages from every route a photo can arrive by: the camera,
 * the gallery, a file, a paste, or a drag. The paste and drag listeners are
 * global, because on a laptop the natural gesture is to drop the screenshot
 * anywhere on the page rather than hunt for a target.
 */
export function useUpload(): UploadState {
  const [pages, setPages] = useState<PendingPage[]>([]);
  const [busy, setBusy] = useState(false);
  const [errorHe, setError] = useState('');
  const urls = useRef<string[]>([]);

  useEffect(
    () => () => {
      for (const url of urls.current) URL.revokeObjectURL(url);
    },
    [],
  );

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const files = [...incoming].filter((f) => ACCEPTED.test(f.type));
    if (files.length === 0) {
      setError('אפשר להעלות תמונות או קובץ PDF.');
      return;
    }

    setBusy(true);
    setError('');

    void (async () => {
      try {
        const processed: PendingPage[] = [];

        for (const file of files) {
          if (file.type === 'application/pdf') {
            // pdf.js is a megabyte and is only loaded if a PDF actually turns up.
            const { pdfToPages } = await import('@/lib/files/pdf');
            for (const page of await pdfToPages(file)) {
              const url = URL.createObjectURL(page.blob);
              urls.current.push(url);
              processed.push({ ...page, previewUrl: url, blurry: false });
            }
          } else {
            const page = await processImage(file);
            const url = URL.createObjectURL(page.blob);
            urls.current.push(url);
            processed.push({
              ...page,
              previewUrl: url,
              blurry: await looksTooBlurry(page.blob),
            });
          }
        }

        setPages((prev) => [...prev, ...processed].slice(0, MAX_PAGES));
      } catch {
        setError('לא הצלחתי לפתוח את הקובץ. אפשר לנסות לצלם שוב?');
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  // Paste and drop anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])];
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    };
    const onDrop = (e: DragEvent) => {
      const files = [...(e.dataTransfer?.files ?? [])];
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    };
    const stop = (e: DragEvent) => e.preventDefault();

    window.addEventListener('paste', onPaste);
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragover', stop);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragover', stop);
    };
  }, [addFiles]);

  const removePage = useCallback((index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reset = useCallback(() => {
    setPages([]);
    setError('');
  }, []);

  return { pages, busy, errorHe, addFiles, removePage, reset };
}
