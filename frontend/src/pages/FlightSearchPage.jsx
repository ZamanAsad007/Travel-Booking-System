import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog.js';
import { Plane, Search, Calendar, MapPin, ArrowRight, Clock, AlertCircle } from 'lucide-react';

export default function FlightSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['flights', searchParams.get('from'), searchParams.get('to'), searchParams.get('date')],
    queryFn: () =>
      catalogApi.searchFlights({
        from: searchParams.get('from') || undefined,
        to: searchParams.get('to') || undefined,
        date: searchParams.get('date') || undefined,
      }),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (from.trim()) params.from = from.trim();
    if (to.trim()) params.to = to.trim();
    if (date.trim()) params.date = date.trim();
    setSearchParams(params);
  };

  const flights = data?.data?.flights || [];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Search Flights
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Browse available flights across major routes with real-time seat tracking
        </p>
      </div>

      {/* Search Filter Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} className="grid-4" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Origin (Airport / City)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. JFK or New York"
                className="form-input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Destination</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. LHR or London"
                className="form-input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Departure Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
            <Search size={16} />
            Search Flights
          </button>
        </form>
      </div>

      {/* Results List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading flights...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <AlertCircle size={20} />
            <strong>Failed to load flights: {error.message || 'Error occurred'}</strong>
          </div>
        </div>
      ) : flights.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Plane size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No flights found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Try adjusting your search criteria or clear filters to view all scheduled flights.
          </p>
          <button
            onClick={() => {
              setFrom('');
              setTo('');
              setDate('');
              setSearchParams({});
            }}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {flights.map((flight) => {
            const availableSeats = flight.available_seats !== undefined ? flight.available_seats : (flight.seats_total - (flight.booked_seats || 0));
            const isSoldOut = availableSeats <= 0;

            return (
              <div key={flight.id} className="card card-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <Plane size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                      {flight.airline}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{flight.origin}</span>
                      <ArrowRight size={14} />
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{flight.destination}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} />
                        {new Date(flight.departs_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(flight.arrives_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ${parseFloat(flight.price).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isSoldOut ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {isSoldOut ? 'Sold Out' : `${availableSeats} seats left`}
                    </div>
                  </div>

                  <Link
                    to={`/flights/${flight.id}`}
                    className={`btn ${isSoldOut ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ minWidth: '120px' }}
                  >
                    {isSoldOut ? 'View Flight' : 'Select Flight'}
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
