export class DlqStore {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.messages = [];
  }

  recordFailedMessage({ queueName, event, error, retryCount, routingKey }) {
    const item = {
      id: event?.eventId || `dlq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      queueName,
      routingKey: routingKey || event?.type,
      event,
      error: error?.message || String(error),
      retryCount: retryCount || 0,
      failedAt: new Date().toISOString(),
    };

    this.messages.unshift(item);
    if (this.messages.length > this.maxSize) {
      this.messages.pop();
    }
    return item;
  }

  getMessages({ queueName, limit = 50 } = {}) {
    let result = this.messages;
    if (queueName) {
      result = result.filter((m) => m.queueName === queueName);
    }
    return result.slice(0, limit);
  }

  getMessageById(id) {
    return this.messages.find((m) => m.id === id) || null;
  }

  removeMessage(id) {
    const index = this.messages.findIndex((m) => m.id === id);
    if (index !== -1) {
      return this.messages.splice(index, 1)[0];
    }
    return null;
  }

  clear() {
    this.messages = [];
  }
}

export const dlqStore = new DlqStore();
