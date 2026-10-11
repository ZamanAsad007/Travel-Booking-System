import { outboxRepository } from '../repositories/outboxRepository.js';
import { eventBus } from '../../../../shared/events/eventBus.js';

let workerInterval = null;
let isProcessing = false;

export async function processOutboxOnce(limit = 50) {
  if (isProcessing) return 0;
  isProcessing = true;

  try {
    const unpublished = await outboxRepository.getUnpublished(limit);
    if (!unpublished || unpublished.length === 0) {
      return 0;
    }

    let publishedCount = 0;
    for (const record of unpublished) {
      try {
        await eventBus.publish(record.event_type, record.payload);
        await outboxRepository.markPublished(record.id);
        publishedCount++;
        console.log(
          `[booking-service:outbox] Published outbox event ${record.id} (${record.event_type})`
        );
      } catch (err) {
        console.error(
          `[booking-service:outbox] Failed to publish event ${record.id} (${record.event_type}):`,
          err.message
        );
        // Break out to avoid tight loops on broker outage
        break;
      }
    }

    return publishedCount;
  } catch (err) {
    console.error('[booking-service:outbox] Error in outbox processing loop:', err.message);
    return 0;
  } finally {
    isProcessing = false;
  }
}

export function startOutboxWorker({ intervalMs = 2000 } = {}) {
  if (workerInterval) return;

  console.log(`[booking-service] Starting Transactional Outbox worker (poll: ${intervalMs}ms)...`);
  // Immediate trigger on startup
  processOutboxOnce().catch(() => {});

  workerInterval = setInterval(async () => {
    try {
      await processOutboxOnce();
    } catch (err) {
      console.error('[booking-service:outbox] Worker tick error:', err.message);
    }
  }, intervalMs);

  if (workerInterval.unref) {
    workerInterval.unref();
  }
}

export function stopOutboxWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[booking-service] Outbox worker stopped.');
  }
}
