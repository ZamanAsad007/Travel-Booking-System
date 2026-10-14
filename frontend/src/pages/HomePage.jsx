import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plane,
  Hotel,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bell,
  Sparkles,
  Package,
  Calendar,
  MapPin,
  Star,
} from 'lucide-react';
import AutocompleteInput from '../components/AutocompleteInput.jsx';
import { catalogApi } from '../api/catalog.js';

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

  // Bundle search inputs
  const [bundleFrom, setBundleFrom] = useState('');
  const [bundleTo, setBundleTo] = useState('');
  const [bundleDate, setBundleDate] = useState('');

  // Query featured bundle packages
  const { data: bundlesData, isLoading: bundlesLoading } = useQuery({
    queryKey: ['bundles', 'featured'],
    queryFn: () => catalogApi.getBundles({ limit: 4 }),
    staleTime: 1000 * 60 * 5,
  });

  const featuredBundles = bundlesData?.data?.bundles || [];

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

  const handleBundleSubmit = (e) => {
    e.preventDefault();
    // Scroll down to featured bundles or search
    const params = new URLSearchParams();
    if (bundleFrom) params.append('from', bundleFrom);
    if (bundleTo) params.append('to', bundleTo);
    if (bundleDate) params.append('date', bundleDate);
    navigate(`/flights?${params.toString()}`);
  };

  const handleBookBundle = (bundle) => {
    navigate('/checkout', {
      state: {
        title: bundle.title,
        subtitle: `${bundle.flight.airline} • ${bundle.hotel.name} (${bundle.room.type})`,
        unitPrice: bundle.bundlePrice,
        originalPrice: bundle.originalPrice,
        savings: bundle.savings,
        discountPercent: bundle.discountPercent,
        items: bundle.items,
        checkIn: bundle.flight.departsAt?.split('T')[0] || undefined,
        itemType: 'bundle',
      },
    });
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <h1>Discover Seamless Travel</h1>
        <p>Book flights, luxury hotels, and bundled vacation packages with event-driven saga reliability.</p>
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
          <button
            type="button"
            className={`tab-btn ${tab === 'bundles' ? 'active' : ''}`}
            onClick={() => setTab('bundles')}
          >
            <Package size={18} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Package Deals <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>Save 15%</span>
            </span>
          </button>
        </div>

        {tab === 'flights' && (
          <form onSubmit={handleFlightSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
            <AutocompleteInput
              label="From (Origin)"
              placeholder="e.g. JFK or New York"
              value={origin}
              onChange={setOrigin}
              onSelect={(val) => setOrigin(val)}
              icon={Plane}
              filterType="airport"
            />

            <AutocompleteInput
              label="To (Destination)"
              placeholder="e.g. LHR or London"
              value={destination}
              onChange={setDestination}
              onSelect={(val) => setDestination(val)}
              icon={MapPin}
              filterType="airport"
            />

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
        )}

        {tab === 'hotels' && (
          <form onSubmit={handleHotelSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
            <AutocompleteInput
              label="City or Destination"
              placeholder="e.g. London, Paris, Tokyo"
              value={city}
              onChange={setCity}
              onSelect={(val) => setCity(val)}
              icon={Hotel}
              filterType="city"
            />

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

        {tab === 'bundles' && (
          <form onSubmit={handleBundleSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
            <AutocompleteInput
              label="Departure City"
              placeholder="e.g. JFK or New York"
              value={bundleFrom}
              onChange={setBundleFrom}
              onSelect={(val) => setBundleFrom(val)}
              icon={Plane}
              filterType="airport"
            />

            <AutocompleteInput
              label="Destination City"
              placeholder="e.g. London, Tokyo, Paris"
              value={bundleTo}
              onChange={setBundleTo}
              onSelect={(val) => setBundleTo(val)}
              icon={MapPin}
            />

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Travel Date</label>
              <input
                type="date"
                className="form-input"
                value={bundleDate}
                onChange={(e) => setBundleDate(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: '42px', backgroundColor: '#d97706' }}
            >
              <Sparkles size={16} />
              Explore Deals
            </button>
          </form>
        )}
      </div>

      {/* Featured Trip Package Deals Section */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={22} style={{ color: '#d97706' }} />
              Featured Package Deals
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
              Combine flights + luxury hotel stays and save 15% with guaranteed multi-item booking
            </p>
          </div>
          <Link
            to="/flights"
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
          >
            <span>View All Offers</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {bundlesLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading top vacation package bundles...
          </div>
        ) : featuredBundles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No packages available currently. Check back soon!
          </div>
        ) : (
          <div className="grid-2">
            {featuredBundles.map((bundle) => (
              <div
                key={bundle.id}
                className="card card-hover"
                style={{
                  border: '1px solid #fde68a',
                  background: 'linear-gradient(to bottom, #fffbeb, #ffffff)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Sparkles size={12} /> Bundle & Save 15%
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {bundle.city}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>
                    {bundle.title}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.6rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.2rem' }}>
                        <Plane size={13} /> {bundle.flight.airline}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {bundle.flight.origin} → {bundle.flight.destination}
                      </div>
                    </div>

                    <div style={{ padding: '0.6rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.2rem' }}>
                        <Hotel size={13} /> {bundle.hotel.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {bundle.room.type}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #fef3c7',
                    paddingTop: '0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        ${bundle.originalPrice.toFixed(0)}
                      </span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>
                        ${bundle.bundlePrice.toFixed(0)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                      Save ${bundle.savings.toFixed(0)} with combo deal
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookBundle(bundle)}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#d97706', padding: '0.5rem 1rem', fontSize: '0.88rem' }}
                  >
                    <span>Book Package</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Architecture Feature Highlights */}
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
            microservices using RabbitMQ with transactional outbox guarantees.
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
            Redis Caching & Holds
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Short-lived 10-minute inventory holds with TTL and high-throughput search query caching with
            instant invalidation on price or stock updates.
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
            Real-Time Updates (SSE)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Live booking status streaming, automated e-ticket PDF generation with QR codes, and price alert
            event triggers.
          </p>
        </div>
      </div>
    </div>
  );
}
