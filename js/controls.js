// js/controls.js
import { loadBusData } from "./dataLoader.js";
import { drawPieCharts } from "./visualization.js";
import { calculateAngle, getLineWidth } from "./utils.js";
import { showTooltip, hideTooltip } from "./tooltip.js";

/**
 * Registers all control-related event listeners.
 * @param {Object} mapInstance - The Leaflet map instance.
 * @param {Object} svg - The SVG element.
 * @param {Object} g - The group (`g`) element within SVG.
 * @param {Object} busData - The processed bus data.
 */
export const registerControlEvents = (mapInstance, svg, g, busData) => {
  // Toggle Pie Charts Layer
  const togglePieChartsLayerBtn = document.getElementById(
    "togglePieChartsLayer",
  );
  if (togglePieChartsLayerBtn) {
    togglePieChartsLayerBtn.addEventListener("click", () => {
      console.log("Toggle Pie Charts button clicked");
      const pieCharts = document.querySelectorAll(".bus-pie");
      pieCharts.forEach((el) => {
        el.style.display = el.style.display === "none" ? "block" : "none";
      });
      // Update the text inside the span without affecting the icon
      const buttonText = togglePieChartsLayerBtn.querySelector("span");
      if (buttonText) {
        const isHidden = buttonText.textContent.trim().startsWith("Show");
        buttonText.textContent = isHidden
          ? " Hide Pie Charts"
          : " Show Pie Charts";
      } else {
        console.error("Button text span not found.");
      }
    });
  }

  // Year selection for Pie Charts
  const yearSelect = document.getElementById("yearSelect_output");
  if (yearSelect) {
    yearSelect.addEventListener("change", async (event) => {
      const selectedYear = event.target.value;
      console.log("Year changed to:", selectedYear);
      busData = await loadBusData("data/geninvscumulative.csv", selectedYear);
      drawPieCharts(busData, svg, g);
    });
  }

  // Toggle Legend
  const toggleLegendBtn = document.getElementById("toggleLegend");
  if (toggleLegendBtn) {
    let legendVisible = true;
    toggleLegendBtn.addEventListener("click", () => {
      legendVisible = !legendVisible;
      window.d3
        .select(".legend")
        .style("display", legendVisible ? "block" : "none");
      const legendButtonText = toggleLegendBtn.querySelector("span");
      if (legendButtonText) {
        legendButtonText.textContent = legendVisible
          ? " Hide Legend"
          : " Show Legend";
      }
    });
  }

  // Reset Map View
  const resetMapViewBtn = document.getElementById("resetMapView");
  if (resetMapViewBtn) {
    resetMapViewBtn.addEventListener("click", () => {
      mapInstance.setView([40.26733719176847, -76.90051525182278], 7);
      console.log("Map view reset to default.");
    });
  }

  // Toggle Lines Layer
  const toggleLinesLayerBtn = document.getElementById("toggleLinesLayer");
  if (toggleLinesLayerBtn) {
    let linesVisible = true;
    toggleLinesLayerBtn.addEventListener("click", () => {
      if (linesVisible) {
        mapInstance.removeLayer(mapInstance.markersLayer_line);
        console.log("Flow lines hidden.");
      } else {
        mapInstance.addLayer(mapInstance.markersLayer_line);
        console.log("Flow lines shown.");
      }
      linesVisible = !linesVisible;
    });
  }

  // Stop Animation
  const stopAnimationBtn = document.getElementById("stopAnimation");
  if (stopAnimationBtn) {
    let stopLoop = false;
    let intervalId;
    stopAnimationBtn.addEventListener("click", () => {
      stopLoop = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      console.log("Animation stopped.");
    });
  }

  // Show Results
  const showResultsBtn = document.getElementById("showResults");
  if (showResultsBtn) {
    showResultsBtn.addEventListener("click", () => {
      showMarkers_line(mapInstance, busData);
    });
  }

  // Animate Results
  const animateResultsBtn = document.getElementById("animateResults");
  if (animateResultsBtn) {
    animateResultsBtn.addEventListener("click", () => {
      const selectedValues = getSelectedValues();
      visualizeAllCombinationsWithDelay(
        selectedValues.year,
        selectedValues.season,
        selectedValues.block,
        mapInstance,
        svg,
        g,
        busData,
      );
      console.log("Started visualizing all combinations.");
    });
  }

  // Clear Button
  const clearButton = document.getElementById("clearButton");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      // Clear all layers from the map
      mapInstance.markersLayer_line.clearLayers();

      // Reset dropdowns
      const yearSelect = document.getElementById("yearSelect_output");
      const seasonSelect = document.getElementById("seasonSelect_output");
      const blockSelect = document.getElementById("blockSelect_output");
      if (yearSelect) yearSelect.value = "TITLE";
      if (seasonSelect) seasonSelect.value = "TITLE";
      if (blockSelect) blockSelect.value = "TITLE";

      // Clear messages
      const messageYear = document.getElementById("messageYear_output");
      const messageSeason = document.getElementById("messageSeason_output");
      const messageBlock = document.getElementById("messageBlock_output");
      const messageOutput = document.getElementById("message_output");
      if (messageYear) messageYear.textContent = "";
      if (messageSeason) messageSeason.textContent = "";
      if (messageBlock) messageBlock.textContent = "";
      if (messageOutput) messageOutput.textContent = "";

      // Clear info box if present
      if (window.infoBox && window.infoBox._div) {
        window.infoBox._div.innerHTML = "";
      }

      console.log("Map cleared and controls reset.");
    });
  }
};

/**
 * Shows markers and flows on the map based on selected values.
 * @param {Object} mapInstance - The Leaflet map instance.
 * @param {Object} busData - The processed bus data.
 */
export const showMarkers_line = (mapInstance, busData) => {
  const tempLayer = L.layerGroup();
  const selectedValues = getSelectedValues();
  displayMessages(selectedValues);

  if (Object.values(selectedValues).some((value) => value === "TITLE")) {
    return;
  }

  // Filter the flowData based on selected values
  const filteredData = window.flowData.filter(
    (row) =>
      row.year == selectedValues.year &&
      row.season == selectedValues.season &&
      row.block == selectedValues.block,
  );

  const messageElement = document.getElementById("message_output");
  if (filteredData.length === 0) {
    if (messageElement) {
      messageElement.textContent = "There is no flow in this combination.";
    }
  } else {
    if (messageElement) {
      messageElement.textContent = "";
    }
    createMapElementsToLayer(filteredData, tempLayer, mapInstance);
    tempLayer.addTo(mapInstance);
    mapInstance.markersLayer_line = tempLayer;
  }
};

/**
 * Creates map elements (markers, polylines) based on filtered data.
 * @param {Array<Object>} filteredData - The filtered flow data.
 * @param {Object} layer - The Leaflet layer group to add elements to.
 * @param {Object} mapInstance - The Leaflet map instance.
 */
const createMapElementsToLayer = (filteredData, layer, mapInstance) => {
  filteredData.forEach((row) => {
    createCircleMarker(
      [row.latitude_i, row.longitude_i],
      "red",
      row.from,
      layer,
    );
    createCircleMarker(
      [row.latitude_j, row.longitude_j],
      "blue",
      row.to,
      layer,
    );
    createPolyline(row, layer, mapInstance);
    const flowMarker = createFlowMarker(row, layer, mapInstance);
    moveMarker(row, flowMarker, mapInstance);
  });
};

/**
 * Creates a circle marker on the map.
 * @param {Array<number>} coords - The [latitude, longitude] coordinates.
 * @param {string} color - The color of the marker.
 * @param {string} popupContent - The content for the popup.
 * @param {Object} layer - The Leaflet layer group to add the marker to.
 * @returns {Object} - The created Leaflet circle marker.
 */
const createCircleMarker = (coords, color, popupContent, layer) => {
  const marker = L.circleMarker(coords, {
    radius: 2,
    color,
    fillOpacity: 1,
  }).addTo(layer);
  marker.bindPopup(popupContent.toString());
  return marker;
};

/**
 * Creates a polyline between two points on the map.
 * @param {Object} row - The flow data row.
 * @param {Object} layer - The Leaflet layer group to add the polyline to.
 * @param {Object} mapInstance - The Leaflet map instance.
 * @returns {Object} - The created Leaflet polyline.
 */
const createPolyline = (row, layer, mapInstance) => {
  const lineWeight = getLineWidth(row.level.toFixed(1));

  const polyline = L.polyline(
    [
      [row.latitude_i, row.longitude_i],
      [row.latitude_j, row.longitude_j],
    ],
    { color: "black", weight: lineWeight, opacity: 0.4 },
  ).addTo(layer);

  const interactivePolyline = L.polyline(
    [
      [row.latitude_i, row.longitude_i],
      [row.latitude_j, row.longitude_j],
    ],
    {
      color: "transparent",
      weight: lineWeight + 10,
      opacity: 0,
      interactive: true,
    },
  ).addTo(layer);

  const customTooltip = L.tooltip({ direction: "auto", opacity: 0.7 });

  interactivePolyline.on("mouseover", (e) => {
    customTooltip.setContent("Level: " + row.level.toFixed(1));
    customTooltip.setLatLng(e.latlng).addTo(mapInstance);
  });

  interactivePolyline.on("mouseout", () => {
    mapInstance.closeTooltip(customTooltip);
  });

  return polyline;
};

/**
 * Creates a flow marker with rotation.
 * @param {Object} row - The flow data row.
 * @param {Object} layer - The Leaflet layer group to add the marker to.
 * @param {Object} mapInstance - The Leaflet map instance.
 * @returns {Object} - The created Leaflet marker.
 */
const createFlowMarker = (row, layer, mapInstance) => {
  const iconSize = [20, 20];
  const iconAnchor = [iconSize[0] / 2, iconSize[1] / 2];
  return L.marker([row.latitude_i, row.longitude_i], {
    icon: L.icon({
      iconUrl: "assets/back_curve.png", // Ensure this file exists in your project directory
      iconSize,
      iconAnchor,
    }),
    rotationAngle: calculateAngle(
      row.latitude_i,
      row.longitude_i,
      row.latitude_j,
      row.longitude_j,
    ),
  }).addTo(layer);
};

/**
 * Animates the movement of a marker along a flow.
 * @param {Object} set - The flow data row.
 * @param {Object} marker - The Leaflet marker to animate.
 * @param {Object} mapInstance - The Leaflet map instance.
 */
const moveMarker = (set, marker, mapInstance) => {
  const steps = 50;
  const forward = true;
  const latStep = forward
    ? (set.latitude_j - set.latitude_i) / steps
    : (set.latitude_i - set.latitude_j) / steps;
  const lonStep = forward
    ? (set.longitude_j - set.longitude_i) / steps
    : (set.longitude_i - set.longitude_j) / steps;
  let stepIndex = 0;
  const moveInterval = setInterval(() => {
    if (stepIndex >= steps) {
      clearInterval(moveInterval);
      stepIndex = 0;
      moveMarker(set, marker, mapInstance);
      return;
    }
    const newLat = forward
      ? set.latitude_i + latStep * stepIndex
      : set.latitude_j + latStep * stepIndex;
    const newLon = forward
      ? set.longitude_i + lonStep * stepIndex
      : set.longitude_j + lonStep * stepIndex;
    marker.setLatLng([newLat, newLon]);
    marker.setRotationAngle(
      calculateAngle(newLat, newLon, set.latitude_j, set.longitude_j),
    );
    marker.update();
    stepIndex++;
  }, 20); // Adjusted interval for smoother animation
};

/**
 * Retrieves the selected values from the dropdowns.
 * @returns {Object} - An object containing selected year, season, and block.
 */
const getSelectedValues = () => ({
  year: document.getElementById("yearSelect_output").value,
  season: document.getElementById("seasonSelect_output").value,
  block: document.getElementById("blockSelect_output").value,
});

/**
 * Displays validation messages based on selected values.
 * @param {Object} selectedValues - The selected year, season, and block.
 */
const displayMessages = (selectedValues) => {
  const messages = {
    Year_output: "Please choose the Year.",
    Season_output: "Please choose the Season.",
    Block_output: "Please choose the Block.",
  };
  Object.entries(selectedValues).forEach(([key, value]) => {
    const messageElement = document.getElementById(`message${key}`);
    if (messageElement) {
      messageElement.textContent = value === "TITLE" ? messages[key] : "";
    }
  });
};

/**
 * Visualizes all combinations with a delay between each visualization.
 * @param {string} startYear - The starting year.
 * @param {string} startSeason - The starting season.
 * @param {string} startBlock - The starting block.
 * @param {Object} mapInstance - The Leaflet map instance.
 * @param {Object} svg - The SVG element.
 * @param {Object} g - The group (`g`) element within SVG.
 * @param {Object} busData - The processed bus data.
 */
export const visualizeAllCombinationsWithDelay = (
  startYear,
  startSeason,
  startBlock,
  mapInstance,
  svg,
  g,
  busData,
) => {
  const { years, seasons, blocks } = getAllPossibleValues();
  const combinations = []; // Reset combinations array

  years.forEach((year) => {
    seasons.forEach((season) => {
      blocks.forEach((block) => {
        combinations.push({ year, season, block });
      });
    });
  });

  let index = combinations.findIndex(
    (comb) =>
      comb.year == startYear &&
      comb.season == startSeason &&
      comb.block == startBlock,
  );

  if (index === -1) index = 0;

  let stopLoop = false;

  const visualizeWithDelay = () => {
    if (index >= combinations.length || stopLoop) return;

    const { year, season, block } = combinations[index];
    document.getElementById("yearSelect_output").value = year;
    document.getElementById("seasonSelect_output").value = season;
    document.getElementById("blockSelect_output").value = block;

    // Update the information box
    updateInfoBox(year, season, block);

    showMarkers_line(mapInstance, busData);

    index++;

    setTimeout(visualizeWithDelay, 10000); // 10 seconds delay
  };

  visualizeWithDelay();
};

/**
 * Updates the information box on the map.
 * @param {string} year - The selected year.
 * @param {string} season - The selected season.
 * @param {string} block - The selected block.
 */
const updateInfoBox = (year, season, block) => {
  const mapInstance = window.mapInstance;
  // If the infoBox does not exist, create it
  if (!window.infoBox) {
    window.infoBox = L.control({ position: "topright" });
    window.infoBox.onAdd = function () {
      const div = L.DomUtil.create("div", "info-box");
      div.style.background = "white";
      div.style.padding = "10px";
      div.style.border = "1px solid black";
      div.style.zIndex = "1000"; // Ensure it's above other elements
      div.style.margin = "10px"; // Offset it from the map edge
      this._div = div;
      return div;
    };
    window.infoBox.addTo(mapInstance);
  }
  // Update the content of the info box
  window.infoBox._div.innerHTML = `<strong>Year:</strong> ${year}<br><strong>Season:</strong> ${season}<br><strong>Block:</strong> ${block}`;
};

/**
 * Retrieves all possible values from the dropdowns.
 * @returns {Object} - An object containing arrays of years, seasons, and blocks.
 */
const getAllPossibleValues = () => {
  const years = Array.from(document.getElementById("yearSelect_output").options)
    .map((option) => option.value)
    .filter((value) => value !== "TITLE");
  const seasons = Array.from(
    document.getElementById("seasonSelect_output").options,
  )
    .map((option) => option.value)
    .filter((value) => value !== "TITLE");
  const blocks = Array.from(
    document.getElementById("blockSelect_output").options,
  )
    .map((option) => option.value)
    .filter((value) => value !== "TITLE");
  return { years, seasons, blocks };
};
