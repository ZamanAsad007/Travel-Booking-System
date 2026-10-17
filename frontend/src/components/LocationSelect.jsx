import React from 'react';
import { AIRPORTS, HOTEL_CITIES } from '../constants/locations.js';
import { ChevronDown, MapPin, Plane, Hotel } from 'lucide-react';

/**
 * Reusable Location Dropdown Select component.
 * Restores the location dropdown system for airport and hotel city selections
 * with high-contrast labels, icons, and accessible focus states.
 */
export default function LocationSelect({
  type = 'airport', // 'airport' | 'city'
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  name,
  id,
  ariaLabel,
}) {
  const options =
    type === 'city'
      ? HOTEL_CITIES.map((c) => ({ value: c.value, label: c.label }))
      : AIRPORTS.map((a) => ({ value: a.code, label: a.name }));

  const defaultPlaceholder =
    placeholder || (type === 'city' ? 'All Cities / Destinations' : 'All Locations');

  const FallbackIcon = type === 'city' ? Hotel : Plane;
  const ActiveIcon = Icon || FallbackIcon;

  return (
    <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: 'relative', width: '100%' }}>
        <div
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <ActiveIcon size={16} />
        </div>

        <select
          id={id}
          name={name}
          className="form-input form-select"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel || label || defaultPlaceholder}
          style={{
            paddingLeft: '2.4rem',
            paddingRight: '2.2rem',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            cursor: 'pointer',
            backgroundColor: 'var(--surface)',
            color: value ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: value ? 600 : 400,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <option value="">{defaultPlaceholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div
          style={{
            position: 'absolute',
            right: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}
