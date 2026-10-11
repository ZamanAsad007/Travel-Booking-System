import React, { useState } from 'react';
import { engagementApi } from '../api/engagement.js';
import { Bell, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function SetPriceAlertModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemName,
  currentPrice,
}) {
  const [targetPrice, setTargetPrice] = useState(
    currentPrice ? Math.floor(parseFloat(currentPrice) * 0.9) : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      setError('Please enter a valid target price');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await engagementApi.createPriceAlert({
        itemType,
        itemId,
        itemName,
        targetPrice: parseFloat(targetPrice),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create price alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '440px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div
            style={{
              background: '#eff6ff',
              padding: '0.6rem',
              borderRadius: '12px',
              color: '#2563eb',
            }}
          >
            <Bell size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Set Price Drop Alert</h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
              We'll notify you when the price drops to or below your target.
            </p>
          </div>
        </div>

        {success ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              background: '#ecfdf5',
              borderRadius: '8px',
              color: '#065f46',
            }}
          >
            <CheckCircle size={36} style={{ margin: '0 auto 0.5rem auto' }} />
            <h4 style={{ margin: '0 0 0.25rem 0' }}>Price Alert Activated!</h4>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              You will be emailed as soon as the price reaches ${parseFloat(targetPrice).toFixed(2)}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: '0.6rem 0.8rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#991b1b',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div
              style={{
                background: '#f9fafb',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Watching Item</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{itemName}</div>
              {currentPrice && (
                <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.2rem' }}>
                  Current Price: <strong>${parseFloat(currentPrice).toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                }}
              >
                Notify me when price drops to: ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Target Price"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              >
                {submitting ? 'Setting Alert...' : 'Set Price Alert'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
