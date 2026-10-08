import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { bookingApi } from '../api/bookings.js';
import { ShieldCheck, CreditCard, AlertCircle, ArrowLeft, Check } from 'lucide-react';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const itemState = location.state;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!itemState) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: 'var(--warning)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Item Selected</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Please select a flight or hotel room before proceeding to checkout.
        </p>
        <Link to="/" className="btn btn-primary">
          Browse Flights & Hotels
        </Link>
      </div>
    );
  }

  const { itemType, itemId, quantity = 1, unitPrice = 0, title, subtitle, checkIn, checkOut } = itemState;
  const subtotal = (unitPrice * quantity).toFixed(2);
  const taxes = (unitPrice * quantity * 0.1).toFixed(2);
  const totalAmount = (parseFloat(subtotal) + parseFloat(taxes)).toFixed(2);

  const handleConfirmBooking = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        items: [
          {
            itemType,
            itemId,
            quantity,
            unitPrice,
            dateFrom: checkIn || null,
            dateTo: checkOut || null,
          },
        ],
      };

      const res = await bookingApi.createBooking(payload);
      const booking = res.data.booking;

      // Navigate directly to booking status detail page
      navigate(`/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to place booking. Please try again.');
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
        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <AlertCircle size={20} />
            <strong>{error}</strong>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left Column: Booking Item & Traveler Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              Item Details
            </h3>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {subtitle}
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Type: </span>
                <strong>{itemType}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Quantity: </span>
                <strong>{quantity}</strong>
              </div>
            </div>

            {checkIn && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Stay: {checkIn} {checkOut ? `to ${checkOut}` : ''}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              Traveler Information
            </h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" disabled value={user?.name || ''} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email (for confirmation)</label>
              <input type="email" className="form-input" disabled value={user?.email || ''} />
            </div>
          </div>
        </div>

        {/* Right Column: Price Summary & Payment Trigger */}
        <div className="card" style={{ position: 'sticky', top: '90px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Price Summary
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Base Price ({quantity}x)</span>
            <span>${subtotal}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Taxes & Regulatory Fees (10%)</span>
            <span>${taxes}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              ${totalAmount}
            </span>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-sm)', margin: '1.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
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
