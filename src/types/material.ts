import type { TopicId } from './curriculum';
import type { DetectedExercise } from '@/lib/ai/homework';

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
  /** The checklist read off the sheet. Not indexed, so it can grow freely. */
  exercises: DetectedExercise[];
  threadId?: string;
  /** Small enough to inline, so the list renders without touching blobs. */
  thumbDataUrl: string;
  /** Set once the full-resolution pages have been dropped to free space. The
   *  checklist, the ticks, the chat and this thumbnail all still stand. */
  pagesPruned?: boolean;
}

export interface MaterialPage {
  id: string; // `${materialId}:${index}`
  materialId: string;
  index: number;
  blob: Blob;
  width: number;
  height: number;
}
