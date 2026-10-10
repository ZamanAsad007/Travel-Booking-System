import api from './client.js';

export const adminApi = {
  getStats: () => api.get('/bookings/admin/stats'),
  getAllBookings: (params) => api.get('/bookings/admin/all', { params }),
  createFlight: (flightData) => api.post('/catalog/admin/flights', flightData),
  updateFlight: (id, flightData) => api.put(`/catalog/admin/flights/${id}`, flightData),
  deleteFlight: (id) => api.delete(`/catalog/admin/flights/${id}`),
  createHotel: (hotelData) => api.post('/catalog/admin/hotels', hotelData),
  updateHotel: (id, hotelData) => api.put(`/catalog/admin/hotels/${id}`, hotelData),
  deleteHotel: (id) => api.delete(`/catalog/admin/hotels/${id}`),
  createRoom: (hotelId, roomData) => api.post(`/catalog/admin/hotels/${hotelId}/rooms`, roomData),
  deleteRoom: (id) => api.delete(`/catalog/admin/rooms/${id}`),
};
