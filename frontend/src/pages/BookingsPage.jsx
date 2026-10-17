import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '../api/bookings.js';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  Luggage,
  Calendar,
  ArrowRight,
  AlertCircle,
  Clock,
  Ticket,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Tag,
} from 'lucide-react';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'

  const { data, isLoading, error } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingApi.getMyBookings(),
    refetchInterval: 5000, // Poll list every 5 seconds to catch saga updates
  });

  const bookings = data?.data?.bookings || [];

  const counts = {
    ALL: bookings.length,
    CONFIRMED: bookings.filter((b) => b.status === 'CONFIRMED').length,
    PENDING: bookings.filter((b) => b.status === 'PENDING').length,
    CANCELLED: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  return (
    <div className="container" style={{ maxWidth: '960px', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span className="stamp-badge stamp-badge-teal">
            <Luggage size={12} /> Travel Itineraries
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--secondary)' }}>
          My Bookings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Track, modify, and manage your flight and hotel reservations in real time
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--border)',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {[
          { key: 'ALL', label: 'All Trips' },
          { key: 'CONFIRMED', label: 'Confirmed' },
          { key: 'PENDING', label: 'Pending Hold' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: isActive ? 'var(--secondary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--sand-dark)',
                  color: isActive ? '#FFFFFF' : 'var(--text-main)',
                  borderRadius: '9999px',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.72rem',
                }}
              >
                {counts[tab.key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Clock size={32} className="animate-spin text-primary" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Retrieving your travel itineraries...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
            <AlertCircle size={22} />
            <div>
              <strong>Failed to load bookings</strong>
              <div style={{ fontSize: '0.85rem' }}>{error.message || 'An unexpected error occurred'}</div>
            </div>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', border: '1.5px dashed var(--border)' }}>
          <Luggage size={52} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--secondary)' }}>
            {activeTab === 'ALL'
              ? 'No bookings found'
              : `No ${activeTab.toLowerCase()} bookings found`}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {activeTab === 'ALL'
              ? "You haven't made any travel reservations yet. Explore handpicked flights and luxury hotels to plan your next journey!"
              : `You have no trips currently under the ${activeTab.toLowerCase()} status.`}
          </p>
          <Link to="/" className="btn btn-accent" style={{ padding: '0.65rem 1.5rem' }}>
            Start Exploring Flights & Hotels
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredBookings.map((booking) => {
            const items = booking.items || [];
            const firstItem = items[0];
            const isConfirmed = booking.status === 'CONFIRMED';
            const isPending = booking.status === 'PENDING';
            const isCancelled = booking.status === 'CANCELLED';

            return (
              <div
                key={booking.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  border: '1.5px solid var(--border)',
                  borderLeft: `5px solid ${
                    isConfirmed
                      ? 'var(--primary)'
                      : isPending
                      ? 'var(--highlight)'
                      : 'var(--danger)'
                  }`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={booking.status} />

                    {booking.ticket_number && (
                      <span className="stamp-badge stamp-badge-teal" style={{ fontSize: '0.72rem' }}>
                        <ShieldCheck size={11} /> {booking.ticket_number}
                      </span>
                    )}

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      #{booking.id.slice(0, 8)}
                    </span>

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>&bull;</span>

                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={13} />
                      {new Date(booking.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.15rem 0 0.35rem 0', color: 'var(--secondary)' }}>
                    {items.length > 0
                      ? `${items.length} ${items.length === 1 ? 'Travel Reservation' : 'Travel Items'}`
                      : 'Travel Booking Package'}
                  </h3>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {firstItem ? (
                      <span>
                        {firstItem.item_type || firstItem.itemType} &bull; Qty: {firstItem.quantity}
                        {items.length > 1 ? ` (+${items.length - 1} more items)` : ''}
                      </span>
                    ) : (
                      'Flight & Hotel Reservation'
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                      Total Paid
                    </span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                      ${parseFloat(booking.total_amount).toFixed(2)}
                    </div>
                  </div>

                  <Link
                    to={`/bookings/${booking.id}`}
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem 1rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>{isConfirmed ? 'View E-Ticket' : 'View Itinerary'}</span>
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
