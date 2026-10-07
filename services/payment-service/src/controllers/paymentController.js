import { paymentService } from '../services/paymentService.js';

export const paymentController = {
  async getByBookingId(req, res, next) {
    try {
      const { bookingId } = req.params;
      const payments = await paymentService.getPaymentsByBookingId(bookingId);
      res.status(200).json({
        success: true,
        data: { payments },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
