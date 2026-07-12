import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="font-display text-6xl font-bold text-primary-500">404</h1>
    <p className="text-gray-500 mt-2">Looks like this tiffin got lost in delivery.</p>
    <Link to="/" className="btn-primary mt-6">Back to Home</Link>
  </div>
);

export default NotFound;
