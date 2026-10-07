import { v4 as uuidv4 } from 'uuid';
import { paymentRepository } from '../repositories/paymentRepository.js';
import { eventBus } from '../../../../shared/events/eventBus.js';
import { EVENTS } from '../../../../shared/constants/events.js';
import { config } from '../config/env.js';

export const paymentService = {
  async processPayment({ bookingId, amount, userId, items = [] }) {
    console.log(`[payment-service] Processing mock payment for booking ${bookingId} ($${amount})...`);

    // Simulate real gateway processing delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Determine mock outcome
    const isSuccess = Math.random() < config.paymentSuccessRate;
    const transactionRef = `txn_${uuidv4().substring(0, 8)}`;
    const status = isSuccess ? 'SUCCESS' : 'FAILED';

    const payment = await paymentRepository.createPayment({
      bookingId,
      amount,
      status,
      transactionRef,
    });

    if (isSuccess) {
      console.log(`[payment-service] Payment SUCCEEDED for booking ${bookingId} (${transactionRef})`);
      await eventBus.publish(EVENTS.PAYMENT_SUCCEEDED, {
        bookingId,
        userId,
        amount,
        transactionRef,
        items,
      });
    } else {
      console.warn(`[payment-service] Payment FAILED for booking ${bookingId} (${transactionRef})`);
      await eventBus.publish(EVENTS.PAYMENT_FAILED, {
        bookingId,
        userId,
        amount,
        reason: 'Payment card declined by issuing bank (insufficient funds)',
      });
    }

    return payment;
  },

  async processRefund({ bookingId, amount, userId }) {
    console.log(`[payment-service] Processing refund for cancelled booking ${bookingId}...`);

    const latestPayment = await paymentRepository.findLatestByBookingId(bookingId);
    if (!latestPayment || latestPayment.status !== 'SUCCESS') {
      console.log(`[payment-service] No successful payment found to refund for booking ${bookingId}`);
      return null;
    }

    const refundRef = `ref_${uuidv4().substring(0, 8)}`;
    const refundPayment = await paymentRepository.createPayment({
      bookingId,
      amount: latestPayment.amount,
      status: 'REFUNDED',
      transactionRef: refundRef,
    });

    console.log(`[payment-service] Refund processed for booking ${bookingId} (${refundRef})`);

    await eventBus.publish(EVENTS.PAYMENT_REFUNDED, {
      bookingId,
      userId: userId || null,
      amount: latestPayment.amount,
      refundRef,
    });

    return refundPayment;
  },

  async getPaymentsByBookingId(bookingId) {
    return paymentRepository.findByBookingId(bookingId);
  },
};
