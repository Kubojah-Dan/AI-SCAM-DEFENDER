import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              CaptoDebot
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user?.role === 'student' && (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-primary-blue px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/ml-workspace" 
                  className="text-gray-700 hover:text-primary-blue px-3 py-2 rounded-md text-sm font-medium"
                >
                  ML Workspace
                </Link>
              </>
            )}
            
            {user?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="text-gray-700 hover:text-primary-blue px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin
              </Link>
            )}
            
            <Link 
              to="/profile" 
              className="text-gray-700 hover:text-primary-blue px-3 py-2 rounded-md text-sm font-medium"
            >
              Profile
            </Link>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="btn-outline text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
