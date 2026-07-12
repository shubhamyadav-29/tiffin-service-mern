import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = params.get('role') === 'provider' ? 'provider' : 'user';

  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    city: '', area: '',
    businessName: '', foodType: 'Veg', contactNumber: '',
  });

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      role,
      address: { city: form.city, area: form.area },
    };
    if (role === 'provider') {
      Object.assign(payload, {
        businessName: form.businessName,
        foodType: form.foodType,
        contactNumber: form.contactNumber || form.phone,
      });
    }
    try {
      const data = await register(payload);
      navigate(role === 'provider' ? '/provider/dashboard' : '/dashboard');
    } catch {
      // error toast already shown
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <UtensilsCrossed className="mx-auto text-primary-500 mb-2" size={32} />
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {['user', 'provider'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                role === r ? 'bg-white shadow text-primary-600' : 'text-gray-500'
              }`}
            >
              {r === 'user' ? 'I want to order tiffin' : 'I provide tiffin service'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input required className="input-field" value={form.name} onChange={update('name')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input required className="input-field" value={form.phone} onChange={update('phone')} />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" required className="input-field" value={form.email} onChange={update('email')} />
          </div>

          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={6} className="input-field" value={form.password} onChange={update('password')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input required className="input-field" value={form.city} onChange={update('city')} />
            </div>
            <div>
              <label className="label">Area</label>
              <input required className="input-field" value={form.area} onChange={update('area')} />
            </div>
          </div>

          {role === 'provider' && (
            <>
              <div>
                <label className="label">Business Name</label>
                <input required className="input-field" value={form.businessName} onChange={update('businessName')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Food Type</label>
                  <select className="input-field" value={form.foodType} onChange={update('foodType')}>
                    <option>Veg</option>
                    <option>Non-Veg</option>
                    <option>Jain</option>
                    <option>Veg & Non-Veg</option>
                  </select>
                </div>
                <div>
                  <label className="label">Contact Number</label>
                  <input className="input-field" value={form.contactNumber} onChange={update('contactNumber')} placeholder={form.phone} />
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary-600 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
