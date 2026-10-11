import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { engagementApi } from '../api/engagement.js';
import StarRating from './StarRating.jsx';
import { MessageSquare, CheckCircle, AlertCircle, Send } from 'lucide-react';

export default function ReviewList({ itemType, itemId, defaultEligibleBookingId = null }) {
  const { isAuthenticated } = useAuth();
  const [reviewsData, setReviewsData] = useState({ total: 0, avgRating: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [eligibleTrips, setEligibleTrips] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(defaultEligibleBookingId || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await engagementApi.getReviews(itemType, itemId);
      if (res.success && res.data) {
        setReviewsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleTrips = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await engagementApi.getEligibleReviewTrips();
      if (res.success && res.data) {
        const matching = res.data.filter(
          (t) =>
            t.item_type?.toLowerCase() === itemType?.toLowerCase() &&
            t.item_id === itemId &&
            !t.has_reviewed
        );
        setEligibleTrips(matching);
        if (matching.length > 0 && !selectedBookingId) {
          setSelectedBookingId(matching[0].booking_id);
        }
      }
    } catch (err) {
      console.error('Failed to load eligible trips:', err);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchEligibleTrips();
  }, [itemType, itemId, isAuthenticated]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setError('Please select a completed booking to review');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await engagementApi.createReview({
        bookingId: selectedBookingId,
        itemType,
        itemId,
        rating,
        comment,
      });
      setSuccess('Review submitted successfully! Thank you for your feedback.');
      setComment('');
      setShowForm(false);
      fetchReviews();
      fetchEligibleTrips();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={20} color="var(--primary-color)" />
            Customer Reviews ({reviewsData.total})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
            <StarRating rating={reviewsData.avgRating} size={18} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{reviewsData.avgRating.toFixed(1)}</span>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>out of 5</span>
          </div>
        </div>

        {isAuthenticated && eligibleTrips.length > 0 && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            Write a Review
          </button>
        )}
      </div>

      {success && (
        <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmitReview} style={{ padding: '1.25rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Share Your Experience</h4>

          {error && (
            <div style={{ padding: '0.6rem 0.8rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Select Verified Trip
            </label>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.5rem' }}
              required
            >
              {eligibleTrips.map((trip) => (
                <option key={trip.booking_id} value={trip.booking_id}>
                  Booking #{trip.booking_id.substring(0, 8)} (Completed {new Date(trip.completed_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Your Rating
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StarRating rating={rating} size={24} interactive onChange={(val) => setRating(val)} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rating} Stars</span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Your Comments
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike? How was the service?"
              rows={3}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={15} />
              {submitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading reviews...</div>
      ) : reviewsData.reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }}>
          No reviews yet for this {itemType}. {eligibleTrips.length > 0 ? 'Be the first verified traveler to leave one!' : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviewsData.reviews.map((rev) => (
            <div key={rev.id} style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rev.user_name || 'Verified Traveler'}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: '#059669', background: '#ecfdf5', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                    <CheckCircle size={12} /> Verified Traveler
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  {new Date(rev.created_at).toLocaleDateString()}
                </span>
              </div>
              <StarRating rating={rev.rating} size={15} />
              <p style={{ marginTop: '0.5rem', color: '#374151', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
