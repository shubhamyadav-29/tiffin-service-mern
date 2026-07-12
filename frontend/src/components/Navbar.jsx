import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath =
    user?.role === 'admin' ? '/admin' : user?.role === 'provider' ? '/provider/dashboard' : '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-primary-600">
            <UtensilsCrossed className="text-primary-500" size={24} />
            TiffinHub
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/providers" className="hover:text-primary-600 transition">Browse Providers</Link>
            {user && (
              <Link to={dashboardPath} className="hover:text-primary-600 transition">Dashboard</Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <User size={16} /> {user.name}
                </span>
                <button onClick={handleLogout} className="btn-outline flex items-center gap-1.5 !py-2">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline !py-2">Login</Link>
                <Link to="/register" className="btn-primary !py-2">Get Started</Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-orange-100 bg-white px-4 py-4 space-y-3">
          <Link to="/providers" onClick={() => setOpen(false)} className="block text-gray-700">Browse Providers</Link>
          {user ? (
            <>
              <Link to={dashboardPath} onClick={() => setOpen(false)} className="block text-gray-700">Dashboard</Link>
              <button onClick={handleLogout} className="btn-outline w-full">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="btn-outline w-full block text-center">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full block text-center">Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
