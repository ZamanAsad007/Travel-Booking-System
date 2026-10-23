import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plane,
  Hotel,
  Search,
  ArrowRight,
  Sparkles,
  Package,
  Calendar,
  MapPin,
  ArrowLeftRight,
  Compass,
  Star,
  CheckCircle2,
  Heart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Users,
} from 'lucide-react';
import LocationSelect from '../components/LocationSelect.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { catalogApi } from '../api/catalog.js';

export default function HomePage() {
  const navigate = useNavigate();
  const destinationsRowRef = useRef(null);

  // Active search tab: 'flights' | 'hotels' | 'bundles'
  const [tab, setTab] = useState('flights');

  // Flight search modifiers & inputs
  const [tripType, setTripType] = useState('roundTrip');
  const [flightClass, setFlightClass] = useState('Economy Class');
  const [travelers, setTravelers] = useState('2 Adults');
  const [origin, setOrigin] = useState('DAC');
  const [destination, setDestination] = useState('DXB');
  const [flightDate, setFlightDate] = useState('2025-10-14');
  const [returnDate, setReturnDate] = useState('2025-10-22');

  // Hotel search inputs
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2 Guests');

  // Bundle search inputs
  const [bundleFrom, setBundleFrom] = useState('');
  const [bundleTo, setBundleTo] = useState('');
  const [bundleDate, setBundleDate] = useState('');

  // Wishlist toggle state for destination cards
  const [savedWishlist, setSavedWishlist] = useState(new Set(['CXB', 'MLE']));

  // Query featured bundle packages from backend API
  const { data: bundlesData, isLoading: bundlesLoading } = useQuery({
    queryKey: ['bundles', 'featured'],
    queryFn: () => catalogApi.getBundles({ limit: 4 }),
    staleTime: 1000 * 60 * 5,
  });

  const apiBundles = bundlesData?.data?.bundles || [];

  // Swap departure and arrival airports
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
    if (returnDate && tripType === 'roundTrip') params.append('returnDate', returnDate);
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
        subtitle: `${bundle.flight?.airline || 'Direct Flight'} • ${bundle.hotel?.name || bundle.city} (${bundle.room?.type || 'Standard Suite'})`,
        unitPrice: bundle.bundlePrice,
        originalPrice: bundle.originalPrice,
        savings: bundle.savings,
        discountPercent: bundle.discountPercent,
        items: bundle.items || [],
        checkIn: bundle.flight?.departsAt?.split('T')[0] || undefined,
        itemType: 'bundle',
      },
    });
  };

  const toggleWishlist = (code, e) => {
    e.stopPropagation();
    setSavedWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const scrollDestinations = (direction) => {
    if (destinationsRowRef.current) {
      const scrollOffset = direction === 'left' ? -320 : 320;
      destinationsRowRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // Stitch 5 Editorial Destinations (Expedition Dispatch)
  const editorialDestinations = [
    {
      city: "Cox's Bazar",
      country: 'Bangladesh',
      code: 'CXB',
      tagCode: 'CXB // 01',
      description: 'Longest natural sea beach in the world',
      rating: 4.9,
      reviews: '1.4k',
      price: 68,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBv1FJbmeKZhd017p5LsO1GxyRB4zq0oFu1Zwnfn-wkpL5YuMmargDx41_0D34oG3MpyuyyFbr9askY5S6ZAyb6vHtVDfhr5MTLMmN6F8ehqfFNynSmU4iQqGosZr1_QQr62_AZD6tE058m2Jtn3K0VbslYYTr_7u76-z51jtXKEsyuip1jtdiXEmPWep8o6wS6hsZc9BWZ9YNp9iKVEDcIAlJfgdIa4qEVpccJvkJ3ipbBjQpYPtsL0Q',
    },
    {
      city: 'Bali',
      country: 'Indonesia',
      code: 'DPS',
      tagCode: 'DPS // 02',
      description: 'Island of the gods & serene temples',
      rating: 4.95,
      reviews: '3.1k',
      price: 340,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCdlEJRNaCAPWZe7YlR4EpQ-53kvOzybbecQaE_GEsNTNwc0RD16B3syDSETlc203FyDHEOVaibBt5eiXOmeUMTiTC_rQady0KcS9Nalo_PNjrAMV1MDQzbwf8X5APlKdqqVDZLeJdy7G1jIUvtbQ0YudI0ZSDtMrQZYRBUlh6HSA-so_yPGX_mPWzzyMefAHcFgRy949s2_sF3m3GE_YF5XT5H17bQhqQu3IIEz_OiNsTalTDLE_CApQ',
    },
    {
      city: 'Dubai',
      country: 'United Arab Emirates',
      code: 'DXB',
      tagCode: 'DXB // 03',
      description: 'Futuristic skyline meets desert dunes',
      rating: 4.88,
      reviews: '4.8k',
      price: 295,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCcnaOODscxxtUTZW-bFOJpxpFAm0NhDahBec3b7xJfkJDP4m9V74Rgv2V7K40gvs0mT5i6qjRdzHxzM-TTZP3_kv96186HQ_VSrwKRUboZ6SU0VHWMNrvOuqshsYd_sufTV3JstH_4KXEcy2-3lVJDrLly1_SV3RWwcHpKCifi84CY24N96ajDUDGFI0AWZTq9KwfzdKERhy7ovUtkiYECnCxOiMBAWsbdlkCh5qEHBksAFndC2SQwTQ',
    },
    {
      city: 'Istanbul',
      country: 'Turkey',
      code: 'IST',
      tagCode: 'IST // 04',
      description: 'Where East embraces West seamlessly',
      rating: 4.92,
      reviews: '2.2k',
      price: 420,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBPMx8lmpQ5nGH2elMSFryXdSC-JPuTyOOCQmS25Oef_5_p7JlaXY6ZcjNBI5Z-nE6stZHpnAKAxhtvyIaAGLFEf3_aSqghq03Iub5GBeSzgMtJHfU5hX9-ffUH-koCRVRuulUxkz7PGf2WffPZYYNJqOOu6RoBPDhkv5aUDZuMcZoqPZQij6KkeueB1vvBmK-Vsq_8ACEaIEUE_djlKJffLCedXbeba8HcvGUACY3plO8n8IbQ37fEyw',
    },
    {
      city: 'Maldives',
      country: 'Maldives',
      code: 'MLE',
      tagCode: 'MLE // 05',
      description: 'Overwater villas & coral atolls',
      rating: 4.98,
      reviews: '950',
      price: 510,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuANo-mQGk6v2BgeSEmyjupGRpDufSHh_u_epVLP0kH6RY0ZvzlsV1LPwWw5uT6pD6y8amR6vYuTLRfH9l0NT-YnddeDItV9_tcTzEPFKGcx3dQtVM_9sNOYIpDI5IocllnPqhAQ29g3Fg_9_vPuMmfZg59v5n4TxMu8UyIyUjpPD21y8usQQGvn4soglqXFMYamZNyt17YGmGWp0Y0DqZDXeoN20koM55dUK2NWlxDaXfxNZT0q5E50Qg',
    },
  ];

  // Curated Stitch Vacation Packages (with fallback for live API)
  const fallbackCuratedPackages = [
    {
      id: 'pkg-santorini-1',
      code: 'PKG // SAN-704',
      tag: '5★ VERIFIED SANCTUARY',
      title: 'Santorini Sunset Dream',
      city: 'Santorini',
      description:
        'Private cliffside caldera plunge pool suite, sunset sailboat charter, and artisanal Aegean winery tour.',
      originalPrice: 1047,
      bundlePrice: 890,
      discountPercent: 20,
      savings: 157,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCDNNp1A03WZD_YlT126zqCAq8t1O6ryRrdG-M1O3853hO2fIcGU1yeRstHuinrNiPbQuH2Zgj22vgs049914_hVOizD4LLcUkOZSCnWfPt9CsJjx_6fjR9Max3_IPA_qWgjoCegbgGHwXYOdv0pdTfBiLEBuxQkZYhfDvO0IYbJwc0SV9IZgW1CGu8hMRyLh4TxPEZUjHzSjkQMXTmzWLPSN_5GsIQ0ZyiWKA8xLlJGt5V6Y_Eui3cuA',
      features: [
        'Round-trip Flight',
        '4 Nights Caldera Villa',
        'VIP Airport Transfer',
        'Breakfast & Wine Tour',
      ],
      flight: { airline: 'Aegean Airways', origin: 'JFK', destination: 'JTR' },
      hotel: { name: 'Canaves Oia Suites' },
      room: { type: 'Caldera Plunge Suite' },
    },
    {
      id: 'pkg-kyoto-2',
      code: 'PKG // KYO-882',
      tag: 'HISTORIC HERITAGE INN',
      title: 'Kyoto Autumn Retreat',
      city: 'Kyoto',
      description:
        'Historic onsen hot spring access, private tea ceremony masterclass, and traditional multi-course kaiseki banquets.',
      originalPrice: 1353,
      bundlePrice: 1150,
      discountPercent: 15,
      savings: 203,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBAd68gR6xKPMCc8KBQJNBLQiaep1YgVO8HsFw3XIgdHEvsL470o01_tfXiRtu0ls50k9yDSz5kdUYMScCP9v4yVFzzcA1T-hH6J5XbZysIrESDLDD1a_pHlUGDGwRYUfVd4FFmv0ASyoWIeNy1F7kNT2Wy1ZZLWK09YOoej8IecXwtD1i22qhenUkQ_yh0h-6MqKBtaEsClnR26ImKqGk0j9Ksyrz26rm1ktHqEI-wlVPyxjQqDfFORg',
      features: [
        'Round-trip Direct',
        '5 Nights Zen Ryokan',
        '7-Day JR Railpass',
        'Private Onsen Suite',
      ],
      flight: { airline: 'Japan Airlines', origin: 'LAX', destination: 'HND' },
      hotel: { name: 'Hoshinoya Kyoto' },
      room: { type: 'Riverside Pavilion' },
    },
  ];

  // City-to-image mapping for API bundles
  const cityImages = {
    Tokyo:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    Paris:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    London:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    'New York':
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    Rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    Dubai:
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    Singapore:
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
    Sydney:
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  };

  const displayPackages =
    apiBundles.length > 0
      ? apiBundles.map((b, i) => ({
          id: b.id,
          code: `PKG // ${(b.city || 'EXP').substring(0, 3).toUpperCase()}-${(i + 1).toString().padStart(2, '0')}`,
          tag: '5★ VERIFIED SANCTUARY',
          title: b.title,
          city: b.city,
          description: `Curated package featuring ${b.flight?.airline || 'premier flight'} and luxury accommodation at ${b.hotel?.name || 'verified hotel'} with bundled savings.`,
          originalPrice: b.originalPrice,
          bundlePrice: b.bundlePrice,
          discountPercent: b.discountPercent || 15,
          savings: b.savings,
          image:
            cityImages[b.city] ||
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          features: [
            `Round-trip: ${b.flight?.airline || 'Direct'}`,
            `${b.hotel?.name || 'Luxury Hotel'}`,
            `Room: ${b.room?.type || 'Standard Suite'}`,
            'Combo Price Guarantee',
          ],
          flight: b.flight,
          hotel: b.hotel,
          room: b.room,
          items: b.items,
        }))
      : fallbackCuratedPackages;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* ====================================================================
          1. Full-Width Immersive Hero Section
          ==================================================================== */}
      <section className="stitch-hero">
        <div className="stitch-hero-bg" />
        <div className="stitch-hero-scrim" />
        <div className="stitch-hero-radial" />

        {/* Topographic Contour Overlay */}
        <svg
          className="stitch-hero-contour"
          viewBox="0 0 1440 900"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100 200 C300 120 600 350 1500 180 M-80 320 C280 260 700 480 1520 280 M-60 440 C420 380 820 600 1540 400 M-40 560 C380 500 900 720 1560 520 M-20 680 C440 620 980 840 1580 640"
            strokeDasharray="6 8"
            strokeWidth="1.5"
          />
        </svg>

        <div className="stitch-hero-content">
          {/* Issue Telemetry Badge */}
          <div className="stitch-telemetry-badge">
            <span className="stitch-pulse-dot" />
            <span>ISSUE NO. 44 // GLOBAL EXPEDITIONS</span>
          </div>

          {/* Editorial Display Heading */}
          <h1 className="stitch-hero-title">
            Where to next?
            <span className="stitch-hero-italic">Let curiosity take flight.</span>
          </h1>

          <p className="stitch-hero-subtitle">
            Handpicked flights, boutique sanctuaries, and curated escapes designed for the modern,
            high-taste wanderer.
          </p>

          {/* Flight Path Telemetry Quick Indicator */}
          <div className="stitch-telemetry-strip">
            <span>DAC</span>
            <span className="stitch-dashed-line" />
            <Plane size={15} style={{ transform: 'rotate(45deg)' }} />
            <span className="stitch-dashed-line" />
            <span>DXB</span>
            <span className="stitch-dashed-line" />
            <Plane size={15} style={{ transform: 'rotate(45deg)' }} />
            <span className="stitch-dashed-line" />
            <span>HND</span>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. Floating Elevated Search Card
          ==================================================================== */}
      <section className="stitch-search-card">
        {/* Search Tabs & Flight Modifiers Sub-Row */}
        <div className="stitch-search-tabs-row">
          <div className="stitch-tab-group" id="booking-tabs">
            <button
              type="button"
              className={`stitch-tab-pill ${tab === 'flights' ? 'active' : ''}`}
              onClick={() => setTab('flights')}
            >
              <Plane size={16} />
              <span>Flights</span>
            </button>
            <button
              type="button"
              className={`stitch-tab-pill ${tab === 'hotels' ? 'active' : ''}`}
              onClick={() => setTab('hotels')}
            >
              <Hotel size={16} />
              <span>Hotels</span>
            </button>
            <button
              type="button"
              className={`stitch-tab-pill ${tab === 'bundles' ? 'active' : ''}`}
              onClick={() => setTab('bundles')}
            >
              <Package size={16} />
              <span>Packages</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '999px',
                  background: 'var(--stitch-amber)',
                  color: 'var(--stitch-navy)',
                  fontWeight: 800,
                  marginLeft: '0.2rem',
                }}
              >
                Save 15%
              </span>
            </button>
          </div>

          {/* Trip Options Modifiers */}
          {tab === 'flights' && (
            <div className="stitch-trip-options">
              <label className="stitch-radio-label">
                <input
                  type="radio"
                  name="trip_type"
                  checked={tripType === 'roundTrip'}
                  onChange={() => setTripType('roundTrip')}
                />
                <span>Round trip</span>
              </label>
              <label className="stitch-radio-label">
                <input
                  type="radio"
                  name="trip_type"
                  checked={tripType === 'oneWay'}
                  onChange={() => setTripType('oneWay')}
                />
                <span>One way</span>
              </label>
              <label className="stitch-radio-label">
                <input
                  type="radio"
                  name="trip_type"
                  checked={tripType === 'multiCity'}
                  onChange={() => setTripType('multiCity')}
                />
                <span>Multi-city</span>
              </label>

              <select
                className="stitch-class-select"
                value={flightClass}
                onChange={(e) => setFlightClass(e.target.value)}
                aria-label="Flight travel class"
              >
                <option value="Economy Class">Economy Class</option>
                <option value="Premium Economy">Premium Economy</option>
                <option value="Business Class">Business Class</option>
                <option value="First Class">First Class</option>
              </select>
            </div>
          )}
        </div>

        {/* --- Tab 1: Flights Search Form --- */}
        {tab === 'flights' && (
          <form onSubmit={handleFlightSubmit}>
            <div className="stitch-flight-grid">
              {/* Origin "From" */}
              <div className="stitch-input-box">
                <div className="stitch-input-header">
                  <span className="stitch-input-label">From</span>
                  <span className="stitch-airport-code">{origin || 'DAC'}</span>
                </div>
                <LocationSelect
                  label=""
                  placeholder="All Origins"
                  value={origin}
                  onChange={setOrigin}
                  icon={Plane}
                  type="airport"
                />
              </div>

              {/* Floating Animated Swap Button */}
              <button
                type="button"
                onClick={handleSwapAirports}
                className="stitch-swap-btn"
                title="Swap departure and arrival airport"
                aria-label="Swap departure and arrival airport"
              >
                <ArrowLeftRight size={17} />
              </button>

              {/* Destination "To" */}
              <div className="stitch-input-box">
                <div className="stitch-input-header">
                  <span className="stitch-input-label">To</span>
                  <span className="stitch-airport-code" style={{ color: 'var(--stitch-coral)' }}>
                    {destination || 'DXB'}
                  </span>
                </div>
                <LocationSelect
                  label=""
                  placeholder="All Destinations"
                  value={destination}
                  onChange={setDestination}
                  icon={MapPin}
                  type="airport"
                />
              </div>

              {/* Departure & Return Dates */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: tripType === 'roundTrip' ? '1fr 1fr' : '1fr',
                  gap: '0.5rem',
                }}
              >
                <div className="stitch-input-box">
                  <span className="stitch-input-label">Depart</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ border: 'none', background: 'transparent', padding: '0.35rem 0 0' }}
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                  />
                </div>
                {tripType === 'roundTrip' && (
                  <div className="stitch-input-box">
                    <span className="stitch-input-label">Return</span>
                    <input
                      type="date"
                      className="form-input"
                      style={{ border: 'none', background: 'transparent', padding: '0.35rem 0 0' }}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Travelers */}
              <div className="stitch-input-box">
                <span className="stitch-input-label">Travelers</span>
                <select
                  className="form-input form-select"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '0.35rem 0 0',
                    fontWeight: 700,
                  }}
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  aria-label="Number of travelers"
                >
                  <option value="1 Adult">1 Adult</option>
                  <option value="2 Adults">2 Adults</option>
                  <option value="3 Adults">3 Adults</option>
                  <option value="Family (4+)">Family (4+)</option>
                </select>
              </div>

              {/* Primary Search Submit */}
              <button type="submit" className="stitch-search-submit">
                <span>Search flights</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        )}

        {/* --- Tab 2: Hotels Search Form --- */}
        {tab === 'hotels' && (
          <form onSubmit={handleHotelSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
                gap: '0.75rem',
                alignItems: 'flex-end',
              }}
            >
              <div className="stitch-input-box">
                <span className="stitch-input-label">Destination City</span>
                <LocationSelect
                  label=""
                  placeholder="All Cities / Destinations"
                  value={city}
                  onChange={setCity}
                  icon={Hotel}
                  type="city"
                />
              </div>

              <div className="stitch-input-box">
                <span className="stitch-input-label">Check-in Date</span>
                <input
                  type="date"
                  className="form-input"
                  style={{ border: 'none', background: 'transparent', padding: '0.35rem 0 0' }}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="stitch-input-box">
                <span className="stitch-input-label">Check-out Date</span>
                <input
                  type="date"
                  className="form-input"
                  style={{ border: 'none', background: 'transparent', padding: '0.35rem 0 0' }}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              <div className="stitch-input-box">
                <span className="stitch-input-label">Guests</span>
                <select
                  className="form-input form-select"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '0.35rem 0 0',
                    fontWeight: 700,
                  }}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  aria-label="Hotel guests"
                >
                  <option value="1 Guest">1 Guest</option>
                  <option value="2 Guests">2 Guests</option>
                  <option value="3 Guests">3 Guests</option>
                  <option value="Family / 4+">Family / 4+</option>
                </select>
              </div>

              <button type="submit" className="stitch-search-submit">
                <span>Find Hotels</span>
                <Search size={17} />
              </button>
            </div>
          </form>
        )}

        {/* --- Tab 3: Vacation Packages Search Form --- */}
        {tab === 'bundles' && (
          <form onSubmit={handleBundleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto',
                gap: '0.75rem',
                alignItems: 'flex-end',
              }}
            >
              <div className="stitch-input-box">
                <span className="stitch-input-label">Departure Airport</span>
                <LocationSelect
                  label=""
                  placeholder="All Origins"
                  value={bundleFrom}
                  onChange={setBundleFrom}
                  icon={Plane}
                  type="airport"
                />
              </div>

              <div className="stitch-input-box">
                <span className="stitch-input-label">Destination Airport</span>
                <LocationSelect
                  label=""
                  placeholder="All Destinations"
                  value={bundleTo}
                  onChange={setBundleTo}
                  icon={MapPin}
                  type="airport"
                />
              </div>

              <div className="stitch-input-box">
                <span className="stitch-input-label">Travel Date</span>
                <input
                  type="date"
                  className="form-input"
                  style={{ border: 'none', background: 'transparent', padding: '0.35rem 0 0' }}
                  value={bundleDate}
                  onChange={(e) => setBundleDate(e.target.value)}
                />
              </div>

              <button type="submit" className="stitch-search-submit">
                <span>Explore Deals</span>
                <Sparkles size={17} />
              </button>
            </div>
          </form>
        )}

        {/* Micro Flight Guarantee Banner */}
        <div className="stitch-guarantee-banner">
          <div className="stitch-guarantee-items">
            <span className="stitch-guarantee-pill">
              <CheckCircle2 size={14} style={{ color: 'var(--stitch-primary)' }} />
              Verified Pricing
            </span>
            <span>•</span>
            <span>No hidden booking surcharges</span>
            <span>•</span>
            <span className="hidden sm:inline">24/7 Aviation Concierge Dispatch</span>
          </div>
          <Link
            to="/flights"
            style={{
              color: 'var(--stitch-primary)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.82rem',
            }}
          >
            <span>Explore low fare calendar</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* Decorative Flight Waypoint Strip */}
      <div className="stitch-waypoint-strip">
        <span>FLIGHT WAYPOINT // 21.42° N, 92.00° E</span>
        <div style={{ width: '80px', borderBottom: '1.5px dashed var(--stitch-primary)' }} />
        <Plane size={14} style={{ transform: 'rotate(45deg)' }} />
      </div>

      {/* ====================================================================
          3. Trending Escapes This Season (Editorial Dispatch)
          ==================================================================== */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="stitch-section-header">
          <div>
            <div className="stitch-dispatch-badge">
              <span>EXPEDITION DISPATCH</span>
            </div>
            <h2 className="stitch-section-title">Trending Escapes This Season</h2>
            <p className="stitch-section-desc">
              Direct flights and seasonal fare dips handpicked by our travel editors.
            </p>
          </div>

          <div className="stitch-carousel-nav">
            <button
              type="button"
              onClick={() => scrollDestinations('left')}
              className="stitch-nav-circle-btn"
              aria-label="Previous destination"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollDestinations('right')}
              className="stitch-nav-circle-btn primary"
              aria-label="Next destination"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Editorial Photo Cards Bento/Row */}
        <div ref={destinationsRowRef} className="stitch-destinations-row">
          {editorialDestinations.map((dest) => {
            const isSaved = savedWishlist.has(dest.code);
            return (
              <div
                key={dest.code}
                className="stitch-editorial-card"
                onClick={() => navigate(`/flights?to=${dest.code}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/flights?to=${dest.code}`);
                  }
                }}
              >
                <div
                  className="stitch-card-bg"
                  style={{ backgroundImage: `url('${dest.image}')` }}
                />
                <div className="stitch-card-gradient" />

                {/* Top Luggage Tag & Wishlist */}
                <div className="stitch-card-top">
                  <div className="stitch-luggage-tag">
                    <span className="stitch-luggage-dot" />
                    <span>{dest.tagCode}</span>
                  </div>

                  <button
                    type="button"
                    className={`stitch-card-heart-btn ${isSaved ? 'active' : ''}`}
                    onClick={(e) => toggleWishlist(dest.code, e)}
                    aria-label={`Save ${dest.city} to wishlist`}
                  >
                    <Heart
                      size={16}
                      fill={isSaved ? 'var(--stitch-coral)' : 'none'}
                      color={isSaved ? 'var(--stitch-coral)' : '#FFFFFF'}
                    />
                  </button>
                </div>

                {/* Bottom Content Area */}
                <div className="stitch-card-bottom">
                  <div className="stitch-card-rating">
                    <Star size={13} fill="var(--stitch-amber)" color="var(--stitch-amber)" />
                    <span>{dest.rating}</span>
                    <span style={{ opacity: 0.75, fontWeight: 400 }}>({dest.reviews})</span>
                  </div>

                  <h3 className="stitch-card-city">{dest.city}</h3>
                  <p className="stitch-card-desc">{dest.description}</p>

                  <div className="stitch-card-price-row">
                    <span className="stitch-card-fare-label">Flights from</span>
                    <span className="stitch-card-fare-amount">${dest.price}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          4. Handcrafted Vacation Packages (Vintage Boarding-Pass Split)
          ==================================================================== */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="stitch-section-header">
          <div>
            <div className="stitch-bundle-badge">
              <span>CURATED BUNDLES // VINTAGE PASS</span>
            </div>
            <h2 className="stitch-section-title">Handcrafted Vacation Packages</h2>
            <p className="stitch-section-desc">
              Complete journeys combining premier aviation corridors with heritage boutique stays.
            </p>
          </div>

          <Link
            to="/flights?deal=bundle"
            style={{
              color: 'var(--stitch-primary)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.92rem',
            }}
          >
            <span>View all 32 curated packages</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {bundlesLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[1, 2].map((i) => (
              <div key={i} className="card" style={{ padding: '1.5rem' }}>
                <Skeleton
                  variant="text"
                  width="40%"
                  height="24px"
                  style={{ marginBottom: '1rem' }}
                />
                <Skeleton
                  variant="text"
                  width="70%"
                  height="32px"
                  style={{ marginBottom: '1.25rem' }}
                />
                <Skeleton variant="rectangular" height="120px" style={{ marginBottom: '1rem' }} />
                <Skeleton variant="text" width="50%" height="28px" />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {displayPackages.map((pkg) => (
              <div key={pkg.id} className="stitch-boarding-pass">
                {/* Stamp Badge (Passport Stamp Overlay) */}
                <div className="stitch-stamp-overlay">
                  <div className="stitch-stamp-box">★ SAVE {pkg.discountPercent}% BUNDLE</div>
                </div>

                {/* Left Image Showcase (44%) */}
                <div className="stitch-pass-media">
                  <img src={pkg.image} alt={pkg.title} className="stitch-pass-img" loading="lazy" />
                </div>

                {/* Perforated Separator (Desktop) */}
                <div className="stitch-perforation">
                  <div className="stitch-perf-notch-top" />
                  <div className="stitch-perf-line" />
                  <div className="stitch-perf-notch-bottom" />
                </div>

                {/* Right Content & Pricing (56%) */}
                <div className="stitch-pass-details">
                  <div>
                    <div className="stitch-pass-meta-row">
                      <span>{pkg.code}</span>
                      <span style={{ color: 'var(--stitch-primary)', fontWeight: 700 }}>
                        {pkg.tag}
                      </span>
                    </div>

                    <h3 className="stitch-pass-title">{pkg.title}</h3>
                    <p className="stitch-pass-summary">{pkg.description}</p>

                    {/* Included Row */}
                    <div className="stitch-pass-included-grid">
                      {pkg.features.map((feat, idx) => (
                        <div key={idx} className="stitch-included-item">
                          <CheckCircle2
                            size={13}
                            style={{ color: 'var(--stitch-primary)', flexShrink: 0 }}
                          />
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price & Booking Action */}
                  <div className="stitch-pass-footer">
                    <div className="stitch-pass-pricing">
                      <span className="stitch-pass-orig-price">
                        ${Number(pkg.originalPrice).toFixed(0)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span className="stitch-pass-price">
                          ${Number(pkg.bundlePrice).toFixed(0)}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          / person
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookBundle(pkg)}
                      className="stitch-pass-btn"
                    >
                      <span>Explore Package</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ====================================================================
          5. The TravelGo Promise ("Why TravelGo" Editorial Strip)
          ==================================================================== */}
      <section className="stitch-promise-container">
        {/* Background Watermark Graphic */}
        <span className="material-symbols-outlined stitch-watermark-icon">travel_explore</span>

        <div className="stitch-promise-header">
          <span className="stitch-promise-badge">THE TRAVELGO PROMISE</span>
          <h2 className="stitch-promise-title">Engineered for Wonder. Grounded in Precision.</h2>
          <p className="stitch-promise-subtitle">
            We strip away the chaos of legacy booking engines to give you calm, tactile reliability
            from inspiration to arrival.
          </p>
        </div>

        <div className="stitch-promise-grid">
          {/* Card 1 */}
          <div className="stitch-promise-card">
            <div className="stitch-promise-icon-box teal">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                radar
              </span>
            </div>
            <div className="stitch-promise-card-title-row">
              <h3 className="stitch-promise-card-title">Live Flight Telemetry</h3>
              <span className="stitch-promise-tag teal">REAL-TIME</span>
            </div>
            <p className="stitch-promise-desc">
              Instantaneous gate pings, luggage baggage carousel assignments, and route weather
              turbulence forecasting delivered directly to your device.
            </p>
          </div>

          {/* Card 2 */}
          <div className="stitch-promise-card">
            <div className="stitch-promise-icon-box amber">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                verified_user
              </span>
            </div>
            <div className="stitch-promise-card-title-row">
              <h3 className="stitch-promise-card-title">Verified Stays Only</h3>
              <span className="stitch-promise-tag amber">100% AUDITED</span>
            </div>
            <p className="stitch-promise-desc">
              Every boutique room and villa is physically inspected for architectural acoustic
              isolation, linen standards, and bespoke hospitality integrity.
            </p>
          </div>

          {/* Card 3 */}
          <div className="stitch-promise-card">
            <div className="stitch-promise-icon-box coral">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                price_check
              </span>
            </div>
            <div className="stitch-promise-card-title-row">
              <h3 className="stitch-promise-card-title">Price Drop Guarantee</h3>
              <span className="stitch-promise-tag coral">AUTOMATED</span>
            </div>
            <p className="stitch-promise-desc">
              If airline tariffs or resort tariffs sink anytime prior to departure, our continuous
              algorithm re-books your seat and credits you the difference.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
