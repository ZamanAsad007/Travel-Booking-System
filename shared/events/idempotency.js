export async function isEventProcessed(clientOrPool, eventId) {
  const res = await clientOrPool.query(
    'SELECT event_id FROM processed_events WHERE event_id = $1 LIMIT 1',
    [eventId]
  );
  return res.rows.length > 0;
}

export async function markEventProcessed(clientOrPool, eventId) {
  await clientOrPool.query(
    `INSERT INTO processed_events (event_id, processed_at)
     VALUES ($1, NOW())
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId]
  );
}

export function withIdempotency(pool, handler) {
  return async (event) => {
    if (!event || !event.eventId) {
      console.warn('[Idempotency] Event is missing eventId, running without idempotency check');
      return handler(event);
    }

    const alreadyProcessed = await isEventProcessed(pool, event.eventId);
    if (alreadyProcessed) {
      console.log(`[Idempotency] Skipping already processed event: ${event.eventId} (${event.type})`);
      return;
    }

    await handler(event);
    await markEventProcessed(pool, event.eventId);
  };
}
