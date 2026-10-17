import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, ArrowUpRight } from 'lucide-react';

/**
 * DestinationCard component displaying trending travel destinations
 *
 * @param {string} city - City name (e.g. 'Tokyo')
 * @param {string} country - Country name (e.g. 'Japan')
 * @param {string} code - Airport code (e.g. 'HND')
 * @param {string} image - Background photograph URL
 * @param {number|string} price - Starting fare (e.g. 480)
 * @param {string} [tag] - Optional badge tag (e.g. 'Trending', 'Direct')
 */
export default function DestinationCard({
  city,
  country,
  code,
  image,
  price,
  tag = 'Popular',
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/flights?to=${code}`);
  };

  return (
    <div
      onClick={handleClick}
      className="destination-card"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="destination-image-container">
        <img
          src={image}
          alt={`${city}, ${country}`}
          className="destination-image"
          loading="lazy"
          decoding="async"
        />
        <div className="destination-gradient-overlay" />
        {tag && (
          <span className="destination-tag">
            {tag}
          </span>
        )}
        <div className="destination-arrow-icon">
          <ArrowUpRight size={18} />
        </div>
      </div>

      <div className="destination-content">
        <div>
          <div className="destination-city">
            {city}
            <span className="destination-code">[{code}]</span>
          </div>
          <div className="destination-country">{country}</div>
        </div>

        <div className="destination-price-box">
          <span className="destination-price-label">From</span>
          <span className="destination-price-amount">${price}</span>
        </div>
      </div>
    </div>
  );
}
