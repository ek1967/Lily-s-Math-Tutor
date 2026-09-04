import type { TopicId } from './curriculum';

/** An uploaded worksheet. Pixels live in MaterialPage; this is the index entry. */
export interface UploadedMaterial {
  id: string;
  kind: 'image' | 'pdf';
  titleHe: string;
  createdAt: number;
  updatedAt: number;
  pageCount: number;
  bytes: number;
  status: 'new' | 'working' | 'done';
  detectedTopicIds: TopicId[];
  threadId?: string;
  /** Small enough to inline, so the list renders without touching blobs. */
  thumbDataUrl: string;
}

export interface MaterialPage {
  id: string; // `${materialId}:${index}`
  materialId: string;
  index: number;
  blob: Blob;
  width: number;
  height: number;
}
