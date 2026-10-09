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
};
