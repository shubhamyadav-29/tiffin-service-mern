import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, IndianRupee, Leaf } from 'lucide-react';
import RatingStars from './RatingStars';

const foodTypeStyle = {
  Veg: 'bg-secondary-500/10 text-secondary-600',
  Jain: 'bg-secondary-500/10 text-secondary-600',
  'Non-Veg': 'bg-red-50 text-red-600',
  'Veg & Non-Veg': 'bg-amber-50 text-amber-700',
};

const ProviderCard = ({ provider }) => {
  const fallbackImg =
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80';

  return (
    <Link to={`/providers/${provider._id}`} className="card group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="relative h-44 overflow-hidden">
        <img
          src={provider.profileImage || fallbackImg}
          alt={provider.businessName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className={`badge absolute top-3 left-3 ${foodTypeStyle[provider.foodType] || 'bg-white'}`}>
          <Leaf size={12} className="inline -mt-0.5 mr-1" />
          {provider.foodType}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-lg text-gray-900 truncate">{provider.businessName}</h3>

        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <MapPin size={14} />
          <span className="truncate">{provider.address?.area}, {provider.address?.city}</span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <RatingStars rating={provider.avgRating} />
          <span className="text-xs text-gray-400">{provider.numReviews} reviews</span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="flex items-center text-primary-600 font-semibold">
            <IndianRupee size={14} />{provider.pricing?.monthly || provider.pricing?.daily}
            <span className="text-xs text-gray-400 font-normal ml-1">
              /{provider.pricing?.monthly ? 'month' : 'day'}
            </span>
          </span>
          <span className="text-sm text-primary-500 font-medium group-hover:underline">View details →</span>
        </div>
      </div>
    </Link>
  );
};

export default ProviderCard;
