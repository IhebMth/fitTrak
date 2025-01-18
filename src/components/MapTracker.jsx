import  { useState, useEffect, useRef } from 'react';
import { Ion, Viewer, Entity, ImageryLayer } from 'cesium';
import { Navigation2, Play, Square, Save, Layers, Heart, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Set your Cesium ion access token
Ion.defaultAccessToken = 'your_cesium_ion_access_token';

const ActivityTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [heartRate, setHeartRate] = useState(null);
  const [isHeartRateConnected, setIsHeartRateConnected] = useState(false);
  const [mapStyle, setMapStyle] = useState('satellite');
  const [averagePace, setAveragePace] = useState(null);
  const [lastSplit, setLastSplit] = useState(null);
  const [error, setError] = useState(null);
  const [elevation, setElevation] = useState(0);
  const [totalAscent, setTotalAscent] = useState(0);

  const cesiumContainer = useRef(null);
  const viewer = useRef(null);
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const routeEntity = useRef(null);

  // Initialize Cesium viewer
  useEffect(() => {
    if (!viewer.current && cesiumContainer.current) {
      viewer.current = new Viewer(cesiumContainer.current, {
        terrainProvider: Ion.createWorldTerrain(),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        sceneModePicker: true,
        timeline: false,
        animation: false
      });

      routeEntity.current = viewer.current.entities.add({
        polyline: {
          positions: [],
          width: 3,
          material: Ion.Color.RED,
          clampToGround: true
        }
      });
    }

    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, []);

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

  const updateRouteOnMap = (positions) => {
    if (viewer.current && routeEntity.current) {
      const cartesianPositions = positions.map(pos => 
        Ion.Cartesian3.fromDegrees(pos.lng, pos.lat, pos.elevation || 0)
      );
      
      routeEntity.current.polyline.positions = cartesianPositions;
      
      if (positions.length > 0) {
        const lastPos = positions[positions.length - 1];
        viewer.current.camera.flyTo({
          destination: Ion.Cartesian3.fromDegrees(
            lastPos.lng,
            lastPos.lat,
            1000
          ),
          duration: 0
        });
      }
    }
  };

  const toggleMapStyle = () => {
    const styles = ['satellite', 'osm', 'dark'];
    setMapStyle(prev => {
      const currentIndex = styles.indexOf(prev);
      const nextIndex = (currentIndex + 1) % styles.length;
      
      if (viewer.current) {
        viewer.current.scene.globe.enableLighting = styles[nextIndex] === 'dark';
        viewer.current.imageryLayers.removeAll();
        
        switch (styles[nextIndex]) {
          case 'satellite':
            viewer.current.imageryLayers.addImageryProvider(
              new Ion.ImageryProvider({ assetId: 3 })
            );
            break;
          case 'osm':
            viewer.current.imageryLayers.addImageryProvider(
              new Ion.ImageryProvider({ assetId: 4 })
            );
            break;
          case 'dark':
            viewer.current.imageryLayers.addImageryProvider(
              new Ion.ImageryProvider({ assetId: 5 })
            );
            break;
        }
      }
      
      return styles[nextIndex];
    });
  };

  const startTracking = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported');
      }

      setIsTracking(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      setError(null);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            elevation: position.coords.altitude,
            timestamp: position.timestamp
          };

          setCurrentPosition(newPosition);
          setRoute(prev => {
            const newRoute = [...prev, newPosition];
            updateRouteOnMap(newRoute);
            
            if (prev.length > 0) {
              const lastPos = prev[prev.length - 1];
              const newDistance = calculateDistance(
                lastPos.lat, lastPos.lng,
                newPosition.lat, newPosition.lng
              );
              
              // Update elevation stats
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

  const finishActivity = () => {
    const activity = {
      route,
      distance,
      duration,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      totalAscent,
      averagePace,
      heartRate
    };
    
    console.log('Saving activity:', activity);
    // Here you would send the activity to your backend
    
    setIsTracking(false);
    setShowFinishDialog(false);
    setRoute([]);
    setDistance(0);
    setDuration(0);
    setTotalAscent(0);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 relative">
        <div ref={cesiumContainer} className="h-full w-full" />
        
        <Button
          onClick={toggleMapStyle}
          className="absolute top-4 right-4 z-10 bg-white shadow-lg"
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
              className="bg-green-500 hover:bg-green-600"
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

export default ActivityTracker;