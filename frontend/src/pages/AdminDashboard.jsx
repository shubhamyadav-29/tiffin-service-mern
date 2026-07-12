import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Store, ClipboardList, TrendingUp, Check, X } from 'lucide-react';
import API from '../api/axios';

const TABS = ['Overview', 'Providers', 'Users', 'Bookings'];

const AdminDashboard = () => {
  const [tab, setTab] = useState('Overview');
  const [reports, setReports] = useState(null);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);

  const fetchAll = async () => {
    const [r, p, u, b] = await Promise.all([
      API.get('/admin/reports'),
      API.get('/admin/providers'),
      API.get('/admin/users'),
      API.get('/admin/bookings'),
    ]);
    setReports(r.data);
    setProviders(p.data);
    setUsers(u.data);
    setBookings(b.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApproval = async (id, approvalStatus) => {
    try {
      await API.put(`/admin/providers/${id}/approval`, { approvalStatus });
      toast.success(`Provider ${approvalStatus}`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const toggleUser = async (id, isActive) => {
    try {
      await API.put(`/admin/users/${id}/status`, { isActive });
      toast.success('User status updated');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold mb-6">Admin Dashboard</h1>

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

      {tab === 'Overview' && reports && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Customers', value: reports.totalUsers },
            { icon: Store, label: 'Active Providers', value: reports.totalProviders },
            { icon: ClipboardList, label: 'Total Bookings', value: reports.totalBookings },
            { icon: TrendingUp, label: 'Revenue', value: `₹${reports.totalRevenue}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-5">
              <Icon className="text-primary-500 mb-2" size={22} />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
          <div className="card p-5 sm:col-span-2 lg:col-span-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-amber-600">{reports.pendingProviders}</span> provider(s) awaiting approval —
              <button onClick={() => setTab('Providers')} className="text-primary-600 font-medium ml-1">review now →</button>
            </p>
          </div>
        </div>
      )}

      {tab === 'Providers' && (
        <div className="space-y-4">
          {providers.map((p) => (
            <div key={p._id} className="card p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{p.businessName}</h3>
                <p className="text-sm text-gray-500">{p.user?.name} · {p.user?.email}</p>
                <span className={`badge mt-1 ${p.approvalStatus === 'approved' ? 'bg-secondary-500/10 text-secondary-600' : p.approvalStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                  {p.approvalStatus}
                </span>
              </div>
              {p.approvalStatus === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleApproval(p._id, 'approved')} className="btn-primary !py-2 flex items-center gap-1.5 text-sm">
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => handleApproval(p._id, 'rejected')} className="text-red-500 border border-red-200 hover:bg-red-50 !py-2 px-4 rounded-xl flex items-center gap-1.5 text-sm transition">
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Users' && (
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u._id} className="card p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{u.name}</h3>
                <p className="text-sm text-gray-500">{u.email} · {u.phone}</p>
              </div>
              <button
                onClick={() => toggleUser(u._id, !u.isActive)}
                className={u.isActive ? 'text-red-500 border border-red-200 hover:bg-red-50 !py-2 px-4 rounded-xl text-sm transition' : 'btn-primary !py-2 text-sm'}
              >
                {u.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'Bookings' && (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="card p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{b.user?.name} → {b.provider?.businessName}</h3>
                <p className="text-sm text-gray-500 capitalize">{b.planType} · ₹{b.price} · {b.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
