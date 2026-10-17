import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../api/bookings.js';
import { catalogApi } from '../api/catalog.js';
import { useBookingStatus } from '../hooks/useBookingStatus.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ProgressTracker from '../components/ProgressTracker.jsx';
import BoardingPass from '../components/BoardingPass.jsx';
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
  Download,
  Calendar,
  Ticket,
  Users,
  Radio,
  Activity,
  Tag,
  Building,
  Star,
  Award,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // Real-time status via SSE stream with polling fallback
  const {
    booking,
    isLoading,
    error,
    connectionState,
    liveEvent,
    toast,
    clearToast,
  } = useBookingStatus(id);

  // If booking has flight items, find flight details for boarding pass
  const flightItem = booking?.items?.find(
    (item) => (item.item_type || item.itemType) === 'FLIGHT'
  );

  const { data: flightDetailsData } = useQuery({
    queryKey: ['flightDetails', flightItem?.item_id || flightItem?.itemId],
    queryFn: () =>
      catalogApi.getFlightById(flightItem?.item_id || flightItem?.itemId),
    enabled: !!(flightItem?.item_id || flightItem?.itemId),
  });

  const flightDetails = flightDetailsData?.data?.flight || null;

  // Search hotel recommendations for destination
  const destination = flightDetails?.destination || 'PAR';
  const { data: hotelsData } = useQuery({
    queryKey: ['recommendedHotels', destination],
    queryFn: () => catalogApi.searchHotels({ destination }),
    enabled: !!destination,
  });

  const recommendedHotels = (hotelsData?.data?.hotels || []).slice(0, 3);

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      setIsCancelModalOpen(false);
    },
    onError: (err) => {
      setCancelError(err.message || 'Failed to cancel booking');
    },
  });

  const handleConfirmCancel = () => {
    setCancelError('');
    cancelMutation.mutate();
  };

  const handleDownloadTicket = async () => {
    setIsDownloading(true);
    setDownloadError('');
    try {
      await bookingApi.downloadTicket(booking.id, booking.ticket_number || booking.id);
    } catch (err) {
      setDownloadError(err.message || 'Failed to download e-ticket');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!booking) return;

    const departureDate = flightDetails?.departs_at
      ? new Date(flightDetails.departs_at)
      : new Date(booking.created_at);
    const arrivalDate = flightDetails?.arrives_at
      ? new Date(flightDetails.arrives_at)
      : new Date(departureDate.getTime() + 4 * 3600 * 1000);

    const formatIcsDate = (date) =>
      date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const origin = flightDetails?.origin || 'Airport';
    const dest = flightDetails?.destination || 'Destination';
    const flightNum =
      flightDetails?.flight_number || booking.ticket_number || 'TG-400';
    const passenger =
      booking.travelers?.[0]?.full_name ||
      booking.travelers?.[0]?.fullName ||
      'Traveler';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TravelGo//Travel Booking Platform//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:travelgo-${booking.id}-${Date.now()}@travelgo.com`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(departureDate)}`,
      `DTEND:${formatIcsDate(arrivalDate)}`,
      `SUMMARY:TravelGo Flight ${flightNum}: ${origin} to ${dest}`,
      `DESCRIPTION:TravelGo Booking #${booking.id}\\nPassenger: ${passenger}\\nTicket: ${
        booking.ticket_number || 'Confirmed'
      }`,
      `LOCATION:${origin} to ${dest}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `travelgo-booking-${booking.id.slice(0, 8)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', marginBottom: '1rem' }}>
          <RefreshCw size={28} className="animate-spin text-primary" />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Loading your travel booking details...
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '700px' }}>
        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
            <AlertCircle size={24} />
            <div>
              <strong style={{ display: 'block', fontSize: '1rem' }}>Booking Not Found</strong>
              <span style={{ fontSize: '0.85rem' }}>
                We couldn't load the details for this reservation. It may have expired or was removed.
              </span>
            </div>
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <Link to="/bookings" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              Back to My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPending = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isCancelled = booking.status === 'CANCELLED';
  const items = booking.items || [];
  const travelers = booking.travelers || [];
  const totalAmount = parseFloat(booking.total_amount || 0);
  const discountAmount = parseFloat(booking.discount_amount || 0);
  const subtotal = totalAmount + discountAmount;
  const loyaltyPointsEarned = Math.max(1, Math.floor(totalAmount / 10));

  return (
    <div className="container" style={{ maxWidth: '900px', padding: '2rem 1.5rem 4rem' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/bookings')}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} />
          Back to Bookings
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Real-Time Toast Notification */}
      {toast && (
        <div
          style={{
            background:
              toast.type === 'success'
                ? '#DCFCE7'
                : toast.type === 'danger'
                ? '#FEE2E2'
                : '#E0F2FE',
            border: `1.5px solid ${
              toast.type === 'success'
                ? '#86EFAC'
                : toast.type === 'danger'
                ? '#FCA5A5'
                : '#7DD3FC'
            }`,
            color:
              toast.type === 'success'
                ? '#166534'
                : toast.type === 'danger'
                ? '#991B1B'
                : '#0369A1',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 600 }}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : toast.type === 'danger' ? (
              <XCircle size={18} />
            ) : (
              <Activity size={18} />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={clearToast}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '0.2rem',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Booking Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="stamp-badge stamp-badge-navy">
                <Ticket size={12} /> TravelGo Itinerary
              </span>
              {booking.ticket_number && (
                <span className="stamp-badge stamp-badge-teal">
                  <ShieldCheck size={12} /> {booking.ticket_number}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0' }}>
              Booking #{booking.id.slice(0, 8)}...
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Placed on {new Date(booking.created_at).toLocaleDateString([], {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Total Paid
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
              ${totalAmount.toFixed(2)}
            </div>
            {booking.coupon_code && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#166534',
                  background: '#DCFCE7',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Tag size={11} /> {booking.coupon_code} (-${discountAmount.toFixed(2)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ProgressTracker: Saga Pipeline & Live Status */}
      <ProgressTracker
        booking={booking}
        connectionState={connectionState}
        liveEvent={liveEvent}
      />

      {/* Confirmed Boarding Pass Component */}
      {isConfirmed && (
        <BoardingPass
          booking={booking}
          flightDetails={flightDetails}
          traveler={travelers[0]}
          onDownloadTicket={handleDownloadTicket}
          onAddToCalendar={handleAddToCalendar}
          isDownloading={isDownloading}
        />
      )}

      {downloadError && (
        <div
          style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Travelers Section */}
      {travelers.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Users size={18} style={{ color: 'var(--primary)' }} />
            Traveler Details ({travelers.length})
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
              gap: '0.85rem',
            }}
          >
            {travelers.map((t, idx) => (
              <div
                key={t.id || idx}
                style={{
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  background: '#FAF7F2',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--secondary)' }}>
                    {idx + 1}. {t.full_name || t.fullName}
                  </span>
                  {(t.seat_no || t.seatNo) && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      Seat {t.seat_no || t.seatNo}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Passport / ID: <strong style={{ color: 'var(--text-main)' }}>{t.passport_no || t.passportNo}</strong>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  DOB: {t.date_of_birth ? new Date(t.date_of_birth).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reserved Items & Price Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
          Reserved Items & Price Breakdown
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: '#FAF7F2',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--secondary)' }}>
                  {item.item_type || item.itemType}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  (Item ID: {item.item_id || item.itemId})
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Quantity: {item.quantity} &times; ${parseFloat(item.unit_price || item.unitPrice || 0).toFixed(2)}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                ${(parseFloat(item.unit_price || item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Price Summary */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1.5px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Items Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {booking.coupon_code && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#166534', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={14} /> Coupon ({booking.coupon_code})
              </span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: '0.75rem',
              marginTop: '0.75rem',
            }}
          >
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>
                Total Paid
              </span>
              <div style={{ marginTop: '0.25rem' }}>
                <span className="stamp-badge stamp-badge-amber">
                  <Award size={12} /> +{loyaltyPointsEarned} TravelGo Points Earned
                </span>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
              ${totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Cancellation Actions */}
        {cancelError && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginTop: '1.25rem',
              fontSize: '0.875rem',
            }}
          >
            {cancelError}
          </div>
        )}

        {!isCancelled && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1.25rem',
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Need to change your itinerary? Cancellations will release inventory holds and trigger refund compensation.
            </span>

            <button
              onClick={() => setIsCancelModalOpen(true)}
              disabled={cancelMutation.isPending}
              className="btn btn-danger"
              style={{ padding: '0.45rem 1.15rem', fontSize: '0.85rem' }}
            >
              <Ban size={15} />
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Reservation'}
            </button>
          </div>
        )}
      </div>

      {/* "Make the most of your trip" Hotel Suggestions */}
      {recommendedHotels.length > 0 && (
        <div className="trip-suggestion-box">
          <div className="trip-suggestion-header">
            <div>
              <span className="stamp-badge stamp-badge-teal" style={{ marginBottom: '0.35rem' }}>
                <Building size={12} /> Destination Recommendations
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)', margin: '0.2rem 0' }}>
                Make the Most of Your Trip
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Top-rated hotels in {destination} near your arrival airport.
              </p>
            </div>
            <Link
              to={`/hotels?destination=${encodeURIComponent(destination)}`}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
            >
              <span>Explore All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="suggestion-hotels-grid">
            {recommendedHotels.map((hotel) => (
              <div key={hotel.id} className="suggestion-hotel-card">
                <img
                  src={
                    hotel.image_url ||
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={hotel.name}
                  className="suggestion-hotel-img"
                  loading="lazy"
                />
                <div className="suggestion-hotel-content">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <Star size={13} fill="#F5B83D" stroke="#F5B83D" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        {hotel.avg_rating ? parseFloat(hotel.avg_rating).toFixed(1) : '4.8'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({hotel.city || destination})
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary)', margin: '0.15rem 0' }}>
                      {hotel.name}
                    </h4>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.75rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>From</span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ${parseFloat(hotel.price_per_night || 120).toFixed(0)}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/night</span>
                    </div>

                    <Link
                      to={`/hotels/${hotel.id}`}
                      className="btn btn-accent"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      View Hotel
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCancelModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Ban size={20} style={{ color: 'var(--danger)' }} />
                <span>Cancel Reservation</span>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '1rem' }}>
                Are you sure you want to cancel booking <strong>#{booking.id}</strong>?
              </p>
              <div
                style={{
                  background: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem',
                  fontSize: '0.82rem',
                  color: '#9F1239',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                  What happens when you cancel:
                </div>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  <li>Your reserved seats & rooms will be immediately released back to the catalog.</li>
                  <li>A full refund of <strong>${totalAmount.toFixed(2)}</strong> will be credited via saga compensation.</li>
                  <li>An updated cancellation receipt will be dispatched to your email.</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={cancelMutation.isPending}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Processing...' : 'Yes, Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
