/**
 * Turning whatever the camera produced into something worth sending.
 *
 * A modern phone photo is 4000px wide and several megabytes. Sent as-is it
 * costs a lot of tokens, uploads slowly on a home connection, and fills the
 * device's storage quota within a term — and none of that buys any accuracy,
 * because the model does not need more than about 1600px to read a worksheet.
 */

export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.8;
export const THUMB_EDGE = 240;
export const MAX_PAGES = 20;

export interface ProcessedPage {
  blob: Blob;
  base64: string;
  width: number;
  height: number;
}

function scaleTo(width: number, height: number, maxEdge: number): [number, number] {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return [width, height];
  const ratio = maxEdge / longest;
  return [Math.round(width * ratio), Math.round(height * ratio)];
}

async function toBitmap(file: Blob): Promise<ImageBitmap> {
  // `from-image` applies the EXIF rotation, without which photos taken in
  // portrait arrive sideways and the model reads a rotated page.
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

function drawTo(bitmap: ImageBitmap, maxEdge: number): HTMLCanvasElement {
  const [w, h] = scaleTo(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  // A white ground, so a transparent PNG does not become black on the page.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encoding failed'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export async function processImage(file: Blob): Promise<ProcessedPage> {
  const bitmap = await toBitmap(file);
  try {
    const canvas = drawTo(bitmap, MAX_EDGE);
    const blob = await canvasToBlob(canvas);
    return {
      blob,
      base64: await blobToBase64(blob),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    bitmap.close();
  }
}

/** Small enough to inline in the materials list, so it renders without blobs. */
export async function makeThumbnail(file: Blob): Promise<string> {
  const bitmap = await toBitmap(file);
  try {
    return drawTo(bitmap, THUMB_EDGE).toDataURL('image/jpeg', 0.6);
  } finally {
    bitmap.close();
  }
}

/** A rough blur check, so an unreadable photo is caught before it is sent. */
export async function looksTooBlurry(blob: Blob): Promise<boolean> {
  try {
    const bitmap = await toBitmap(blob);
    const canvas = drawTo(bitmap, 320);
    bitmap.close();
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Variance of a Laplacian-ish edge response. A sharp page of handwriting has
    // strong local contrast; a blurred one does not.
    let sum = 0;
    let sumSquares = 0;
    let count = 0;
    const luma = (i: number) => 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = (y * width + x) * 4;
        const response =
          4 * luma(i) -
          luma(i - 4) -
          luma(i + 4) -
          luma(i - width * 4) -
          luma(i + width * 4);
        sum += response;
        sumSquares += response * response;
        count += 1;
      }
    }

    if (count === 0) return false;
    const mean = sum / count;
    const variance = sumSquares / count - mean * mean;
    // Tuned to be reluctant: a false "too blurry" is more annoying than a
    // borderline photo the model can probably still read.
    return variance < 60;
  } catch {
    return false;
  }
}
