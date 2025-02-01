// useLocationTracking.jsx
import { useState, useRef, useCallback, useEffect } from 'react';

const LOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 5000, // Reduced timeout for faster initial response
  maximumAge: 0, // Don't use cached positions
  distanceFilter: 5 // meters
};

const ACCURACY_THRESHOLD = {
    GOOD: 50,        // Increased from 20
    ACCEPTABLE: 250  // Increased from 50
  };

export const useLocationTracking = () => {
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [gpsSignal, setGpsSignal] = useState({
    status: "initializing",
    accuracy: null
  });
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastSplitTimeRef = useRef(null);
  const retryAttemptsRef = useRef(0);
  const maxRetryAttempts = 3;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  };

  const updateGPSStatus = useCallback((accuracy) => {
    if (accuracy === null) {
      setGpsSignal({ status: 'lost', accuracy: null });
    } else {
      if (accuracy <= ACCURACY_THRESHOLD.GOOD) {
        setGpsSignal({ status: 'good', accuracy });
      } else if (accuracy <= ACCURACY_THRESHOLD.ACCEPTABLE) {
        setGpsSignal({ status: 'acceptable', accuracy });
      } else {
        setGpsSignal({ status: 'poor', accuracy });
      }
      retryAttemptsRef.current = 0;
    }
  }, []);
  

  const checkLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(result.state);
      
      result.addEventListener('change', () => {
        setPermissionStatus(result.state);
        if (result.state === 'denied') {
          setGpsSignal({ status: 'denied', accuracy: null });
          stopTracking();
        }
      });

      return result.state;
    } catch (error) {
      console.error('Permission check failed:', error);
      return 'prompt';
    }
  }, []);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const successCallback = (position) => {
        console.log('Got position:', position); // Debug log
        const currentPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          elevation: position.coords.altitude || 0,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0
        };
        updateGPSStatus(position.coords.accuracy);
        resolve(currentPosition);
      };

      const errorCallback = async (error) => {
        console.error('Position error:', error);
        
        if (retryAttemptsRef.current < maxRetryAttempts) {
          retryAttemptsRef.current++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,
            LOCATION_CONFIG
          );
        } else {
          setGpsSignal({ status: 'lost', accuracy: null });
          reject(error);
        }
      };

      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        LOCATION_CONFIG
      );
    });
  }, [updateGPSStatus]);

  const startTracking = useCallback(async (onPosition) => {
    try {
      const permission = await checkLocationPermission();
      if (permission === 'denied') {
        throw new Error('Location permission denied');
      }

      setIsTracking(true);
      setGpsSignal({ status: 'searching', accuracy: null });
      lastSplitTimeRef.current = Date.now();

      // Get initial position
      const initialPosition = await getCurrentPosition();
      console.log('Initial position acquired:', initialPosition); // Debug log

      // Start continuous tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          console.log('Watch position update:', position); // Debug log
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            elevation: position.coords.altitude || 0,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0
          };

          updateGPSStatus(position.coords.accuracy);

          if (lastPositionRef.current) {
            const distance = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              newPosition.lat,
              newPosition.lng
            );

            if (distance >= LOCATION_CONFIG.distanceFilter) {
              setRoute(prev => [...prev, newPosition]);
              setDistance(prev => prev + distance);
              lastPositionRef.current = newPosition;
              onPosition?.(newPosition);
            }
          } else {
            lastPositionRef.current = newPosition;
            setRoute([newPosition]);
            onPosition?.(newPosition);
          }
        },
        (error) => {
          console.error('Watch position error:', error);
          setGpsSignal({ status: 'lost', accuracy: null });
        },
        LOCATION_CONFIG
      );
    } catch (error) {
      console.error('Start tracking error:', error);
      setGpsSignal({ status: 'lost', accuracy: null });
      setIsTracking(false);
      throw error;
    }
  }, [checkLocationPermission, getCurrentPosition, updateGPSStatus]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Initialize permissions and GPS on mount
  useEffect(() => {
    let mounted = true;

    const initializeGPS = async () => {
      try {
        await checkLocationPermission();
        const position = await getCurrentPosition();
        if (mounted) {
          console.log('Initial GPS position:', position); // Debug log
        }
      } catch (error) {
        console.error('GPS initialization error:', error);
        if (mounted) {
          setGpsSignal({ status: 'lost', accuracy: null });
        }
      }
    };

    initializeGPS();

    return () => {
      mounted = false;
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [checkLocationPermission, getCurrentPosition]);

  return {
    route,
    setRoute,
    distance,
    setDistance,
    gpsSignal,
    isTracking,
    permissionStatus,
    startTracking,
    stopTracking,
    getCurrentPosition,
    getSplitData: useCallback(() => {
      const currentTime = Date.now();
      const splitDuration = currentTime - lastSplitTimeRef.current;
      lastSplitTimeRef.current = currentTime;
      
      return {
        position: lastPositionRef.current,
        timestamp: currentTime,
        duration: splitDuration,
        distance,
        route: [...route]
      };
    }, [distance, route]),
    lastPosition: lastPositionRef.current
  };
};