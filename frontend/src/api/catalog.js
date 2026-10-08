import api from './client.js';

export const catalogApi = {
  searchFlights: async (params = {}) => {
    return api.get('/catalog/flights', { params });
  },
  getFlightById: async (id) => {
    return api.get(`/catalog/flights/${id}`);
  },
  searchHotels: async (params = {}) => {
    return api.get('/catalog/hotels', { params });
  },
  getHotelById: async (id) => {
    return api.get(`/catalog/hotels/${id}`);
  },
};
