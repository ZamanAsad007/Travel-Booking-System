import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Hotel, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      <div className="hero-banner">
        <h1>Find Your Next Adventure</h1>
        <p>Book flights and premium hotel rooms seamlessly across top worldwide destinations.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <Link to="/flights" className="btn btn-secondary">
            <Plane size={18} />
            Search Flights
          </Link>
          <Link to="/hotels" className="btn btn-secondary">
            <Hotel size={18} />
            Search Hotels
          </Link>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '2rem' }}>
        <div className="card card-hover">
          <Plane className="text-primary" size={32} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Flights Anywhere</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Direct and connecting flights with real-time seat availability and instant confirmation.
          </p>
          <Link to="/flights" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <span>Explore Flights</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="card card-hover">
          <Hotel className="text-primary" size={32} style={{ color: 'var(--secondary)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Luxury Hotels & Suites</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Handpicked 4-star and 5-star hotels with deluxe suites, breakfast included, and free cancellation.
          </p>
          <Link to="/hotels" className="btn btn-primary" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--secondary)' }}>
            <span>Explore Hotels</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
