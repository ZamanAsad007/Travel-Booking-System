import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '../api/bookings.js';
import { catalogApi } from '../api/catalog.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  Luggage,
  Calendar,
  ArrowRight,
  AlertCircle,
  Clock,
  Ticket,
  ShieldCheck,
  Plane,
  Hotel,
  MapPin,
  Download,
  Users,
  Sparkles,
} from 'lucide-react';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  const [catalogItemsMap, setCatalogItemsMap] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingApi.getMyBookings(),
    refetchInterval: 5000, // Poll list every 5 seconds to catch saga updates
  });

  const bookings = data?.data?.bookings || [];

  // Fetch real catalog details for all items across bookings
  useEffect(() => {
    if (!bookings.length) return;

    let active = true;
    const fetchCatalogDetails = async () => {
      const itemsToFetch = [];
      for (const b of bookings) {
        for (const it of b.items || []) {
          const type = (it.item_type || it.itemType || '').toLowerCase();
          const id = it.item_id || it.itemId;
          if (id && !catalogItemsMap[id]) {
            itemsToFetch.push({ type, id });
          }
        }
      }

      if (itemsToFetch.length === 0) return;

      const newDetails = {};
      await Promise.all(
        itemsToFetch.map(async ({ type, id }) => {
          try {
            if (type === 'flight') {
              const res = await catalogApi.getFlightById(id);
              const flight = res?.data?.flight || res?.data;
              if (flight && flight.id) {
                newDetails[id] = { ...flight, itemType: 'flight' };
              }
            } else if (type === 'hotel') {
              const res = await catalogApi.getHotelById(id);
              const hotel = res?.data?.hotel || res?.data;
              if (hotel && hotel.id) {
                newDetails[id] = { ...hotel, itemType: 'hotel' };
              }
            }
          } catch (e) {
            console.warn(`Could not load catalog info for item ${id}:`, e.message);
          }
        })
      );

      if (active && Object.keys(newDetails).length > 0) {
        setCatalogItemsMap((prev) => ({ ...prev, ...newDetails }));
      }
    };

    fetchCatalogDetails();
    return () => {
      active = false;
    };
  }, [bookings]);

  const handleDownloadTicket = async (booking, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!booking.id) return;
    try {
      setDownloadingId(booking.id);
      await bookingApi.downloadTicket(booking.id, booking.ticket_number || booking.id);
    } catch (err) {
      console.error('Failed to download e-ticket:', err);
    } finally {
      setDownloadingId(null);
    }
  };

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
    <div className="container" style={{ maxWidth: '1100px', padding: '2rem 1.5rem 5rem' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="stamp-badge stamp-badge-teal">
            <Luggage size={12} /> Travel Itineraries
          </span>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--secondary)' }}>
          My Bookings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '640px' }}>
          Track real-time flight boarding passes, hotel reservations, and live saga updates
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--border)',
          marginBottom: '2.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
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
                padding: '0.55rem 1.2rem',
                fontSize: '0.88rem',
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
                  padding: '0.1rem 0.5rem',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card"
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton height="24px" width="160px" />
                <Skeleton height="20px" width="120px" />
              </div>
              <Skeleton height="32px" width="45%" />
              <Skeleton height="18px" width="70%" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <Skeleton height="28px" width="100px" />
                <Skeleton height="40px" width="150px" variant="rectangular" style={{ borderRadius: 'var(--radius-sm)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
            <AlertCircle size={24} />
            <div>
              <strong>Failed to load bookings</strong>
              <div style={{ fontSize: '0.85rem' }}>{error.message || 'An unexpected error occurred'}</div>
            </div>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title={
            activeTab === 'ALL'
              ? 'No travel reservations found'
              : `No ${activeTab.toLowerCase()} bookings found`
          }
          description={
            activeTab === 'ALL'
              ? "You haven't made any flight or hotel reservations yet. Explore scheduled flights and luxury hotels to plan your next journey!"
              : `You have no trips currently under the ${activeTab.toLowerCase()} status.`
          }
          actionText="Search Flights & Hotels"
          actionLink="/"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredBookings.map((booking) => {
            const items = booking.items || [];
            const isConfirmed = booking.status === 'CONFIRMED';
            const isPending = booking.status === 'PENDING';
            const isCancelled = booking.status === 'CANCELLED';

            const flightItems = items.filter(
              (it) => (it.item_type || it.itemType || '').toLowerCase() === 'flight'
            );
            const hotelItems = items.filter(
              (it) => (it.item_type || it.itemType || '').toLowerCase() === 'hotel'
            );
            const isPackage = flightItems.length > 0 && hotelItems.length > 0;

            const primaryFlight = flightItems[0];
            const primaryHotel = hotelItems[0];

            const flightInfo = primaryFlight ? catalogItemsMap[primaryFlight.item_id || primaryFlight.itemId] : null;
            const hotelInfo = primaryHotel ? catalogItemsMap[primaryHotel.item_id || primaryHotel.itemId] : null;

            // Compute dynamic descriptive title from real catalog items
            let bookingTitle = 'Travel Booking';
            if (isPackage) {
              const destCity = hotelInfo?.city || flightInfo?.destination || 'Vacation';
              bookingTitle = `${destCity} Vacation Package`;
            } else if (flightInfo) {
              bookingTitle = `${flightInfo.airline || 'Flight'} ${flightInfo.flight_number ? `(${flightInfo.flight_number})` : ''} • ${flightInfo.origin} → ${flightInfo.destination}`;
            } else if (hotelInfo) {
              bookingTitle = `${hotelInfo.name || 'Hotel Stay'} • ${hotelInfo.city || ''}`;
            } else if (items.length > 0) {
              bookingTitle = `${items.length} ${items.length === 1 ? 'Travel Reservation' : 'Travel Items'}`;
            }

            const travelerCount = booking.travelers?.length || items[0]?.quantity || 1;

            return (
              <div
                key={booking.id}
                className="card card-hover"
                style={{
                  border: '1.5px solid var(--border)',
                  borderLeft: `5px solid ${
                    isConfirmed
                      ? 'var(--primary)'
                      : isPending
                      ? 'var(--highlight)'
                      : 'var(--danger)'
                  }`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                  background: 'var(--surface)',
                }}
              >
                {/* Top Meta Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={booking.status} />

                    {isPackage && (
                      <span className="stamp-badge stamp-badge-amber" style={{ fontSize: '0.75rem' }}>
                        <Sparkles size={11} /> Vacation Package
                      </span>
                    )}

                    {booking.ticket_number && (
                      <span className="stamp-badge stamp-badge-teal" style={{ fontSize: '0.75rem' }}>
                        <ShieldCheck size={11} /> {booking.ticket_number}
                      </span>
                    )}

                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      #{booking.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Calendar size={14} style={{ color: 'var(--primary)' }} />
                    <span>
                      Booked on{' '}
                      {new Date(booking.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div>
                  <h3
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      margin: '0 0 0.5rem 0',
                      color: 'var(--secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {isPackage ? <Sparkles size={20} style={{ color: 'var(--highlight)' }} /> : isFlight(items) ? <Plane size={20} style={{ color: 'var(--primary)' }} /> : <Hotel size={20} style={{ color: 'var(--secondary)' }} />}
                    <span>{bookingTitle}</span>
                  </h3>

                  {/* Flight Segment Details if present */}
                  {flightInfo && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.05) 0%, rgba(11, 37, 69, 0.02) 100%)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        margin: '0.75rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                          }}
                        >
                          <Plane size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.95rem' }}>
                            {flightInfo.airline} {flightInfo.flight_number ? `(${flightInfo.flight_number})` : ''}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock size={13} />
                            <span>
                              Departs:{' '}
                              {flightInfo.departs_at
                                ? new Date(flightInfo.departs_at).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : primaryFlight?.date_from
                                ? new Date(primaryFlight.date_from).toLocaleDateString()
                                : 'Scheduled'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--secondary)' }}>
                          {flightInfo.origin}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', minWidth: '60px' }}>
                          <span style={{ height: '1.5px', width: '100%', background: 'var(--primary)' }} />
                          <ArrowRight size={14} style={{ marginLeft: '-4px' }} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--secondary)' }}>
                          {flightInfo.destination}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hotel Segment Details if present */}
                  {hotelInfo && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(11, 37, 69, 0.04) 0%, rgba(245, 184, 61, 0.04) 100%)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        margin: '0.75rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#b45309',
                          }}
                        >
                          <Hotel size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.95rem' }}>
                            {hotelInfo.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MapPin size={13} />
                            <span>{hotelInfo.city || hotelInfo.address}</span>
                          </div>
                        </div>
                      </div>

                      {(primaryHotel?.date_from || primaryHotel?.date_to) && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                          <div>
                            Check-in: <strong>{new Date(primaryHotel.date_from).toLocaleDateString()}</strong>
                          </div>
                          <div>
                            Check-out: <strong>{new Date(primaryHotel.date_to).toLocaleDateString()}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Booking Traveler & Items Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users size={14} style={{ color: 'var(--primary)' }} />
                      <span>{travelerCount} {travelerCount === 1 ? 'Traveler' : 'Travelers'}</span>
                    </span>

                    {booking.travelers && booking.travelers.length > 0 && (
                      <>
                        <span>&bull;</span>
                        <span>
                          Lead Traveler: <strong>{booking.travelers[0].full_name}</strong>
                          {booking.travelers[0].seat_no ? ` (Seat ${booking.travelers[0].seat_no})` : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Amount & Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '1rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, display: 'block' }}>
                      {isConfirmed ? 'Total Paid' : isPending ? 'Reserved Amount' : 'Original Amount'}
                    </span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                      ${parseFloat(booking.total_amount || 0).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {isConfirmed && booking.ticket_number && (
                      <button
                        type="button"
                        onClick={(e) => handleDownloadTicket(booking, e)}
                        disabled={downloadingId === booking.id}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.55rem 0.95rem',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                        title="Download official PDF ticket"
                      >
                        <Download size={15} />
                        <span>{downloadingId === booking.id ? 'Generating...' : 'Download PDF'}</span>
                      </button>
                    )}

                    <Link
                      to={`/bookings/${booking.id}`}
                      className={`btn ${isConfirmed ? 'btn-primary' : isPending ? 'btn-accent' : 'btn-secondary'}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.55rem 1.15rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                      }}
                    >
                      {isConfirmed ? (
                        <>
                          <Ticket size={16} />
                          <span>View E-Ticket & Pass</span>
                        </>
                      ) : isPending ? (
                        <>
                          <Clock size={16} />
                          <span>Track Live Status</span>
                        </>
                      ) : (
                        <>
                          <span>View Itinerary</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function isFlight(items) {
  return items.some((it) => (it.item_type || it.itemType || '').toLowerCase() === 'flight');
}
