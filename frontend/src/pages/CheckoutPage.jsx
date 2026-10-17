import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { bookingApi } from '../api/bookings.js';
import { engagementApi } from '../api/engagement.js';
import {
  ShieldCheck,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Users,
  Tag,
  Percent,
  Sparkles,
  X,
  Award,
  Luggage,
  Sliders,
} from 'lucide-react';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const itemState = location.state;
  const [currentStep, setCurrentStep] = useState(1); // 1: Passengers, 2: Extras, 3: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Loyalty rewards redemption state
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);

  // Travel extras state
  const [extras, setExtras] = useState({
    insurance: false,
    priorityBoarding: false,
  });

  useEffect(() => {
    engagementApi
      .getLoyaltyProfile()
      .then((res) => {
        if (res.success && res.data?.account) {
          setLoyaltyAccount(res.data.account);
        }
      })
      .catch(() => {});
  }, []);

  const [travelers, setTravelers] = useState([
    {
      full_name: user?.name || '',
      passport_no: '',
      date_of_birth: '',
      seat_no: '',
    },
  ]);

  if (!itemState) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: 'var(--warning)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          No Item Selected
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Please select a flight or hotel room before proceeding to checkout.
        </p>
        <Link to="/" className="btn btn-primary">
          Browse Flights & Hotels
        </Link>
      </div>
    );
  }

  const {
    itemType,
    itemId,
    unitPrice = 0,
    title,
    subtitle,
    checkIn,
    checkOut,
    items: bundleItems,
    savings: bundleSavings = 0,
    discountPercent: bundleDiscountPercent = 0,
  } = itemState;

  // Multi-item / Bundle pricing calculation
  const isBundle = Boolean(bundleItems && bundleItems.length > 0);
  const baseUnitTotal = isBundle
    ? bundleItems.reduce((acc, it) => acc + parseFloat(it.price || it.unitPrice || 0), 0)
    : parseFloat(unitPrice || 0);

  const packageDiscountPerTraveler = bundleSavings
    ? parseFloat(bundleSavings)
    : bundleDiscountPercent
      ? Math.round(baseUnitTotal * (bundleDiscountPercent / 100) * 100) / 100
      : 0;

  const discountedUnitTotal = Math.max(0, baseUnitTotal - packageDiscountPerTraveler);

  // Dynamic pricing calculation
  const dateForPricing = checkIn || itemState.departureDate || itemState.departureTime || itemState.date;
  const isWeekend = (() => {
    if (!dateForPricing) return false;
    const d = new Date(dateForPricing);
    if (isNaN(d.getTime())) return false;
    const day = d.getUTCDay();
    return day === 0 || day === 5 || day === 6;
  })();

  const peakSeason = (() => {
    if (!dateForPricing) return null;
    const d = new Date(dateForPricing);
    if (isNaN(d.getTime())) return null;
    const month = d.getUTCMonth();
    if (month >= 5 && month <= 7) return { name: 'Summer Peak', rate: 0.2 };
    if (month === 11) return { name: 'Holiday Peak', rate: 0.25 };
    return null;
  })();

  const travelerCount = travelers.length;
  const grossBaseTotal = baseUnitTotal * travelerCount;
  const totalPackageDiscount = packageDiscountPerTraveler * travelerCount;
  const baseTotal = discountedUnitTotal * travelerCount;

  const weekendSurcharge = isWeekend ? Math.round(baseTotal * 0.15 * 100) / 100 : 0;
  const peakSurcharge = peakSeason ? Math.round(baseTotal * peakSeason.rate * 100) / 100 : 0;
  const grossSubtotal = baseTotal + weekendSurcharge + peakSurcharge;

  const insurancePrice = extras.insurance ? 25 * travelerCount : 0;
  const priorityPrice = extras.priorityBoarding ? 15 * travelerCount : 0;
  const extrasTotal = insurancePrice + priorityPrice;

  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  // Loyalty points redemption: 10 points = $1.00
  const pointsBalance = loyaltyAccount?.points_balance || 0;
  const maxRedeemablePoints = Math.min(
    pointsBalance,
    Math.max(0, Math.floor((grossSubtotal + extrasTotal - couponDiscountAmount) * 10))
  );
  const loyaltyDiscount = Math.min(
    Math.floor(redeemPoints / 10),
    Math.max(0, grossSubtotal + extrasTotal - couponDiscountAmount)
  );

  const totalDiscount = couponDiscountAmount + loyaltyDiscount;
  const discountedSubtotal = Math.max(0, grossSubtotal + extrasTotal - totalDiscount);
  const taxes = Math.round(discountedSubtotal * 0.1 * 100) / 100;
  const totalAmount = (discountedSubtotal + taxes).toFixed(2);

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await bookingApi.validateCoupon(couponInput.trim().toUpperCase(), grossSubtotal);
      if (res.data?.valid) {
        setAppliedCoupon(res.data);
      } else {
        setCouponError(res.error?.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err.message || 'Failed to apply coupon');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleAddTraveler = () => {
    setTravelers([
      ...travelers,
      { full_name: '', passport_no: '', date_of_birth: '', seat_no: '' },
    ]);
  };

  const handleRemoveTraveler = (index) => {
    if (travelers.length <= 1) return;
    setTravelers(travelers.filter((_, i) => i !== index));
  };

  const handleTravelerChange = (index, field, value) => {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: value };
    setTravelers(updated);
  };

  const handleConfirmBooking = async () => {
    setError('');

    // Validate travelers
    for (let i = 0; i < travelers.length; i++) {
      const t = travelers[i];
      if (!t.full_name.trim()) {
        setError(`Traveler #${i + 1} full name is required`);
        return;
      }
      if (!t.passport_no.trim()) {
        setError(`Traveler #${i + 1} passport number is required`);
        return;
      }
      if (!t.date_of_birth) {
        setError(`Traveler #${i + 1} date of birth is required`);
        return;
      }
    }

    setLoading(true);

    try {
      const normalizedItemType = itemType?.toLowerCase().includes('hotel') ? 'hotel' : 'flight';

      const itemsPayload = isBundle
        ? bundleItems.map((it) => ({
            itemType: (it.itemType || '').toLowerCase().includes('hotel') ? 'hotel' : 'flight',
            itemId: it.itemId,
            quantity: travelerCount,
            ...(it.dateFrom ? { dateFrom: it.dateFrom } : checkIn ? { dateFrom: checkIn } : {}),
            ...(it.dateTo ? { dateTo: it.dateTo } : checkOut ? { dateTo: checkOut } : {}),
          }))
        : [
            {
              itemType: normalizedItemType,
              itemId,
              quantity: travelerCount,
              ...(checkIn ? { dateFrom: checkIn } : {}),
              ...(checkOut ? { dateTo: checkOut } : {}),
            },
          ];

      const payload = {
        items: itemsPayload,
        travelers: travelers.map((t) => ({
          full_name: t.full_name.trim(),
          passport_no: t.passport_no.trim().toUpperCase(),
          date_of_birth: t.date_of_birth,
          seat_no: t.seat_no ? t.seat_no.trim().toUpperCase() : null,
        })),
        couponCode: appliedCoupon?.coupon?.code || undefined,
      };

      const res = await bookingApi.createBooking(payload);
      const booking = res.data?.booking || res.data;

      // Navigate directly to booking status detail page
      navigate(`/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      console.error('Checkout error:', err);

      if (err.status === 401 || err.code === 'UNAUTHORIZED') {
        setError('Your session has expired. Redirecting to login...');
        setTimeout(() => {
          navigate('/login', {
            state: { from: { pathname: '/checkout', state: itemState } },
          });
        }, 1500);
        return;
      }

      const validationDetails = err.details?.map((d) => d.message).join('. ');
      const message =
        validationDetails || err.message || 'Failed to place booking. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ marginBottom: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Checkout Stepper */}
      <div className="checkout-stepper">
        <div
          className={`stepper-step ${currentStep >= 1 ? (currentStep === 1 ? 'active' : 'done') : ''}`}
          onClick={() => setCurrentStep(1)}
          style={{ cursor: 'pointer' }}
        >
          <div className="stepper-num">1</div>
          <span>Travelers</span>
        </div>
        <div className="stepper-divider" />
        <div
          className={`stepper-step ${currentStep >= 2 ? (currentStep === 2 ? 'active' : 'done') : ''}`}
          onClick={() => setCurrentStep(2)}
          style={{ cursor: 'pointer' }}
        >
          <div className="stepper-num">2</div>
          <span>Extras</span>
        </div>
        <div className="stepper-divider" />
        <div
          className={`stepper-step ${currentStep >= 3 ? 'active' : ''}`}
          onClick={() => setCurrentStep(3)}
          style={{ cursor: 'pointer' }}
        >
          <div className="stepper-num">3</div>
          <span>Payment</span>
        </div>
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--secondary)' }}>
        Review & Complete Your Booking
      </h1>

      {error && (
        <div
          className="card"
          style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5', marginBottom: '1.5rem' }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}
          >
            <AlertCircle size={20} />
            <strong>{error}</strong>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left Column: Booking Item & Traveler Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {isBundle ? 'Package Bundle Details' : 'Item Details'}
              </h3>
              {isBundle && (
                <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.75rem' }}>
                  <Sparkles size={12} /> Bundle Deal (15% Off)
                </span>
              )}
            </div>

            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              {title}
            </div>
            {subtitle && (
              <div
                style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}
              >
                {subtitle}
              </div>
            )}

            {isBundle && bundleItems && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bundleItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {item.title || `${item.itemType?.toUpperCase()} - Item #${idx + 1}`}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Type: {item.itemType}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      ${parseFloat(item.price || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Type: </span>
                <strong>{isBundle ? 'Flight + Hotel Bundle' : itemType}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Travelers: </span>
                <strong>{travelerCount} passenger(s)</strong>
              </div>
            </div>

            {checkIn && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Stay: {checkIn} {checkOut ? `to ${checkOut}` : ''}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> Traveler Information
              </h3>
              <button
                type="button"
                onClick={handleAddTraveler}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Plus size={14} /> Add Passenger
              </button>
            </div>

            {travelers.map((traveler, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: index < travelers.length - 1 ? '1rem' : 0,
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3a8a' }}>
                    Passenger #{index + 1}
                  </span>
                  {travelers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTraveler(index)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. John Doe"
                      value={traveler.full_name}
                      onChange={(e) => handleTravelerChange(index, 'full_name', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Passport / National ID *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. A12345678"
                      value={traveler.passport_no}
                      onChange={(e) => handleTravelerChange(index, 'passport_no', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Date of Birth *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={traveler.date_of_birth}
                      onChange={(e) => handleTravelerChange(index, 'date_of_birth', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Seat Preference</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 14A or Window"
                      value={traveler.seat_no}
                      onChange={(e) => handleTravelerChange(index, 'seat_no', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Travel Extras & Add-ons Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
              <Luggage size={18} style={{ color: 'var(--primary)' }} />
              Travel Extras & Add-ons
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  border: `1.5px solid ${extras.insurance ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: extras.insurance ? 'var(--primary-light)' : '#FAF7F2',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={extras.insurance}
                  onChange={(e) => setExtras({ ...extras, insurance: e.target.checked })}
                  style={{ marginTop: '0.2rem' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Comprehensive Travel Insurance</strong>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.85rem' }}>+$25 / traveler</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    Covers trip cancellations, medical emergencies, and lost baggage with zero deductible.
                  </p>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  border: `1.5px solid ${extras.priorityBoarding ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: extras.priorityBoarding ? 'var(--primary-light)' : '#FAF7F2',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={extras.priorityBoarding}
                  onChange={(e) => setExtras({ ...extras, priorityBoarding: e.target.checked })}
                  style={{ marginTop: '0.2rem' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Priority Boarding & Fast-Track</strong>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.85rem' }}>+$15 / traveler</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    Fast-track airport security check and guaranteed overhead bin space on aircraft.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Price Summary & Payment Trigger */}
        <div className="card" style={{ position: 'sticky', top: '90px' }}>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.5rem',
            }}
          >
            Price Summary
          </h3>

          {/* Coupon Code Input & Status */}
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Tag size={15} />
              Promo / Coupon Code
            </label>
            {appliedCoupon ? (
              <div style={{ background: 'var(--success-bg)', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Check size={14} />
                    {appliedCoupon.coupon.code} applied!
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#15803d' }}>
                    {appliedCoupon.coupon.discount_type === 'PERCENT'
                      ? `${appliedCoupon.coupon.discount_value}% off (-$${discountAmount.toFixed(2)})`
                      : `$${appliedCoupon.coupon.discount_value} off`}
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                  title="Remove coupon"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. SAVE10, FLAT50"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponError('');
                  }}
                  className="form-control"
                  style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem', textTransform: 'uppercase' }}
                />
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem', whiteSpace: 'nowrap' }}
                >
                  {validatingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </form>
            )}
          </div>

          {/* Loyalty Rewards Redemption Slider */}
          {loyaltyAccount && (
            <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={15} style={{ color: 'var(--highlight)' }} />
                  Redeem TravelGo Points
                </label>
                <span className="stamp-badge stamp-badge-amber" style={{ fontSize: '0.7rem' }}>
                  {pointsBalance} pts
                </span>
              </div>

              {pointsBalance > 0 ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>0 pts ($0)</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {redeemPoints} pts (-${loyaltyDiscount.toFixed(2)})
                    </span>
                    <span>{maxRedeemablePoints} pts</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={maxRedeemablePoints}
                    step="10"
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />

                  {redeemPoints > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '0.35rem', fontWeight: 600 }}>
                      ✓ Applied ${loyaltyDiscount.toFixed(2)} rewards discount!
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  You currently have 0 points. Complete this trip to earn rewards!
                </p>
              )}
            </div>
          )}

          {/* Itemized Price Breakdown */}
          {isBundle ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.92rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Combined Base Price ({travelerCount}x @ ${baseUnitTotal.toFixed(2)})
                </span>
                <span>${grossBaseTotal.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.92rem',
                  color: 'var(--success)',
                  fontWeight: 600,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sparkles size={13} /> Package Bundle Savings (15%)
                </span>
                <span>-${totalPackageDiscount.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.92rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>
                Base Price ({travelerCount}x @ ${parseFloat(unitPrice).toFixed(2)})
              </span>
              <span>${baseTotal.toFixed(2)}</span>
            </div>
          )}

          {extrasTotal > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.92rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Travel Extras & Protection</span>
              <span>+${extrasTotal.toFixed(2)}</span>
            </div>
          )}

          {isWeekend && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.92rem',
                color: '#b45309',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={13} /> Weekend Departure (+15%)
              </span>
              <span>+${weekendSurcharge.toFixed(2)}</span>
            </div>
          )}

          {peakSeason && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.92rem',
                color: '#b45309',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={13} /> {peakSeason.name} (+{peakSeason.rate * 100}%)
              </span>
              <span>+${peakSurcharge.toFixed(2)}</span>
            </div>
          )}

          {appliedCoupon && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.92rem',
                color: 'var(--success)',
                fontWeight: 600,
              }}
            >
              <span>Coupon Discount ({appliedCoupon.coupon.code})</span>
              <span>-${couponDiscountAmount.toFixed(2)}</span>
            </div>
          )}

          {loyaltyDiscount > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.92rem',
                color: '#166534',
                fontWeight: 600,
              }}
            >
              <span>Loyalty Points Discount ({redeemPoints} pts)</span>
              <span>-${loyaltyDiscount.toFixed(2)}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.92rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Taxes & Regulatory Fees (10%)</span>
            <span>${taxes.toFixed(2)}</span>
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
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}>Total</span>
              <div style={{ marginTop: '0.15rem' }}>
                <span className="stamp-badge stamp-badge-amber" style={{ fontSize: '0.68rem' }}>
                  Earns +{Math.max(1, Math.floor(totalAmount / 10))} pts
                </span>
              </div>
            </div>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
              ${totalAmount}
            </span>
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              margin: '1.25rem 0',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: '0.25rem',
              }}
            >
              <CreditCard size={15} />
              <span>Simulated Payment Gateway</span>
            </div>
            Mock payment will be processed via RabbitMQ Saga with a 90% default success rate.
          </div>

          <button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
          >
            {loading ? (
              'Initiating Saga...'
            ) : (
              <>
                <Check size={18} />
                <span>Confirm & Pay ${totalAmount}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
