import api from './client.js';

export const bookingApi = {
  createBooking: async (bookingData) => {
    return api.post('/bookings', bookingData);
  },
  getMyBookings: async () => {
    return api.get('/bookings');
  },
  getBookingById: async (id) => {
    return api.get(`/bookings/${id}`);
  },
  cancelBooking: async (id) => {
    return api.post(`/bookings/${id}/cancel`);
  },
  downloadTicket: async (id, ticketNumber = 'ticket') => {
    const response = await api.get(`/bookings/${id}/ticket/download`, {
      responseType: 'blob',
    });
    const blob =
      response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ticket-${ticketNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  validateCoupon: async (code, amount) => {
    return api.post('/bookings/coupons/validate', { code, amount });
  },
};
