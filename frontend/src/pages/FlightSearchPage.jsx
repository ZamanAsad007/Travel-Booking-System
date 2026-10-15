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
  SlidersHorizontal,
  Star,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Filter,
  X,
  Compass,
} from 'lucide-react';
import AutocompleteInput from '../components/AutocompleteInput.jsx';
import FlightCard from '../components/FlightCard.jsx';
import FareStrip from '../components/FareStrip.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { engagementApi } from '../api/engagement.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function FlightSearchPage() {
  const { isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  // Search form expansion toggle
  const [searchExpanded, setSearchExpanded] = useState(false);
  // Mobile filter drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
    setSearchExpanded(false);
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
    setMobileFilterOpen(false);
  };

  const handleSelectFareDate = (newDateStr) => {
    setDate(newDateStr);
    applyFilters({ date: newDateStr });
  };

  const flights = data?.data?.flights || [];
  const lowestPrice = flights.length > 0 ? Math.min(...flights.map((f) => parseFloat(f.price))) : 350;

  // Active filter count for badge
  const activeFilterCount = [
    minPrice,
    maxPrice,
    airline,
    minRating,
    maxDuration,
  ].filter(Boolean).length;

  return (
    <div>
      {/* Search Header Banner */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--secondary)' }}>
          Flight Results
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Explore live scheduled flights with real-time seat tracking, fare comparison, and instant saga holds.
        </p>
      </div>

      {/* Compact Search Summary Bar with Modify Toggle */}
      <div className="search-summary-bar">
        <div className="search-summary-route">
          <span className="search-summary-code">{from || 'ANY'}</span>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)' }}>
            <span style={{ height: '1.5px', width: '24px', background: 'var(--primary)', display: 'inline-block' }} />
            <Plane size={14} style={{ transform: 'rotate(90deg)', margin: '0 2px' }} />
            <span style={{ height: '1.5px', width: '24px', background: 'var(--primary)', display: 'inline-block' }} />
          </div>
          <span className="search-summary-code">{to || 'ALL DESTINATIONS'}</span>
        </div>

        <div className="search-summary-meta">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} style={{ color: 'var(--primary)' }} />
            <span>{date ? new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible Dates'}</span>
          </span>
          <span>•</span>
          <span><strong>{flights.length}</strong> flights found</span>
        </div>

        <button
          type="button"
          onClick={() => setSearchExpanded((prev) => !prev)}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          <Search size={14} />
          <span>{searchExpanded ? 'Close Search' : 'Modify Search'}</span>
        </button>
      </div>

      {/* Expandable Search Form Drawer */}
      {searchExpanded && (
        <div className="card" style={{ marginBottom: '1.75rem', border: '1.5px solid var(--primary)', animation: 'fadeIn 0.2s ease-out' }}>
          <form onSubmit={handleSearchSubmit} className="grid-4" style={{ alignItems: 'flex-end' }}>
            <AutocompleteInput
              label="From (Origin)"
              placeholder="e.g. JFK or New York"
              value={from}
              onChange={setFrom}
              onSelect={(val) => setFrom(val)}
              icon={Plane}
              filterType="airport"
            />

            <AutocompleteInput
              label="To (Destination)"
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

            <button type="submit" className="btn btn-accent" style={{ height: '44px' }}>
              <Search size={16} />
              Update Search
            </button>
          </form>
        </div>
      )}

      {/* 7-Day Fare Strip Calendar */}
      <FareStrip
        currentDate={date}
        onSelectDate={handleSelectFareDate}
        basePrice={lowestPrice}
      />

      {/* Main Content: Left Filter Sidebar + Right Results List */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Desktop Filter Sidebar */}
        <aside className="card desktop-filter-sidebar" style={{ position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
              <SlidersHorizontal size={16} /> Filters
            </h3>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Price Range Filter */}
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
              className="form-select"
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
              className="form-select"
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

          {/* Maximum Duration */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Max Duration</label>
            <select
              className="form-select"
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
            style={{ width: '100%', fontSize: '0.88rem', padding: '0.55rem' }}
          >
            Apply Filters
          </button>
        </aside>

        {/* Right Column: Sort Tabs & Flight Ticket Results */}
        <div>
          {/* Sort Tabs & Mobile Filter Trigger */}
          <div className="sort-tabs-container">
            <div className="sort-tabs">
              <button
                type="button"
                className={`sort-tab-btn ${sortBy === 'departs_at_asc' ? 'active' : ''}`}
                onClick={() => {
                  setSortBy('departs_at_asc');
                  applyFilters({ sortBy: 'departs_at_asc' });
                }}
              >
                <span>Earliest</span>
              </button>
              <button
                type="button"
                className={`sort-tab-btn ${sortBy === 'price_asc' ? 'active' : ''}`}
                onClick={() => {
                  setSortBy('price_asc');
                  applyFilters({ sortBy: 'price_asc' });
                }}
              >
                <span>Cheapest</span>
              </button>
              <button
                type="button"
                className={`sort-tab-btn ${sortBy === 'duration_asc' ? 'active' : ''}`}
                onClick={() => {
                  setSortBy('duration_asc');
                  applyFilters({ sortBy: 'duration_asc' });
                }}
              >
                <span>Fastest</span>
              </button>
              <button
                type="button"
                className={`sort-tab-btn ${sortBy === 'rating_desc' ? 'active' : ''}`}
                onClick={() => {
                  setSortBy('rating_desc');
                  applyFilters({ sortBy: 'rating_desc' });
                }}
              >
                <span>Top Rated</span>
              </button>
            </div>

            {/* Mobile Filter Button */}
            <button
              type="button"
              className="mobile-filter-trigger"
              onClick={() => setMobileFilterOpen(true)}
            >
              <Filter size={15} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="stamp-badge" style={{ padding: '0.05rem 0.35rem', fontSize: '0.65rem' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Results List */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton variant="text" width="200px" height="24px" />
                    <Skeleton variant="text" width="80px" height="24px" />
                  </div>
                  <Skeleton variant="rectangular" height="64px" />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton variant="text" width="160px" height="20px" />
                    <Skeleton variant="text" width="100px" height="28px" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <AlertCircle size={20} />
                <strong>Failed to load flights: {error.message || 'Error occurred'}</strong>
              </div>
            </div>
          ) : flights.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No flights match your criteria"
              description="Try adjusting your departure date, price range, or clearing your airline filters to see available flights."
              actionText="Clear All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {flights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  isWishlisted={wishlistIds.has(flight.id)}
                  onToggleWishlist={handleToggleWishlist}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div
          className="filter-drawer-backdrop"
          onClick={() => setMobileFilterOpen(false)}
          aria-hidden="true"
        />
      )}

      {mobileFilterOpen && (
        <aside className="filter-drawer" role="dialog" aria-modal="true" aria-label="Filter flights">
          <div className="filter-drawer-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={16} /> Filters & Sorting
            </h3>
            <button
              type="button"
              className="mobile-drawer-close"
              onClick={() => setMobileFilterOpen(false)}
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          </div>

          <div className="filter-drawer-body">
            {/* Price Range */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Price Range ($)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Min"
                  className="form-input"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="form-input"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Airline */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Airline</label>
              <select
                className="form-select"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
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
              <label className="form-label">Minimum Rating</label>
              <select
                className="form-select"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              >
                <option value="">Any Rating</option>
                <option value="4.0">★ 4.0 & above</option>
                <option value="4.5">★ 4.5 & above</option>
                <option value="4.8">★ 4.8 & above</option>
              </select>
            </div>

            {/* Max Duration */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Max Duration</label>
              <select
                className="form-select"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
              >
                <option value="">Any Duration</option>
                <option value="4">Under 4 hours</option>
                <option value="8">Under 8 hours</option>
                <option value="12">Under 12 hours</option>
                <option value="16">Under 16 hours</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  applyFilters();
                  setMobileFilterOpen(false);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Apply
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
