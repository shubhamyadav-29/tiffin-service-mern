import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, size = 16, showValue = true }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      ))}
      {showValue && <span className="text-sm text-gray-500 ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
};

export default RatingStars;
