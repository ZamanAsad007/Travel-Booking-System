import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '../api/bookings.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { Luggage, Calendar, ArrowRight, AlertCircle, Clock } from 'lucide-react';

export default function BookingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingApi.getMyBookings(),
    refetchInterval: 5000, // Poll list every 5 seconds to catch saga updates
  });

  const bookings = data?.data?.bookings || [];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          My Bookings
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Track and manage your flight and hotel reservations in real-time
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading your bookings...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <AlertCircle size={20} />
            <strong>Failed to load bookings: {error.message || 'Error occurred'}</strong>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Luggage size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Bookings Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You haven't made any travel bookings yet. Explore our flights and hotels to get started!
          </p>
          <Link to="/" className="btn btn-primary">
            Start Booking
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map((booking) => {
            const items = booking.items || [];
            const firstItem = items[0];

            return (
              <div
                key={booking.id}
                className="card card-hover"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <StatusBadge status={booking.status} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      #{booking.id.slice(0, 8)}...
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={13} />
                      {new Date(booking.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                    {items.length > 0
                      ? `${items.length} ${items.length === 1 ? 'Travel Item' : 'Travel Items'}`
                      : 'Travel Reservation'}
                  </h3>

                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {firstItem ? (
                      <span>
                        {firstItem.item_type || firstItem.itemType} (Qty: {firstItem.quantity})
                        {items.length > 1 ? ` + ${items.length - 1} more` : ''}
                      </span>
                    ) : (
                      'Standard Booking Package'
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Amount</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      ${parseFloat(booking.total_amount).toFixed(2)}
                    </div>
                  </div>

                  <Link to={`/bookings/${booking.id}`} className="btn btn-secondary">
                    <span>View Status</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
