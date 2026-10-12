import amqplib from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { EXCHANGE_NAME } from '../constants/events.js';
import { dlqStore } from './dlqStore.js';

export const DLX_EXCHANGE = 'travel.events.dlx';

class EventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    this.exchange = EXCHANGE_NAME;
    this.dlxExchange = DLX_EXCHANGE;
    this.isConnecting = false;
  }

  async connect(retries = 10, delay = 3000) {
    if (this.channel) return this.channel;
    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.connect(retries, delay);
    }

    this.isConnecting = true;
    for (let i = 0; i < retries; i++) {
      try {
        console.log(
          `[EventBus] Connecting to RabbitMQ at ${this.url} (attempt ${i + 1}/${retries})...`
        );
        this.connection = await amqplib.connect(this.url);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
        await this.channel.assertExchange(this.dlxExchange, 'direct', { durable: true });

        this.connection.on('error', (err) => {
          console.error('[EventBus] RabbitMQ connection error:', err);
          this.channel = null;
          this.connection = null;
        });

        this.connection.on('close', () => {
          console.warn('[EventBus] RabbitMQ connection closed.');
          this.channel = null;
          this.connection = null;
        });

        console.log(
          '[EventBus] Successfully connected to RabbitMQ and asserted exchanges:',
          this.exchange,
          this.dlxExchange
        );
        this.isConnecting = false;
        return this.channel;
      } catch (err) {
        console.warn(
          `[EventBus] Connection attempt ${i + 1} failed: ${err.message}. Retrying in ${delay / 1000}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.isConnecting = false;
    throw new Error(`[EventBus] Could not connect to RabbitMQ after ${retries} attempts.`);
  }

  async publish(routingKey, data, eventId = null, headers = {}) {
    const channel = await this.connect();
    const event = {
      eventId: eventId || uuidv4(),
      type: routingKey,
      occurredAt: new Date().toISOString(),
      data,
    };

    const content = Buffer.from(JSON.stringify(event));
    channel.publish(this.exchange, routingKey, content, {
      persistent: true,
      contentType: 'application/json',
      messageId: event.eventId,
      timestamp: Date.now(),
      headers,
    });

    console.log(`[EventBus] Published event: ${routingKey} (eventId: ${event.eventId})`);
    return event;
  }

  async subscribe(queueName, routingKeys, handler, options = {}) {
    const {
      prefetch = 1,
      maxRetries = 3,
      initialDelayMs = 1000,
      backoffFactor = 2,
      withDlq = true,
      dlxExchange = this.dlxExchange,
      dlqQueue = `${queueName}.dlq`,
    } = options;

    const channel = await this.connect();

    const queueOptions = { durable: true };
    if (withDlq) {
      const dlRoutingKey = `${queueName}.dlq`;

      await channel.assertExchange(dlxExchange, 'direct', { durable: true });
      await channel.assertQueue(dlqQueue, { durable: true });
      await channel.bindQueue(dlqQueue, dlxExchange, dlRoutingKey);

      queueOptions.deadLetterExchange = dlxExchange;
      queueOptions.deadLetterRoutingKey = dlRoutingKey;
      console.log(
        `[EventBus] Configured DLQ '${dlqQueue}' with DLX '${dlxExchange}' for queue '${queueName}'`
      );
    }

    await channel.assertQueue(queueName, queueOptions);
    await channel.prefetch(prefetch);

    const keys = Array.isArray(routingKeys) ? routingKeys : [routingKeys];
    for (const key of keys) {
      await channel.bindQueue(queueName, this.exchange, key);
      console.log(`[EventBus] Bound queue '${queueName}' to routing key '${key}'`);
    }

    await channel.consume(queueName, async (msg) => {
      if (!msg) return;

      let event = null;
      try {
        const content = msg.content.toString();
        event = JSON.parse(content);
        console.log(
          `[EventBus] Consumed event: ${event.type} from queue '${queueName}' (id: ${event.eventId})`
        );

        await handler(event);
        channel.ack(msg);
      } catch (err) {
        console.error(`[EventBus] Error processing message in '${queueName}':`, err.message);

        await this.handleMessageFailure({
          channel,
          msg,
          queueName,
          event,
          err,
          maxRetries,
          initialDelayMs,
          backoffFactor,
        });
      }
    });

    console.log(
      `[EventBus] Subscribed to queue: ${queueName} for keys: [${keys.join(', ')}] (maxRetries: ${maxRetries})`
    );
  }

  async handleMessageFailure({
    channel,
    msg,
    queueName,
    event,
    err,
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffFactor = 2,
  }) {
    const headers = msg.properties?.headers || {};
    const retryCount = Number(headers['x-retry-count'] || 0);

    if (retryCount < maxRetries) {
      const nextRetry = retryCount + 1;
      const delay = Math.min(60000, initialDelayMs * Math.pow(backoffFactor, retryCount));

      console.warn(
        `[EventBus:Retry] Queue '${queueName}' retrying event ${event?.eventId || 'unknown'} (attempt ${nextRetry}/${maxRetries}) after ${delay}ms delay...`
      );

      // Re-publish with incremented retry headers
      const updatedHeaders = {
        ...headers,
        'x-retry-count': nextRetry,
        'x-first-failure-at': headers['x-first-failure-at'] || new Date().toISOString(),
        'x-last-error': err.message,
      };

      setTimeout(() => {
        try {
          channel.publish(this.exchange, event?.type || msg.fields.routingKey, msg.content, {
            persistent: true,
            contentType: 'application/json',
            messageId: event?.eventId || msg.properties?.messageId,
            timestamp: Date.now(),
            headers: updatedHeaders,
          });
        } catch (publishErr) {
          console.error('[EventBus:Retry] Failed to re-publish retry message:', publishErr);
        }
      }, delay);

      channel.ack(msg);
    } else {
      // Max retries exceeded: Route to Dead-Letter Queue
      console.error(
        `[EventBus:DLQ] Max retries (${maxRetries}) reached for event ${event?.eventId || 'unknown'} in queue '${queueName}'. Moving to DLQ.`
      );

      dlqStore.recordFailedMessage({
        queueName,
        event,
        error: err,
        retryCount,
        routingKey: msg.fields?.routingKey,
      });

      // nack without requeue triggers dead-letter-exchange
      channel.nack(msg, false, false);
    }
  }

  getFailedMessages(queueName) {
    return dlqStore.getMessages({ queueName });
  }

  async replayFailedMessage(id) {
    const record = dlqStore.getMessageById(id);
    if (!record) {
      throw new Error(`Failed message ${id} not found in DLQ store`);
    }

    await this.publish(record.routingKey, record.event?.data, record.event?.eventId);
    dlqStore.removeMessage(id);
    console.log(`[EventBus:DLQ] Replayed failed message ${id} to ${record.routingKey}`);
    return record;
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (err) {
      console.error('[EventBus] Error closing RabbitMQ connection:', err);
    }
  }
}

export const eventBus = new EventBus();
