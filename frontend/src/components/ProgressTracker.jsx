import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  Zap,
  Mail,
  RefreshCw,
  CreditCard,
  Check,
} from 'lucide-react';

export default function ProgressTracker({ booking, connectionState, liveEvent }) {
  if (!booking) return null;

  const status = booking.status;
  const isPending = status === 'PENDING';
  const isConfirmed = status === 'CONFIRMED';
  const isCancelled = status === 'CANCELLED';

  // Determine current step (1: Hold, 2: Payment, 3: Confirmed)
  let step1State = 'done'; // Created is always done once booking exists
  let step2State = isPending ? 'active' : isConfirmed ? 'done' : 'error';
  let step3State = isConfirmed ? 'done' : isCancelled ? 'error' : 'waiting';

  return (
    <div className="progress-tracker-card">
      <div className="progress-tracker-header">
        <div className="tracker-header-left">
          <span className="tracker-eyebrow">Choreographed Saga Pipeline</span>
          <h3 className="tracker-title">Booking Progress</h3>
        </div>

        <div className="tracker-live-indicator">
          {connectionState === 'connected' ? (
            <span className="live-pill active">
              <span className="pulse-dot" />
              <span>Live SSE Stream</span>
            </span>
          ) : connectionState === 'polling_fallback' ? (
            <span className="live-pill fallback">
              <RefreshCw size={12} className="animate-spin" />
              <span>Polling Fallback</span>
            </span>
          ) : (
            <span className="live-pill idle">
              <span className="status-dot-idle" />
              <span>Connecting...</span>
            </span>
          )}
        </div>
      </div>

      <div className="tracker-steps-container">
        {/* Connecting Line */}
        <div className="tracker-line-track">
          <div
            className={`tracker-line-fill ${
              isConfirmed ? 'w-100' : isPending ? 'w-50' : 'w-50 error'
            }`}
          />
        </div>

        {/* Step 1: Hold */}
        <div className="tracker-step done">
          <div className="step-circle">
            <CheckCircle2 size={18} />
          </div>
          <div className="step-content">
            <span className="step-number">Step 1</span>
            <span className="step-label">Inventory Hold</span>
            <span className="step-subtext">Reserved via Redis TTL</span>
          </div>
        </div>

        {/* Step 2: Payment */}
        <div className={`tracker-step ${step2State}`}>
          <div className="step-circle">
            {step2State === 'done' ? (
              <CheckCircle2 size={18} />
            ) : step2State === 'active' ? (
              <Clock size={18} className="animate-pulse" />
            ) : (
              <XCircle size={18} />
            )}
          </div>
          <div className="step-content">
            <span className="step-number">Step 2</span>
            <span className="step-label">Payment Capture</span>
            <span className="step-subtext">
              {step2State === 'done'
                ? 'Payment verified'
                : step2State === 'active'
                ? 'Capturing payment...'
                : 'Payment failed'}
            </span>
          </div>
        </div>

        {/* Step 3: Confirmed / Issued */}
        <div className={`tracker-step ${step3State}`}>
          <div className="step-circle">
            {step3State === 'done' ? (
              <CheckCircle2 size={18} />
            ) : step3State === 'error' ? (
              <XCircle size={18} />
            ) : (
              <Mail size={18} />
            )}
          </div>
          <div className="step-content">
            <span className="step-number">Step 3</span>
            <span className="step-label">E-Ticket & Email</span>
            <span className="step-subtext">
              {step3State === 'done'
                ? 'Issued & dispatched'
                : step3State === 'error'
                ? 'Holds released'
                : 'Pending confirmation'}
            </span>
          </div>
        </div>
      </div>

      {liveEvent && (
        <div className="tracker-live-meta">
          <Zap size={14} style={{ color: 'var(--primary)' }} />
          <span>
            Last real-time event: <strong>{liveEvent.event || liveEvent.status}</strong>
            {liveEvent.timestamp && (
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                ({new Date(liveEvent.timestamp).toLocaleTimeString()})
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
