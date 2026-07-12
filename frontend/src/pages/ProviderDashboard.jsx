import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Check, IndianRupee } from 'lucide-react';
import API from '../api/axios';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];
const TABS = ['Profile', 'Menu', 'Bookings'];

const emptyMeal = { items: '', price: 0 };

const ProviderDashboard = () => {
  const [tab, setTab] = useState('Profile');
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [mealForm, setMealForm] = useState({ breakfast: emptyMeal, lunch: emptyMeal, dinner: emptyMeal });

  const fetchProfile = async () => {
    const { data } = await API.get('/providers/me/profile');
    setProfile(data);
  };
  const fetchBookings = async () => {
    const { data } = await API.get('/providers/me/bookings');
    setBookings(data);
  };

  useEffect(() => { fetchProfile(); fetchBookings(); }, []);

  const saveProfile = async () => {
    try {
      await API.put('/providers/me/profile', profile);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const saveMenu = async () => {
    try {
      const payload = { day: activeDay };
      MEALS.forEach((m) => {
        payload[m] = {
          items: mealForm[m].items.split(',').map((s) => s.trim()).filter(Boolean),
          price: Number(mealForm[m].price) || 0,
        };
      });
      await API.post('/menus/me', payload);
      toast.success(`${activeDay} menu saved`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save menu');
    }
  };

  const handleBookingStatus = async (id, status) => {
    try {
      await API.put(`/providers/me/bookings/${id}/status`, { status });
      toast.success(`Booking ${status}`);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  if (!profile) return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Provider Dashboard</h1>
      <p className="text-gray-500 mb-6">{profile.businessName}</p>

      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 font-medium text-sm border-b-2 transition ${
              tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <div>
            <label className="label">Business Name</label>
            <input className="input-field" value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field" rows={3} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Daily (₹)</label>
              <input type="number" className="input-field" value={profile.pricing?.daily || 0} onChange={(e) => setProfile({ ...profile, pricing: { ...profile.pricing, daily: e.target.value } })} />
            </div>
            <div>
              <label className="label">Weekly (₹)</label>
              <input type="number" className="input-field" value={profile.pricing?.weekly || 0} onChange={(e) => setProfile({ ...profile, pricing: { ...profile.pricing, weekly: e.target.value } })} />
            </div>
            <div>
              <label className="label">Monthly (₹)</label>
              <input type="number" className="input-field" value={profile.pricing?.monthly || 0} onChange={(e) => setProfile({ ...profile, pricing: { ...profile.pricing, monthly: e.target.value } })} />
            </div>
          </div>
          <button onClick={saveProfile} className="btn-primary flex items-center gap-2"><Save size={16} /> Save Profile</button>
        </div>
      )}

      {tab === 'Menu' && (
        <div className="card p-6">
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
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {MEALS.map((meal) => (
              <div key={meal} className="border border-gray-100 rounded-xl p-4">
                <h3 className="font-semibold capitalize mb-2">{meal}</h3>
                <label className="label">Items (comma-separated)</label>
                <textarea
                  className="input-field mb-2"
                  rows={2}
                  placeholder="Dal, Rice, Roti, Sabzi"
                  value={mealForm[meal].items}
                  onChange={(e) => setMealForm({ ...mealForm, [meal]: { ...mealForm[meal], items: e.target.value } })}
                />
                <label className="label">Price (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  value={mealForm[meal].price}
                  onChange={(e) => setMealForm({ ...mealForm, [meal]: { ...mealForm[meal], price: e.target.value } })}
                />
              </div>
            ))}
          </div>
          <button onClick={saveMenu} className="btn-primary flex items-center gap-2"><Save size={16} /> Save {activeDay} Menu</button>
        </div>
      )}

      {tab === 'Bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">No bookings yet.</div>
          ) : (
            bookings.map((b) => (
              <div key={b._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{b.user?.name}</h3>
                      <span className="badge bg-gray-100 text-gray-600 capitalize">{b.status.replace('_', ' ')}</span>
                      <span className={`badge ${b.paymentStatus === 'paid' ? 'bg-secondary-500/10 text-secondary-600' : b.paymentStatus === 'failed' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-700'}`}>
                        payment: {b.paymentStatus}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 capitalize mt-1">{b.planType} plan · {b.user?.phone}</p>
                    <span className="flex items-center text-primary-600 text-sm font-medium mt-1"><IndianRupee size={12} />{b.price}</span>
                    {b.deliveryAddress && (
                      <div className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 max-w-sm">
                        <p className="font-medium text-gray-700">{b.deliveryAddress.fullName} · {b.deliveryAddress.mobileNumber}</p>
                        <p>{b.deliveryAddress.houseNumber}, {b.deliveryAddress.street}, {b.deliveryAddress.area}</p>
                        <p>{b.deliveryAddress.city} - {b.deliveryAddress.pincode}</p>
                        {b.deliveryAddress.landmark && <p>Landmark: {b.deliveryAddress.landmark}</p>}
                        {b.deliveryAddress.deliveryInstructions && <p>Note: {b.deliveryAddress.deliveryInstructions}</p>}
                      </div>
                    )}
                  </div>
                  {b.status === 'pending' && b.paymentStatus === 'paid' && (
                    <button onClick={() => handleBookingStatus(b._id, 'active')} className="btn-primary !py-2 flex items-center gap-1.5 text-sm shrink-0">
                      <Check size={14} /> Accept
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
