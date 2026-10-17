import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';

export default function FareStrip({
  currentDate,
  onSelectDate,
  basePrice = 380,
}) {
  // Normalize today to start of day
  const getToday = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  };

  const computeInitialStart = (targetDateStr) => {
    const today = getToday();
    if (!targetDateStr) return today;
    const target = new Date(targetDateStr + 'T00:00:00');
    if (isNaN(target.getTime()) || target < today) return today;

    // Center window slightly around target if target is in the future
    const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) {
      return today;
    }
    const start = new Date(target);
    start.setDate(target.getDate() - 3);
    return start < today ? today : start;
  };

  const [windowStart, setWindowStart] = useState(() => computeInitialStart(currentDate));

  // Sync window when currentDate changes externally
  useEffect(() => {
    if (currentDate) {
      const today = getToday();
      const target = new Date(currentDate + 'T00:00:00');
      if (!isNaN(target.getTime())) {
        const windowEnd = new Date(windowStart);
        windowEnd.setDate(windowStart.getDate() + 6);

        // If target is outside current 7-day window, re-center window
        if (target < windowStart || target > windowEnd) {
          setWindowStart(computeInitialStart(currentDate));
        }
      }
    }
  }, [currentDate]);

  const today = getToday();
  const isPrevDisabled = windowStart <= today;

  const handlePrevWeek = () => {
    setWindowStart((prev) => {
      const prevWeek = new Date(prev);
      prevWeek.setDate(prev.getDate() - 7);
      return prevWeek < today ? today : prevWeek;
    });
  };

  const handleNextWeek = () => {
    setWindowStart((prev) => {
      const nextWeek = new Date(prev);
      nextWeek.setDate(prev.getDate() + 7);
      return nextWeek;
    });
  };

  // Generate 7 consecutive days starting from windowStart
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(windowStart);
    d.setDate(windowStart.getDate() + i);

    const isToday = d.getTime() === today.getTime();
    const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const dayDelta = Math.sin(d.getDate() * 1.5) * 20;
    const estimatedPrice = Math.round(basePrice + (isWeekend ? 35 : -15) + dayDelta);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isSelected = currentDate === dateStr;

    days.push({
      dateStr,
      isToday,
      dayName: isToday ? 'Today' : d.toLocaleDateString([], { weekday: 'short' }),
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)' }}>
            <Calendar size={15} style={{ color: 'var(--primary)' }} />
            <span>7-Day Fare Calendar</span>
          </div>
          {currentDate ? (
            <span
              className="stamp-badge"
              style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.5rem',
                backgroundColor: 'var(--primary-light)',
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
                textTransform: 'none',
              }}
            >
              Selected: {new Date(currentDate + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <TrendingDown size={13} style={{ color: 'var(--success)' }} />
              <span>Select a date to filter flights</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', height: '28px' }}
              onClick={handlePrevWeek}
              disabled={isPrevDisabled}
              title="Previous 7 Days"
              aria-label="Previous 7 Days"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', height: '28px' }}
              onClick={handleNextWeek}
              title="Next 7 Days"
              aria-label="Next 7 Days"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          {currentDate && (
            <button
              type="button"
              onClick={() => onSelectDate('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.2rem 0.35rem',
              }}
            >
              All Dates
            </button>
          )}
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
