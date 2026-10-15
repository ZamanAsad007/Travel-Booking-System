import React, { useState, useEffect, useRef } from 'react';
import { catalogApi } from '../api/catalog.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { MapPin, Plane, Hotel, Building2, Check } from 'lucide-react';

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Type to search...',
  label,
  icon: Icon = MapPin,
  filterType = null, // 'airport' | 'city' | null
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    let active = true;
    if (!debouncedQuery || debouncedQuery.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    catalogApi
      .suggest(debouncedQuery.trim())
      .then((res) => {
        if (!active) return;
        let list = res.data?.suggestions || [];
        if (filterType) {
          list = list.filter((s) => s.type === filterType || (filterType === 'city' && s.type === 'hotel'));
        }
        setSuggestions(list);
      })
      .catch(() => {
        if (active) setSuggestions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, filterType]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setOpen(true);
  };

  const handleSelect = (item) => {
    const selectedVal = item.code || item.name || item.text;
    setQuery(selectedVal);
    onSelect(selectedVal, item);
    setOpen(false);
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'airport':
        return <Plane size={14} style={{ color: 'var(--primary)' }} />;
      case 'hotel':
        return <Hotel size={14} style={{ color: 'var(--secondary)' }} />;
      case 'airline':
        return <Plane size={14} style={{ color: '#d97706' }} />;
      case 'city':
      default:
        return <Building2 size={14} style={{ color: '#059669' }} />;
    }
  };

  return (
    <div className="form-group" style={{ position: 'relative', marginBottom: 0 }} ref={containerRef}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          style={{ paddingLeft: '2.2rem' }}
        />
        <div
          style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Icon size={16} />
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            zIndex: 50,
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(item)}
              style={{
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border-subtle, #f1f5f9)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--sand)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getItemIcon(item.type)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {item.text || item.name}
                  </div>
                  {item.city && item.city !== item.name && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.city} {item.country ? `• ${item.country}` : ''}
                    </div>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--sand-dark)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                {item.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
