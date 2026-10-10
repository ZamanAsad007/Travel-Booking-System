import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../api/bookings.js';

/**
 * Custom hook to monitor booking status in real-time via Server-Sent Events (SSE)
 * with automatic fallback to polling when disconnected.
 */
export function useBookingStatus(bookingId) {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState('connecting'); // 'connecting' | 'connected' | 'polling_fallback'
  const [liveEvent, setLiveEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const esRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initial and reactive query
  const query = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId),
    enabled: !!bookingId,
    // Only poll if SSE is in polling_fallback mode and booking is PENDING
    refetchInterval: (q) => {
      const status = q?.state?.data?.data?.booking?.status;
      if (connectionState === 'polling_fallback' && status === 'PENDING') {
        return 2500;
      }
      return false;
    },
  });

  const booking = query.data?.data?.booking;

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    const token = localStorage.getItem('token');

    const connectSse = () => {
      if (booking && booking.status !== 'PENDING') {
        setConnectionState('connected');
        return;
      }

      if (esRef.current) {
        esRef.current.close();
      }

      try {
        const streamUrl = `/api/notifications/stream/bookings?bookingId=${encodeURIComponent(bookingId)}${
          token ? `&token=${encodeURIComponent(token)}` : ''
        }`;

        const es = new EventSource(streamUrl);
        esRef.current = es;

        es.onopen = () => {
          if (!isMounted) return;
          console.log('[SSE] Connected to live booking stream');
          setConnectionState('connected');
        };

        es.addEventListener('booking_update', (e) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(e.data);
            console.log('[SSE] Received booking update:', data);
            setLiveEvent(data);

            // Refetch query to get fully populated items, travelers, and ticket number
            queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });

            // Toast notifications
            if (data.status === 'CONFIRMED' || data.event === 'booking.confirmed') {
              setToast({
                type: 'success',
                message: `🎉 Booking Confirmed! E-Ticket ${data.ticketNumber || ''} is ready.`,
              });
            } else if (data.status === 'CANCELLED' || data.event === 'payment.failed') {
              setToast({
                type: 'danger',
                message: `❌ Booking Cancelled: ${data.data?.reason || data.message || 'Payment failed'}`,
              });
            } else if (data.status === 'PAYMENT_SUCCESS') {
              setToast({
                type: 'info',
                message: '💳 Payment captured successfully. Finalizing booking...',
              });
            }
          } catch (err) {
            console.warn('[SSE] Failed to parse event data:', err);
          }
        });

        es.onerror = (err) => {
          if (!isMounted) return;
          console.warn('[SSE] EventSource connection error. Falling back to polling...', err);
          es.close();
          setConnectionState('polling_fallback');

          // Attempt reconnection after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              connectSse();
            }
          }, 5000);
        };
      } catch (err) {
        if (!isMounted) return;
        setConnectionState('polling_fallback');
      }
    };

    connectSse();

    return () => {
      isMounted = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [bookingId, queryClient, booking?.status]);

  const clearToast = () => setToast(null);

  return {
    ...query,
    booking,
    connectionState,
    liveEvent,
    toast,
    clearToast,
  };
}
