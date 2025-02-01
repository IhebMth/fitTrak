// src/utils/validation.js
export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
    if (password.length < minLength) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long'
      };
    }
  
    if (!hasUpperCase || !hasLowerCase) {
      return {
        isValid: false,
        message: 'Password must contain both uppercase and lowercase letters'
      };
    }
  
    if (!hasNumbers) {
      return {
        isValid: false,
        message: 'Password must contain at least one number'
      };
    }
  
    if (!hasSpecialChar) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character'
      };
    }
  
    return { isValid: true };
  };
  
  export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address'
      };
    }
    return { isValid: true };
  };
  
  export const sanitizeInput = (input) => {
    // Basic XSS prevention
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .trim(); // Remove leading/trailing whitespace
  };