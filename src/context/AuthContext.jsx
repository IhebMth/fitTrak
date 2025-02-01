// AuthContext.jsx
import PropTypes from 'prop-types';
import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    initializeFacebookSDK();
    initializeGoogleSDK();
  }, []);

  const initializeGoogleSDK = () => {
    const loadGoogleSDK = () => {
      return new Promise((resolve, reject) => {
        if (document.getElementById('google-jssdk')) {
          resolve();
          return;
        }
  
        const script = document.createElement('script');
        script.id = 'google-jssdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          try {
            window.google.accounts.id.initialize({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              callback: handleGoogleCallback,
              auto_select: false,
              cancel_on_tap_outside: true,
              // Add these two lines
              redirect_uri: 'http://localhost:5173/login',
              ux_mode: 'popup'
            });
            
            resolve();
          } catch (error) {
            console.error('Google SDK initialization error:', error);
            reject(error);
          }
        };
        script.onerror = (error) => {
          console.error('Failed to load Google SDK', error);
          reject(error);
        };
        
        document.body.appendChild(script);
      });
    };
  
    loadGoogleSDK().catch(console.error);
  };

  const initializeFacebookSDK = () => {
    const loadFacebookSDK = () => {
      return new Promise((resolve) => {
        if (document.getElementById('facebook-jssdk')) {
          resolve();
          return;
        }
        
        window.fbAsyncInit = function() {
          window.FB.init({
            appId: import.meta.env.VITE_FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          resolve();
        };

        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      });
    };

    loadFacebookSDK();
  };

  const handleGoogleCallback = async (response) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }
  
      const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });
  
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.message || 'Failed to authenticate with the server');
      }
  
      const data = await backendResponse.json();
      
      // Set cookies based on remember me preference
      const rememberMe = Cookies.get('remember_preference') === 'true';
      if (rememberMe) {
        Cookies.set('auth_token', data.token, { expires: 30 });
        Cookies.set('user_email', data.user.email, { expires: 30 });
      } else {
        Cookies.set('auth_token', data.token);
      }
  
      setUser(data.user);
      navigate('/dashboard');
      return data;
    } catch (error) {
      console.error('Google authentication error:', error);
      throw error;
    }
  };

  const checkAuth = async () => {
    const token = Cookies.get('auth_token');
    if (token) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
       
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          Cookies.remove('auth_token');
          Cookies.remove('user_email');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        Cookies.remove('auth_token');
        Cookies.remove('user_email');
        setUser(null);
      }
    }
    setLoading(false);
  };

 const loginWithGoogle = () => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error('Google SDK not loaded'));
      return;
    }

    try {
      // Trigger the Google One-Tap Sign-In
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log('Google Sign-In not displayed');
          reject(new Error('Google Sign-In prompt not displayed'));
        } else if (notification.isSkippedMoment()) {
          console.log('Google Sign-In skipped');
          reject(new Error('Google Sign-In prompt skipped'));
        } else if (notification.isDismissedMoment()) {
          console.log('Google Sign-In dismissed');
          reject(new Error('Google Sign-In prompt dismissed'));
        }
      });
      resolve();
    } catch (error) {
      console.error('Google login error:', error);
      reject(error);
    }
  });
};

  const loginWithFacebook = async () => {
    try {
      if (!window.FB) {
        throw new Error('Facebook SDK not loaded');
      }

      const statusResponse = await new Promise((resolve) => {
        window.FB.getLoginStatus((response) => resolve(response));
      });

      let authResponse;
      if (statusResponse.status !== 'connected') {
        authResponse = await new Promise((resolve, reject) => {
          window.FB.login((response) => {
            if (response.authResponse) {
              resolve(response);
            } else {
              reject(new Error('Facebook login cancelled'));
            }
          }, { scope: 'email,public_profile' });
        });
      } else {
        authResponse = statusResponse;
      }

      const userDataResponse = await new Promise((resolve, reject) => {
        window.FB.api('/me', { fields: 'email,name,picture' }, (userData) => {
          if (userData.error) reject(userData.error);
          resolve(userData);
        });
      });

      const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: authResponse.authResponse.accessToken,
          user_id: authResponse.authResponse.userID,
          email: userDataResponse.email,
          name: userDataResponse.name,
          picture: userDataResponse.picture?.data?.url
        }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.message || 'Failed to authenticate with the server');
      }

      const data = await backendResponse.json();
      
      // Set cookies based on remember me preference
      const rememberMe = Cookies.get('remember_preference') === 'true';
      if (rememberMe) {
        Cookies.set('auth_token', data.token, { expires: 30 });
        Cookies.set('user_email', data.user.email, { expires: 30 });
      } else {
        Cookies.set('auth_token', data.token);
      }

      setUser(data.user);
      return data;

    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }
  
      const data = await response.json();
      setUser(data.user);
      setError(null);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Logout from Facebook if connected
      if (window.FB) {
        await new Promise((resolve) => {
          window.FB.getLoginStatus((response) => {
            if (response.status === 'connected') {
              window.FB.logout(resolve);
            } else {
              resolve();
            }
          });
        });
      }

      // Logout from Google
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      // Clear all auth-related cookies
      Cookies.remove('auth_token');
      Cookies.remove('user_email');
      Cookies.remove('remember_preference');
      
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    loginWithFacebook,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;