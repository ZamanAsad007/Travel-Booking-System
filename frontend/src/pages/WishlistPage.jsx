import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { engagementApi } from '../api/engagement.js';
import { catalogApi } from '../api/catalog.js';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  Heart,
  Trash2,
  Plane,
  Hotel,
  ArrowRight,
  Star,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [itemsDetails, setItemsDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'FLIGHT' | 'HOTEL'
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await engagementApi.getWishlist();
      const list = res?.data || [];
      setWishlist(list);

      // Fetch details for all unique items
      const details = {};
      await Promise.all(
        list.map(async (item) => {
          const type = (item.item_type || '').toLowerCase();
          try {
            if (type === 'flight') {
              const flightRes = await catalogApi.getFlightById(item.item_id);
              const flight = flightRes?.data?.flight || flightRes?.data;
              if (flight && flight.id) {
                details[item.item_id] = { ...flight, itemType: 'flight' };
              }
            } else if (type === 'hotel') {
              const hotelRes = await catalogApi.getHotelById(item.item_id);
              const hotel = hotelRes?.data?.hotel || hotelRes?.data;
              if (hotel && hotel.id) {
                const minRoomPrice =
                  hotel.rooms && hotel.rooms.length > 0
                    ? Math.min(...hotel.rooms.map((r) => parseFloat(r.price_per_night || 9999)))
                    : null;
                const startingPrice =
                  hotel.starting_price || minRoomPrice || hotel.min_price || hotel.price;
                details[item.item_id] = {
                  ...hotel,
                  starting_price: startingPrice,
                  itemType: 'hotel',
                };
              }
            }
          } catch (e) {
            console.warn(`Could not load details for ${item.item_type} ${item.item_id}:`, e.message);
          }
        })
      );

      setItemsDetails(details);
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
      setRemovingId(wishlistId);
      await engagementApi.removeFromWishlist(itemType, itemId, wishlistId);
      setWishlist((prev) => prev.filter((item) => item.id !== wishlistId));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const flightsCount = wishlist.filter(
    (item) => (item.item_type || '').toLowerCase() === 'flight'
  ).length;
  const hotelsCount = wishlist.filter(
    (item) => (item.item_type || '').toLowerCase() === 'hotel'
  ).length;

  const filteredItems = wishlist.filter((item) => {
    if (activeTab === 'ALL') return true;
    return (item.item_type || '').toUpperCase() === activeTab;
  });

  return (
    <div className="container" style={{ maxWidth: '1200px', padding: '2rem 1.5rem 5rem' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="stamp-badge stamp-badge-coral">
            <Heart size={12} fill="currentColor" /> Saved Destinations
          </span>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--secondary)' }}>
          My Wishlist
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px' }}>
          Keep track of your dream flights and handpicked luxury hotels for upcoming journeys
        </p>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          borderBottom: '2px solid var(--border)',
          marginBottom: '2.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
        }}
      >
        {[
          { key: 'ALL', label: 'All Saved', count: wishlist.length },
          { key: 'FLIGHT', label: 'Flights', count: flightsCount },
          { key: 'HOTEL', label: 'Hotels', count: hotelsCount },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: isActive ? 'var(--secondary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 1.1rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--sand-dark)',
                  color: isActive ? '#FFFFFF' : 'var(--text-main)',
                  borderRadius: '9999px',
                  padding: '0.1rem 0.5rem',
                  fontSize: '0.72rem',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid-3" style={{ gap: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="card"
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <Skeleton height="160px" variant="rectangular" style={{ borderRadius: 'var(--radius-md)' }} />
              <Skeleton height="20px" width="60%" />
              <Skeleton height="16px" width="85%" />
              <Skeleton height="28px" width="40%" style={{ marginTop: '0.5rem' }} />
              <Skeleton height="40px" variant="rectangular" style={{ borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }} />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={
            activeTab === 'ALL'
              ? 'Your wishlist is currently empty'
              : `No saved ${activeTab.toLowerCase()}s found`
          }
          description={
            activeTab === 'ALL'
              ? 'Browse scheduled flights and five-star luxury hotels, then click the heart icon to save your favorites here!'
              : `You have no ${activeTab.toLowerCase()}s saved to your wishlist yet.`
          }
          actionText={activeTab === 'HOTEL' ? 'Search Hotels' : 'Search Flights'}
          actionLink={activeTab === 'HOTEL' ? '/hotels' : '/flights'}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: '1.75rem',
          }}
        >
          {filteredItems.map((item) => {
            const isFlight = (item.item_type || '').toLowerCase() === 'flight';
            const detail = itemsDetails[item.item_id];
            const isRemoving = removingId === item.id;

            return (
              <div
                key={item.id}
                className="card card-hover"
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: isRemoving ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
              >
                <div>
                  {/* Top Media / Header Area */}
                  {isFlight ? (
                    <div
                      style={{
                        padding: '1.25rem 1.25rem 0.75rem',
                        background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(11, 37, 69, 0.04) 100%)',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span className="stamp-badge stamp-badge-teal">
                        <Plane size={12} /> Scheduled Flight
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id, item.item_type, item.item_id)}
                        disabled={isRemoving}
                        style={{
                          background: 'rgba(255, 255, 255, 0.85)',
                          border: '1px solid var(--border)',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-full)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                        title="Remove from wishlist"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden', backgroundColor: 'var(--sand)' }}>
                      {detail?.image_url ? (
                        <img
                          src={detail.image_url}
                          alt={detail.name || 'Hotel'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(11, 37, 69, 0.08) 0%, rgba(15, 118, 110, 0.05) 100%)',
                            color: 'var(--primary)',
                          }}
                        >
                          <Hotel size={48} opacity={0.6} />
                        </div>
                      )}

                      <div
                        style={{
                          position: 'absolute',
                          top: '0.85rem',
                          left: '0.85rem',
                        }}
                      >
                        <span className="stamp-badge stamp-badge-navy">
                          <Hotel size={12} /> Hotel Stay
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id, item.item_type, item.item_id)}
                        disabled={isRemoving}
                        style={{
                          position: 'absolute',
                          top: '0.85rem',
                          right: '0.85rem',
                          background: 'rgba(255, 255, 255, 0.92)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(0,0,0,0.08)',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-full)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        title="Remove from wishlist"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 size={15} />
                      </button>

                      {detail?.city && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0.75rem',
                            left: '0.85rem',
                            background: 'rgba(11, 37, 69, 0.85)',
                            backdropFilter: 'blur(4px)',
                            color: '#FFFFFF',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <MapPin size={12} />
                          <span>{detail.city}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body Content */}
                  <div style={{ padding: '1.25rem' }}>
                    {detail ? (
                      <div>
                        {isFlight ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--secondary)' }}>
                                  {detail.airline}
                                </h3>
                                {detail.flight_number && (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    Flight {detail.flight_number}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Route Display */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 0',
                                margin: '0.5rem 0 0.85rem',
                                borderTop: '1px solid var(--border)',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <div style={{ textAlign: 'left' }}>
                                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--secondary)', display: 'block' }}>
                                  {detail.origin}
                                </span>
                              </div>

                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <span style={{ height: '1.5px', width: '100%', background: 'var(--border)', position: 'relative' }}>
                                  <Plane
                                    size={14}
                                    style={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%) rotate(90deg)',
                                      color: 'var(--primary)',
                                    }}
                                  />
                                </span>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--secondary)', display: 'block' }}>
                                  {detail.destination}
                                </span>
                              </div>
                            </div>

                            {detail.departs_at && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                                <Calendar size={13} style={{ color: 'var(--primary)' }} />
                                <span>
                                  {new Date(detail.departs_at).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}{' '}
                                  at{' '}
                                  {new Date(detail.departs_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            )}

                            <div style={{ marginTop: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                                Fare Price
                              </span>
                              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                                ${parseFloat(detail.price || 0).toFixed(2)}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--secondary)' }}>
                                {detail.name}
                              </h3>
                              {detail.rating && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: '#b45309',
                                    background: '#fef3c7',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: 'var(--radius-sm)',
                                  }}
                                >
                                  <Star size={13} fill="#b45309" />
                                  {parseFloat(detail.rating).toFixed(1)}
                                </span>
                              )}
                            </div>

                            {detail.address && (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0.85rem' }}>
                                {detail.address}
                              </p>
                            )}

                            {detail.free_cancellation && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <span className="stamp-badge stamp-badge-teal" style={{ fontSize: '0.7rem' }}>
                                  <ShieldCheck size={11} /> Free Cancellation Available
                                </span>
                              </div>
                            )}

                            <div style={{ marginTop: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                                Starting from
                              </span>
                              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                                ${parseFloat(detail.starting_price || 120).toFixed(0)}{' '}
                                <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ night</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Saved {isFlight ? 'Flight' : 'Hotel'} • #{item.item_id.slice(0, 8)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action CTA */}
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  <Link
                    to={isFlight ? `/flights/${item.item_id}` : `/hotels/${item.item_id}`}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.9rem',
                      padding: '0.65rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>{isFlight ? 'Book Flight' : 'View Hotel Rooms'}</span>
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
