// LoginForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FaFacebook, FaGoogle } from 'react-icons/fa';
import Cookies from 'js-cookie';

export const LoginForm = () => {

  const navigate = useNavigate();
  const { login, loginWithFacebook, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
              callback: handleGoogleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true
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

    const handleGoogleCredentialResponse = async (response) => {
      try {
        if (!response.credential) {
          throw new Error('No credential received');
        }

        // Store remember me preference
        Cookies.set('remember_preference', formData.rememberMe);
        
        const result = await loginWithGoogle(response.credential);
        
        if (result.token) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Google login error:', error);
        setSubmitError(error.message || 'Failed to login with Google');
      }
    };

    loadGoogleSDK().catch(console.error);

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    };
  }, []);


  // Check for remembered email on component mount
  useEffect(() => {
    const rememberedEmail = Cookies.get('user_email');
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Store remember me preference
      Cookies.set('remember_preference', formData.rememberMe);
      
      const response = await login(formData);
      
      if (formData.rememberMe) {
        Cookies.set('auth_token', response.token, { expires: 30 });
        Cookies.set('user_email', formData.email, { expires: 30 });
      } else {
        Cookies.set('auth_token', response.token);
        Cookies.remove('user_email');
      }
      
      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setSubmitError('');
    setIsLoading(true);

    try {
      // Store remember me preference for social login
      Cookies.set('remember_preference', formData.rememberMe);
      
      const response = await loginWithFacebook();
      if (response.token) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Facebook login error:', err);
      setSubmitError(err.message || 'Failed to login with Facebook. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { google } = window;
      if (!google) {
        console.error('Google script not loaded');
        return;
      }
  
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          // Send ID token to your backend
          const result = await loginWithGoogle(response.credential);
          if (result.token) {
            navigate('/dashboard');
          }
        }
      });
  
      google.accounts.id.prompt(); // Trigger the Google Sign-In popup
    } catch (err) {
      console.error('Google login error:', err);
      setSubmitError(err.message || 'Failed to login with Google');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Login to track your fitness journey</p>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
            className="w-full"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            required
            className="w-full"
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>

          <Link to="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full"
        >
          <FaGoogle className="mr-2 h-4 w-4" />
          Google
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleFacebookLogin}
          disabled={isLoading}
          className="w-full"
        >
          <FaFacebook className="mr-2 h-4 w-4" />
          Facebook
        </Button>
      </div>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;