import { makeThumbnail } from '@/lib/files/imagePipeline';

/** A tiny inline preview for the materials list, so it never loads blobs. */
export async function thumbFor(blob: Blob): Promise<string> {
  try {
    return await makeThumbnail(blob);
  } catch {
    return '';
  }
}
