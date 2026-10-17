import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { engagementApi } from '../api/engagement.js';
import LoyaltyCard from '../components/LoyaltyCard.jsx';
import { Award, History, ArrowUpRight, ArrowDownRight, Gift, HelpCircle } from 'lucide-react';

export default function LoyaltyPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await engagementApi.getLoyaltyProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error('Failed to load loyalty profile:', err);
      setError('Unable to load your rewards profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span className="stamp-badge stamp-badge-amber">
            <Award size={12} /> TravelGo Rewards
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--secondary)' }}>
          Loyalty Rewards Program
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Earn points on every flight and hotel booking, unlock VIP tiers, and redeem instant cash savings
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          Loading your loyalty status...
        </div>
      ) : error ? (
        <div
          className="card"
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            borderColor: '#fca5a5',
          }}
        >
          {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Main Loyalty Card */}
          <LoyaltyCard account={profile?.account} tierInfo={profile?.tierInfo} />

          {/* Points Ledger / Transaction History */}
          <div
            className="card"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--secondary)' }}>
                  Points Activity Ledger
                </h3>
              </div>
              <span className="stamp-badge stamp-badge-navy" style={{ fontSize: '0.72rem' }}>
                {profile?.ledger?.length || 0} transaction{profile?.ledger?.length === 1 ? '' : 's'}
              </span>
            </div>

            {(!profile?.ledger || profile.ledger.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Gift size={40} style={{ color: 'var(--border)', margin: '0 auto 0.75rem auto' }} />
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--secondary)' }}>No points activity recorded yet.</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Book your next flight or hotel to start earning points!
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6', color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Description</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Points</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.ledger.map((entry) => {
                      const isPositive = entry.points > 0;
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.85rem 0.5rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {formatDate(entry.created_at)}
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: '#1f2937' }}>
                            {entry.reason}
                            {entry.booking_id && (
                              <div style={{ fontSize: '0.8rem', fontWeight: 400, color: '#6b7280' }}>
                                Ref: #{entry.booking_id.slice(0, 8)}
                              </div>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '0.85rem 0.5rem',
                              textAlign: 'right',
                              fontWeight: 700,
                              color: isPositive ? '#16a34a' : '#dc2626',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {isPositive ? `+${entry.points}` : entry.points} pts
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', color: '#4b5563', fontWeight: 600 }}>
                            {entry.balance_after?.toLocaleString()} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* How It Works Section */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <HelpCircle size={20} color="#64748b" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                How the Rewards Program Works
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: '0.25rem' }}>1. Welcome Bonus</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Get 100 free points credited immediately upon joining TravelGo Club.
                </div>
              </div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: '0.25rem' }}>2. Earn Every Trip</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Earn 1 loyalty point for every $10 spent on confirmed flight and hotel bookings.
                </div>
              </div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: '0.25rem' }}>3. Tier Progression</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Reach 500 lifetime points for Silver and 2,000 for Gold to unlock higher point multipliers.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
