import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plane, Hotel, Search, ArrowRight, ShieldCheck, Zap, Bell } from 'lucide-react';
import { AIRPORTS, HOTEL_CITIES } from '../constants/locations.js';

export default function HomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('flights');

  // Flight search inputs
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [flightDate, setFlightDate] = useState('');

  // Hotel search inputs
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const handleFlightSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.append('from', origin);
    if (destination) params.append('to', destination);
    if (flightDate) params.append('date', flightDate);
    navigate(`/flights?${params.toString()}`);
  };

  const handleHotelSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (checkIn) params.append('checkIn', checkIn);
    if (checkOut) params.append('checkOut', checkOut);
    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <h1>Discover Seamless Travel</h1>
        <p>Book flights and premium hotel rooms with event-driven saga reliability.</p>
      </div>

      {/* Interactive Search Box */}
      <div
        className="card"
        style={{ marginTop: '-2.5rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="tabs">
          <button
            type="button"
            className={`tab-btn ${tab === 'flights' ? 'active' : ''}`}
            onClick={() => setTab('flights')}
          >
            <Plane size={18} />
            <span>Search Flights</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'hotels' ? 'active' : ''}`}
            onClick={() => setTab('hotels')}
          >
            <Hotel size={18} />
            <span>Search Hotels</span>
          </button>
        </div>

        {tab === 'flights' ? (
          <form onSubmit={handleFlightSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From (Origin)</label>
              <select
                className="form-input"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              >
                <option value="">All Origins</option>
                {AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To (Destination)</label>
              <select
                className="form-input"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">All Destinations</option>
                {AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Departure Date</label>
              <input
                type="date"
                className="form-input"
                value={flightDate}
                onChange={(e) => setFlightDate(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
              <Search size={16} />
              Find Flights
            </button>
          </form>
        ) : (
          <form onSubmit={handleHotelSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">City or Destination</label>
              <select className="form-input" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All Cities / Destinations</option>
                {HOTEL_CITIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Check-in Date</label>
              <input
                type="date"
                className="form-input"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Check-out Date</label>
              <input
                type="date"
                className="form-input"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: '42px', backgroundColor: 'var(--secondary)' }}
            >
              <Search size={16} />
              Find Hotels
            </button>
          </form>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="grid-3">
        <div className="card">
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: '1rem',
            }}
          >
            <Zap size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Choreographed Saga
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Asynchronous orchestration between booking, catalog, payment, and notification
            microservices using RabbitMQ.
          </p>
        </div>

        <div className="card">
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success)',
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Redis Inventory Holds
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Short-lived 10-minute seat and room reservations in Redis prevent overselling while
            payments process.
          </p>
        </div>

        <div className="card">
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              marginBottom: '1rem',
            }}
          >
            <Bell size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Instant Notifications
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Automated confirmation and cancellation emails sent through Mailpit with durable DLQ
            retry guarantees.
          </p>
        </div>
      </div>
    </div>
  );
}
