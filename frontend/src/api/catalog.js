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
  getPriceHistory: async (itemType, itemId) => {
    return api.get('/catalog/price-history', { params: { itemType, itemId } });
  },
  suggest: async (q) => {
    return api.get('/catalog/suggest', { params: { q } });
  },
  getBundles: async (params = {}) => {
    return api.get('/catalog/bundles', { params });
  },
  getAirlines: async () => {
    return api.get('/catalog/airlines');
  },
};
