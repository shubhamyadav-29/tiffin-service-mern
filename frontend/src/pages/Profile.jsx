import React, { useEffect, useState } from 'react';
import { MapPin, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import AddressForm from '../components/AddressForm';

const Profile = () => {
  const [address, setAddress] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAddress = async () => {
    try {
      const { data } = await API.get('/addresses/me');
      setAddress(data);
      if (!data) setEditing(true); // no address yet - go straight to the form
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddress(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const { data } = await API.put('/addresses/me', form);
      setAddress(data);
      setEditing(false);
      toast.success('Delivery address saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">My Delivery Address</h1>
      <p className="text-gray-500 mb-8">This address is used for all your tiffin deliveries.</p>

      <div className="card p-6">
        {editing ? (
          <AddressForm
            initialData={address}
            onSave={handleSave}
            saving={saving}
            submitLabel={address ? 'Update Address' : 'Save Address'}
          />
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <MapPin className="text-primary-500 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-gray-800">{address.fullName} · {address.mobileNumber}</p>
                  <p className="text-gray-600 mt-1">
                    {address.houseNumber}, {address.street}, {address.area}<br />
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  {address.landmark && <p className="text-sm text-gray-500 mt-1">Landmark: {address.landmark}</p>}
                  {address.deliveryInstructions && (
                    <p className="text-sm text-gray-500 mt-1">Instructions: {address.deliveryInstructions}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setEditing(true)} className="btn-outline !py-2 flex items-center gap-1.5 text-sm shrink-0">
                <Pencil size={14} /> Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
