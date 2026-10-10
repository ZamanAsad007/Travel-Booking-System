import { EventEmitter } from 'events';
import { jest } from '@jest/globals';
import { sseService } from '../../services/notification-service/src/services/sseService.js';

describe('SSE Service Unit Tests', () => {
  let mockReq;
  let mockRes;
  let writtenData;

  beforeEach(() => {
    writtenData = [];
    mockReq = new EventEmitter();
    mockRes = new EventEmitter();
    mockRes.writeHead = jest.fn();
    mockRes.write = jest.fn((chunk) => {
      writtenData.push(chunk);
    });
  });

  afterEach(() => {
    // Clear all clients
    sseService.clients.clear();
  });

  test('should register SSE client and send connection headers & handshake', () => {
    sseService.addClient(mockReq, mockRes, { userId: 'u-1', bookingId: 'b-1' });

    expect(sseService.getClientCount()).toBe(1);
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const joinedOutput = writtenData.join('');
    expect(joinedOutput).toContain(': connected');
    expect(joinedOutput).toContain('event: connected');
    expect(joinedOutput).toContain('"bookingId":"b-1"');
  });

  test('should remove client on request close', () => {
    sseService.addClient(mockReq, mockRes, { userId: 'u-1', bookingId: 'b-1' });
    expect(sseService.getClientCount()).toBe(1);

    mockReq.emit('close');
    expect(sseService.getClientCount()).toBe(0);
  });

  test('should broadcast booking.confirmed update to matching booking client', () => {
    sseService.addClient(mockReq, mockRes, { userId: 'u-1', bookingId: 'b-target' });

    writtenData = []; // Reset after handshake

    sseService.broadcastBookingEvent({
      type: 'booking.confirmed',
      data: {
        bookingId: 'b-target',
        userId: 'u-1',
        ticketNumber: 'TKT-12345678',
        amount: 250.0,
      },
    });

    const output = writtenData.join('');
    expect(output).toContain('event: booking_update');
    expect(output).toContain('"status":"CONFIRMED"');
    expect(output).toContain('"ticketNumber":"TKT-12345678"');
    expect(output).toContain('"bookingId":"b-target"');
  });

  test('should filter out events for different bookingId', () => {
    sseService.addClient(mockReq, mockRes, { userId: 'u-1', bookingId: 'b-target' });

    writtenData = [];

    sseService.broadcastBookingEvent({
      type: 'booking.confirmed',
      data: {
        bookingId: 'b-other',
        userId: 'u-1',
        ticketNumber: 'TKT-99999999',
      },
    });

    expect(writtenData.length).toBe(0);
  });

  test('should broadcast payment.failed update with CANCELLED status', () => {
    sseService.addClient(mockReq, mockRes, { userId: 'u-1', bookingId: 'b-target' });

    writtenData = [];

    sseService.broadcastBookingEvent({
      type: 'payment.failed',
      data: {
        bookingId: 'b-target',
        userId: 'u-1',
        reason: 'Insufficient funds',
      },
    });

    const output = writtenData.join('');
    expect(output).toContain('event: booking_update');
    expect(output).toContain('"status":"PAYMENT_FAILED"');
    expect(output).toContain('Insufficient funds');
  });
});
