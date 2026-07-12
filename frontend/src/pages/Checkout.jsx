import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, IndianRupee, MapPin, CalendarDays, Pencil, PartyPopper, Loader2 } from 'lucide-react';
import API from '../api/axios';
import AddressForm from '../components/AddressForm';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Provider', 'Plan', 'Address', 'Review', 'Payment', 'Confirmation'];
const PLAN_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', custom: 'Custom' };

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialProviderId = params.get('providerId');
  const retrySubscriptionId = params.get('subscriptionId'); // used when retrying a failed payment

  const [step, setStep] = useState(initialProviderId ? 2 : 1);
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);
  const [planType, setPlanType] = useState(params.get('plan') || 'monthly');
  const [customDays, setCustomDays] = useState(7);
  const [mealTypes, setMealTypes] = useState(['lunch']);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const [address, setAddress] = useState(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [subscription, setSubscription] = useState(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);

  // Load provider list only if we're starting from step 1 (no provider preselected)
  useEffect(() => {
    if (!initialProviderId) {
      API.get('/providers').then(({ data }) => setProviders(data));
    } else {
      API.get(`/providers/${initialProviderId}`).then(({ data }) => setProvider(data.provider));
    }
  }, [initialProviderId]);

  // Always load the user's saved address so Step 3 can show/reuse it
  useEffect(() => {
    API.get('/addresses/me').then(({ data }) => {
      setAddress(data);
      if (!data) setEditingAddress(true);
    });
  }, []);

  // If we arrived here to retry a failed payment, jump straight to the payment step
  useEffect(() => {
    if (retrySubscriptionId) {
      API.get(`/subscriptions/${retrySubscriptionId}`).then(({ data }) => {
        setSubscription(data);
        setProvider(data.provider);
        setPlanType(data.planType);
        setStep(5);
      });
    }
  }, [retrySubscriptionId]);

  const selectProvider = (p) => { setProvider(p); setStep(2); };

  const currentPrice = () => {
    if (!provider) return 0;
    if (planType === 'custom') return (provider.pricing?.daily || 0) * customDays;
    return provider.pricing?.[planType] || 0;
  };

  const toggleMeal = (meal) => {
    setMealTypes((prev) => (prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]));
  };

  const handleAddressSave = async (form) => {
    setSavingAddress(true);
    try {
      const { data } = await API.put('/addresses/me', form);
      setAddress(data);
      setEditingAddress(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save address');
    } finally {
      setSavingAddress(false);
    }
  };

  // Step 4 -> 5: create the subscription record (status: pending_payment), then move to payment
  const handleReviewConfirm = async () => {
    setCreating(true);
    try {
      const { data } = await API.post('/subscriptions', {
        providerId: provider._id,
        planType,
        customDurationDays: planType === 'custom' ? customDays : undefined,
        mealTypes,
        startDate,
      });
      setSubscription(data);
      setStep(5);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create subscription');
    } finally {
      setCreating(false);
    }
  };

  // Step 5: create Razorpay order, open checkout, verify on success
  const handlePayment = async () => {
    setPaying(true);
    try {
      const { data: order } = await API.post('/payments/create-order', { subscriptionId: subscription._id });

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'TiffinHub',
        description: `${PLAN_LABEL[planType]} subscription - ${provider.businessName}`,
        order_id: order.orderId,
        prefill: {
          name: address?.fullName || user?.name,
          contact: address?.mobileNumber,
          email: user?.email,
        },
        theme: { color: '#E85D04' },
        handler: async (response) => {
          try {
            const { data: result } = await API.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSubscription(result.subscription);
            setReceiptUrl(result.payment.receiptUrl);
            toast.success('Payment successful!');
            setStep(6);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: async () => {
            setPaying(false);
            try {
              await API.post('/payments/failure', { razorpay_order_id: order.orderId, reason: 'Checkout closed by user' });
            } catch { /* best-effort */ }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (resp) => {
        setPaying(false);
        try {
          await API.post('/payments/failure', {
            razorpay_order_id: order.orderId,
            reason: resp.error?.description || 'Payment failed',
          });
        } catch { /* best-effort */ }
        toast.error('Payment failed. You can retry from your dashboard.');
      });
      rzp.open();
    } catch (err) {
      setPaying(false);
      toast.error(err.response?.data?.message || 'Could not start payment');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex items-center flex-1 min-w-[90px]">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  done ? 'bg-secondary-500 text-white' : active ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {done ? <Check size={16} /> : n}
                </div>
                <span className={`text-xs mt-1 text-center ${active ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{label}</span>
              </div>
              {n < STEPS.length && <div className={`h-0.5 flex-1 ${done ? 'bg-secondary-500' : 'bg-gray-200'}`} />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Select Provider */}
      {step === 1 && (
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Select a Provider</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {providers.map((p) => (
              <button key={p._id} onClick={() => selectProvider(p)} className="card p-4 text-left hover:shadow-lg transition">
                <h3 className="font-semibold">{p.businessName}</h3>
                <p className="text-sm text-gray-500">{p.address?.area}, {p.address?.city}</p>
                <p className="text-sm text-primary-600 font-medium mt-1">From ₹{p.pricing?.daily}/day</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Choose Plan */}
      {step === 2 && provider && (
        <div className="card p-6">
          <h2 className="font-display text-2xl font-bold mb-1">Choose Your Plan</h2>
          <p className="text-gray-500 mb-6">{provider.businessName}</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {['daily', 'weekly', 'monthly', 'custom'].map((p) => (
              (p === 'custom' ? provider.pricing?.daily > 0 : provider.pricing?.[p] > 0) && (
                <button
                  key={p}
                  onClick={() => setPlanType(p)}
                  className={`p-4 rounded-xl border text-left transition ${planType === p ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                >
                  <div className="font-medium capitalize">{p}</div>
                  <div className="flex items-center text-primary-600 font-semibold mt-1">
                    <IndianRupee size={14} />
                    {p === 'custom' ? `${provider.pricing.daily}/day` : provider.pricing[p]}
                  </div>
                </button>
              )
            ))}
          </div>

          {planType === 'custom' && (
            <div className="mb-6">
              <label className="label">Number of Days</label>
              <input type="number" min={1} className="input-field max-w-xs" value={customDays} onChange={(e) => setCustomDays(Number(e.target.value))} />
            </div>
          )}

          <div className="mb-6">
            <label className="label">Meals Included</label>
            <div className="flex gap-3">
              {['breakfast', 'lunch', 'dinner'].map((meal) => (
                <button
                  key={meal}
                  onClick={() => toggleMeal(meal)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                    mealTypes.includes(meal) ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="label">Start Date</label>
            <input type="date" className="input-field max-w-xs" value={startDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="flex items-center text-xl font-bold text-primary-600"><IndianRupee size={18} />{currentPrice()}</span>
            <button onClick={() => setStep(3)} disabled={mealTypes.length === 0} className="btn-primary">Continue</button>
          </div>
        </div>
      )}

      {/* Step 3: Delivery Address */}
      {step === 3 && (
        <div className="card p-6">
          <h2 className="font-display text-2xl font-bold mb-4">Delivery Address</h2>
          {editingAddress ? (
            <AddressForm initialData={address} onSave={handleAddressSave} saving={savingAddress} />
          ) : (
            <div>
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 mb-4">
                <MapPin className="text-primary-500 mt-1 shrink-0" size={20} />
                <div>
                  <p className="font-semibold">{address.fullName} · {address.mobileNumber}</p>
                  <p className="text-gray-600 text-sm mt-1">
                    {address.houseNumber}, {address.street}, {address.area}, {address.city}, {address.state} - {address.pincode}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingAddress(true)} className="btn-outline flex items-center gap-1.5"><Pencil size={14} /> Edit Address</button>
                <button onClick={() => setStep(4)} className="btn-primary ml-auto">Continue</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review Order */}
      {step === 4 && provider && (
        <div className="card p-6">
          <h2 className="font-display text-2xl font-bold mb-6">Review Your Order</h2>

          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Provider</span>
              <span className="font-medium">{provider.businessName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium capitalize">{PLAN_LABEL[planType]}{planType === 'custom' ? ` (${customDays} days)` : ''}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Meals</span>
              <span className="font-medium capitalize">{mealTypes.join(', ')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 flex items-center gap-1.5"><CalendarDays size={14} /> Start Date</span>
              <span className="font-medium">{new Date(startDate).toDateString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 flex items-center gap-1.5"><MapPin size={14} /> Deliver To</span>
              <span className="font-medium text-right max-w-xs">{address.fullName}, {address.area}, {address.city} - {address.pincode}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="flex items-center text-xl font-bold text-primary-600"><IndianRupee size={18} />{currentPrice()}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(3)} className="btn-outline">Back</button>
            <button onClick={handleReviewConfirm} disabled={creating} className="btn-primary flex-1">
              {creating ? 'Please wait...' : 'Confirm & Proceed to Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Payment */}
      {step === 5 && subscription && (
        <div className="card p-8 text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Complete Your Payment</h2>
          <p className="text-gray-500 mb-6">Subscription ID: <span className="font-mono">{subscription.subscriptionId}</span></p>
          <div className="flex items-center justify-center text-3xl font-bold text-primary-600 mb-6">
            <IndianRupee size={26} />{subscription.price}
          </div>
          <button onClick={handlePayment} disabled={paying} className="btn-primary px-10 flex items-center gap-2 mx-auto">
            {paying ? <><Loader2 className="animate-spin" size={16} /> Processing...</> : 'Proceed to Payment'}
          </button>
          <p className="text-xs text-gray-400 mt-4">Secured by Razorpay · Test Mode</p>
        </div>
      )}

      {/* Step 6: Confirmation */}
      {step === 6 && subscription && (
        <div className="card p-8 text-center">
          <PartyPopper className="mx-auto text-primary-500 mb-3" size={40} />
          <h2 className="font-display text-2xl font-bold mb-2">Subscription Confirmed!</h2>
          <p className="text-gray-500 mb-6">Your payment was successful and your order has been sent to the provider.</p>

          <div className="text-left max-w-sm mx-auto bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
            <div className="flex justify-between"><span className="text-gray-500">Subscription ID</span><span className="font-mono">{subscription.subscriptionId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount Paid</span><span>₹{subscription.price}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="capitalize">{subscription.status}</span></div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            {receiptUrl && (
              <a href={receiptUrl} target="_blank" rel="noreferrer" className="btn-outline">Download Receipt</a>
            )}
            <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
