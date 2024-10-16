// js/main.js
import { initMap, initSVGOverlay } from "./map.js";
import { loadBusData, loadFlowData } from "./dataLoader.js";
import { drawPieCharts } from "./visualization.js";
import {
  registerControlEvents,
  showMarkers_line,
  visualizeAllCombinationsWithDelay,
} from "./controls.js";
import { initTooltip } from "./tooltip.js";
import { hideTooltip } from "./tooltip.js";

/**
 * Initializes the application by setting up the map, loading data, and registering controls.
 */
/*
const init = async () => {
  console.log("Initializing application...");

  // Initialize Map and Overlays
  window.mapInstance = initMap();
  const { svg, g } = initSVGOverlay(window.mapInstance);

  // Initialize Tooltip
  initTooltip();

  // Register Map Events (Zoom and Move)
  window.mapInstance.on("zoomend moveend", () => {
    drawPieCharts(window.busData, svg, g);
  });
  window.mapInstance.on("click", hideTooltip);

  // Initialize Legend
  initLegend();

  // Load and Visualize Bus Data
  window.busData = await loadBusData("data/geninvscumulative.csv", "2031");
  drawPieCharts(window.busData, svg, g);

  // Load Flow Data
  window.flowData = await loadFlowData("data/flows.csv");
  setupSeasonBlockMapping();

  // Register Control Events
  registerControlEvents(window.mapInstance, svg, g, window.busData);

  // Initialize jQuery UI Components
  initializeJQueryUI();
};
*/

const init = async () => {
  console.log("Initializing application...");

  // Initialize Map and Overlays
  window.mapInstance = initMap();
  const { svg, g } = initSVGOverlay(window.mapInstance);

  // Initialize Tooltip
  initTooltip();

  // Register Map Events (Zoom and Move)
  window.mapInstance.on("zoomend moveend", () => {
    if (window.busData) {
      // Ensure busData exists before drawing pie charts
      drawPieCharts(window.busData, svg, g);
    }
  });
  window.mapInstance.on("click", hideTooltip);

  // Initialize Legend
  initLegend();

  // Load Flow Data
  window.flowData = await loadFlowData("data/flows.csv");
  setupSeasonBlockMapping();

  // Register Control Events
  registerControlEvents(window.mapInstance, svg, g);

  // Initialize jQuery UI Components
  initializeJQueryUI();

  // Do NOT load bus data or draw pie charts here
};

init();

/**
 * Initializes the legend on the map.
 */
const initLegend = () => {
  console.log("Initializing legend...");
  const legend = window.d3.select("#map").append("div").attr("class", "legend");
  legend.append("h3").text("Technology Legend");

  const labelColors = {
    Biomass: "#5D4037",
    CC: "#FF9800",
    CoalST: "#795548",
    GasCT: "#FFD54F",
    GasGT: "#FFC107",
    GasST: "#FF5722",
    Hydro: "#0288D1",
    Nuclear: "#9C27B0",
    OilGT: "#455A64",
    OilST: "#37474F",
    PS: "#03A9F4",
    STO: "#607D8B",
    Solar: "#FFEB3B",
    WOff: "#4CAF50",
    Wind: "#388E3C",
    Other: "#9E9E9E",
  };

  Object.keys(labelColors).forEach((tech) => {
    const item = legend.append("div").attr("class", "legend-item");
    item
      .append("span")
      .attr("class", "legend-color")
      .style("background-color", labelColors[tech]);
    item.append("span").attr("class", "legend-label").text(tech);
  });
};

/**
 * Sets up the mapping between seasons and blocks.
 */
const setupSeasonBlockMapping = () => {
  const flowData = window.flowData;
  window.seasonBlockMapping = flowData.reduce((acc, row) => {
    const season = row.season;
    const block = row.block;

    if (!acc[season]) {
      acc[season] = new Set();
    }

    acc[season].add(block);

    return acc;
  }, {});

  Object.keys(window.seasonBlockMapping).forEach((season) => {
    window.seasonBlockMapping[season] = Array.from(
      window.seasonBlockMapping[season],
    );
  });

  setupSeasonDropdownListener();
};

/**
 * Sets up the season dropdown listener to update block options.
 */
const setupSeasonDropdownListener = () => {
  const seasonSelect = document.getElementById("seasonSelect_output");
  seasonSelect.addEventListener("change", (event) => {
    const selectedSeason = event.target.value;
    updateBlockOptions(selectedSeason);
  });

  // Populate block options on initial load
  updateBlockOptions(seasonSelect.value);
};

/**
 * Updates the block options based on the selected season.
 * @param {string} selectedSeason - The selected season.
 */
const updateBlockOptions = (selectedSeason) => {
  const blockSelect = document.getElementById("blockSelect_output");
  blockSelect.innerHTML = ""; // Clear existing options

  if (window.seasonBlockMapping[selectedSeason]) {
    window.seasonBlockMapping[selectedSeason].forEach((block) => {
      const option = document.createElement("option");
      option.value = block;
      option.textContent = block;
      blockSelect.appendChild(option);
    });
    blockSelect.disabled = false;
  } else {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No available blocks";
    blockSelect.appendChild(option);
    blockSelect.disabled = true;
  }
};

/**
 * Initializes jQuery UI components like draggable and tabs.
 */
const initializeJQueryUI = () => {
  window.$(function () {
    // Make the control panel draggable
    window.$("#controlPanel").draggable();
    // Initialize the tabs
    window.$(".tabs").tabs();

    // Toggle between Pause and Play buttons
    window.$("#pauseAnimation").on("click", function () {
      window.$(this).hide();
      window.$("#playAnimation").show();
    });

    window.$("#playAnimation").on("click", function () {
      window.$(this).hide();
      window.$("#pauseAnimation").show();
    });

    // Update dropdown visibility based on visualization type selection
    window.$("#output-select").on("change", function () {
      const selectedValue = window.$(this).val();
      if (
        selectedValue === "lineFlows" ||
        selectedValue === "generationDispatch"
      ) {
        window.$("#yearSelectGroup").show();
        window.$("#seasonSelectGroup").show();
        window.$("#blockSelectGroup").show();
      } else {
        window.$("#yearSelectGroup").show();
        window.$("#seasonSelectGroup").hide();
        window.$("#blockSelectGroup").hide();
      }
    });
  });
};

// Start the Application
init();
