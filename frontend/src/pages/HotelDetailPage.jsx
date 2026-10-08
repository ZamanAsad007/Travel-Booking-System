import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Hotel, Star, MapPin, CheckCircle, Bed, ArrowRight, AlertCircle } from 'lucide-react';

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['hotel', id],
    queryFn: () => catalogApi.getHotelById(id),
  });

  const hotel = data?.data?.hotel;

  const handleBookRoom = (room) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/hotels/${id}` } } });
      return;
    }

    navigate('/checkout', {
      state: {
        itemType: 'HOTEL_ROOM',
        itemId: room.id,
        quantity: 1,
        unitPrice: parseFloat(room.price_per_night),
        title: `${hotel.name} - ${room.type}`,
        subtitle: `Room Type: ${room.type} (${hotel.city})`,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
      },
    });
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
          <AlertCircle size={20} />
          <strong>Hotel not found or failed to load</strong>
        </div>
      </div>
    );
  }

  const rooms = hotel.rooms || [];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', marginBottom: '0.35rem' }}>
              <Star size={18} fill="#d97706" />
              <span style={{ fontWeight: 700 }}>{parseFloat(hotel.rating || 4.5).toFixed(1)} Star Luxury Accommodation</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0' }}>{hotel.name}</h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <MapPin size={16} />
              <span>{hotel.city}</span>
            </p>
          </div>
        </div>

        {/* Date Preferences */}
        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Stay Dates (Optional)</h4>
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
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>Available Rooms & Suites</h2>

        {rooms.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No rooms currently available in this hotel.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rooms.map((room) => {
              const availableRooms = room.available_rooms !== undefined ? room.available_rooms : (room.rooms_total - (room.booked_rooms || 0));
              const isFull = availableRooms <= 0;

              return (
                <div key={room.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Bed size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{room.type}</h3>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Free High-Speed WiFi
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Breakfast Included
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        ${parseFloat(room.price_per_night).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: isFull ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {isFull ? 'Sold Out' : `${availableRooms} rooms available`}
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookRoom(room)}
                      disabled={isFull}
                      className="btn btn-primary"
                      style={{ minWidth: '120px' }}
                    >
                      <span>Book Room</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
