import { useEffect, useRef, useCallback } from "react";
import * as Cesium from "cesium";
import { Button } from "@/components/ui/button";
import { Layers, MapPin, Signal, AlertCircle } from "lucide-react";
import PropTypes from "prop-types";

const INITIAL_CAMERA_HEIGHT = 600;

const MAP_STYLES = {
  osm: {
    name: "Street Map",
    createProvider: () =>
      new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
      }),
  },
  satellite: {
    name: "Satellite",
    createProvider: () =>
      new Cesium.IonImageryProvider({
        assetId: 3,
      }),
  },
  terrain: {
    name: "Terrain",
    createProvider: () =>
      new Cesium.IonImageryProvider({
        assetId: 4,
      }),
  },
};

const CesiumMap = ({ 
  onMapInitialized,
  onError,
  currentMapStyle,
  onMapStyleChange,
  routePositions,
  isTracking,
  gpsSignal,
  cesiumIonToken
}) => {
  const cesiumContainer = useRef(null);
  const viewer = useRef(null);
  const routeEntity = useRef(null);

  const renderGpsStatus = () => {
    const statusIcons = {
      searching: <MapPin className="text-yellow-500" />,
      acquired: <Signal className="text-green-500" />,
      lost: <AlertCircle className="text-primary-500" />,
    };

    const statusMessages = {
      searching: "Searching for GPS",
      acquired: "GPS Signal Strong",
      lost: "GPS Signal Lost",
    };

    return (
      <div className="absolute top-4 left-4 z-10 bg-white rounded-full px-3 py-2 shadow-md flex items-center space-x-2">
        {statusIcons[gpsSignal.status]}
        <span className="text-sm">{statusMessages[gpsSignal.status]}</span>
      </div>
    );
  };

  const initializeCesiumMap = useCallback(async () => {
    if (!viewer.current && cesiumContainer.current) {
      try {
        Cesium.Ion.defaultAccessToken = cesiumIonToken;

        viewer.current = new Cesium.Viewer(cesiumContainer.current, {
          imageryProvider: MAP_STYLES[currentMapStyle].createProvider(),
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          navigationHelpButton: false,
          sceneModePicker: false,
          timeline: false,
          animation: false,
          fullscreenButton: false,
          terrainProvider: await Cesium.Terrain.fromWorldTerrain(),
          requestRenderMode: true,
          maximumRenderTimeChange: Infinity,
        });

        const scene = viewer.current.scene;
        scene.globe.enableLighting = true;
        scene.fog.enabled = true;
        scene.fog.density = 0.0002;
        scene.globe.showGroundAtmosphere = true;

        routeEntity.current = viewer.current.entities.add({
          polyline: {
            positions: new Cesium.PositionPropertyArray(),
            width: 4,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.2,
              color: Cesium.Color.fromCssColorString("#ff4081"),
            }),
            clampToGround: true,
          },
        });

        onMapInitialized(viewer.current);

      } catch (error) {
        console.error("Map initialization error:", error);
        onError(`Map initialization failed: ${error.message}`);
      }
    }
  }, [onMapInitialized, onError, currentMapStyle, cesiumIonToken]);

  useEffect(() => {
    initializeCesiumMap();

    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, [initializeCesiumMap]);

  useEffect(() => {
    if (!viewer.current) return;

    try {
      const imageryLayers = viewer.current.imageryLayers;
      imageryLayers.removeAll();
      const newProvider = MAP_STYLES[currentMapStyle].createProvider();
      imageryLayers.addImageryProvider(newProvider);
    } catch (error) {
      console.error("Error updating map style:", error);
      onError(`Failed to update map style: ${error.message}`);
    }
  }, [currentMapStyle, onError]);

  useEffect(() => {
    if (!viewer.current || !routeEntity.current || !routePositions?.length) return;

    const cartesianPositions = routePositions.map((pos) =>
      Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, pos.elevation || 0)
    );

    routeEntity.current.polyline.positions = cartesianPositions;

    if (routePositions.length > 0) {
      const lastPos = routePositions[routePositions.length - 1];
      viewer.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          lastPos.lng,
          lastPos.lat,
          INITIAL_CAMERA_HEIGHT
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0.0,
        },
        duration: 0.5,
      });
    }
  }, [routePositions]);

  return (
    <div className="flex-1 relative">
      <div ref={cesiumContainer} className="h-full w-full" />
      
      {!isTracking && renderGpsStatus()}

      {!isTracking && (
        <div className="absolute top-4 right-4 space-y-2">
          <Button
            onClick={() => {
              const styles = Object.keys(MAP_STYLES);
              const currentIndex = styles.indexOf(currentMapStyle);
              const nextStyle = styles[(currentIndex + 1) % styles.length];
              onMapStyleChange(nextStyle);
            }}
            className="bg-white shadow-lg hover:bg-gray-100"
            size="icon"
          >
            <Layers className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
      )}
    </div>
  );
};

CesiumMap.propTypes = {
  onMapInitialized: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  currentMapStyle: PropTypes.oneOf(Object.keys(MAP_STYLES)).isRequired,
  onMapStyleChange: PropTypes.func.isRequired,
  routePositions: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      elevation: PropTypes.number,
    })
  ),
  isTracking: PropTypes.bool,
  gpsSignal: PropTypes.shape({
    status: PropTypes.oneOf(["searching", "acquired", "lost"]).isRequired,
    accuracy: PropTypes.number,
  }).isRequired,
  cesiumIonToken: PropTypes.string.isRequired,
};

export default CesiumMap;