import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = 18,
  interactive = false,
  onChange,
}) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const isFilled = displayRating >= starValue;
        const isHalf = !isFilled && displayRating >= starValue - 0.5;

        return (
          <span
            key={index}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              display: 'inline-flex',
              alignItems: 'center',
              color: isFilled || isHalf ? '#f59e0b' : '#d1d5db',
              transition: 'transform 0.1s ease',
            }}
            onClick={() => interactive && onChange && onChange(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <Star
              size={size}
              fill={isFilled ? '#f59e0b' : isHalf ? 'url(#halfStar)' : 'none'}
              stroke="#f59e0b"
            />
          </span>
        );
      })}
    </div>
  );
}
