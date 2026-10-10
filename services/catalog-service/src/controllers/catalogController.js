import { catalogService } from '../services/catalogService.js';

export const catalogController = {
  async searchFlights(req, res, next) {
    try {
      const { from, to, date, page, limit } = req.query;
      const result = await catalogService.searchFlights({
        from,
        to,
        date,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      });

      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async getFlight(req, res, next) {
    try {
      const flight = await catalogService.getFlightById(req.params.id);
      res.status(200).json({
        success: true,
        data: { flight },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async searchHotels(req, res, next) {
    try {
      const { city, page, limit } = req.query;
      const result = await catalogService.searchHotels({
        city,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      });

      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async getHotel(req, res, next) {
    try {
      const hotel = await catalogService.getHotelById(req.params.id);
      res.status(200).json({
        success: true,
        data: { hotel },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async checkAvailability(req, res, next) {
    try {
      const { itemType, itemId, quantity } = req.body;
      const result = await catalogService.checkAvailability({
        itemType,
        itemId,
        quantity: quantity ? parseInt(quantity, 10) : 1,
      });

      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async createHold(req, res, next) {
    try {
      const { itemType, itemId, bookingId, quantity, ttlSeconds } = req.body;
      const hold = await catalogService.createHold({
        itemType,
        itemId,
        bookingId,
        quantity: quantity ? parseInt(quantity, 10) : 1,
        ttlSeconds: ttlSeconds ? parseInt(ttlSeconds, 10) : 600,
      });

      res.status(201).json({
        success: true,
        data: { hold },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async releaseHolds(req, res, next) {
    try {
      const { bookingId } = req.params;
      await catalogService.releaseHolds(bookingId);
      res.status(200).json({
        success: true,
        data: { message: `Holds released for booking ${bookingId}` },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async confirmHold(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { itemType, itemId, quantity, dateFrom, dateTo } = req.body;
      const reservation = await catalogService.confirmHoldToReservation({
        itemType,
        itemId,
        bookingId,
        quantity: quantity ? parseInt(quantity, 10) : 1,
        dateFrom,
        dateTo,
      });

      res.status(200).json({
        success: true,
        data: { reservation },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async reserveItem(req, res, next) {
    try {
      const { itemType, itemId, bookingId, quantity, dateFrom, dateTo } = req.body;
      const result = await catalogService.reserveItem({
        itemType,
        itemId,
        bookingId,
        quantity: quantity ? parseInt(quantity, 10) : 1,
        dateFrom,
        dateTo,
      });

      res.status(201).json({
        success: true,
        data: { reservation: result },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async releaseReservation(req, res, next) {
    try {
      const { bookingId } = req.params;
      const result = await catalogService.releaseReservation(bookingId);
      res.status(200).json({
        success: true,
        data: { released: result },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin Controllers
  async createFlight(req, res, next) {
    try {
      const flight = await catalogService.createFlight(req.body);
      res.status(201).json({
        success: true,
        data: { flight },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateFlight(req, res, next) {
    try {
      const flight = await catalogService.updateFlight(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: { flight },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteFlight(req, res, next) {
    try {
      await catalogService.deleteFlight(req.params.id);
      res.status(200).json({
        success: true,
        data: { message: 'Flight deleted successfully' },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async createHotel(req, res, next) {
    try {
      const hotel = await catalogService.createHotel(req.body);
      res.status(201).json({
        success: true,
        data: { hotel },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateHotel(req, res, next) {
    try {
      const hotel = await catalogService.updateHotel(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: { hotel },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteHotel(req, res, next) {
    try {
      await catalogService.deleteHotel(req.params.id);
      res.status(200).json({
        success: true,
        data: { message: 'Hotel deleted successfully' },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async createRoom(req, res, next) {
    try {
      const hotel_id = req.params.hotelId || req.body.hotel_id;
      const room = await catalogService.createRoom({ ...req.body, hotel_id });
      res.status(201).json({
        success: true,
        data: { room },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateRoom(req, res, next) {
    try {
      const room = await catalogService.updateRoom(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: { room },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteRoom(req, res, next) {
    try {
      await catalogService.deleteRoom(req.params.id);
      res.status(200).json({
        success: true,
        data: { message: 'Room deleted successfully' },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
