// src/constants/mapStyles.js
import * as Cesium from 'cesium';

export const MAP_STYLES = {
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
