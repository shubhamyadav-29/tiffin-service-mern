import React, { useState, useEffect } from 'react';

const STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh',
  'West Bengal', 'Rajasthan', 'Telangana', 'Kerala', 'Madhya Pradesh', 'Other',
];

const emptyForm = {
  fullName: '', mobileNumber: '', houseNumber: '', street: '', area: '',
  city: '', state: '', pincode: '', landmark: '', deliveryInstructions: '',
};

// Reusable delivery address form. Pass `initialData` to pre-fill (edit mode),
// and `onSave(formData)` which should perform the actual API call.
const AddressForm = ({ initialData, onSave, saving, submitLabel = 'Save Address' }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) setForm({ ...emptyForm, ...initialData });
  }, [initialData]);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!/^\d{10}$/.test(form.mobileNumber)) errs.mobileNumber = 'Enter a valid 10-digit number';
    if (!form.houseNumber.trim()) errs.houseNumber = 'Required';
    if (!form.street.trim()) errs.street = 'Required';
    if (!form.area.trim()) errs.area = 'Required';
    if (!form.city.trim()) errs.city = 'Required';
    if (!form.state) errs.state = 'Required';
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = 'Enter a valid 6-digit PIN code';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const field = (key, label, placeholder = '') => (
    <div>
      <label className="label">{label}</label>
      <input className="input-field" value={form[key]} onChange={update(key)} placeholder={placeholder} />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {field('fullName', 'Full Name')}
        {field('mobileNumber', 'Mobile Number', '10-digit number')}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {field('houseNumber', 'House/Flat Number')}
        {field('street', 'Street / Locality')}
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {field('area', 'Area')}
        {field('city', 'City')}
        <div>
          <label className="label">State</label>
          <select className="input-field" value={form.state} onChange={update('state')}>
            <option value="">Select state</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {field('pincode', 'PIN Code', '6-digit code')}
        {field('landmark', 'Landmark (Optional)')}
      </div>
      <div>
        <label className="label">Delivery Instructions (Optional)</label>
        <textarea className="input-field" rows={2} value={form.deliveryInstructions} onChange={update('deliveryInstructions')} placeholder="e.g. Ring the bell, leave at the door..." />
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
};

export default AddressForm;
