import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

/**
 * EmptyState component for travel-themed zero-state views.
 *
 * @param {React.ComponentType} [icon=Compass] - Lucide icon component to display
 * @param {string} [title='No items found'] - Primary headline
 * @param {string} [description] - Detailed explanation or guidance
 * @param {string} [actionText] - Label for primary CTA button
 * @param {string} [actionLink] - Route path if CTA is a navigation link
 * @param {() => void} [onAction] - Click handler if CTA is a button
 * @param {string} [className=''] - Additional CSS classes
 */
export default function EmptyState({
  icon: Icon = Compass,
  title = 'No items found',
  description = 'Try adjusting your search criteria, dates, or filters to discover available journeys.',
  actionText,
  actionLink,
  onAction,
  className = '',
}) {
  return (
    <div className={`empty-state-card ${className}`}>
      <div className="empty-state-icon">
        <Icon size={36} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {(actionText && (actionLink || onAction)) && (
        <div style={{ marginTop: '1.25rem' }}>
          {actionLink ? (
            <Link to={actionLink} className="btn btn-primary">
              {actionText}
            </Link>
          ) : (
            <button type="button" onClick={onAction} className="btn btn-primary">
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
