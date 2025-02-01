import { useState, useEffect, useRef } from "react";
import { HeartRateService } from "../services/HeartRateServices";
import { Heart, Activity, Settings, Map, Clock, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Switch from "../components/ui/Siwtch";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CesiumMap from "../components/activity-tracker/CesiumMap";
import ActivityControls from "../components/activity-tracker/ControlButtons";
import { CESIUM_ION_TOKEN } from "../config/cesium-config";
import PropTypes from "prop-types";
import ActivityStats from "../components/activity-tracker/StatsView";

const ActivityTracker = () => {
  // Constants
  const GPS_CHECK_INTERVAL = 5000; // Check GPS every 5 seconds
  const REALTIME_UPDATE_INTERVAL = 1000; // Update realtime stats every second
  const LOCATION_TIMEOUT = 30000;
  const LOCATION_MAX_AGE = 10000;
  const LOCATION_HIGH_ACCURACY = true;

  // Primary state
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("running");
  const [selectedView, setSelectedView] = useState("map");
  const [currentMapStyle, setCurrentMapStyle] = useState("osm");
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);

  // Tracking data state
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [averagePace, setAveragePace] = useState(null);
  const [currentPace, setCurrentPace] = useState(null);
  const [totalAscent, setTotalAscent] = useState(0);
  const [splits, setSplits] = useState([]);
  const [lastSplit, setLastSplit] = useState(null);
  const [realtimeDistance, setRealtimeDistance] = useState(0);
  const [realtimeSpeed, setRealtimeSpeed] = useState(0);
  const [lastSplits, setLastSplits] = useState([]);

  // GPS and location state
  const [error, setError] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);
  const [gpsSignal, setGpsSignal] = useState({
    status: "searching",
    accuracy: null,
  });

  // Heart rate monitoring state
  const [heartRate, setHeartRate] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isHeartRateConnected, setIsHeartRateConnected] = useState(false);
  const [heartRateHistory, setHeartRateHistory] = useState([]);
  const [lastHeartRateUpdate, setLastHeartRateUpdate] = useState(null);
  const [autoSplitsEnabled, setAutoSplitsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const heartRateServiceRef = useRef(null);
  const lastPositionRef = useRef(null);
  const viewer = useRef(null);
  const gpsCheckIntervalRef = useRef(null);
  const initialCheckTimeoutRef = useRef(null);
  const lastUpdateTimeRef = useRef(null);
  const movingTimeRef = useRef(0);
  const isMovingRef = useRef(false);
  const splitIntervalRef = useRef(null);
  const recoveryAttemptRef = useRef(null);

  // Constants
  const ACTIVITY_TYPES = [
    { value: "running", label: "Running" },
    { value: "cycling", label: "Cycling" },
    { value: "walking", label: "Walking" },
    { value: "hiking", label: "Hiking" },
  ];

  const VIEWS = [
    { value: "map", icon: <Map className="h-6 w-6" />, label: "Map" },
    { value: "stats", icon: <Clock className="h-6 w-6" />, label: "Stats" },
    { value: "details", icon: <Route className="h-6 w-6" />, label: "Details" },
  ];

  // Utility functions
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatPace = (pace) => {
    if (!pace) return "--:--";
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const HeartRateConnector = ({ onConnect }) => (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            Heart Rate Monitor
          </h3>
          <p className="text-sm text-gray-600">
            Connect your Bluetooth heart rate monitor
          </p>
        </div>
        <Button
          onClick={onConnect}
          variant="outline"
          className="flex items-center"
        >
          Connect
          <Heart className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  HeartRateConnector.propTypes = {
    onConnect: PropTypes.func.isRequired,
  };

  // Heart rate functions
  const handleHeartRateUpdate = (rate) => {
    const now = Date.now();
    setHeartRate(rate);
    setLastHeartRateUpdate(now);

    // Alert if no heart rate update received in last 30 seconds
    if (now - lastHeartRateUpdate > 30000) {
      setError("Heart rate monitor connection may be unstable");
    }

    setHeartRateHistory((prev) => {
      const thirtyMinutesAgo = now - 30 * 60 * 1000;
      const filteredHistory = prev.filter(
        (reading) => reading.timestamp >= thirtyMinutesAgo
      );
      return [...filteredHistory, { value: rate, timestamp: now }];
    });
  };

  const connectHeartRate = async () => {
    try {
      if (!navigator.bluetooth) {
        console.warn("Bluetooth not supported");
        return false;
      }

      if (!heartRateServiceRef.current) {
        heartRateServiceRef.current = new HeartRateService();
      }

      await heartRateServiceRef.current.connect();
      setIsHeartRateConnected(true);

      heartRateServiceRef.current.setBatteryCallback((level) => {
        setBatteryLevel(level);
      });

      await heartRateServiceRef.current.startNotifications(
        handleHeartRateUpdate
      );

      return true;
    } catch (err) {
      console.error("Heart Rate Connection Error:", err);
      setError(`Heart Rate Error: ${err.message}`);
      setIsHeartRateConnected(false);
      return false;
    }
  };

  // Position and tracking functions
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: LOCATION_HIGH_ACCURACY,
        timeout: LOCATION_TIMEOUT,
        maximumAge: LOCATION_MAX_AGE,
      };

      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        setGpsSignal({ status: "lost", accuracy: null });
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setError(
              "Location permission is denied. Please enable location services."
            );
            setGpsSignal({ status: "lost", accuracy: null });
            reject(new Error("Location permission denied"));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                elevation: position.coords.altitude || 0,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
              };

              setLastPosition(newPosition);
              lastPositionRef.current = newPosition;

              if (position.coords.accuracy <= 30) {
                setGpsSignal({
                  status: "acquired",
                  accuracy: position.coords.accuracy,
                });
              } else {
                setGpsSignal({
                  status: "acquired",
                  accuracy: position.coords.accuracy,
                });
              }

              resolve(newPosition);
            },
            (error) => {
              console.error("Position acquisition error:", error);
              let errorMessage = "GPS Error: ";
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage += "Location permission denied";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage += "Location information unavailable";
                  break;
                case error.TIMEOUT:
                  errorMessage += "Location request timed out";
                  break;
                default:
                  errorMessage += error.message;
              }
              setError(errorMessage);
              setGpsSignal({ status: "lost", accuracy: null });
              reject(error);
            },
            options
          );
        });
    });
  };

  // Initialize GPS tracking
  useEffect(() => {
    const initializeGPS = async () => {
      try {
        await getCurrentPosition();

        gpsCheckIntervalRef.current = setInterval(async () => {
          if (!isTracking) {
            await getCurrentPosition();
          }
        }, GPS_CHECK_INTERVAL);
      } catch (error) {
        console.error("GPS initialization error:", error);
      }
    };

    const attemptInitialGPSCheck = () => {
      initialCheckTimeoutRef.current = setTimeout(async () => {
        try {
          await getCurrentPosition();
        } catch (error) {
          console.warn("Initial GPS check failed, retrying...", error);
          attemptInitialGPSCheck();
        }
      }, 2000);
    };

    attemptInitialGPSCheck();
    initializeGPS();

    return () => {
      if (gpsCheckIntervalRef.current) {
        clearInterval(gpsCheckIntervalRef.current);
      }
      if (initialCheckTimeoutRef.current) {
        clearTimeout(initialCheckTimeoutRef.current);
      }
    };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (heartRateServiceRef.current) {
        heartRateServiceRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (isTracking && autoSplitsEnabled && !isPaused) {
      const kmDistance = distance / 1000;
      const lastSplitDistance = lastSplit ? lastSplit.totalDistance : 0;

      // Create new split every kilometer
      if (Math.floor(kmDistance) > Math.floor(lastSplitDistance)) {
        recordSplit();
      }
    }
  }, [distance, autoSplitsEnabled, isTracking, isPaused]);

  // Activity control functions
  const startTracking = async () => {
    try {
      let initialPosition = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (!initialPosition && retryCount < maxRetries) {
        try {
          initialPosition = await getCurrentPosition();
          break;
        } catch (error) {
          console.warn(error);
          retryCount++;
          if (retryCount === maxRetries) {
            throw new Error(
              "Unable to get initial position after multiple attempts"
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (gpsSignal.status !== "acquired") {
        setError(
          "Waiting for GPS signal. Please ensure location services are enabled."
        );
        return;
      }

      // Reset all states and start tracking
      setIsTracking(true);
      setIsPaused(false);
      setRoute([]);
      setDistance(0);
      setDuration(0);
      setAveragePace(null);
      setTotalAscent(0);
      setCurrentPace(null);
      setRealtimeSpeed(0);
      setRealtimeDistance(0);
      setSplits([]);
      setError(null);
      startTimeRef.current = Date.now();

      // Start position tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        {
          enableHighAccuracy: LOCATION_HIGH_ACCURACY,
          timeout: LOCATION_TIMEOUT,
          maximumAge: LOCATION_MAX_AGE,
        }
      );

      // Initialize heart rate monitoring if available
      if (navigator.bluetooth) {
        try {
          await connectHeartRate();
        } catch (error) {
          console.warn("Heart rate monitor connection failed:", error);
        }
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Enable auto splits if configured
      if (autoSplitsEnabled) {
        splitIntervalRef.current = setInterval(() => {
          if (
            realtimeDistance > 0 &&
            Math.floor(realtimeDistance / 1000) > splits.length
          ) {
            recordSplit();
          }
        }, 1000);
      }

      // Vibrate to indicate start
      if ("vibrate" in navigator) {
        navigator.vibrate([200]);
      }
    } catch (error) {
      console.error("Failed to start tracking:", error);
      setError(`Failed to start tracking: ${error.message}`);
      stopTracking();
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsTracking(false);
    setIsPaused(false);
    setShowFinishDialog(true);
  };

  const pauseTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsPaused(true);
  };

  const resumeTracking = () => {
    startTracking();
  };

  const finishActivity = async () => {
    const averageHeartRate =
      heartRateHistory.length > 0
        ? Math.round(
            heartRateHistory.reduce((sum, reading) => sum + reading.value, 0) /
              heartRateHistory.length
          )
        : null;

    const activity = {
      type: selectedActivity,
      route,
      distance,
      duration,
      movingTime: Math.floor(movingTimeRef.current),
      startTime: startTimeRef.current,
      endTime: Date.now(),
      totalAscent,
      averagePace,
      splits,
      autoSplitsEnabled, // Save the auto splits setting
      heartRateData: {
        average: averageHeartRate,
        history: heartRateHistory,
        battery: batteryLevel,
      },
    };

    lastUpdateTimeRef.current = null;
    movingTimeRef.current = 0;

    // Disconnect heart rate monitor
    if (heartRateServiceRef.current) {
      await heartRateServiceRef.current.disconnect();
      setIsHeartRateConnected(false);
    }

    // Save activity to local storage
    try {
      const savedActivities = JSON.parse(
        localStorage.getItem("activities") || "[]"
      );
      savedActivities.push(activity);
      localStorage.setItem("activities", JSON.stringify(savedActivities));
    } catch (error) {
      console.error("Error saving activity:", error);
    }

    // Reset all states
    setRoute([]);
    setDistance(0);
    setDuration(0);
    setTotalAscent(0);
    setAveragePace(null);
    setCurrentPace(null);
    setRealtimeSpeed(0);
    setRealtimeDistance(0);
    setSplits([]);
    setHeartRateHistory([]);
    setShowFinishDialog(false);
    setIsTracking(false);
    setIsPaused(false);
  };

  const handlePositionUpdate = (position) => {
    const newPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      elevation: position.coords.altitude || 0,
      timestamp: position.timestamp,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || 0,
    };

    if (position.coords.speed) {
      const newSpeed = position.coords.speed * 3.6; // Convert m/s to km/h
      setRealtimeSpeed((prevSpeed) => 0.7 * prevSpeed + 0.3 * newSpeed); // Apply smoothing
    }

    const isMoving = position.coords.speed && position.coords.speed > 0.3;
    isMovingRef.current = isMoving;

    setGpsSignal({
      status: "acquired",
      accuracy: position.coords.accuracy,
    });

    setRoute((prevRoute) => {
      const updatedRoute = [...prevRoute, newPosition];

      if (updatedRoute.length > 1) {
        const lastIndex = updatedRoute.length - 1;
        const segmentDistance = calculateDistance(
          updatedRoute[lastIndex - 1].lat,
          updatedRoute[lastIndex - 1].lng,
          updatedRoute[lastIndex].lat,
          updatedRoute[lastIndex].lng
        );

        // Update realtime distance and speed
        setRealtimeDistance((prev) => {
          const newDistance = prev + segmentDistance;
          return 0.7 * prev + 0.3 * newDistance; // Apply smoothing
        });

        setDistance((prevDistance) => {
          const newDistance = prevDistance + segmentDistance;

          // Calculate pace
          const timeElapsed =
            (newPosition.timestamp - updatedRoute[lastIndex - 1].timestamp) /
            1000;
          if (timeElapsed > 0 && segmentDistance > 0) {
            const speedMPS = segmentDistance / timeElapsed;
            const paceMinPerKm = 1000 / speedMPS / 60;
            setCurrentPace(paceMinPerKm);
          }

          return newDistance;
        });

        // Update realtime speed
        if (position.coords.speed) {
          setRealtimeSpeed(position.coords.speed);
        } else {
          const timeElapsed =
            (newPosition.timestamp - updatedRoute[lastIndex - 1].timestamp) /
            1000;
          const calculatedSpeed = segmentDistance / timeElapsed;
          setRealtimeSpeed(calculatedSpeed);
        }

        // Update ascent
        if (
          updatedRoute[lastIndex].elevation >
          updatedRoute[lastIndex - 1].elevation
        ) {
          const elevationGain =
            updatedRoute[lastIndex].elevation -
            updatedRoute[lastIndex - 1].elevation;
          setTotalAscent((prev) => prev + elevationGain);
        }
      }

      return updatedRoute;
    });

    setLastPosition(newPosition);
    lastPositionRef.current = newPosition;
  };

  const handlePositionError = (error) => {
    console.error("Position tracking error:", error);
    setGpsSignal({ status: "lost", accuracy: null });

    let errorMessage = "GPS Error: ";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage += "Location permission denied";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage += "Location information unavailable";
        break;
      case error.TIMEOUT:
        errorMessage += "Location request timed out";
        break;
      default:
        errorMessage += error.message;
    }
    setError(errorMessage);

    // Attempt GPS recovery
    recoveryAttemptRef.current = setTimeout(async () => {
      try {
        await getCurrentPosition();
        setError(null);
        setGpsSignal((prev) => ({ ...prev, status: "acquired" }));
      } catch (recoveryError) {
        console.warn("GPS recovery failed:", recoveryError);
      }
    }, 5000);
  };

  const SettingsDialog = ({ open, onOpenChange }) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Auto Splits (every 1km)
              </label>
              <Switch
                checked={autoSplitsEnabled}
                onCheckedChange={setAutoSplitsEnabled}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Define PropTypes for the component
  SettingsDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onOpenChange: PropTypes.func.isRequired,
  };

  const recordSplit = () => {
    if (route.length === 0) return;

    const currentTime = Date.now();
    const splitStartTime = lastSplit
      ? lastSplit.timestamp
      : startTimeRef.current;
    const splitDuration = (currentTime - splitStartTime) / 1000;

    const lastSplitDistance = lastSplit ? lastSplit.totalDistance : 0;
    const splitDistance = distance / 1000 - lastSplitDistance;

    const splitPace =
      splitDuration > 0 ? splitDuration / 60 / splitDistance : null;

    const newSplit = {
      splitNumber: (lastSplit?.splitNumber || 0) + 1,
      timestamp: currentTime,
      duration: splitDuration,
      totalDistance: distance / 1000,
      splitDistance: splitDistance,
      splitPace: splitPace,
      totalDuration: duration,
      heartRate: heartRate,
      elevation: route[route.length - 1].elevation,
      position: lastPosition,
      realtimeSpeed: realtimeSpeed, // Use realtimeSpeed here
      speedTrend: lastSplit
        ? (realtimeSpeed - lastSplit.realtimeSpeed).toFixed(2)
        : "0.00", // Speed trend compared to last split
    };

    setSplits((prevSplits) => [...prevSplits, newSplit]);
    setLastSplit(newSplit);

    // Keep track of last 3 splits for quick comparison
    setLastSplits((prevSplits) => {
      const newSplits = [...prevSplits, newSplit].slice(-3);
      return newSplits;
    });

    // Vibrate for split notification
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const renderHeartRateInfo = () => {
    if (!isHeartRateConnected && !heartRate) {
      return null;
    }

    return (
      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-white rounded-lg p-2 shadow-sm">
        <Heart
          className={`h-5 w-5 ${
            isHeartRateConnected
              ? heartRate > 160
                ? "text-red-500 animate-pulse"
                : heartRate > 140
                ? "text-orange-500 animate-pulse"
                : "text-green-500 animate-pulse"
              : "text-gray-400"
          }`}
        />
        <div className="flex flex-col">
          {heartRate ? (
            <>
              <span className="font-bold">{heartRate} bpm</span>
              {batteryLevel && (
                <span
                  className={`text-xs ${
                    batteryLevel < 20 ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  Battery: {batteryLevel}%
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-500">No signal</span>
          )}
        </div>
      </div>
    );
  };

  const toggleStatsExpansion = () => {
    setIsStatsExpanded((prev) => !prev);
  };

  useEffect(() => {
    let interval;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        const now = Date.now();
        lastUpdateTimeRef.current = now;

        // Update moving time if speed is above threshold
        if (realtimeSpeed > 0.3) {
          // 0.3 m/s threshold
          movingTimeRef.current += REALTIME_UPDATE_INTERVAL / 1000;
        }

        // Update average pace based on moving time
        if (movingTimeRef.current > 0 && distance > 0) {
          const paceMinPerKm = movingTimeRef.current / 60 / (distance / 1000);
          setAveragePace(paceMinPerKm);
        }
      }, REALTIME_UPDATE_INTERVAL);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, isPaused, realtimeSpeed, distance]);
  useEffect(() => {
    let interval;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        const now = Date.now();
        lastUpdateTimeRef.current = now;

        // Update moving time if speed is above threshold
        if (realtimeSpeed > 0.3) {
          // 0.3 m/s threshold
          movingTimeRef.current += REALTIME_UPDATE_INTERVAL / 1000;
        }

        // Update average pace based on moving time
        if (movingTimeRef.current > 0 && distance > 0) {
          const paceMinPerKm = movingTimeRef.current / 60 / (distance / 1000);
          setAveragePace(paceMinPerKm);
        }
      }, REALTIME_UPDATE_INTERVAL);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, isPaused, realtimeSpeed, distance]);

  const renderDetails = () => (
    <div className="p-4 space-y-4">
      {/* Show heart rate connector if not connected */}
      {!isHeartRateConnected && (
        <HeartRateConnector onConnect={connectHeartRate} />
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Current Stats Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Current Stats</h3>
          <div className="space-y-2">
            <p>Current Pace: {formatPace(currentPace)}</p>
            <p>Distance: {(distance / 1000).toFixed(2)} km</p>
            <p>Total Duration: {formatDuration(duration)}</p>
            <p>
              Moving Time: {formatDuration(Math.floor(movingTimeRef.current))}
            </p>
            <p>Real-time Speed: {(realtimeSpeed * 3.6).toFixed(1)} km/h</p>
            <p>Elevation Gain: {totalAscent}m</p>
            {heartRate && <p>Heart Rate: {heartRate} bpm</p>}
            {lastUpdateTimeRef.current && (
              <p>
                Last Update:{" "}
                {new Date(lastUpdateTimeRef.current).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* All Splits History Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Splits History</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {splits.map((split, index) => (
              <div key={index} className="text-sm border-b pb-2">
                <p>
                  Split {split.splitNumber}: {split.splitDistance.toFixed(2)}km
                </p>
                <p>Pace: {formatPace(split.splitPace)}</p>
                <p>Speed: {(split.realtimeSpeed * 3.6).toFixed(1)} km/h</p>
                {split.heartRate && <p>HR: {split.heartRate} bpm</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last Splits Comparison Card - Only show if there are splits */}
      {lastSplits.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Recent Splits Analysis</h3>
          <div className="space-y-2">
            {lastSplits.map((split, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 border-b last:border-b-0"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Split {split.splitNumber}
                    </span>
                    <span
                      className={`text-sm ${
                        split.speedTrend > 0
                          ? "text-green-500"
                          : split.speedTrend < 0
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {split.speedTrend > 0
                        ? "↑"
                        : split.speedTrend < 0
                        ? "↓"
                        : "→"}
                      {Math.abs(split.speedTrend)} km/h
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-sm text-gray-600">
                    <div>
                      <span className="block text-xs text-gray-500">
                        Distance
                      </span>
                      {split.splitDistance.toFixed(2)}km
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Pace</span>
                      {formatPace(split.splitPace)}
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Speed</span>
                      {(split.realtimeSpeed * 3.6).toFixed(1)} km/h
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto Splits Settings Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Auto Splits</h3>
            <p className="text-sm text-gray-600">
              {autoSplitsEnabled
                ? "Automatically recording splits every 1km"
                : "Manual split recording"}
            </p>
          </div>
          <Switch
            checked={autoSplitsEnabled}
            onCheckedChange={setAutoSplitsEnabled}
            className="ml-4"
          />
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-2 flex justify-between items-center">
        <Activity className="h-6 w-6 text-primary-500" />
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Record</span>
          <div className="flex space-x-1">
            {ACTIVITY_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={
                  selectedActivity === type.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedActivity(type.value)}
                disabled={isTracking}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
          <Settings className="h-6 w-6 text-gray-600" />
        </Button>
      </div>

      {/* Add SettingsDialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 relative">
        {selectedView === "map" && (
          <CesiumMap
            onMapInitialized={(viewerInstance) => {
              viewer.current = viewerInstance;
            }}
            onError={setError}
            currentMapStyle={currentMapStyle}
            onMapStyleChange={setCurrentMapStyle}
            routePositions={route}
            isTracking={isTracking}
            gpsSignal={gpsSignal}
            cesiumIonToken={CESIUM_ION_TOKEN}
          />
        )}
        {selectedView === "stats" && (
          <ActivityStats
            distance={distance}
            duration={duration}
            averagePace={averagePace}
            isExpanded={isStatsExpanded}
            onToggleExpansion={toggleStatsExpansion}
            formatDuration={formatDuration}
            formatPace={formatPace}
          />
        )}{" "}
        {selectedView === "details" && renderDetails()}
        {renderHeartRateInfo()}
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t border-gray-200">
        {/* View Toggle */}
        <div className="flex justify-around py-2">
          {VIEWS.map((view) => (
            <Button
              key={view.value}
              variant={selectedView === view.value ? "default" : "ghost"}
              onClick={() => setSelectedView(view.value)}
              className="flex flex-col items-center"
            >
              {view.icon}
              <span className="text-xs mt-1">{view.label}</span>
            </Button>
          ))}
        </div>

        {/* Activity Controls */}
        <ActivityControls
          isTracking={isTracking}
          isPaused={isPaused}
          gpsSignal={gpsSignal}
          onStart={startTracking}
          onPause={pauseTracking}
          onResume={resumeTracking}
          onStop={stopTracking}
          onSplit={recordSplit}
          showFinishDialog={showFinishDialog}
          setShowFinishDialog={setShowFinishDialog}
          onFinish={finishActivity}
        />
      </div>
    </div>
  );
};

export default ActivityTracker;
