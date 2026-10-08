import React from 'react';
import { Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();

  switch (normalized) {
    case 'PENDING':
      return (
        <span className="badge badge-pending">
          <Clock size={12} className="animate-spin" />
          Pending
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className="badge badge-confirmed">
          <CheckCircle2 size={12} />
          Confirmed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="badge badge-cancelled">
          <XCircle size={12} />
          Cancelled
        </span>
      );
    case 'REFUNDED':
      return (
        <span className="badge badge-refunded">
          <RefreshCw size={12} />
          Refunded
        </span>
      );
    default:
      return <span className="badge">{status}</span>;
  }
}
