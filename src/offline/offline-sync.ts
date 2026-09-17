import { AxiosError } from 'axios';
import { careHomeApiClient, normalizeApiError } from '@/src/lib/api-client';
import {
  markOfflineMutationFailed,
  pendingOfflineMutations,
  removeOfflineMutation,
  type OfflineMutation,
} from './offline-db';

/**
 * After this many automatic attempts an item stops auto-syncing and is
 * surfaced as "needs attention" in the sync-status screen. Care records
 * are never discarded automatically — a person must retry or delete them.
 */
export const MAX_OFFLINE_AUTO_ATTEMPTS = 3;

export function mutationNeedsAttention(item: OfflineMutation) {
  return item.attempts >= MAX_OFFLINE_AUTO_ATTEMPTS;
}

/** Human-readable label for an outbox row, derived from the API route. */
export function describeOfflineMutation(item: Pick<OfflineMutation, 'method' | 'url'>) {
  const url = item.url;
  if (url.includes('/care-entries')) {
    if (item.method === 'POST') return 'Care note';
    if (item.method === 'DELETE') return 'Care note removal';
    return 'Care note update';
  }
  if (url.includes('/care-tasks') && url.includes('/outcome')) return 'Task outcome';
  if (url.includes('/incidents')) return 'Incident report';
  return `${item.method} ${url}`;
}

type FailureKind = 'permanent' | 'transient';

function classifyFailure(error: unknown): FailureKind {
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    // These responses explicitly invite a later retry. Counting them towards
    // the manual-attention limit would strand valid care records during a
    // temporary timeout, rate limit or early-data response.
    if (status === 408 || status === 425 || status === 429) return 'transient';
    // 4xx means the server rejected the payload — retrying the same
    // request will keep failing, so don't block the rest of the queue.
    if (status >= 400 && status < 500) return 'permanent';
  }
  // No response (offline / unreachable) or 5xx — worth retrying later.
  return 'transient';
}

let flushing = false;

/**
 * Replays the outbox in FIFO order.
 * - transient failure → stop the flush (we are offline or the server is down)
 * - permanent failure → mark and continue so one bad item cannot block care records
 * - items past the auto-attempt limit are skipped (manual retry required)
 */
export async function flushOfflineQueue(ownerId: string) {
  if (flushing) return { synced: 0, skipped: 0 };
  flushing = true;
  let synced = 0;
  let skipped = 0;
  try {
    const pending = await pendingOfflineMutations(ownerId);
    for (const item of pending) {
      if (mutationNeedsAttention(item)) {
        skipped += 1;
        continue;
      }
      try {
        await careHomeApiClient.request({
          method: item.method,
          url: item.url,
          data: item.payload,
          headers: { 'Idempotency-Key': item.id },
        });
        await removeOfflineMutation(item.id);
        synced += 1;
      } catch (error) {
        const failureKind = classifyFailure(error);
        await markOfflineMutationFailed(
          item.id,
          normalizeApiError(error),
          failureKind === 'permanent',
        );
        if (failureKind === 'transient') break;
      }
    }
  } finally {
    flushing = false;
  }
  return { synced, skipped };
}
