import { bookingService } from '../services/bookingService.js';

export const bookingController = {
  async create(req, res, next) {
    try {
      const { items } = req.body;
      const booking = await bookingService.createBooking({
        userId: req.user.id,
        items,
      });

      res.status(201).json({
        success: true,
        data: { booking },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const bookings = await bookingService.getUserBookings(req.user.id);
      res.status(200).json({
        success: true,
        data: { bookings },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const booking = await bookingService.getBookingById(
        req.params.id,
        req.user.id,
        req.user.role
      );
      res.status(200).json({
        success: true,
        data: { booking },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancel(req, res, next) {
    try {
      const booking = await bookingService.cancelBooking(req.params.id, req.user.id, req.user.role);
      res.status(200).json({
        success: true,
        data: { booking },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async adminListAll(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await bookingService.getAllBookings({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
        status,
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

  async getStats(req, res, next) {
    try {
      const stats = await bookingService.getStats();
      res.status(200).json({
        success: true,
        data: stats,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
