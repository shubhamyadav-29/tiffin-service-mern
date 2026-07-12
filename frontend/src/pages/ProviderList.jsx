import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import API from '../api/axios';
import ProviderCard from '../components/ProviderCard';

const ProviderList = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', city: '', foodType: '', minRating: '' });

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await API.get('/providers', { params });
      setProviders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchProviders, 300); // debounce
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Tiffin Providers Near You</h1>
      <p className="text-gray-500 mb-6">Home-style meals, freshly prepared and delivered daily.</p>

      {/* Filters */}
      <div className="card p-4 mb-8 grid sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <input
          className="input-field"
          placeholder="City"
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        />
        <select
          className="input-field"
          value={filters.foodType}
          onChange={(e) => setFilters({ ...filters, foodType: e.target.value })}
        >
          <option value="">All Food Types</option>
          <option>Veg</option>
          <option>Non-Veg</option>
          <option>Jain</option>
          <option>Veg & Non-Veg</option>
        </select>
        <select
          className="input-field"
          value={filters.minRating}
          onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
        >
          <option value="">Any Rating</option>
          <option value="4">4★ & above</option>
          <option value="3">3★ & above</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <SlidersHorizontal className="mx-auto mb-2 animate-pulse" />
          Loading providers...
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No providers match your filters. Try adjusting them.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((p) => (
            <ProviderCard key={p._id} provider={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderList;
