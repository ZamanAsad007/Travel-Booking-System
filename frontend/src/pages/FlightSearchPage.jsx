import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog.js';
import {
  Plane,
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  Clock,
  AlertCircle,
  Heart,
  SlidersHorizontal,
  Star,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import AutocompleteInput from '../components/AutocompleteInput.jsx';
import { engagementApi } from '../api/engagement.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function FlightSearchPage() {
  const { isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary search inputs
  const [from, setFrom] = useState(searchParams.get('from')?.toUpperCase() || '');
  const [to, setTo] = useState(searchParams.get('to')?.toUpperCase() || '');
  const [date, setDate] = useState(searchParams.get('date') || '');

  // Advanced filters state
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [airline, setAirline] = useState(searchParams.get('airline') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [maxDuration, setMaxDuration] = useState(searchParams.get('maxDuration') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'departs_at_asc');

  // Available airlines query
  const { data: airlinesData } = useQuery({
    queryKey: ['airlines'],
    queryFn: () => catalogApi.getAirlines(),
    staleTime: 1000 * 60 * 10,
  });
  const availableAirlines = airlinesData?.data?.airlines || [];

  useEffect(() => {
    setFrom(searchParams.get('from')?.toUpperCase() || '');
    setTo(searchParams.get('to')?.toUpperCase() || '');
    setDate(searchParams.get('date') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setAirline(searchParams.get('airline') || '');
    setMinRating(searchParams.get('minRating') || '');
    setMaxDuration(searchParams.get('maxDuration') || '');
    setSortBy(searchParams.get('sortBy') || 'departs_at_asc');
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      engagementApi
        .getWishlist()
        .then((res) => {
          if (res.success && res.data) {
            const ids = new Set(
              res.data
                .filter((w) => w.item_type?.toLowerCase() === 'flight')
                .map((w) => w.item_id)
            );
            setWishlistIds(ids);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleToggleWishlist = async (flightId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      if (wishlistIds.has(flightId)) {
        await engagementApi.removeFromWishlist('flight', flightId);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(flightId);
          return next;
        });
      } else {
        await engagementApi.addToWishlist('flight', flightId);
        setWishlistIds((prev) => new Set([...prev, flightId]));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'flights',
      searchParams.get('from'),
      searchParams.get('to'),
      searchParams.get('date'),
      searchParams.get('minPrice'),
      searchParams.get('maxPrice'),
      searchParams.get('airline'),
      searchParams.get('minRating'),
      searchParams.get('maxDuration'),
      searchParams.get('sortBy'),
    ],
    queryFn: () =>
      catalogApi.searchFlights({
        from: searchParams.get('from') || undefined,
        to: searchParams.get('to') || undefined,
        date: searchParams.get('date') || undefined,
        minPrice: searchParams.get('minPrice') || undefined,
        maxPrice: searchParams.get('maxPrice') || undefined,
        airline: searchParams.get('airline') || undefined,
        minRating: searchParams.get('minRating') || undefined,
        maxDuration: searchParams.get('maxDuration') || undefined,
        sortBy: searchParams.get('sortBy') || undefined,
      }),
  });

  const applyFilters = (overrideParams = {}) => {
    const params = {
      ...(from.trim() ? { from: from.trim() } : {}),
      ...(to.trim() ? { to: to.trim() } : {}),
      ...(date.trim() ? { date: date.trim() } : {}),
      ...(minPrice ? { minPrice } : {}),
      ...(maxPrice ? { maxPrice } : {}),
      ...(airline ? { airline } : {}),
      ...(minRating ? { minRating } : {}),
      ...(maxDuration ? { maxDuration } : {}),
      ...(sortBy && sortBy !== 'departs_at_asc' ? { sortBy } : {}),
      ...overrideParams,
    };
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    applyFilters();
  };

  const handleResetFilters = () => {
    setFrom('');
    setTo('');
    setDate('');
    setMinPrice('');
    setMaxPrice('');
    setAirline('');
    setMinRating('');
    setMaxDuration('');
    setSortBy('departs_at_asc');
    setSearchParams({});
  };

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const flights = data?.data?.flights || [];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Search Flights
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Browse available flights across major routes with real-time seat tracking and intelligent filters
        </p>
      </div>

      {/* Top Search Bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
          <AutocompleteInput
            label="Origin (Airport / City)"
            placeholder="e.g. JFK or New York"
            value={from}
            onChange={setFrom}
            onSelect={(val) => setFrom(val)}
            icon={Plane}
            filterType="airport"
          />

          <AutocompleteInput
            label="Destination"
            placeholder="e.g. LHR or London"
            value={to}
            onChange={setTo}
            onSelect={(val) => setTo(val)}
            icon={MapPin}
            filterType="airport"
          />

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

      {/* Two-Column Layout: Sidebar Filters + Flight Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Filter Sidebar */}
        <div className="card" style={{ position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={16} /> Filters
            </h3>
            <button
              onClick={handleResetFilters}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Sort By */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Sort By</label>
            <select
              className="form-input"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                applyFilters({ sortBy: e.target.value });
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="departs_at_asc">Departure: Earliest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="duration_asc">Duration: Shortest</option>
              <option value="rating_desc">Rating: Highest</option>
            </select>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Price Range ($)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input
                type="number"
                placeholder="Min"
                className="form-input"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={() => applyFilters()}
                style={{ fontSize: '0.85rem' }}
              />
              <input
                type="number"
                placeholder="Max"
                className="form-input"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={() => applyFilters()}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Airline Filter */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Airline</label>
            <select
              className="form-input"
              value={airline}
              onChange={(e) => {
                setAirline(e.target.value);
                applyFilters({ airline: e.target.value });
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">All Airlines</option>
              {availableAirlines.map((al) => (
                <option key={al} value={al}>
                  {al}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Rating */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Minimum Rating</label>
            <select
              className="form-input"
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                applyFilters({ minRating: e.target.value });
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">Any Rating</option>
              <option value="4.0">★ 4.0 & above</option>
              <option value="4.5">★ 4.5 & above</option>
              <option value="4.8">★ 4.8 & above</option>
            </select>
          </div>

          {/* Max Duration */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Max Duration</label>
            <select
              className="form-input"
              value={maxDuration}
              onChange={(e) => {
                setMaxDuration(e.target.value);
                applyFilters({ maxDuration: e.target.value });
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">Any Duration</option>
              <option value="4">Under 4 hours</option>
              <option value="8">Under 8 hours</option>
              <option value="12">Under 12 hours</option>
              <option value="16">Under 16 hours</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => applyFilters()}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
          >
            Apply Filters
          </button>
        </div>

        {/* Right Column: Results List */}
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Searching flights with Redis cache...</p>
            </div>
          ) : error ? (
            <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}
              >
                <AlertCircle size={20} />
                <strong>Failed to load flights: {error.message || 'Error occurred'}</strong>
              </div>
            </div>
          ) : flights.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Plane
                size={48}
                style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }}
              />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                No flights matched your criteria
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Try relaxing your price, duration, or airline filters to discover more flights.
              </p>
              <button onClick={handleResetFilters} className="btn btn-secondary">
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Found <strong>{flights.length}</strong> available flight(s)
                </span>
              </div>

              {flights.map((flight) => {
                const availableSeats =
                  flight.seats_available !== undefined
                    ? flight.seats_available
                    : flight.seats_total - (flight.booked_seats || 0);
                const isSoldOut = availableSeats <= 0;
                const duration = formatDuration(flight.duration_minutes);

                return (
                  <div
                    key={flight.id}
                    className="card card-hover"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'var(--primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                        }}
                      >
                        <Plane size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                            {flight.airline}
                          </h3>
                          {flight.avg_rating > 0 && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                fontSize: '0.75rem',
                                color: '#b45309',
                                background: '#fef3c7',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              <Star size={12} fill="#b45309" />
                              {parseFloat(flight.avg_rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginTop: '0.35rem',
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {flight.origin}
                          </span>
                          <ArrowRight size={14} />
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {flight.destination}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={14} />
                            {new Date(flight.departs_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(flight.arrives_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {duration && (
                            <>
                              <span>•</span>
                              <span>{duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                          ${parseFloat(flight.price).toFixed(2)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: isSoldOut ? 'var(--danger)' : 'var(--text-muted)',
                          }}
                        >
                          {isSoldOut ? 'Sold Out' : `${availableSeats} seats left`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isAuthenticated && (
                          <button
                            onClick={(e) => handleToggleWishlist(flight.id, e)}
                            style={{
                              background: wishlistIds.has(flight.id) ? '#fee2e2' : '#f3f4f6',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.6rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: wishlistIds.has(flight.id) ? '#ef4444' : '#9ca3af',
                              transition: 'all 0.2s',
                            }}
                            title={wishlistIds.has(flight.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                          >
                            <Heart size={18} fill={wishlistIds.has(flight.id) ? '#ef4444' : 'none'} />
                          </button>
                        )}

                        <Link
                          to={`/flights/${flight.id}`}
                          className={`btn ${isSoldOut ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ minWidth: '120px' }}
                        >
                          {isSoldOut ? 'View Flight' : 'Select Flight'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
