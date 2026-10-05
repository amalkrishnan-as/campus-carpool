'use client';

import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  max?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingStars({
  rating,
  max = 5,
  interactive = false,
  onRatingChange,
  size = 'md',
}: RatingStarsProps) {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(starValue)}
            className={`${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            } focus:outline-none`}
          >
            <Star
              className={`${sizeMap[size]} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                  : 'text-slate-600 fill-transparent'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
