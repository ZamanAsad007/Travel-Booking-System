import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../api/bookings.js';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Mail,
  Zap,
  CreditCard,
  RefreshCw,
  Ban,
} from 'lucide-react';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState('');

  // Auto-poll every 2.5 seconds while status is PENDING!
  const { data, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.getBookingById(id),
    refetchInterval: (query) => {
      const status = query?.state?.data?.data?.booking?.status;
      return status === 'PENDING' ? 2500 : false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err) => {
      setCancelError(err.message || 'Failed to cancel booking');
    },
  });

  const booking = data?.data?.booking;

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this booking? This will release reserved inventory and trigger a refund.')) {
      setCancelError('');
      cancelMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading booking status...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
          <AlertCircle size={20} />
          <strong>Booking not found or failed to load</strong>
        </div>
      </div>
    );
  }

  const isPending = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isCancelled = booking.status === 'CANCELLED';
  const items = booking.items || [];

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/bookings')}
        className="btn btn-secondary"
        style={{ marginBottom: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} />
        Back to Bookings
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <StatusBadge status={booking.status} />
              {isPending && (
                <span style={{ fontSize: '0.8rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <RefreshCw size={13} className="animate-spin" />
                  Live polling saga status...
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              Booking #{booking.id}
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Placed on {new Date(booking.created_at).toLocaleString()}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Amount</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              ${parseFloat(booking.total_amount).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Visual Saga Flow Progress Tracker */}
        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Choreographed Saga Pipeline
          </h4>

          <div className="grid-3" style={{ gap: '1rem' }}>
            <div style={{ background: '#fff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} />
                <span>1. Booking & Hold</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                Inventory reserved in Redis with 10m TTL
              </p>
            </div>

            <div style={{ background: '#fff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isPending ? '#d97706' : isConfirmed ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>
                {isPending ? <Clock size={16} /> : isConfirmed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>2. Payment Process</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                {isPending ? 'Processing mock payment...' : isConfirmed ? 'Payment captured successfully' : 'Payment failed or refunded'}
              </p>
            </div>

            <div style={{ background: '#fff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isPending ? 'var(--text-muted)' : isConfirmed ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>
                {isPending ? <Clock size={16} /> : isConfirmed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>3. Notification</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                {isPending ? 'Waiting on payment...' : 'Dispatched email via Mailpit'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Callout Banner */}
        {isConfirmed && (
          <div style={{ background: 'var(--success-bg)', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#166534' }}>
            <CheckCircle2 size={24} />
            <div>
              <div style={{ fontWeight: 700 }}>Booking Confirmed!</div>
              <div style={{ fontSize: '0.875rem' }}>Your tickets and room reservations are locked in. Check Mailpit (port 8025) for your confirmation email.</div>
            </div>
          </div>
        )}

        {isCancelled && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#991b1b' }}>
            <XCircle size={24} />
            <div>
              <div style={{ fontWeight: 700 }}>Booking Cancelled</div>
              <div style={{ fontSize: '0.875rem' }}>The booking was cancelled and inventory holds have been released back to catalog.</div>
            </div>
          </div>
        )}

        {/* Reserved Items Table */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>Reserved Items</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{item.item_type || item.itemType}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  (Item ID: {item.item_id || item.itemId})
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Quantity: {item.quantity} × ${parseFloat(item.unit_price || item.unitPrice || 0).toFixed(2)}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                ${(parseFloat(item.unit_price || item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Cancellation Action */}
        {cancelError && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {cancelError}
          </div>
        )}

        {!isCancelled && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="btn btn-danger"
              style={{ padding: '0.5rem 1.25rem' }}
            >
              <Ban size={16} />
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
