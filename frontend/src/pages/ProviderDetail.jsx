import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, IndianRupee, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RatingStars from '../components/RatingStars';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];

const ProviderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [menus, setMenus] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [planType, setPlanType] = useState('monthly');

  const fetchData = async () => {
    const { data } = await API.get(`/providers/${id}`);
    setProvider(data.provider);
    setMenus(data.menus);
    const rev = await API.get(`/reviews/${id}`);
    setReviews(rev.data);
  };

  useEffect(() => { fetchData(); }, [id]);

  const dayMenu = menus.find((m) => m.day === activeDay);

  const goToCheckout = () => {
    if (!user) return toast.error('Please login to subscribe');
    if (user.role !== 'user') return toast.error('Only customers can subscribe');
    navigate(`/checkout?providerId=${id}&plan=${planType}`);
  };

  if (!provider) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const fallbackImg = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="card overflow-hidden mb-8">
        <div className="h-64 relative">
          <img src={provider.profileImage || fallbackImg} alt={provider.businessName} className="w-full h-full object-cover" />
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">{provider.businessName}</h1>
              <p className="text-gray-500 mt-1">{provider.description}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><MapPin size={15} /> {provider.address?.area}, {provider.address?.city}</span>
                <span className="flex items-center gap-1"><Phone size={15} /> {provider.contactNumber}</span>
                <RatingStars rating={provider.avgRating} />
              </div>
            </div>
            <span className="badge bg-secondary-500/10 text-secondary-600">{provider.foodType}</span>
          </div>

          {/* Pricing + subscribe */}
          <div className="mt-6 pt-6 border-t border-gray-100 grid sm:grid-cols-2 gap-6 items-end">
            <div className="flex gap-3">
              {['daily', 'weekly', 'monthly'].map((p) => (
                provider.pricing?.[p] > 0 && (
                  <button
                    key={p}
                    onClick={() => setPlanType(p)}
                    className={`px-4 py-3 rounded-xl border text-left transition ${
                      planType === p ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-xs text-gray-500 capitalize">{p}</div>
                    <div className="flex items-center font-semibold text-primary-600">
                      <IndianRupee size={14} />{provider.pricing[p]}
                    </div>
                  </button>
                )
              ))}
            </div>
            <button onClick={goToCheckout} className="btn-primary sm:justify-self-end">
              Subscribe ({planType}) →
            </button>
          </div>
        </div>
      </div>

      {/* Weekly menu */}
      <div className="card p-6 mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Weekly Menu</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                activeDay === day ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {dayMenu ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {MEALS.map((meal) => (
              <div key={meal} className="rounded-xl border border-gray-100 overflow-hidden">
                {dayMenu[meal]?.image && (
                  <img src={dayMenu[meal].image} alt={meal} className="h-32 w-full object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold capitalize text-gray-800">{meal}</h3>
                  <p className="text-sm text-gray-500 mt-1">{dayMenu[meal]?.items?.join(', ') || 'Not set'}</p>
                  {dayMenu[meal]?.price > 0 && (
                    <span className="flex items-center text-primary-600 text-sm font-medium mt-2">
                      <IndianRupee size={12} />{dayMenu[meal].price}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No menu set for {activeDay} yet.</p>
        )}
      </div>

      {/* Reviews */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-semibold mb-4">Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews yet. Be the first to try this provider!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{r.user?.name}</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star size={14} className="fill-amber-400" /> {r.rating}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDetail;
