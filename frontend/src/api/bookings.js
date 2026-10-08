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
};
