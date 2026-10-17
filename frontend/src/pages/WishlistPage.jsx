import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { engagementApi } from '../api/engagement.js';
import { catalogApi } from '../api/catalog.js';
import { Heart, Trash2, Plane, Hotel, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [itemsDetails, setItemsDetails] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await engagementApi.getWishlist();
      if (res.success && res.data) {
        setWishlist(res.data);

        // Fetch detail for items
        const details = {};
        for (const item of res.data) {
          try {
            if (item.item_type?.toLowerCase() === 'flight') {
              const flightRes = await catalogApi.getFlightById(item.item_id);
              if (flightRes.success) details[item.item_id] = flightRes.data;
            } else if (item.item_type?.toLowerCase() === 'hotel') {
              const hotelRes = await catalogApi.getHotelById(item.item_id);
              if (hotelRes.success) details[item.item_id] = hotelRes.data;
            }
          } catch (e) {
            console.warn(`Could not load details for ${item.item_type} ${item.item_id}`);
          }
        }
        setItemsDetails(details);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (wishlistId, itemType, itemId) => {
    try {
      await engagementApi.removeFromWishlist(itemType, itemId, wishlistId);
      setWishlist((prev) => prev.filter((item) => item.id !== wishlistId));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fee2e2', padding: '0.75rem', borderRadius: '12px', color: '#ef4444' }}>
          <Heart size={28} fill="#ef4444" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My Saved Wishlist</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>Keep track of your dream flights and hotels for future adventures</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading your saved favorites...</div>
      ) : wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <Heart size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your wishlist is empty</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Explore flights and hotels to save your favorite destinations!</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/flights" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plane size={18} /> Search Flights
            </Link>
            <Link to="/hotels" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hotel size={18} /> Search Hotels
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {wishlist.map((item) => {
            const isFlight = item.item_type?.toLowerCase() === 'flight';
            const detail = itemsDetails[item.item_id];

            return (
              <div
                key={item.id}
                className="card card-hover"
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span className={`stamp-badge ${isFlight ? 'stamp-badge-teal' : 'stamp-badge-navy'}`}>
                      {isFlight ? <Plane size={12} /> : <Hotel size={12} />}
                      {item.item_type}
                    </span>

                    <button
                      onClick={() => handleRemove(item.id, item.item_type, item.item_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '6px',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      title="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {detail ? (
                    <div>
                      {isFlight ? (
                        <>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--secondary)' }}>
                            {detail.airline} [{detail.flight_number || 'FL'}]
                          </h3>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ color: 'var(--text-main)' }}>{detail.origin}</strong>
                            <span>&rarr;</span>
                            <strong style={{ color: 'var(--text-main)' }}>{detail.destination}</strong>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                            ${parseFloat(detail.price).toFixed(2)}
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--secondary)' }}>
                            {detail.name}
                          </h3>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                            {detail.city} &bull; Rating: {detail.rating || 4.8} ★
                          </div>
                          {detail.starting_price && (
                            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                              From ${parseFloat(detail.starting_price).toFixed(2)}{' '}
                              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ night</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Item ID: {item.item_id}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <Link
                    to={isFlight ? `/flights/${item.item_id}` : `/hotels/${item.item_id}`}
                    className="btn btn-accent"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', padding: '0.55rem' }}
                  >
                    <span>View & Book</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
