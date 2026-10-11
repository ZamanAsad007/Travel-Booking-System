import React from 'react';
import { Award, Crown, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function LoyaltyCard({ account, tierInfo }) {
  if (!account) return null;

  const tier = (account.tier || 'BRONZE').toUpperCase();
  const balance = account.points_balance || 0;
  const lifetime = account.lifetime_points || 0;
  const { nextTier, pointsToNextTier, progressPercentage } = tierInfo || {
    nextTier: 'SILVER',
    pointsToNextTier: 500,
    progressPercentage: 0,
  };

  const getTierTheme = () => {
    switch (tier) {
      case 'GOLD':
        return {
          gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
          badgeBg: '#fef3c7',
          badgeColor: '#92400e',
          accent: '#fbbf24',
          perks: ['1.5x Points Multiplier', 'Complimentary Room Upgrades', '24/7 VIP Concierge'],
        };
      case 'SILVER':
        return {
          gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #64748b 100%)',
          badgeBg: '#e2e8f0',
          badgeColor: '#0f172a',
          accent: '#94a3b8',
          perks: ['1.2x Points Multiplier', 'Priority Check-in', 'Free Cancellation Flexibility'],
        };
      case 'BRONZE':
      default:
        return {
          gradient: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #9a3412 100%)',
          badgeBg: '#ffedd5',
          badgeColor: '#7c2d12',
          accent: '#fdba74',
          perks: ['Earn 1 pt per $10 spent', '100 Welcome Points', 'Access to Member Only Deals'],
        };
    }
  };

  const theme = getTierTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Visual Loyalty Card */}
      <div
        style={{
          background: theme.gradient,
          borderRadius: '20px',
          padding: '2rem',
          color: '#fff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            opacity: 0.12,
            transform: 'rotate(15deg)',
          }}
        >
          {tier === 'GOLD' ? <Crown size={220} /> : <Award size={220} />}
        </div>

        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {tier === 'GOLD' ? <Crown size={24} color="#fef08a" /> : <Sparkles size={24} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>
                TravelGo Club
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Member Rewards</div>
            </div>
          </div>

          <div
            style={{
              background: theme.badgeBg,
              color: theme.badgeColor,
              padding: '0.35rem 0.9rem',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {tier} TIER
          </div>
        </div>

        {/* Balance & Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.25rem' }}>Available Balance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
              {balance.toLocaleString()} <span style={{ fontSize: '1.1rem', fontWeight: 600, opacity: 0.9 }}>pts</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.25rem' }}>Lifetime Earned</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginTop: '0.4rem' }}>
              {lifetime.toLocaleString()} <span style={{ fontSize: '0.95rem', fontWeight: 500, opacity: 0.85 }}>pts</span>
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            <span>
              {nextTier
                ? `${pointsToNextTier.toLocaleString()} pts to reach ${nextTier}`
                : 'Top Tier Status Achieved 🎉'}
            </span>
            <span>{progressPercentage}%</span>
          </div>
          <div
            style={{
              height: '8px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercentage}%`,
                background: theme.accent,
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tier Perks Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <TrendingUp size={20} color="#2563eb" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Your {tier} Privileges</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {theme.perks.map((perk, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
