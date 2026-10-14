import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog.js';
import {
  Hotel,
  Search,
  MapPin,
  Star,
  AlertCircle,
  ArrowRight,
  Heart,
  SlidersHorizontal,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import AutocompleteInput from '../components/AutocompleteInput.jsx';
import { engagementApi } from '../api/engagement.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function HotelSearchPage() {
  const { isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  // Search parameters
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');

  // Advanced filters state
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [freeCancellation, setFreeCancellation] = useState(
    searchParams.get('freeCancellation') === 'true'
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating_desc');

  useEffect(() => {
    setCity(searchParams.get('city') || '');
    setCheckIn(searchParams.get('checkIn') || '');
    setCheckOut(searchParams.get('checkOut') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setMinRating(searchParams.get('minRating') || '');
    setFreeCancellation(searchParams.get('freeCancellation') === 'true');
    setSortBy(searchParams.get('sortBy') || 'rating_desc');
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      engagementApi
        .getWishlist()
        .then((res) => {
          if (res.success && res.data) {
            const ids = new Set(
              res.data
                .filter((w) => w.item_type?.toLowerCase() === 'hotel')
                .map((w) => w.item_id)
            );
            setWishlistIds(ids);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleToggleWishlist = async (hotelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      if (wishlistIds.has(hotelId)) {
        await engagementApi.removeFromWishlist('hotel', hotelId);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(hotelId);
          return next;
        });
      } else {
        await engagementApi.addToWishlist('hotel', hotelId);
        setWishlistIds((prev) => new Set([...prev, hotelId]));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'hotels',
      searchParams.get('city'),
      searchParams.get('checkIn'),
      searchParams.get('checkOut'),
      searchParams.get('minPrice'),
      searchParams.get('maxPrice'),
      searchParams.get('minRating'),
      searchParams.get('freeCancellation'),
      searchParams.get('sortBy'),
    ],
    queryFn: () =>
      catalogApi.searchHotels({
        city: searchParams.get('city') || undefined,
        checkIn: searchParams.get('checkIn') || undefined,
        checkOut: searchParams.get('checkOut') || undefined,
        minPrice: searchParams.get('minPrice') || undefined,
        maxPrice: searchParams.get('maxPrice') || undefined,
        minRating: searchParams.get('minRating') || undefined,
        freeCancellation: searchParams.get('freeCancellation') || undefined,
        sortBy: searchParams.get('sortBy') || undefined,
      }),
  });

  const applyFilters = (overrideParams = {}) => {
    const params = {
      ...(city.trim() ? { city: city.trim() } : {}),
      ...(checkIn.trim() ? { checkIn: checkIn.trim() } : {}),
      ...(checkOut.trim() ? { checkOut: checkOut.trim() } : {}),
      ...(minPrice ? { minPrice } : {}),
      ...(maxPrice ? { maxPrice } : {}),
      ...(minRating ? { minRating } : {}),
      ...(freeCancellation ? { freeCancellation: 'true' } : {}),
      ...(sortBy && sortBy !== 'rating_desc' ? { sortBy } : {}),
      ...overrideParams,
    };
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    applyFilters();
  };

  const handleResetFilters = () => {
    setCity('');
    setCheckIn('');
    setCheckOut('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setFreeCancellation(false);
    setSortBy('rating_desc');
    setSearchParams({});
  };

  const hotels = data?.data?.hotels || [];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Find Luxury Hotels
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Browse top-rated luxury hotels across major destinations with flexible cancellation and verified ratings
        </p>
      </div>

      {/* Top Search Bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
          <AutocompleteInput
            label="City or Destination"
            placeholder="e.g. London or Paris"
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
            Search Hotels
          </button>
        </form>
      </div>

      {/* Two-Column Layout: Sidebar Filters + Hotel Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Filter Sidebar */}
        <div className="card" style={{ position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={16} /> Filters
            </h3>
            <button
              onClick={handleResetFilters}
              style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
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
              <option value="rating_desc">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Hotel Name</option>
            </select>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Price / Night ($)</label>
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

          {/* Minimum Rating */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Guest Rating</label>
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

          {/* Free Cancellation Toggle */}
          <div style={{ marginBottom: '1.25rem', padding: '0.5rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={freeCancellation}
                onChange={(e) => {
                  setFreeCancellation(e.target.checked);
                  applyFilters({ freeCancellation: e.target.checked ? 'true' : undefined });
                }}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--secondary)' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={15} style={{ color: 'var(--success)' }} />
                Free Cancellation Only
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => applyFilters()}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--secondary)' }}
          >
            Apply Filters
          </button>
        </div>

        {/* Right Column: Hotel Results List */}
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Searching luxury hotels with Redis cache...</p>
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
                No hotels found matching criteria
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Try relaxing your price filters or choose another destination city.
              </p>
              <button onClick={handleResetFilters} className="btn btn-secondary">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid-2">
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
                        <span>{parseFloat(hotel.avg_rating || hotel.rating || 4.5).toFixed(1)} / 5.0</span>
                        {hotel.review_count > 0 && (
                          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem' }}>
                            ({hotel.review_count} reviews)
                          </span>
                        )}
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

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      {hotel.name}
                    </h3>
                    <p
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.88rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <MapPin size={14} />
                      <span>{hotel.address || hotel.city}</span>
                    </p>

                    {hotel.free_cancellation && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          color: '#15803d',
                          background: '#f0fdf4',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          marginBottom: '0.75rem',
                        }}
                      >
                        <ShieldCheck size={13} /> Free Cancellation Available
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: '1rem',
                      marginTop: '0.75rem',
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
                        ${parseFloat(hotel.starting_price || hotel.min_price || 150).toFixed(0)}{' '}
                        <span
                          style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}
                        >
                          / night
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isAuthenticated && (
                        <button
                          onClick={(e) => handleToggleWishlist(hotel.id, e)}
                          style={{
                            background: wishlistIds.has(hotel.id) ? '#fee2e2' : '#f3f4f6',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: wishlistIds.has(hotel.id) ? '#ef4444' : '#9ca3af',
                            transition: 'all 0.2s',
                          }}
                          title={wishlistIds.has(hotel.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                        >
                          <Heart size={18} fill={wishlistIds.has(hotel.id) ? '#ef4444' : 'none'} />
                        </button>
                      )}

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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
