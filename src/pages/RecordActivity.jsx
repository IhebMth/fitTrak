import { useState, useEffect, useRef } from 'react';
import { Ion, Viewer, Color, Cartesian3 } from 'cesium';
import { HeartRateService } from '../services/HeartRateServices';
import { Play, Square, Layers, Heart, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Import the token from config
import { CESIUM_ION_TOKEN } from '../config/cesium-config';

const INITIAL_CAMERA_HEIGHT = 1000;
const MAP_STYLES = {
  satellite: {
    name: 'Satellite',
    assetId: 2
  },
  terrain: {
    name: 'Terrain',
    assetId: 3
  },
  osm: {
    name: 'Street Map',
    assetId: 4
  }
};

const RecordActivity = () => {
  // State management for tracking
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [averagePace, setAveragePace] = useState(null);
  const [lastSplit, setLastSplit] = useState(null);
  const [totalAscent, setTotalAscent] = useState(0);
  const [currentMapStyle, setCurrentMapStyle] = useState('satellite');
  const [error, setError] = useState(null);

  // Heart rate state
  const [heartRate, setHeartRate] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isHeartRateConnected, setIsHeartRateConnected] = useState(false);

  // Refs
  const cesiumContainer = useRef(null);
  const viewer = useRef(null);
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const routeEntity = useRef(null);
  const heartRateServiceRef = useRef(null);

  // Initialize Cesium viewer
  useEffect(() => {
    if (!viewer.current && cesiumContainer.current) {
      Ion.defaultAccessToken = CESIUM_ION_TOKEN;
  
      viewer.current = new Viewer(cesiumContainer.current, {
        // terrainProvider: Cesium.Ion.createWorldTerrain(),

terrainProvider: new Cesium.CesiumTerrainProvider({
          url: 'https://assets.agi.com/stk-terrain/v1/1/1',
        }),        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        sceneModePicker: true,
        timeline: false,
        animation: false,
        fullscreenButton: false,
      });
  
      // Set initial imagery
      updateMapStyle('satellite');
  
      // Create route entity
      routeEntity.current = viewer.current.entities.add({
        polyline: {
          positions: new Cartesian3(),
          width: 3,
          material: Color.RED,
          clampToGround: true,
        },
      });
  
      // Enable terrain
      viewer.current.scene.globe.enableLighting = true;
      viewer.current.scene.globe.terrainExaggeration = 1.0;
    }
  
    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, []);
  
  const updateMapStyle = () => {
    if (!viewer.current) return;
  
    viewer.current.imageryLayers.removeAll();
  
    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url : "" // Use the appropriate URL or provider for your style
    });
  
    viewer.current.imageryLayers.addImageryProvider(imageryProvider);
  };

  
//   const updateMapStyle = (style) => {
//     if (!viewer.current) return;
    
//     viewer.current.imageryLayers.removeAll();
//     viewer.current.imageryLayers.addImageryProvider(
//       Ion.createImageryProvider({
//         assetId: MAP_STYLES[style].assetId
//       })
//     );
//   };

  const cycleMapStyle = () => {
    const styles = Object.keys(MAP_STYLES);
    const currentIndex = styles.indexOf(currentMapStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setCurrentMapStyle(nextStyle);
    updateMapStyle(nextStyle);
  };

  const connectHeartRate = async () => {
    try {
      if (!heartRateServiceRef.current) {
        heartRateServiceRef.current = new HeartRateService();
      }

      await heartRateServiceRef.current.connect();
      setIsHeartRateConnected(true);
      
      heartRateServiceRef.current.setBatteryCallback(setBatteryLevel);
      await heartRateServiceRef.current.startNotifications(setHeartRate);
    } catch (err) {
      setError(`Heart Rate Error: ${err.message}`);
      setIsHeartRateConnected(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const updateRouteVisualization = (positions) => {
    if (!viewer.current || !routeEntity.current) return;

    const cartesianPositions = positions.map(pos => 
      Cartesian3.fromDegrees(pos.lng, pos.lat, pos.elevation || 0)
    );
    
    routeEntity.current.polyline.positions = cartesianPositions;

    if (positions.length > 0) {
      const lastPos = positions[positions.length - 1];
      viewer.current.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          lastPos.lng,
          lastPos.lat,
          INITIAL_CAMERA_HEIGHT
        ),
        duration: 0
      });
    }
  };

  const startTracking = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported');
      }

      if (!isHeartRateConnected) {
        await connectHeartRate();
      }

      setIsTracking(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      setError(null);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start position tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            elevation: position.coords.altitude,
            timestamp: position.timestamp
          };

          setRoute(prev => {
            const newRoute = [...prev, newPosition];
            updateRouteVisualization(newRoute);
            
            if (prev.length > 0) {
              const lastPos = prev[prev.length - 1];
              const newDistance = calculateDistance(
                lastPos.lat, lastPos.lng,
                newPosition.lat, newPosition.lng
              );
              
              if (newPosition.elevation && lastPos.elevation) {
                const elevationDiff = newPosition.elevation - lastPos.elevation;
                if (elevationDiff > 0) {
                  setTotalAscent(prev => prev + elevationDiff);
                }
              }
              
              setDistance(d => {
                const newTotalDistance = d + newDistance;
                if (duration > 0) {
                  const currentPace = (duration / 60) / (newTotalDistance / 1000);
                  setAveragePace(currentPace);
                  if (newTotalDistance >= 1000) {
                    setLastSplit(currentPace);
                  }
                }
                return newTotalDistance;
              });
            }
            return newRoute;
          });
        },
        (err) => setError(`Location error: ${err.message}`),
        { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const pauseTracking = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsPaused(true);
  };

  const resumeTracking = () => {
    startTracking();
    setIsPaused(false);
  };

  const stopTracking = () => {
    pauseTracking();
    setShowFinishDialog(true);
  };

  const finishActivity = async () => {
    const activity = {
      route,
      distance,
      duration,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      totalAscent,
      averagePace,
      heartRateData: {
        average: heartRate,
        battery: batteryLevel
      }
    };
    
    // Here you would implement saving to your backend
    console.log('Activity completed:', activity);
    
    if (heartRateServiceRef.current) {
      await heartRateServiceRef.current.disconnect();
      setIsHeartRateConnected(false);
    }
    
    // Reset state
    setIsTracking(false);
    setShowFinishDialog(false);
    setRoute([]);
    setDistance(0);
    setDuration(0);
    setTotalAscent(0);
    setAveragePace(null);
    setLastSplit(null);
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    if (!pace) return '--:--';
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  // Cleanup
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

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 relative">
        <div ref={cesiumContainer} className="h-full w-full" />
        
        <Button
          onClick={cycleMapStyle}
          className="absolute top-4 right-4 z-10 bg-white shadow-lg"
          title={`Current style: ${MAP_STYLES[currentMapStyle].name}`}
        >
          <Layers className="h-5 w-5" />
        </Button>
        
        {error && (
          <div className="absolute top-4 left-4 z-10 bg-red-100 text-red-700 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      <Card className="rounded-none border-t-2">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold">{formatDuration(duration)}</div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{formatPace(averagePace)}</div>
              <div className="text-sm text-gray-500">Average Pace</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{(distance / 1000).toFixed(2)}</div>
              <div className="text-sm text-gray-500">Distance (km)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatPace(lastSplit)}</div>
              <div className="text-sm text-gray-500">Last Split</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(totalAscent)}m</div>
              <div className="text-sm text-gray-500">Elevation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center">
                <Heart className={`h-4 w-4 mr-1 ${isHeartRateConnected ? 'text-red-500' : 'text-gray-400'}`} />
                {heartRate || '--'}
                {batteryLevel && <span className="text-xs ml-1">({batteryLevel}%)</span>}
              </div>
              <div className="text-sm text-gray-500">BPM</div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {!isTracking ? (
              <Button
                onClick={startTracking}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4"
              >
                <Play className="h-6 w-6" />
              </Button>
            ) : isPaused ? (
              <Button
                onClick={resumeTracking}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4"
              >
                <Play className="h-6 w-6" />
              </Button>
            ) : (
              // ... [Previous code remains exactly the same until the Button onClick={stopTracking}]

              <Button
                onClick={stopTracking}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-4"
              >
                <Square className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Activity?</DialogTitle>
            <DialogDescription>
              Would you like to save or discard this activity?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowFinishDialog(false);
                resumeTracking();
              }}
            >
              Resume
            </Button>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={finishActivity}
            >
              <Check className="h-4 w-4 mr-2" />
              Save Activity
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordActivity;