import amqplib from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { EXCHANGE_NAME } from '../constants/events.js';

class EventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    this.exchange = EXCHANGE_NAME;
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
        console.log(`[EventBus] Connecting to RabbitMQ at ${this.url} (attempt ${i + 1}/${retries})...`);
        this.connection = await amqplib.connect(this.url);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

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

        console.log('[EventBus] Successfully connected to RabbitMQ and asserted exchange:', this.exchange);
        this.isConnecting = false;
        return this.channel;
      } catch (err) {
        console.warn(`[EventBus] Connection attempt ${i + 1} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.isConnecting = false;
    throw new Error(`[EventBus] Could not connect to RabbitMQ after ${retries} attempts.`);
  }

  async publish(routingKey, data, eventId = null) {
    const channel = await this.connect();
    const event = {
      eventId: eventId || uuidv4(),
      type: routingKey,
      occurredAt: new Date().toISOString(),
      data,
    };

    const content = Buffer.from(JSON.stringify(event));
    const published = channel.publish(this.exchange, routingKey, content, {
      persistent: true,
      contentType: 'application/json',
      messageId: event.eventId,
      timestamp: Date.now(),
    });

    console.log(`[EventBus] Published event: ${routingKey} (eventId: ${event.eventId})`);
    return event;
  }

  async subscribe(queueName, routingKeys, handler, options = { prefetch: 1 }) {
    const channel = await this.connect();
    await channel.assertQueue(queueName, { durable: true });
    await channel.prefetch(options.prefetch || 1);

    const keys = Array.isArray(routingKeys) ? routingKeys : [routingKeys];
    for (const key of keys) {
      await channel.bindQueue(queueName, this.exchange, key);
      console.log(`[EventBus] Bound queue '${queueName}' to routing key '${key}'`);
    }

    await channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const content = msg.content.toString();
        const event = JSON.parse(content);
        console.log(`[EventBus] Consumed event: ${event.type} from queue '${queueName}' (id: ${event.eventId})`);

        await handler(event);
        channel.ack(msg);
      } catch (err) {
        console.error(`[EventBus] Error processing message in '${queueName}':`, err);
        // Reject and requeue or send to DLQ (false, false for DLQ or false, true for retry)
        // Requeue only if it's not a business logic error
        channel.nack(msg, false, false);
      }
    });

    console.log(`[EventBus] Subscribed to queue: ${queueName} for keys: [${keys.join(', ')}]`);
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
