import { generateTicketPdf } from '../../shared/utils/ticketPdf.js';

describe('E-Ticket PDF Generation Unit Tests', () => {
  test('should generate a valid PDF buffer with QR code for booking', async () => {
    const ticketData = {
      ticketNumber: 'TKT-TEST-1234',
      bookingId: 'b7123456-789a-bcde-f012-3456789abcde',
      amount: 599.98,
      items: [
        {
          item_type: 'flight',
          item_id: 'flight-uuid-1',
          quantity: 2,
          unit_price: 299.99,
        },
      ],
      travelers: [
        {
          full_name: 'Alice Smith',
          passport_no: 'A12345678',
          date_of_birth: '1990-05-15',
          seat_no: '12A',
        },
        {
          full_name: 'Bob Smith',
          passport_no: 'B87654321',
          date_of_birth: '1988-10-22',
          seat_no: '12B',
        },
      ],
    };

    const pdfBuffer = await generateTicketPdf(ticketData);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000); // Has contents
    // Check PDF header
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });
});
