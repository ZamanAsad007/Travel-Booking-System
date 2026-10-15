import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  Clock,
  Heart,
  Star,
  ChevronDown,
  ChevronUp,
  Luggage,
  ShieldCheck,
  Zap,
  Coffee,
  Check,
} from 'lucide-react';

export default function FlightCard({
  flight,
  isWishlisted,
  onToggleWishlist,
  isAuthenticated,
}) {
  const [expanded, setExpanded] = useState(false);

  const availableSeats =
    flight.seats_available !== undefined
      ? flight.seats_available
      : flight.seats_total - (flight.booked_seats || 0);

  const isSoldOut = availableSeats <= 0;
  const isFewSeats = availableSeats > 0 && availableSeats <= 8;

  const formatDuration = (minutes) => {
    if (!minutes) return 'Direct';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const departDate = new Date(flight.departs_at);
  const arriveDate = new Date(flight.arrives_at);

  const departTimeStr = departDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const arriveTimeStr = arriveDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flight-ticket-card ${isSoldOut ? 'is-sold-out' : ''}`}>
      <div className="ticket-main">
        {/* Top Header: Airline, Flight No., Rating, Status */}
        <div className="ticket-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="airline-badge-icon">
              <Plane size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="airline-name">{flight.airline}</span>
                <span className="flight-number">[{flight.flight_number || 'FL-100'}]</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                {flight.avg_rating > 0 && (
                  <span className="rating-pill">
                    <Star size={11} fill="currentColor" />
                    {parseFloat(flight.avg_rating).toFixed(1)}
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {departDate.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isSoldOut ? (
              <span className="badge badge-cancelled">Sold Out</span>
            ) : isFewSeats ? (
              <span className="badge badge-pending">Only {availableSeats} left</span>
            ) : (
              <span className="badge badge-confirmed">Available</span>
            )}
          </div>
        </div>

        {/* Route Row: Origin ➔ Dotted Flight Line with Plane ➔ Destination */}
        <div className="ticket-route-row">
          {/* Departure */}
          <div className="route-node origin">
            <span className="airport-code">{flight.origin}</span>
            <span className="time-display">{departTimeStr}</span>
            <span className="node-label">Departure</span>
          </div>

          {/* Dotted Route with Plane */}
          <div className="route-path-container">
            <span className="duration-pill">
              <Clock size={11} />
              {formatDuration(flight.duration_minutes)}
            </span>
            <div className="dotted-flight-line">
              <Plane size={14} className="flight-route-plane" />
            </div>
            <span className="route-type-label">Non-stop Flight</span>
          </div>

          {/* Arrival */}
          <div className="route-node destination">
            <span className="airport-code">{flight.destination}</span>
            <span className="time-display">{arriveTimeStr}</span>
            <span className="node-label">Arrival</span>
          </div>
        </div>

        {/* Bottom Bar: Details Toggle & Badges */}
        <div className="ticket-footer-bar">
          <button
            type="button"
            className="expand-details-btn"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            <span>{expanded ? 'Hide flight details' : 'Flight details & baggage'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="feature-chip">
              <Luggage size={12} /> Carry-on included
            </span>
            <span className="feature-chip">
              <Zap size={12} style={{ color: 'var(--primary)' }} /> Instant Hold
            </span>
          </div>
        </div>

        {/* Expandable Details Drawer */}
        {expanded && (
          <div className="ticket-expanded-panel">
            <div className="expanded-grid">
              <div className="expanded-col">
                <span className="expanded-heading">Baggage Allowance</span>
                <ul className="expanded-list">
                  <li>
                    <Check size={13} style={{ color: 'var(--success)' }} />
                    <span>1 Personal item (laptop / handbag)</span>
                  </li>
                  <li>
                    <Check size={13} style={{ color: 'var(--success)' }} />
                    <span>1 Cabin bag (up to 10kg, 55x40x20cm)</span>
                  </li>
                  <li>
                    <Check size={13} style={{ color: 'var(--success)' }} />
                    <span>Checked baggage available at checkout</span>
                  </li>
                </ul>
              </div>

              <div className="expanded-col">
                <span className="expanded-heading">Flight Amenities & Policies</span>
                <ul className="expanded-list">
                  <li>
                    <Coffee size={13} style={{ color: 'var(--secondary)' }} />
                    <span>Complimentary snacks & beverages</span>
                  </li>
                  <li>
                    <ShieldCheck size={13} style={{ color: 'var(--primary)' }} />
                    <span>Protected by Saga choreography</span>
                  </li>
                  <li>
                    <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                    <span>10-Minute Redis seat hold with zero overbooking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Perforated Divider */}
      <div className="ticket-perforation">
        <div className="notch top" />
        <div className="tear-line" />
        <div className="notch bottom" />
      </div>

      {/* Ticket Right Stub */}
      <div className="ticket-stub">
        <div className="stub-price-section">
          <span className="stub-label">Price per traveler</span>
          <div className="stub-price">
            ${parseFloat(flight.price).toFixed(0)}
          </div>
          <span className="stub-taxes">Includes all taxes & fees</span>
        </div>

        <div className="stub-actions">
          {isAuthenticated && (
            <button
              type="button"
              onClick={(e) => onToggleWishlist(flight.id, e)}
              className={`stub-wishlist-btn ${isWishlisted ? 'active' : ''}`}
              title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-label="Wishlist toggle"
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          )}

          <Link
            to={`/flights/${flight.id}`}
            className={`btn ${isSoldOut ? 'btn-secondary disabled' : 'btn-accent'}`}
            style={{ width: '100%', padding: '0.65rem 0.75rem', fontSize: '0.9rem' }}
          >
            {isSoldOut ? 'Sold Out' : 'Select Flight'}
          </Link>
        </div>
      </div>
    </div>
  );
}
