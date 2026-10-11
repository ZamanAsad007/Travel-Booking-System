import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { engagementApi } from '../api/engagement.js';
import { Bell, Trash2, CheckCircle2, AlertTriangle, ArrowRight, Plane, Hotel } from 'lucide-react';

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await engagementApi.getPriceAlerts();
      if (res.success && res.data) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error('Failed to load price alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await engagementApi.deletePriceAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete price alert:', err);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '12px', color: '#2563eb' }}>
          <Bell size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Price Drop Alerts</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>
            Get instantly notified via email whenever flight or hotel prices drop to your target rate
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading your price alerts...</div>
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <Bell size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No active price alerts</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Browse flights and hotels and click "Set Price Alert" on any detail page to track price drops!
          </p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.map((alert) => {
            const isTriggered = alert.status === 'TRIGGERED';
            const isFlight = alert.item_type?.toLowerCase() === 'flight';

            return (
              <div
                key={alert.id}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  border: `1px solid ${isTriggered ? '#a7f3d0' : '#e5e7eb'}`,
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '999px',
                        background: isFlight ? '#eff6ff' : '#f0fdf4',
                        color: isFlight ? '#1d4ed8' : '#15803d',
                      }}
                    >
                      {isFlight ? <Plane size={12} /> : <Hotel size={12} />}
                      {alert.item_type}
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: isTriggered ? '#ecfdf5' : '#fef3c7',
                        color: isTriggered ? '#065f46' : '#92400e',
                      }}
                    >
                      {isTriggered ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {isTriggered ? 'TRIGGERED (Discount reached!)' : 'ACTIVE (Watching)'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                    {alert.item_name || `${alert.item_type} #${alert.item_id}`}
                  </h3>

                  <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                    Target Price: <strong style={{ color: '#059669', fontSize: '1.05rem' }}>${parseFloat(alert.target_price).toFixed(2)}</strong>
                    <span style={{ color: '#9ca3af', marginLeft: '0.75rem' }}>
                      Created: {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Link
                    to={isFlight ? `/flights/${alert.item_id}` : `/hotels/${alert.item_id}`}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    View Item <ArrowRight size={14} />
                  </Link>

                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="btn btn-secondary"
                    style={{
                      color: '#ef4444',
                      borderColor: '#fee2e2',
                      background: '#fff',
                      padding: '0.5rem 0.75rem',
                    }}
                    title="Delete price alert"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
