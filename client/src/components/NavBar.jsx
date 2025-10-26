import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 cursor-pointer">
          <i className="fas fa-home mr-2"></i>RealEstate
        </Link>
        <div className="flex space-x-6 items-center">
          <Link to="/" className="text-gray-600 hover:text-blue-600 cursor-pointer font-medium">Home</Link>
          {user ? (
            <>
              <Link
                to="/property/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 cursor-pointer font-medium"
              >
                Create Listing
              </Link>
              <a onClick={handleLogout} className="text-gray-600 hover:text-blue-600 cursor-pointer font-medium">
                Logout ({user.email})
              </a>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-blue-600 cursor-pointer font-medium">Login</Link>
              <Link to="/register" className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 cursor-pointer font-medium">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
