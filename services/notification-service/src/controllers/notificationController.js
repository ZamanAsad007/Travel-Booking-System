import { notificationRepository } from '../repositories/notificationRepository.js';
import { sseService } from '../services/sseService.js';

export const notificationController = {
  async listNotifications(req, res, next) {
    try {
      const { userId, bookingId, limit, offset } = req.query;
      const notifications = await notificationRepository.findAll({
        userId,
        bookingId,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });

      res.status(200).json({
        success: true,
        data: { notifications },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationRepository.findById(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Notification not found' },
        });
      }

      res.status(200).json({
        success: true,
        data: { notification },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async downloadTicket(req, res, next) {
    try {
      const { ticketNumber } = req.params;
      const { ticketStore } = await import('../services/ticketStore.js');
      const pdfBuffer = ticketStore.get(ticketNumber);

      if (!pdfBuffer) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Ticket PDF not found or not yet generated' },
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketNumber}.pdf"`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  },

  streamBookings(req, res, next) {
    try {
      const { bookingId } = req.query;
      const userId = req.user?.id || req.query.userId || null;
      sseService.addClient(req, res, { userId, bookingId });
    } catch (error) {
      next(error);
    }
  },
};
