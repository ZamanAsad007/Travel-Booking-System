import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';

export default function FareStrip({
  currentDate,
  onSelectDate,
  basePrice = 380,
}) {
  // Use current date or today as reference
  const baseDateObj = currentDate ? new Date(currentDate) : new Date();

  // Generate 7 days: 3 days prior, selected day, 3 days after
  const days = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(baseDateObj);
    d.setDate(baseDateObj.getDate() + offset);

    // Deterministic price estimation based on day of week and offset
    const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const dayDelta = Math.sin(offset + d.getDate()) * 25;
    const estimatedPrice = Math.round(basePrice + (isWeekend ? 35 : -15) + dayDelta);

    const dateStr = d.toISOString().split('T')[0];
    const isSelected = currentDate === dateStr;

    days.push({
      dateStr,
      dayName: d.toLocaleDateString([], { weekday: 'short' }),
      dateLabel: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      price: Math.max(120, estimatedPrice),
      isSelected,
    });
  }

  // Find lowest price index among the 7 days
  const minPrice = Math.min(...days.map((item) => item.price));

  return (
    <div className="fare-strip-container">
      <div className="fare-strip-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--secondary)' }}>
          <Calendar size={14} style={{ color: 'var(--primary)' }} />
          <span>7-Day Fare Calendar</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <TrendingDown size={13} style={{ color: 'var(--success)' }} />
          <span>Select a date to view available flights</span>
        </div>
      </div>

      <div className="fare-strip-row">
        {days.map((item) => {
          const isCheapest = item.price === minPrice;

          return (
            <button
              key={item.dateStr}
              type="button"
              className={`fare-strip-day ${item.isSelected ? 'selected' : ''} ${isCheapest ? 'is-cheapest' : ''}`}
              onClick={() => onSelectDate(item.dateStr)}
              aria-pressed={item.isSelected}
            >
              {isCheapest && (
                <span className="cheapest-indicator">Best Fare</span>
              )}
              <span className="day-name">{item.dayName}</span>
              <span className="date-number">{item.dateLabel}</span>
              <span className="day-price">${item.price}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
