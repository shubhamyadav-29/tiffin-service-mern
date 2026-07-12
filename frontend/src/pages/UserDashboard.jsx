import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IndianRupee, Pause, Play, XCircle, Star, MapPin, Receipt, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const TABS = ['Subscriptions', 'Payment History'];

const statusStyle = {
  pending_payment: 'bg-orange-50 text-orange-700',
  pending: 'bg-amber-50 text-amber-700',
  active: 'bg-secondary-500/10 text-secondary-600',
  paused: 'bg-blue-50 text-blue-600',
  cancelled: 'bg-red-50 text-red-600',
  completed: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-50 text-red-600',
};

const paymentStatusStyle = {
  unpaid: 'bg-orange-50 text-orange-700',
  paid: 'bg-secondary-500/10 text-secondary-600',
  failed: 'bg-red-50 text-red-600',
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Subscriptions');
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const fetchSubscriptions = async () => {
    const { data } = await API.get('/subscriptions/me');
    setSubscriptions(data);
  };
  const fetchPayments = async () => {
    const { data } = await API.get('/payments/me');
    setPayments(data);
  };

  useEffect(() => { fetchSubscriptions(); fetchPayments(); }, []);

  const handleAction = async (id, action) => {
    try {
      await API.put(`/subscriptions/${id}/${action}`);
      toast.success(`Subscription ${action}d`);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const submitReview = async () => {
    try {
      await API.post('/reviews', { subscriptionId: reviewModal._id, ...reviewForm });
      toast.success('Review submitted!');
      setReviewModal(null);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <h1 className="font-display text-3xl font-bold">My Account</h1>
        <Link to="/profile" className="btn-outline !py-2 flex items-center gap-1.5 text-sm">
          <MapPin size={14} /> Manage Delivery Address
        </Link>
      </div>
      <p className="text-gray-500 mb-8">View your subscriptions, payment history, and receipts.</p>

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

      {tab === 'Subscriptions' && (
        subscriptions.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            No subscriptions yet. <Link to="/providers" className="text-primary-600 font-medium">Browse providers</Link> to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div key={sub._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{sub.provider?.businessName}</h3>
                      <span className={`badge ${statusStyle[sub.status]}`}>{sub.status.replace('_', ' ')}</span>
                      <span className={`badge ${paymentStatusStyle[sub.paymentStatus]}`}>payment: {sub.paymentStatus}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      {sub.planType} plan · {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{sub.subscriptionId}</p>
                    <span className="flex items-center text-primary-600 text-sm font-medium mt-1">
                      <IndianRupee size={12} />{sub.price}
                    </span>
                    {sub.deliveryAddress && (
                      <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        {sub.deliveryAddress.area}, {sub.deliveryAddress.city} - {sub.deliveryAddress.pincode}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {(sub.status === 'pending_payment' || sub.paymentStatus === 'failed') && (
                      <button
                        onClick={() => navigate(`/checkout?subscriptionId=${sub._id}`)}
                        className="btn-primary !py-2 flex items-center gap-1.5 text-sm"
                      >
                        <RefreshCw size={14} /> Retry Payment
                      </button>
                    )}
                    {sub.status === 'active' && (
                      <button onClick={() => handleAction(sub._id, 'pause')} className="btn-outline !py-2 flex items-center gap-1.5 text-sm">
                        <Pause size={14} /> Pause
                      </button>
                    )}
                    {sub.status === 'paused' && (
                      <button onClick={() => handleAction(sub._id, 'resume')} className="btn-outline !py-2 flex items-center gap-1.5 text-sm">
                        <Play size={14} /> Resume
                      </button>
                    )}
                    {['pending_payment', 'pending', 'active', 'paused'].includes(sub.status) && (
                      <button onClick={() => handleAction(sub._id, 'cancel')} className="text-red-500 border border-red-200 hover:bg-red-50 !py-2 px-4 rounded-xl flex items-center gap-1.5 text-sm transition">
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                    {sub.payment?.receiptUrl && (
                      <a href={sub.payment.receiptUrl} target="_blank" rel="noreferrer" className="btn-outline !py-2 flex items-center gap-1.5 text-sm">
                        <Receipt size={14} /> Receipt
                      </a>
                    )}
                    {!sub.isReviewed && ['active', 'completed'].includes(sub.status) && (
                      <button onClick={() => setReviewModal(sub)} className="btn-primary !py-2 flex items-center gap-1.5 text-sm">
                        <Star size={14} /> Rate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'Payment History' && (
        payments.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">No payments yet.</div>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <div key={p._id} className="card p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{p.subscription?.provider?.businessName || 'N/A'}</h3>
                    <span className={`badge ${paymentStatusStyle[p.status === 'paid' ? 'paid' : p.status === 'failed' ? 'failed' : 'unpaid']}`}>{p.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{p.receiptNumber}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {p.paymentMethod ? p.paymentMethod.toUpperCase() : '-'} · {p.transactionDate ? new Date(p.transactionDate).toLocaleString() : new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center text-primary-600 font-semibold">
                    <IndianRupee size={14} />{p.amount}
                  </span>
                  {p.receiptUrl && (
                    <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="btn-outline !py-2 flex items-center gap-1.5 text-sm">
                      <Receipt size={14} /> Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-display text-lg font-semibold mb-4">
              Rate {reviewModal.provider?.businessName}
            </h3>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                  <Star size={28} className={n <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Share your experience..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReviewModal(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={submitReview} className="btn-primary flex-1">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
