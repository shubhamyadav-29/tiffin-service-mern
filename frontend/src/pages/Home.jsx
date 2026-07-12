import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ShieldCheck, Salad } from 'lucide-react';

const Home = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-orange-700 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              Home-style Tiffins, <br /> Delivered Fresh Daily
            </h1>
            <p className="mt-4 text-white/90 text-lg">
              Discover trusted local tiffin providers near you. Fresh, homely, and hygienic meals — subscribe daily, weekly, or monthly.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/providers" className="bg-white text-primary-600 font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-orange-50 transition flex items-center justify-center gap-2">
                <Search size={18} /> Find Tiffin Providers
              </Link>
              <Link to="/register?role=provider" className="border-2 border-white/70 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition text-center">
                List Your Tiffin Service
              </Link>
            </div>
          </div>
          <div className="relative hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=800&q=80"
              alt="Delicious home-style thali"
              className="rounded-3xl shadow-2xl object-cover w-full h-96"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { icon: Salad, title: 'Fresh & Homely', desc: 'Curated menus with daily-changing breakfast, lunch & dinner options.' },
            { icon: Clock, title: 'Flexible Plans', desc: 'Subscribe daily, weekly or monthly — pause or cancel anytime.' },
            { icon: ShieldCheck, title: 'Verified Providers', desc: 'Every provider is approved and reviewed by real customers.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 mb-4">
                <Icon size={24} />
              </div>
              <h3 className="font-display font-semibold text-lg">{title}</h3>
              <p className="text-gray-500 text-sm mt-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary-500/5 py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display text-3xl font-bold text-gray-900">Hungry for real, home-cooked food?</h2>
          <p className="text-gray-500 mt-3">Browse tiffin providers in your area and subscribe in minutes.</p>
          <Link to="/providers" className="btn-primary inline-block mt-6">Explore Providers</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
