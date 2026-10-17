import React from 'react';
import {
  Plane,
  Download,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Tag,
} from 'lucide-react';

export default function BoardingPass({
  booking,
  flightDetails,
  traveler,
  onDownloadTicket,
  onAddToCalendar,
  isDownloading,
}) {
  if (!booking) return null;

  // Derive flight info from either flightDetails or first flight item in booking
  const flightItem = booking.items?.find(
    (item) => (item.item_type || item.itemType) === 'FLIGHT'
  );

  const airline = flightDetails?.airline || 'TravelGo Airways';
  const flightNumber =
    flightDetails?.flight_number ||
    (flightItem ? `TG-${flightItem.item_id || flightItem.itemId}` : 'TG-740');
  const origin = flightDetails?.origin || 'NYC';
  const destination = flightDetails?.destination || 'PAR';
  const passengerName =
    traveler?.full_name || traveler?.fullName || 'Valued Traveler';
  const seatNumber = traveler?.seat_no || traveler?.seatNo || '12B';
  const ticketNumber = booking.ticket_number || `ETKT-${booking.id?.slice(0, 8).toUpperCase()}`;

  const departureDate = flightDetails?.departs_at
    ? new Date(flightDetails.departs_at)
    : flightItem?.date_from
    ? new Date(flightItem.date_from)
    : new Date(booking.created_at);

  const arrivalDate = flightDetails?.arrives_at
    ? new Date(flightDetails.arrives_at)
    : flightItem?.date_to
    ? new Date(flightItem.date_to)
    : new Date(departureDate.getTime() + 4 * 3600 * 1000);

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) =>
    date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Calculate boarding time (45 mins prior to departure)
  const boardingTime = new Date(departureDate.getTime() - 45 * 60 * 1000);

  return (
    <div className="boarding-pass-wrapper">
      <div className="boarding-pass-card">
        {/* Main Boarding Pass Section */}
        <div className="bp-main">
          {/* Top Brand Bar */}
          <div className="bp-top-bar">
            <div className="bp-airline-group">
              <div className="bp-airline-icon">
                <Plane size={20} />
              </div>
              <div>
                <span className="bp-airline-title">{airline}</span>
                <span className="bp-doc-type">BOARDING PASS &bull; ELECTRONIC TICKET</span>
              </div>
            </div>

            <div className="bp-header-tags">
              <span className="stamp-badge stamp-badge-teal">
                <ShieldCheck size={12} /> Confirmed
              </span>
              <span className="bp-class-pill">Economy Class</span>
            </div>
          </div>

          {/* Large Airport Code Route Banner */}
          <div className="bp-route-hero">
            <div className="bp-route-node origin">
              <span className="bp-code">{origin}</span>
              <span className="bp-city-label">{flightDetails?.originCity || origin}</span>
              <span className="bp-time-big">{formatTime(departureDate)}</span>
              <span className="bp-date-sub">{formatDate(departureDate)}</span>
            </div>

            <div className="bp-route-path">
              <span className="bp-flight-pill">
                <Plane size={13} /> {flightNumber}
              </span>
              <div className="bp-dotted-line">
                <Plane size={16} className="bp-path-plane" />
              </div>
              <span className="bp-duration-label">
                {flightDetails?.duration_minutes
                  ? `${Math.floor(flightDetails.duration_minutes / 60)}h ${
                      flightDetails.duration_minutes % 60
                    }m`
                  : 'Direct Flight'}
              </span>
            </div>

            <div className="bp-route-node destination">
              <span className="bp-code">{destination}</span>
              <span className="bp-city-label">{flightDetails?.destCity || destination}</span>
              <span className="bp-time-big">{formatTime(arrivalDate)}</span>
              <span className="bp-date-sub">{formatDate(arrivalDate)}</span>
            </div>
          </div>

          {/* Passenger Information Grid */}
          <div className="bp-meta-grid">
            <div className="bp-meta-item">
              <span className="bp-meta-label">PASSENGER NAME</span>
              <span className="bp-meta-value highlight">{passengerName}</span>
            </div>

            <div className="bp-meta-item">
              <span className="bp-meta-label">FLIGHT NO.</span>
              <span className="bp-meta-value">{flightNumber}</span>
            </div>

            <div className="bp-meta-item">
              <span className="bp-meta-label">BOARDING TIME</span>
              <span className="bp-meta-value text-accent">{formatTime(boardingTime)}</span>
            </div>

            <div className="bp-meta-item">
              <span className="bp-meta-label">GATE</span>
              <span className="bp-meta-value">B12</span>
            </div>

            <div className="bp-meta-item">
              <span className="bp-meta-label">SEAT</span>
              <span className="bp-meta-value seat-badge">{seatNumber}</span>
            </div>

            <div className="bp-meta-item">
              <span className="bp-meta-label">E-TICKET NUMBER</span>
              <span className="bp-meta-value font-mono">{ticketNumber}</span>
            </div>
          </div>

          {/* Bottom Micro Details */}
          <div className="bp-sub-footer">
            <span className="bp-notice">
              Please arrive at gate B12 at least 30 minutes before departure. Carry valid passport & photo ID.
            </span>
          </div>
        </div>

        {/* Perforation Line with notches */}
        <div className="bp-perforation">
          <div className="bp-notch top" />
          <div className="bp-tear-line" />
          <div className="bp-notch bottom" />
        </div>

        {/* Boarding Pass Right Stub */}
        <div className="bp-stub">
          <div className="bp-stub-header">
            <span className="bp-stub-title">BOARDING PASS</span>
            <span className="bp-stub-airline">{airline}</span>
          </div>

          <div className="bp-stub-content">
            <div className="bp-stub-row">
              <span className="bp-stub-label">PASSENGER</span>
              <span className="bp-stub-val">{passengerName}</span>
            </div>

            <div className="bp-stub-row-split">
              <div>
                <span className="bp-stub-label">FLIGHT</span>
                <span className="bp-stub-val">{flightNumber}</span>
              </div>
              <div>
                <span className="bp-stub-label">GATE</span>
                <span className="bp-stub-val">B12</span>
              </div>
              <div>
                <span className="bp-stub-label">SEAT</span>
                <span className="bp-stub-val seat-badge-sm">{seatNumber}</span>
              </div>
            </div>

            <div className="bp-stub-row-split">
              <div>
                <span className="bp-stub-label">FROM</span>
                <span className="bp-stub-val">{origin}</span>
              </div>
              <div>
                <span className="bp-stub-label">TO</span>
                <span className="bp-stub-val">{destination}</span>
              </div>
              <div>
                <span className="bp-stub-label">TIME</span>
                <span className="bp-stub-val">{formatTime(departureDate)}</span>
              </div>
            </div>

            {/* Stylized Barcode Graphic */}
            <div className="bp-barcode-container">
              <div className="bp-barcode-bars" aria-hidden="true" />
              <span className="bp-barcode-text font-mono">{ticketNumber}</span>
            </div>
          </div>

          {/* Stub Actions */}
          <div className="bp-stub-actions">
            <button
              type="button"
              onClick={onDownloadTicket}
              disabled={isDownloading}
              className="btn btn-primary bp-action-btn"
              title="Download official PDF e-ticket"
            >
              <Download size={14} />
              {isDownloading ? 'Downloading...' : 'E-Ticket PDF'}
            </button>

            {onAddToCalendar && (
              <button
                type="button"
                onClick={onAddToCalendar}
                className="btn btn-secondary bp-action-btn"
                title="Add trip to Google Calendar, Apple Calendar, or Outlook"
              >
                <Calendar size={14} />
                <span>Add to Calendar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
