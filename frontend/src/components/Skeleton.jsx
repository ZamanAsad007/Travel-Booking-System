import React from 'react';

/**
 * Shimmer placeholder skeleton component for progressive loading states.
 *
 * @param {'text' | 'rectangular' | 'circular'} [variant='text'] - Shape of the skeleton
 * @param {string|number} [width] - Width of the element (e.g. '100%', 120, '4rem')
 * @param {string|number} [height] - Height of the element (e.g. '1.25rem', 40, '200px')
 * @param {number} [count=1] - Number of skeleton items to render sequentially
 * @param {string} [className=''] - Additional CSS classes
 * @param {React.CSSProperties} [style={}] - Inline styles
 */
export default function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  style = {},
}) {
  const items = Array.from({ length: Math.max(1, count) });

  return (
    <>
      {items.map((_, i) => (
        <span
          key={i}
          className={`skeleton skeleton-${variant} ${className}`}
          style={{
            width: width || (variant === 'circular' ? height || '40px' : '100%'),
            height: height || (variant === 'text' ? '1rem' : '100%'),
            ...style,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
