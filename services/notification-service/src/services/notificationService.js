import { sendEmail } from '../config/email.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { EVENTS } from '../../../../shared/constants/events.js';

export const notificationService = {
  async handleEventNotification(event) {
    const { type, data } = event;
    const bookingId = data.bookingId;
    const userId = data.userId;
    const recipientEmail = data.userEmail || data.email || 'traveler@example.com';
    const amount = data.amount ? parseFloat(data.amount).toFixed(2) : '0.00';

    let subject = '';
    let text = '';
    let html = '';

    switch (type) {
      case EVENTS.BOOKING_CONFIRMED: {
        subject = `Booking Confirmation - #${bookingId}`;
        const itemsSummary = (data.items || [])
          .map(
            (item, idx) =>
              `${idx + 1}. ${item.item_type || item.itemType} (ID: ${item.item_id || item.itemId}) x${item.quantity || 1} - $${item.unit_price || item.unitPrice || 0}`
          )
          .join('\n');

        text = `Hello,\n\nYour travel booking #${bookingId} has been successfully confirmed!\nTotal Paid: $${amount}\n\nItems:\n${itemsSummary || 'Standard travel reservation'}\n\nThank you for choosing Travel Booking System!`;

        html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
            <h2 style="color: #2563eb; margin-top: 0;">🎉 Booking Confirmed!</h2>
            <p>Your travel booking has been confirmed and tickets/vouchers are issued.</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
              <p style="margin: 4px 0;"><strong>Total Paid:</strong> $${amount}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">CONFIRMED</span></p>
            </div>
            <p>We wish you a wonderful trip!</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <small style="color: #64748b;">Travel Booking System Local Notification Service</small>
          </div>
        `;
        break;
      }

      case EVENTS.BOOKING_CANCELLED: {
        subject = `Booking Cancelled - #${bookingId}`;
        const reason = data.reason || 'Payment or reservation could not be completed';
        text = `Hello,\n\nYour travel booking #${bookingId} has been cancelled.\nReason: ${reason}\n\nAny holds have been released. If funds were captured, a refund will be processed automatically.`;

        html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
            <h2 style="color: #dc2626; margin-top: 0;">⚠️ Booking Cancelled</h2>
            <p>Your travel booking #${bookingId} has been cancelled.</p>
            <div style="background-color: #fef2f2; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 4px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
              <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">CANCELLED</span></p>
            </div>
            <p>If you have any questions or wish to make another booking, please visit our search page.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <small style="color: #64748b;">Travel Booking System Local Notification Service</small>
          </div>
        `;
        break;
      }

      case EVENTS.PAYMENT_REFUNDED: {
        subject = `Refund Processed - #${bookingId}`;
        text = `Hello,\n\nA refund of $${amount} for booking #${bookingId} has been successfully processed to your original payment method.`;

        html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
            <h2 style="color: #0284c7; margin-top: 0;">💰 Refund Processed</h2>
            <p>Your refund for booking #${bookingId} has been processed.</p>
            <div style="background-color: #f0f9ff; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
              <p style="margin: 4px 0;"><strong>Refunded Amount:</strong> $${amount}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #0284c7; font-weight: bold;">REFUNDED</span></p>
            </div>
            <p>The funds should appear in your statement shortly.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <small style="color: #64748b;">Travel Booking System Local Notification Service</small>
          </div>
        `;
        break;
      }

      default: {
        console.warn(`[notification-service] Unrecognized event type for notification: ${type}`);
        return null;
      }
    }

    const sendResult = await sendEmail({
      to: recipientEmail,
      subject,
      text,
      html,
    });

    const status = sendResult.success ? 'SENT' : 'FAILED';
    const errorMessage = sendResult.error || null;

    const record = await notificationRepository.create({
      userId,
      bookingId,
      type,
      recipientEmail,
      subject,
      content: text,
      payload: data,
      status,
      errorMessage,
    });

    console.log(
      `[notification-service] Notification record created with ID: ${record.id} (Status: ${status})`
    );
    return record;
  },
};
