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
  ArrowLeftRight,
  Compass,
  Star,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import LocationSelect from '../components/LocationSelect.jsx';
import DestinationCard from '../components/DestinationCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
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

  // Swap origin and destination
  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

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

  // Curated trending destination cards
  const trendingDestinations = [
    {
      city: 'Tokyo',
      country: 'Japan',
      code: 'HND',
      price: 490,
      tag: 'Trending',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    },
    {
      city: 'Paris',
      country: 'France',
      code: 'CDG',
      price: 360,
      tag: 'Romantic',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    },
    {
      city: 'London',
      country: 'United Kingdom',
      code: 'LHR',
      price: 420,
      tag: 'Direct Flights',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    },
    {
      city: 'New York',
      country: 'United States',
      code: 'JFK',
      price: 280,
      tag: 'Popular',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    },
    {
      city: 'Rome',
      country: 'Italy',
      code: 'FCO',
      price: 390,
      tag: 'Heritage',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    },
    {
      city: 'Dubai',
      country: 'United Arab Emirates',
      code: 'DXB',
      price: 520,
      tag: 'Luxury',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // City-to-image mapping for vacation package cards
  const cityImages = {
    Tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    Paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    London: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    Rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    Dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    Singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
    Sydney: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  };

  return (
    <div>
      {/* Travel-Themed Hero Banner */}
      <div className="hero-banner">
        <div className="hero-badge">
          <Sparkles size={14} style={{ color: 'var(--highlight)' }} />
          <span>Curated Journeys & Luxury Stays</span>
        </div>
        <h1>Where to next?</h1>
        <p>
          Discover direct flights, five-star accommodations, and bespoke package deals backed by real-time saga reliability.
        </p>
        <div className="hero-features-strip">
          <span className="hero-feature-pill">
            <CheckCircle2 size={13} style={{ color: 'var(--highlight)' }} /> 56 Global Direct Routes
          </span>
          <span className="hero-feature-pill">
            <CheckCircle2 size={13} style={{ color: 'var(--highlight)' }} /> 10-Min Zero-Conflict Holds
          </span>
          <span className="hero-feature-pill">
            <CheckCircle2 size={13} style={{ color: 'var(--highlight)' }} /> 15% Vacation Package Savings
          </span>
        </div>
      </div>

      {/* Floating Elevated Search Card */}
      <div className="floating-search-card">
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Vacation Packages
              <span className="stamp-badge stamp-badge-amber">Save 15%</span>
            </span>
          </button>
        </div>

        {tab === 'flights' && (
          <form onSubmit={handleFlightSubmit}>
            <div className="search-route-grid">
              <LocationSelect
                label="From (Origin)"
                placeholder="All Origins"
                value={origin}
                onChange={setOrigin}
                icon={Plane}
                type="airport"
              />

              <button
                type="button"
                onClick={handleSwapAirports}
                className="swap-btn"
                title="Swap origin and destination"
                aria-label="Swap origin and destination"
              >
                <ArrowLeftRight size={16} />
              </button>

              <LocationSelect
                label="To (Destination)"
                placeholder="All Destinations"
                value={destination}
                onChange={setDestination}
                icon={MapPin}
                type="airport"
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

              <button
                type="submit"
                className="btn btn-accent"
                style={{ height: '46px', padding: '0 1.5rem', alignSelf: 'flex-end' }}
              >
                <Search size={18} />
                <span>Search Flights</span>
              </button>
            </div>
          </form>
        )}

        {tab === 'hotels' && (
          <form onSubmit={handleHotelSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
            <LocationSelect
              label="City or Destination"
              placeholder="All Cities / Destinations"
              value={city}
              onChange={setCity}
              icon={Hotel}
              type="city"
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
              style={{ height: '46px' }}
            >
              <Search size={18} />
              <span>Find Hotels</span>
            </button>
          </form>
        )}

        {tab === 'bundles' && (
          <form onSubmit={handleBundleSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
            <LocationSelect
              label="Departure City"
              placeholder="All Origins"
              value={bundleFrom}
              onChange={setBundleFrom}
              icon={Plane}
              type="airport"
            />

            <LocationSelect
              label="Destination City"
              placeholder="All Destinations"
              value={bundleTo}
              onChange={setBundleTo}
              icon={MapPin}
              type="airport"
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
              className="btn btn-accent"
              style={{ height: '46px' }}
            >
              <Sparkles size={18} />
              <span>Explore Deals</span>
            </button>
          </form>
        )}
      </div>

      {/* Trending Destinations Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              <Compass size={16} />
              <span>Inspiring Escapes</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              Trending Destinations
            </h2>
          </div>
          <Link
            to="/flights"
            className="btn btn-secondary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
          >
            <span>All Destinations</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="destinations-scroll-row">
          {trendingDestinations.map((dest) => (
            <DestinationCard key={dest.code} {...dest} />
          ))}
        </div>
      </section>

      {/* Featured Vacation Package Deals Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              <Sparkles size={16} />
              <span>Exclusive Savings</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              Featured Package Deals
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
              Combine flights + boutique hotels for an automatic 15% combo discount.
            </p>
          </div>
          <Link
            to="/flights?deal=bundle"
            className="btn btn-secondary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
          >
            <span>View All Packages</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {bundlesLoading ? (
          <div className="grid-2">
            {[1, 2].map((i) => (
              <div key={i} className="card" style={{ padding: '1.5rem' }}>
                <Skeleton variant="text" width="40%" height="24px" style={{ marginBottom: '1rem' }} />
                <Skeleton variant="text" width="70%" height="32px" style={{ marginBottom: '1.25rem' }} />
                <Skeleton variant="rectangular" height="80px" style={{ marginBottom: '1rem' }} />
                <Skeleton variant="text" width="50%" height="28px" />
              </div>
            ))}
          </div>
        ) : featuredBundles.length === 0 ? (
          <div className="empty-state-card" style={{ maxWidth: '600px' }}>
            <div className="empty-state-icon">
              <Package size={36} />
            </div>
            <h3 className="empty-state-title">No Packages Available</h3>
            <p className="empty-state-description">
              Our automated bundle engine is assembling fresh flight and hotel packages. Check back shortly!
            </p>
          </div>
        ) : (
          <div className="grid-2">
            {featuredBundles.map((bundle) => (
              <div
                key={bundle.id}
                className="card card-hover card-ticket bundle-card-package"
              >
                <div className="bundle-image-container">
                  <img
                    src={
                      cityImages[bundle.city] ||
                      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={`${bundle.title} - ${bundle.city}`}
                    className="bundle-card-image"
                    loading="lazy"
                  />
                  <div className="bundle-image-overlay" />
                  <div className="bundle-card-badge-top">
                    <span className="stamp-badge stamp-badge-amber">
                      <Sparkles size={12} /> Save {bundle.discountPercent || 15}%
                    </span>
                    <span className="bundle-city-chip">
                      <MapPin size={12} /> {bundle.city}
                    </span>
                  </div>
                </div>

                <div className="bundle-card-body">
                  <div>
                    <h3
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        marginBottom: '0.6rem',
                        color: 'var(--secondary)',
                      }}
                    >
                      {bundle.title}
                    </h3>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        marginTop: '0.75rem',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <div
                        style={{
                          padding: '0.75rem',
                          background: 'var(--surface)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            marginBottom: '0.2rem',
                          }}
                        >
                          <Plane size={14} /> {bundle.flight.airline}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {bundle.flight.origin} → {bundle.flight.destination}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '0.75rem',
                          background: 'var(--surface)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--secondary)',
                            marginBottom: '0.2rem',
                          }}
                        >
                          <Hotel size={14} /> {bundle.hotel.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {bundle.room.type}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1.5px dashed var(--border)',
                      paddingTop: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span
                          style={{
                            textDecoration: 'line-through',
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                          }}
                        >
                          ${bundle.originalPrice.toFixed(0)}
                        </span>
                        <span
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          ${bundle.bundlePrice.toFixed(0)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--success)',
                          fontWeight: 700,
                        }}
                      >
                        Save ${bundle.savings.toFixed(0)} with combo pricing
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookBundle(bundle)}
                      className="btn btn-accent"
                      style={{ padding: '0.55rem 1.15rem', fontSize: '0.9rem' }}
                    >
                      <span>Book Package</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* "Why TravelGo" Icon Strip */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
            <ShieldCheck size={16} />
            <span>Built For Confidence</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Why Travel With TravelGo?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
            Production-grade distributed architecture delivering zero-conflict holds and instantaneous status feedback.
          </p>
        </div>

        <div className="grid-4">
          <div className="why-travelgo-card">
            <div className="why-travelgo-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--secondary)' }}>
              Saga Reliability
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Distributed saga pattern coordinates booking, inventory holds, and payment with automatic rollback.
            </p>
          </div>

          <div className="why-travelgo-card">
            <div className="why-travelgo-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Sparkles size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--secondary)' }}>
              Real-Time SSE
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Instant live streaming updates deliver status transitions without manual page refreshes.
            </p>
          </div>

          <div className="why-travelgo-card">
            <div className="why-travelgo-icon" style={{ background: 'var(--highlight-light)', color: '#B45309' }}>
              <Bell size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--secondary)' }}>
              Smart Price Alerts
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Set notifications on favorite routes and get notified the moment prices drop to your target.
            </p>
          </div>

          <div className="why-travelgo-card">
            <div className="why-travelgo-icon" style={{ background: '#EEF2F6', color: 'var(--navy)' }}>
              <Star size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--secondary)' }}>
              Verified Reviews
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              100% verified traveler ratings and reviews cross-referenced against completed booking confirmations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
