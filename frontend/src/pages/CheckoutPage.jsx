import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { bookingApi } from '../api/bookings.js';
import { ShieldCheck, CreditCard, AlertCircle, ArrowLeft, Check, Plus, Trash2, Users } from 'lucide-react';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const itemState = location.state;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  } = itemState;

  const travelerCount = travelers.length;
  const subtotal = (unitPrice * travelerCount).toFixed(2);
  const taxes = (unitPrice * travelerCount * 0.1).toFixed(2);
  const totalAmount = (parseFloat(subtotal) + parseFloat(taxes)).toFixed(2);

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

      const payload = {
        items: [
          {
            itemType: normalizedItemType,
            itemId,
            quantity: travelerCount,
            ...(checkIn ? { dateFrom: checkIn } : {}),
            ...(checkOut ? { dateTo: checkOut } : {}),
          },
        ],
        travelers: travelers.map((t) => ({
          full_name: t.full_name.trim(),
          passport_no: t.passport_no.trim().toUpperCase(),
          date_of_birth: t.date_of_birth,
          seat_no: t.seat_no ? t.seat_no.trim().toUpperCase() : null,
        })),
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

      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>
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
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.5rem',
              }}
            >
              Item Details
            </h3>
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

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Type: </span>
                <strong>{itemType}</strong>
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

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.95rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Base Price ({quantity}x)</span>
            <span>${subtotal}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.95rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Taxes & Regulatory Fees (10%)</span>
            <span>${taxes}</span>
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
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
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
