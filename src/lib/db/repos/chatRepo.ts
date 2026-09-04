import { db } from '../db';
import type { ChatMessage, ChatThread } from '@/types/chat';

export async function createThread(thread: ChatThread): Promise<void> {
  await db.threads.put(thread);
}

export async function getThread(id: string): Promise<ChatThread | undefined> {
  return db.threads.get(id);
}

export async function touchThread(id: string, at = Date.now()): Promise<void> {
  const thread = await db.threads.get(id);
  if (thread) await db.threads.put({ ...thread, updatedAt: at });
}

export async function recentThreads(limit = 30): Promise<ChatThread[]> {
  return db.threads.orderBy('updatedAt').reverse().limit(limit).toArray();
}

export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  const rows = await db.messages.where('threadId').equals(threadId).toArray();
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function addMessage(message: ChatMessage): Promise<number> {
  const id = await db.messages.add(message);
  await touchThread(message.threadId, message.createdAt);
  return id as number;
}

export async function updateMessage(id: number, patch: Partial<ChatMessage>): Promise<void> {
  await db.messages.update(id, patch);
}

export async function deleteThread(id: string): Promise<void> {
  await db.transaction('rw', db.threads, db.messages, async () => {
    await db.messages.where('threadId').equals(id).delete();
    await db.threads.delete(id);
  });
}
