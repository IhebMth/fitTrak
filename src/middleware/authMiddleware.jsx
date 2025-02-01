// src/middleware/authMiddleware.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './../components/LoadingSpinner';

export const RequireAuth = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return  <LoadingSpinner />
  }
  
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export const RequireNoAuth = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return !user ? <Outlet /> : <Navigate to="/dashboard" />;
};

// src/utils/validation.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    message: emailRegex.test(email) ? '' : 'Please enter a valid email address'
  };
};

export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isValid = password.length >= minLength && 
                 hasUpperCase && 
                 hasLowerCase && 
                 hasNumbers && 
                 hasSpecialChar;

  return {
    isValid,
    message: isValid ? '' : 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters'
  };
};