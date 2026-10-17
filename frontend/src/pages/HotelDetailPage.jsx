import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog.js';
import { engagementApi } from '../api/engagement.js';
import { useAuth } from '../context/AuthContext.jsx';
import ReviewList from '../components/ReviewList.jsx';
import PriceHistoryChart from '../components/PriceHistoryChart.jsx';
import SetPriceAlertModal from '../components/SetPriceAlertModal.jsx';
import { Hotel, Star, MapPin, CheckCircle, Bed, ArrowRight, AlertCircle, Heart, Bell } from 'lucide-react';

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      engagementApi.getWishlist().then((res) => {
        if (res.success && res.data) {
          const found = res.data.some(
            (w) => w.item_type?.toLowerCase() === 'hotel' && w.item_id === id
          );
          setIsWishlisted(found);
        }
      }).catch(() => {});
    }
  }, [id, isAuthenticated]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (isWishlisted) {
        await engagementApi.removeFromWishlist('hotel', id);
        setIsWishlisted(false);
      } else {
        await engagementApi.addToWishlist('hotel', id);
        setIsWishlisted(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['hotel', id],
    queryFn: () => catalogApi.getHotelById(id),
  });

  const hotel = data?.data?.hotel;

  const handleBookRoom = (room) => {
    const checkoutState = {
      itemType: 'hotel',
      itemId: room.id,
      quantity: 1,
      unitPrice: parseFloat(room.price_per_night),
      title: `${hotel.name} - ${room.type}`,
      subtitle: `Room Type: ${room.type} (${hotel.city})`,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
    };

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: {
            pathname: '/checkout',
            state: checkoutState,
          },
        },
      });
      return;
    }

    navigate('/checkout', { state: checkoutState });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading hotel details...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}
        >
          <AlertCircle size={20} />
          <strong>Hotel not found or failed to load</strong>
        </div>
      </div>
    );
  }

  const rooms = hotel.rooms || [];
  const hotelImage =
    hotel.image_url ||
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Photo-First Hero Gallery */}
      <div className="hotel-hero-gallery">
        <img
          src={hotelImage}
          alt={hotel.name}
          className="hotel-hero-img"
          decoding="async"
          loading="eager"
        />
        <div className="hotel-hero-overlay">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span className="rating-pill" style={{ background: '#F5B83D', color: '#1B2B34' }}>
              <Star size={12} fill="currentColor" />
              {parseFloat(hotel.rating || 4.8).toFixed(1)}
            </span>
            <span className="stamp-badge stamp-badge-navy" style={{ background: 'rgba(255,255,255,0.95)', border: 'none' }}>
              {hotel.city}
            </span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#FFFFFF', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {hotel.name}
          </h1>

          <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', margin: 0 }}>
            <MapPin size={16} />
            <span>{hotel.address || `${hotel.city} Center`}</span>
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Amenity Chips */}
          <div className="amenity-chip-row" style={{ margin: 0 }}>
            <span className="amenity-chip">Free Wi-Fi</span>
            <span className="amenity-chip">Infinity Pool</span>
            <span className="amenity-chip">Full Spa</span>
            <span className="amenity-chip">Complimentary Breakfast</span>
            <span className="amenity-chip" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
              <CheckCircle size={12} /> Saga Protected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isAuthenticated && (
              <button
                onClick={() => setShowAlertModal(true)}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem',
                }}
                title="Set price drop alert"
              >
                <Bell size={16} />
                <span>Price Alert</span>
              </button>
            )}

            <button
              onClick={handleToggleWishlist}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: isWishlisted ? 'var(--accent)' : 'var(--text-muted)',
                borderColor: isWishlisted ? '#fca5a5' : 'var(--border)',
                background: isWishlisted ? '#FFF1EE' : '#FFF',
                padding: '0.45rem 0.9rem',
                fontSize: '0.85rem',
              }}
              title={isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
              <span>{isWishlisted ? 'Saved' : 'Save Hotel'}</span>
            </button>
          </div>
        </div>

        {/* Date Preferences */}
        <div
          style={{
            background: '#FAF7F2',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: '1.75rem',
          }}
        >
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--secondary)' }}>
            Choose Your Stay Dates
          </h4>
          <div className="grid-2">
            <div>
              <label className="form-label">Check-in Date</label>
              <input
                type="date"
                className="form-input"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Check-out Date</label>
              <input
                type="date"
                className="form-input"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Available Rooms Section */}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--secondary)' }}>
          Available Rooms & Suites
        </h2>

        {rooms.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No rooms currently available in this hotel.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rooms.map((room) => {
              const availableRooms =
                room.available_rooms !== undefined
                  ? room.available_rooms
                  : room.rooms_total - (room.booked_rooms || 0);
              const isFull = availableRooms <= 0;

              return (
                <div
                  key={room.id}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                      }}
                    >
                      <Bed size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                        {room.type}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          marginTop: '0.25rem',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Free
                          High-Speed WiFi
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Breakfast
                          Included
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}
                      >
                        ${parseFloat(room.price_per_night).toFixed(2)}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: isFull ? 'var(--danger)' : 'var(--text-muted)',
                        }}
                      >
                        {isFull ? 'Sold Out' : `${availableRooms} rooms available`}
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookRoom(room)}
                      disabled={isFull}
                      className="btn btn-accent"
                      style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <span>Reserve Room</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PriceHistoryChart
        itemType="hotel"
        itemId={id}
        currentPrice={hotel.rooms?.[0]?.price_per_night || 120}
      />

      <ReviewList
        itemType="hotel"
        itemId={id}
        roomIds={hotel.rooms?.map((r) => r.id) || []}
      />

      <SetPriceAlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        itemType="hotel"
        itemId={id}
        itemName={hotel.name}
        currentPrice={hotel.rooms?.[0]?.price_per_night || 120}
      />
    </div>
  );
}
