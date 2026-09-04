import type { ProcessedPage } from './imagePipeline';
import { JPEG_QUALITY, MAX_EDGE, MAX_PAGES, blobToBase64 } from './imagePipeline';

/**
 * PDF pages, rendered to images.
 *
 * Deliberately no text extraction and no OCR. A worksheet is usually a scan or
 * a photo with handwriting on it, so there is no text layer to extract, and
 * Hebrew handwriting OCR is accurate enough to produce confidently wrong
 * tutoring — the worst possible failure here. The vision model reads the page
 * far better, so the PDF becomes images and goes the same route as a photo.
 *
 * pdf.js is about a megabyte and is imported dynamically, so it never lands in
 * the bundle that daily practice loads.
 */
export async function pdfToPages(file: Blob, maxPages = MAX_PAGES): Promise<ProcessedPage[]> {
  const pdfjs = await import('pdfjs-dist');
  // The worker URL must go through the bundler: a hard-coded path silently
  // 404s under the GitHub Pages base path.
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: ProcessedPage[] = [];

  try {
    const count = Math.min(doc.numPages, maxPages);
    for (let n = 1; n <= count; n += 1) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, MAX_EDGE / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas unavailable');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('encoding failed'))),
          'image/jpeg',
          JPEG_QUALITY,
        );
      });

      pages.push({
        blob,
        base64: await blobToBase64(blob),
        width: canvas.width,
        height: canvas.height,
      });
    }
  } finally {
    await doc.destroy();
  }

  return pages;
}
