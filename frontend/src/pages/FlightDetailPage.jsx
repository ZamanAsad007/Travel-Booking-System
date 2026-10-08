import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Plane, Calendar, Clock, Users, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function FlightDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['flight', id],
    queryFn: () => catalogApi.getFlightById(id),
  });

  const flight = data?.data?.flight;

  const handleProceed = () => {
    if (!flight) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/flights/${id}` } } });
      return;
    }

    navigate('/checkout', {
      state: {
        itemType: 'FLIGHT',
        itemId: flight.id,
        quantity,
        unitPrice: parseFloat(flight.price),
        title: `${flight.airline} Flight (${flight.origin} → ${flight.destination})`,
        subtitle: `Departure: ${new Date(flight.departs_at).toLocaleString()}`,
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading flight details...</p>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="card" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
          <AlertCircle size={20} />
          <strong>Flight not found or failed to load</strong>
        </div>
      </div>
    );
  }

  const availableSeats = flight.available_seats !== undefined ? flight.available_seats : (flight.seats_total - (flight.booked_seats || 0));
  const isSoldOut = availableSeats <= 0;
  const totalPrice = (parseFloat(flight.price) * quantity).toFixed(2);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Flight Overview
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {flight.airline}
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Price per ticket</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              ${parseFloat(flight.price).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Flight Route Visual */}
        <div style={{ background: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{flight.origin}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Departure</div>
            <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
              {new Date(flight.departs_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date(flight.departs_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <Plane size={24} style={{ color: 'var(--primary)' }} />
            <div style={{ width: '120px', height: '2px', background: 'var(--primary)', opacity: 0.5 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Direct Flight</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{flight.destination}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Arrival</div>
            <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
              {new Date(flight.arrives_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date(flight.arrives_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Seat Selection & Booking Box */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <label className="form-label">Number of Passengers / Seats</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <select
                  className="form-select"
                  style={{ width: '120px' }}
                  value={quantity}
                  disabled={isSoldOut}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                >
                  {[...Array(Math.min(availableSeats, 8)).keys()].map((i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'Seat' : 'Seats'}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.85rem', color: isSoldOut ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {isSoldOut ? 'Sold Out' : `${availableSeats} seats currently available`}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Amount</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                ${totalPrice}
              </div>
              <button
                onClick={handleProceed}
                disabled={isSoldOut}
                className="btn btn-primary"
                style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShieldCheck size={24} style={{ color: 'var(--success)' }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <strong>Inventory Lock Guarantee:</strong> Seats are held in Redis with a temporary hold as soon as checkout starts to prevent double booking.
        </div>
      </div>
    </div>
  );
}
