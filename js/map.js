// js/map.js

/**
 * Initializes the Leaflet map.
 * @returns {Object} - The initialized Leaflet map instance.
 */
export const initMap = () => {
  const map = L.map("map").setView([40.26733719176847, -76.90051525182278], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    minZoom: 5,
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Initialize markers layer
  map.markersLayer_line = L.layerGroup().setZIndex(2);
  map.markersLayer_line.addTo(map);

  return map;
};

/**
 * Initializes the SVG overlay using D3.
 * @param {Object} mapInstance - The Leaflet map instance.
 * @returns {Object} - An object containing the SVG and group (`g`) elements.
 */
export const initSVGOverlay = (mapInstance) => {
  console.log("Initializing SVG overlay...");
  const svg = window.d3
    .select(mapInstance.getPanes().overlayPane)
    .append("svg");
  const g = svg.append("g").attr("class", "leaflet-zoom-hide");
  return { svg, g };
};
