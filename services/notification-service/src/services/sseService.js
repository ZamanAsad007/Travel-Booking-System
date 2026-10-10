import { randomUUID } from 'crypto';

class SseService {
  constructor() {
    this.clients = new Set();
  }

  /**
   * Registers a new SSE client connection and initiates keep-alive pings.
   */
  addClient(req, res, { userId = null, bookingId = null } = {}) {
    const clientId = randomUUID();

    // Set standard Server-Sent Events headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Critical for Nginx proxy buffering disablement
    });

    // Flush headers if supported
    if (res.flushHeaders) {
      res.flushHeaders();
    }

    const client = {
      id: clientId,
      res,
      userId,
      bookingId,
      connectedAt: new Date(),
    };

    this.clients.add(client);
    console.log(
      `[notification-service] SSE client connected: ${clientId} (userId: ${userId}, bookingId: ${bookingId}). Active clients: ${this.clients.size}`
    );

    // Initial handshake frame
    res.write(': connected\n\n');
    res.write(
      `event: connected\ndata: ${JSON.stringify({
        clientId,
        userId,
        bookingId,
        message: 'Connected to live booking update stream',
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Keep-alive heartbeat ping every 25 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (err) {
        clearInterval(heartbeat);
      }
    }, 25000);

    const cleanup = () => {
      clearInterval(heartbeat);
      this.clients.delete(client);
      console.log(
        `[notification-service] SSE client disconnected: ${clientId}. Remaining clients: ${this.clients.size}`
      );
    };

    req.on('close', cleanup);
    res.on('finish', cleanup);
    res.on('error', cleanup);
  }

  /**
   * Broadcasts a booking event to matching SSE clients.
   */
  broadcastBookingEvent(event) {
    if (!event || !event.type) return;

    const { type, data = {} } = event;
    const bookingId = data.bookingId;
    const userId = data.userId;

    let status = 'PENDING';
    let message = 'Booking status updated';

    switch (type) {
      case 'booking.created':
        status = 'PENDING';
        message = 'Booking created, processing inventory hold and payment';
        break;
      case 'payment.succeeded':
        status = 'PAYMENT_SUCCESS';
        message = 'Payment captured successfully';
        break;
      case 'booking.confirmed':
        status = 'CONFIRMED';
        message = data.ticketNumber
          ? `Booking confirmed! E-Ticket issued: ${data.ticketNumber}`
          : 'Booking confirmed successfully';
        break;
      case 'booking.ticket.issued':
        status = 'CONFIRMED';
        message = `E-Ticket ${data.ticketNumber} is ready for download`;
        break;
      case 'payment.failed':
        status = 'PAYMENT_FAILED';
        message = `Payment failed: ${data.reason || 'Transaction declined'}`;
        break;
      case 'booking.cancelled':
        status = 'CANCELLED';
        message = `Booking cancelled: ${data.reason || 'Inventory hold released'}`;
        break;
      case 'payment.refunded':
        status = 'REFUNDED';
        message = 'Payment refunded successfully';
        break;
      default:
        status = type;
        message = `Event: ${type}`;
    }

    const payload = {
      event: type,
      bookingId,
      userId,
      status,
      ticketNumber: data.ticketNumber || null,
      amount: data.amount ? parseFloat(data.amount) : null,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    const sseChunk = `event: booking_update\ndata: ${JSON.stringify(payload)}\n\n`;

    let matchedCount = 0;
    for (const client of this.clients) {
      // Filter by bookingId if client subscribed to a specific booking
      if (client.bookingId && bookingId && client.bookingId !== bookingId) {
        continue;
      }

      // Filter by userId if client subscribed as a specific user
      if (client.userId && userId && client.userId !== userId) {
        continue;
      }

      try {
        client.res.write(sseChunk);
        matchedCount++;
      } catch (err) {
        console.warn(
          `[notification-service] Failed writing SSE to client ${client.id}:`,
          err.message
        );
      }
    }

    console.log(
      `[notification-service] Dispatched SSE ${type} for booking ${bookingId} to ${matchedCount} clients`
    );
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const sseService = new SseService();
