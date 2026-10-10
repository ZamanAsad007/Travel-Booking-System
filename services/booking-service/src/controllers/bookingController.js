import { bookingService } from '../services/bookingService.js';

export const bookingController = {
  async create(req, res, next) {
    try {
      const { items, travelers, couponCode, coupon_code } = req.body;
      const booking = await bookingService.createBooking({
        userId: req.user.id,
        items,
        travelers,
        couponCode: couponCode || coupon_code,
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

  async getTicket(req, res, next) {
    try {
      const booking = await bookingService.getBookingById(
        req.params.id,
        req.user.id,
        req.user.role
      );

      if (booking.status !== 'CONFIRMED' || !booking.ticket_number) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            message: 'E-Ticket is only available for confirmed bookings',
            code: 'TICKET_NOT_AVAILABLE',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: {
          ticket: {
            ticketNumber: booking.ticket_number,
            bookingId: booking.id,
            status: booking.status,
            totalAmount: booking.total_amount,
            travelers: booking.travelers || [],
            items: booking.items || [],
            createdAt: booking.created_at,
          },
        },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async downloadTicketPdf(req, res, next) {
    try {
      const booking = await bookingService.getBookingById(
        req.params.id,
        req.user.id,
        req.user.role
      );

      if (booking.status !== 'CONFIRMED' || !booking.ticket_number) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            message: 'E-Ticket is only available for confirmed bookings',
            code: 'TICKET_NOT_AVAILABLE',
          },
        });
      }

      const { generateTicketPdf } = await import('../../../../shared/utils/ticketPdf.js');
      const pdfBuffer = await generateTicketPdf({
        ticketNumber: booking.ticket_number,
        bookingId: booking.id,
        amount: booking.total_amount,
        items: booking.items || [],
        travelers: booking.travelers || [],
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ticket-${booking.ticket_number}.pdf"`
      );
      return res.send(pdfBuffer);
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

  async validateCoupon(req, res, next) {
    try {
      const { code, amount } = req.body;
      const result = await bookingService.validateCoupon({
        code,
        userId: req.user?.id,
        amount: parseFloat(amount || 0),
      });

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            message: result.reason || 'Invalid coupon code',
            code: 'INVALID_COUPON',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async adminListCoupons(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await bookingService.getAllCoupons({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
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

  async adminCreateCoupon(req, res, next) {
    try {
      const coupon = await bookingService.createCoupon(req.body);
      res.status(201).json({
        success: true,
        data: { coupon },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async adminUpdateCoupon(req, res, next) {
    try {
      const coupon = await bookingService.updateCoupon(req.params.id, req.body);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Coupon not found', code: 'NOT_FOUND' },
        });
      }
      res.status(200).json({
        success: true,
        data: { coupon },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async adminDeleteCoupon(req, res, next) {
    try {
      const coupon = await bookingService.deleteCoupon(req.params.id);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Coupon not found', code: 'NOT_FOUND' },
        });
      }
      res.status(200).json({
        success: true,
        data: { message: 'Coupon deleted successfully' },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
