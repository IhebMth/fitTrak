import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Activity, BarChart2, Map, User, Bell, Circle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <Activity className="h-8 w-8 text-primary-500 transform group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                FitTrack
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-primary-500 transition-colors"
            >
              <BarChart2 className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/explore" 
              className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-primary-500 transition-colors"
            >
              <Map className="h-5 w-5" />
              <span>Explore</span>
            </Link>

            
              <Link 
                to="/record"
                className="flex items-center space-x-1 px-3 py-2 text-primary-500 hover:text-primary-600 transition-colors"
              >
                <Circle className="h-5 w-5 fill-current" />
                <span>Record</span>
              </Link>
            

            {user ? (
              <>
                <Button 
                  size="sm"
                  variant="secondary"
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-500 rounded-full text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                >
                  Logout
                </Button>
                <Link to="/profile">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-500" />
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-500 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-2">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-500 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <BarChart2 className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/explore"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-500 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Map className="h-5 w-5" />
                <span>Explore</span>
              </Link>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-500 hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-500 hover:bg-gray-100 w-full text-left"
                  >
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 text-gray-700 hover:text-primary-500 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
