// In-memory / temporary storage for generated ticket PDFs
const ticketCache = new Map();

export const ticketStore = {
  save(ticketNumber, pdfBuffer, bookingId) {
    ticketCache.set(ticketNumber, pdfBuffer);
    if (bookingId) {
      ticketCache.set(`booking:${bookingId}`, { ticketNumber, pdfBuffer });
    }
  },

  get(ticketNumber) {
    return ticketCache.get(ticketNumber) || null;
  },

  getByBookingId(bookingId) {
    const entry = ticketCache.get(`booking:${bookingId}`);
    return entry ? entry.pdfBuffer : null;
  },
};
