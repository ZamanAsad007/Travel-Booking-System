import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog.js';
import { Hotel, Search, MapPin, Star, AlertCircle, ArrowRight } from 'lucide-react';
import { HOTEL_CITIES } from '../constants/locations.js';

export default function HotelSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getNormalizedCity = (val) => {
    if (!val) return '';
    const match = HOTEL_CITIES.find((c) => c.value.toLowerCase() === val.toLowerCase());
    return match ? match.value : val;
  };

  const [city, setCity] = useState(getNormalizedCity(searchParams.get('city')));
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');

  useEffect(() => {
    setCity(getNormalizedCity(searchParams.get('city')));
    setCheckIn(searchParams.get('checkIn') || '');
    setCheckOut(searchParams.get('checkOut') || '');
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'hotels',
      searchParams.get('city'),
      searchParams.get('checkIn'),
      searchParams.get('checkOut'),
    ],
    queryFn: () =>
      catalogApi.searchHotels({
        city: searchParams.get('city') || undefined,
        checkIn: searchParams.get('checkIn') || undefined,
        checkOut: searchParams.get('checkOut') || undefined,
      }),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (city.trim()) params.city = city.trim();
    if (checkIn.trim()) params.checkIn = checkIn.trim();
    if (checkOut.trim()) params.checkOut = checkOut.trim();
    setSearchParams(params);
  };

  const hotels = data?.data?.hotels || [];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Find Luxury Hotels
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Browse top-rated luxury hotels across major destinations
        </p>
      </div>

      {/* Hotel Search Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} className="grid-4" style={{ alignItems: 'flex-end' }}>
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
            Search Hotels
          </button>
        </form>
      </div>

      {/* Hotel Results List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading hotels...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}
          >
            <AlertCircle size={20} />
            <strong>Failed to load hotels: {error.message || 'Error occurred'}</strong>
          </div>
        </div>
      ) : hotels.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Hotel
            size={48}
            style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }}
          />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            No hotels found
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Try checking another city or remove date constraints.
          </p>
          <button
            onClick={() => {
              setCity('');
              setCheckIn('');
              setCheckOut('');
              setSearchParams({});
            }}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="card card-hover"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#d97706',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    <Star size={16} fill="#d97706" />
                    <span>{parseFloat(hotel.rating || 4.5).toFixed(1)} / 5.0</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      background: '#f1f5f9',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {hotel.city}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {hotel.name}
                </h3>
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                  }}
                >
                  <MapPin size={15} />
                  <span>{hotel.city}</span>
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Starting from
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)' }}>
                    ${parseFloat(hotel.min_price || hotel.price_from || 120).toFixed(0)}{' '}
                    <span
                      style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}
                    >
                      / night
                    </span>
                  </div>
                </div>

                <Link
                  to={`/hotels/${hotel.id}`}
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--secondary)', padding: '0.5rem 1rem' }}
                >
                  <span>View Rooms</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
