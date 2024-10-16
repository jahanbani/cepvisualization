// scripts.js

document.addEventListener("DOMContentLoaded", () => {
  // Global variables
  const globals = {
    map: null,
    markersLayer_line: L.layerGroup().setZIndex(2),
    tooltip: null,
    svg: null,
    g: null,
    busData: {},
    pieChartsVisible: true,
    intervalId: null,
    steps: 50,
    forward: true,
    seasonBlockMapping: {},
    index: 0,
    stopLoop: false,
    combinations: [],
    infoBox: null,
    linesVisible: true,
    flowData: [],
    currentDataset: "cumulative", // Tracks the selected dataset
    currentYear: "2031",
    currentSeason: "Fall",
    currentBlock: "1",
  };

  const config = {
    dataFiles: {
      cumulative: "data/geninvcumulative.csv",
      annual: "data/geninvy.csv",
      gencaptot: "data/gencaptot.csv", // Added new dataset
      genrety: "data/genrety.csv", // Added new dataset
      genretcumulative: "data/genretcumulative.csv", // Added new dataset
      gendisp: "data/gendisp.csv", // Added new dataset
      lineinvy: "data/lineinvy.csv", // Added new dataset
      lineinvcumulative: "data/lineinvcumulative.csv", // Added new dataset
    },
    flowsFile: "data/flows.csv",
    mapCenter: [40.26733719176847, -76.90051525182278],
    mapZoom: 7,
    labelColors: {
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
      Capacity: "#FF0000", // Optional: Color for Capacity
    },
  };

  // Map functions
  const mapModule = {
    initMap: () => {
      globals.map = L.map("map").setView(config.mapCenter, config.mapZoom);

      // CartoDB Positron
      // L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      //   minZoom: 5,
      //   maxZoom: 20,
      //   attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      // }).addTo(globals.map);

      // Esri World Imagery (Satellite)
      // L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      //   minZoom: 5,
      //   maxZoom: 20,
      //   attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      // }).addTo(globals.map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 5,
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(globals.map);

      globals.markersLayer_line.addTo(globals.map);
      return globals.map;
    },

    initSVGOverlay: () => {
      globals.svg = d3.select(globals.map.getPanes().overlayPane).append("svg");
      globals.g = globals.svg.append("g").attr("class", "leaflet-zoom-hide");
    },

    updatePosition: () => {
      try {
        const bounds = globals.map.getBounds();
        const topLeft = globals.map.latLngToLayerPoint(bounds.getNorthWest());
        const bottomRight = globals.map.latLngToLayerPoint(
          bounds.getSouthEast(),
        );

        globals.svg
          // .attr("width", globals.map.getSize().x)
          // .attr("height", globals.map.getSize().y)
          // .style("left", "0px")
          // .style("top", "0px");
          .attr("width", bottomRight.x - topLeft.x)
          .attr("height", bottomRight.y - topLeft.y)
          .style("left", topLeft.x + "px")
          .style("top", topLeft.y + "px");

        globals.g.attr("transform", `translate(${-topLeft.x},${-topLeft.y})`);

        // Update positions for pie charts
        d3.selectAll(".bus-pie").attr("transform", function (d) {
          let point = globals.map.latLngToLayerPoint([d.latitude, d.longitude]);
          console.log(
            `Bus ${d.bus}: (${d.latitude}, ${d.longitude}) -> (${point.x}, ${point.y})`,
          );
          return `translate(${point.x},${point.y})`;
        });

        // Update positions for capacity markers
        d3.selectAll(".bus-capacity")
          .attr("cx", function (d) {
            let point = globals.map.latLngToLayerPoint([
              d.latitude,
              d.longitude,
            ]);
            return point.x;
          })
          .attr("cy", function (d) {
            let point = globals.map.latLngToLayerPoint([
              d.latitude,
              d.longitude,
            ]);
            return point.y;
          });
      } catch (e) {
        console.error("Error updating visualization positions:", e);
      }
    },

    registerMapEvents: () => {
      globals.map.on("zoomend moveend", mapModule.updatePosition);
      globals.map.on("click", uiModule.hideTooltip);
      mapModule.updatePosition();
    },
  };

  // Data processing functions
  // const dataModule = {
  //   loadData: () => {
  //     console.log("Loading investment data...");
  //     return new Promise((resolve, reject) => {
  //       Papa.parse(config.dataFiles[globals.currentDataset], {
  //         header: true,
  //         dynamicTyping: true,
  //         skipEmptyLines: true,
  //         download: true,
  //         complete: (results) => {
  //           console.log("Investment data loaded successfully.");
  //           dataModule.processData(results.data);
  //           resolve();
  //         },
  //         error: (error) => {
  //           console.error("CSV Parsing Error:", error);
  //           alert("Error loading investment data. Please try again later.");
  //           reject(error);
  //         },
  //       });
  //     });
  //   },
  //
  //   processData: (data) => {
  //     console.log("Processing investment data...");
  //     globals.busData = {};
  //     data.forEach((row, index) => {
  //       // Validate essential fields
  //       if (
  //         !row.bus ||
  //         row.latitude === undefined ||
  //         row.longitude === undefined ||
  //         isNaN(row.latitude) ||
  //         isNaN(row.longitude)
  //       ) {
  //         console.warn(`Skipping row ${index} due to missing or invalid data.`);
  //         return;
  //       }
  //
  //       const rowYear = String(row.year).trim();
  //       const currentYearStr = String(globals.currentYear).trim();
  //
  //       if (rowYear !== currentYearStr) {
  //         return;
  //       }
  //
  //       const key = row.bus;
  //       if (!globals.busData[key]) {
  //         globals.busData[key] = {
  //           bus: row.bus,
  //           latitude: row.latitude,
  //           longitude: row.longitude,
  //           investments: {},
  //         };
  //       }
  //
  //       if (!row.tech) {
  //         console.warn(`Row ${index} missing 'tech' field. Skipping.`);
  //         return;
  //       }
  //
  //       if (!globals.busData[key].investments[row.tech]) {
  //         globals.busData[key].investments[row.tech] = 0;
  //       }
  //       globals.busData[key].investments[row.tech] += row.level;
  //     });
  //     console.log("Processed busData:", globals.busData);
  //   },

  const dataModule = {
    // loadData: () => {
    //   console.log(`Loading ${globals.currentDataset} data...`);
    //   return new Promise((resolve, reject) => {
    //     Papa.parse(config.dataFiles[globals.currentDataset], {
    //       header: true,
    //       dynamicTyping: true,
    //       skipEmptyLines: true,
    //       download: true,
    //       complete: (results) => {
    //         console.log(`${globals.currentDataset} data loaded successfully.`);
    //         dataModule.processData(results.data);
    //         resolve();
    //       },
    //       error: (error) => {
    //         console.error("CSV Parsing Error:", error);
    //         alert(
    //           `Error loading ${globals.currentDataset} data. Please try again later.`,
    //         );
    //         reject(error);
    //       },
    //     });
    //   });
    // },
    // loadData: () => {
    //   console.log(`Loading ${globals.currentDataset} data...`);
    //   return new Promise((resolve, reject) => {
    //     const filePath = config.dataFiles[globals.currentDataset];
    //     if (!filePath) {
    //       console.error(
    //         `No file path found for dataset: ${globals.currentDataset}`,
    //       );
    //       reject(
    //         new Error(
    //           `No file path found for dataset: ${globals.currentDataset}`,
    //         ),
    //       );
    //       return;
    //     }
    //
    //     console.log(`Attempting to load file from: ${filePath}`);
    //
    //     Papa.parse(filePath, {
    //       header: true,
    //       dynamicTyping: true,
    //       skipEmptyLines: true,
    //       download: true,
    //       complete: (results) => {
    //         console.log(`${globals.currentDataset} data loaded successfully.`);
    //         console.log(`${results.data} will be processed.`);
    //         dataModule.processData(results.data);
    //         resolve();
    //       },
    //       error: (error) => {
    //         console.error("CSV Parsing Error:", error);
    //         console.error("Error details:", error.message);
    //         alert(
    //           `Error loading ${globals.currentDataset} data. Please check the console for details.`,
    //         );
    //         reject(error);
    //       },
    //     });
    //   });
    // },
    // processData: (data) => {
    //   console.log(`Processing ${globals.currentDataset} data...`);
    //   console.log(`${globals.currentDataset} data is ${data}`);
    //   globals.busData = {};
    //   data.forEach((row, index) => {
    //     // Validate essential fields
    //     if (
    //       !row.bus ||
    //       row.latitude === undefined ||
    //       row.longitude === undefined ||
    //       isNaN(row.latitude) ||
    //       isNaN(row.longitude)
    //     ) {
    //       console.warn(`Skipping row ${index} due to missing or invalid data.`);
    //       return;
    //     }
    //
    //     const rowYear = String(row.year).trim();
    //     const currentYearStr = String(globals.currentYear).trim();
    //
    //     if (rowYear !== currentYearStr) {
    //       return;
    //     }
    //     // Additional filtering for gendisp dataset
    //     if (globals.currentDataset === "gendisp") {
    //       if (
    //         row.season !== globals.currentSeason ||
    //         row.block !== globals.currentBlock
    //       ) {
    //         return;
    //       }
    //     }
    //     const key = row.bus;
    //     if (!globals.busData[key]) {
    //       globals.busData[key] = {
    //         bus: row.bus,
    //         latitude: row.latitude,
    //         longitude: row.longitude,
    //         investments: {},
    //       };
    //     }
    //
    //     if (!row.tech) {
    //       console.warn(`Row ${index} missing 'tech' field. Skipping.`);
    //       return;
    //     }
    //
    //     if (!globals.busData[key].investments[row.tech]) {
    //       globals.busData[key].investments[row.tech] = 0;
    //     }
    //     globals.busData[key].investments[row.tech] += row.level;
    //   });
    //   console.log("Processed busData:", globals.busData);
    // },
    loadData: () => {
      console.log(`Loading ${globals.currentDataset} data...`);
      return new Promise((resolve, reject) => {
        const filePath = config.dataFiles[globals.currentDataset];
        if (!filePath) {
          console.error(
            `No file path found for dataset: ${globals.currentDataset}`,
          );
          reject(
            new Error(
              `No file path found for dataset: ${globals.currentDataset}`,
            ),
          );
          return;
        }

        console.log(`Attempting to load file from: ${filePath}`);

        Papa.parse(filePath, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          download: true,
          complete: (results) => {
            console.log(`${globals.currentDataset} data loaded successfully.`);
            console.log(`Data rows: ${results.data.length}`);
            dataModule.processData(results.data);
            resolve();
          },
          error: (error) => {
            console.error("CSV Parsing Error:", error);
            console.error("Error details:", error.message);
            alert(
              `Error loading ${globals.currentDataset} data. Please check the console for details.`,
            );
            reject(error);
          },
        });
      });
    },
    processData: (data) => {
      console.log(`Processing ${globals.currentDataset} data...`);
      globals.busData = {};
      data.forEach((row, index) => {
        // Validate essential fields
        if (
          !row.bus ||
          row.latitude === undefined ||
          row.longitude === undefined ||
          isNaN(row.latitude) ||
          isNaN(row.longitude)
        ) {
          console.warn(`Skipping row ${index} due to missing or invalid data.`);
          return;
        }

        const rowYear = String(row.year).trim();
        const currentYearStr = String(globals.currentYear).trim();

        if (rowYear !== currentYearStr) {
          return;
        }

        // Additional filtering for gendisp dataset
        if (globals.currentDataset === "gendisp") {
          if (
            row.season !== globals.currentSeason ||
            String(row.block) !== String(globals.currentBlock)
          ) {
            return;
          }
        }

        const key = row.bus;
        if (!globals.busData[key]) {
          globals.busData[key] = {
            bus: row.bus,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            investments: {},
          };
        }

        if (!row.tech) {
          console.warn(`Row ${index} missing 'tech' field. Skipping.`);
          return;
        }

        if (!globals.busData[key].investments[row.tech]) {
          globals.busData[key].investments[row.tech] = 0;
        }
        globals.busData[key].investments[row.tech] +=
          parseFloat(row.level) || 0;
      });
      console.log("Processed busData:", globals.busData);
      console.log(`Number of buses: ${Object.keys(globals.busData).length}`);
    },
    // processData: (data) => {
    //   console.log(`Processing ${globals.currentDataset} data...`);
    //   globals.busData = {};
    //   data.forEach((row, index) => {
    //     // Validate essential fields
    //     if (
    //       !row.bus ||
    //       row.latitude === undefined ||
    //       row.longitude === undefined ||
    //       isNaN(row.latitude) ||
    //       isNaN(row.longitude)
    //     ) {
    //       console.warn(`Skipping row ${index} due to missing or invalid data.`);
    //       return;
    //     }
    //
    //     const rowYear = String(row.year).trim();
    //     const currentYearStr = String(globals.currentYear).trim();
    //
    //     if (rowYear !== currentYearStr) {
    //       return;
    //     }
    //
    //     // Additional filtering for gendisp dataset
    //     if (globals.currentDataset === "gendisp") {
    //       if (
    //         row.season !== globals.currentSeason ||
    //         row.block !== globals.currentBlock
    //       ) {
    //         return;
    //       }
    //     }
    //
    //     const key = row.bus;
    //     if (!globals.busData[key]) {
    //       globals.busData[key] = {
    //         bus: row.bus,
    //         latitude: row.latitude,
    //         longitude: row.longitude,
    //         investments: {},
    //       };
    //     }
    //
    //     if (!row.tech) {
    //       console.warn(`Row ${index} missing 'tech' field. Skipping.`);
    //       return;
    //     }
    //
    //     if (!globals.busData[key].investments[row.tech]) {
    //       globals.busData[key].investments[row.tech] = 0;
    //     }
    //     globals.busData[key].investments[row.tech] += row.level;
    //   });
    //   console.log("Processed busData:", globals.busData);
    //   console.log(`Number of buses: ${Object.keys(globals.busData).length}`);
    // },

    loadFlowData: () => {
      console.log("Loading flow data...");
      return new Promise((resolve, reject) => {
        Papa.parse(config.flowsFile, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          download: true,
          complete: (results) => {
            globals.flowData = results.data;
            console.log("Flow data loaded successfully.");
            dataModule.processFlowData();
            resolve();
          },
          error: (error) => {
            console.error("CSV Parsing Error:", error);
            alert("Error loading flow data. Please try again later.");
            reject(error);
          },
        });
      });
    },

    processFlowData: () => {
      console.log("Processing flow data...");
      globals.seasonBlockMapping = globals.flowData.reduce((acc, row) => {
        const season = row.season;
        const block = row.block;

        if (!acc[season]) {
          acc[season] = new Set();
        }

        acc[season].add(block);

        return acc;
      }, {});

      Object.keys(globals.seasonBlockMapping).forEach((season) => {
        globals.seasonBlockMapping[season] = Array.from(
          globals.seasonBlockMapping[season],
        );
      });

      console.log("Processed seasonBlockMapping:", globals.seasonBlockMapping);
    },
  };

  // UI functions
  const uiModule = {
    initTooltip: () => {
      console.log("Initializing tooltip...");
      globals.tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    },

    showTooltip: (event, bus, title, data) => {
      const [x, y] = d3.pointer(event);

      let tooltipContent = `<strong>Bus: ${bus.bus}</strong><br><strong>${title}</strong><br>`;

      if (title === "Total Investments") {
        tooltipContent += data
          .map(([tech, value]) => `${tech}: ${value.toFixed(2)}`)
          .join("<br>");
      } else if (title === "Total Generation Capacity") {
        tooltipContent += `${data[0][0]}: ${data[0][1]} MW`;
      }

      globals.tooltip
        .html(tooltipContent)
        .style("left", event.pageX + 20 + "px")
        .style("top", event.pageY - 20 + "px")
        .transition()
        .duration(200)
        .style("opacity", 0.9);
    },

    hideTooltip: () => {
      globals.tooltip.transition().duration(500).style("opacity", 0);
    },

    initLegend: () => {
      console.log("Initializing legend...");
      const legend = d3.select("#map").append("div").attr("class", "legend");
      legend.append("h3").text("Technology Legend");

      Object.keys(config.labelColors).forEach((tech) => {
        if (tech === "Capacity") {
          // Skip Capacity here since we're visualizing it the same way as other datasets
          return;
        }
        const item = legend.append("div").attr("class", "legend-item");
        item
          .append("span")
          .attr("class", "legend-color")
          .style("background-color", config.labelColors[tech]);
        item.append("span").attr("class", "legend-label").text(tech);
      });

      // Optionally, add an entry for 'Other'
      // const otherItem = legend.append("div").attr("class", "legend-item");
      // otherItem
      //   .append("span")
      //   .attr("class", "legend-color")
      //   .style("background-color", config.labelColors.Other);
      // otherItem.append("span").attr("class", "legend-label").text("Other");
    },

    registerControlEvents: () => {
      document
        .getElementById("toggleGeoJsonLayer")
        .addEventListener("click", () => {
          const geoJsonLayer = globals.layerControl._layers.find(
            (layer) => layer.name === "Existing Transmission Lines",
          );
          if (geoJsonLayer) {
            if (globals.map.hasLayer(geoJsonLayer.layer)) {
              globals.map.removeLayer(geoJsonLayer.layer);
            } else {
              globals.map.addLayer(geoJsonLayer.layer);
            }
          }
        });
      // Toggle Pie Charts Button
      document
        .getElementById("togglePieChartsLayer")
        .addEventListener("click", () => {
          console.log("Toggle Pie Charts button clicked");
          globals.pieChartsVisible = !globals.pieChartsVisible;
          d3.selectAll(".bus-pie").style(
            "display",
            globals.pieChartsVisible ? "block" : "none",
          );
          const buttonText = document.querySelector(
            "#togglePieChartsLayer span",
          );
          if (buttonText) {
            buttonText.textContent = globals.pieChartsVisible
              ? " Hide Pie Charts"
              : " Show Pie Charts";
          } else {
            console.error("Button text span not found.");
          }
        });

      // Dataset Selection Control
      document
        .getElementById("dataset-select")
        .addEventListener("change", (event) => {
          globals.currentDataset = event.target.value;
          console.log("Dataset changed to:", globals.currentDataset);
          uiModule.toggleGendispControls();
          visualizationModule.updateVisualization();
        });

      // Year Selection Control
      document
        .getElementById("year-select")
        .addEventListener("change", (event) => {
          globals.currentYear = event.target.value;
          console.log("Year changed to:", globals.currentYear);
          visualizationModule.updateVisualization();
        });

      // Season Selection Control (for gendisp)
      document
        .getElementById("season-select")
        .addEventListener("change", (event) => {
          globals.currentSeason = event.target.value;
          console.log("Season changed to:", globals.currentSeason);
          uiModule.updateBlockOptions();
          visualizationModule.updateVisualization();
        });

      // Block Selection Control (for gendisp)
      document
        .getElementById("block-select")
        .addEventListener("change", (event) => {
          globals.currentBlock = event.target.value;
          console.log("Block changed to:", globals.currentBlock);
          visualizationModule.updateVisualization();
        });

      // Toggle Legend Button
      let legendVisible = true;
      document.getElementById("toggleLegend").addEventListener("click", () => {
        legendVisible = !legendVisible;
        d3.select(".legend").style("display", legendVisible ? "block" : "none");
        const legendButtonText = document.querySelector("#toggleLegend span");
        if (legendButtonText) {
          legendButtonText.textContent = legendVisible
            ? " Hide Legend"
            : " Show Legend";
        }
      });

      // Reset Map View Button
      document.getElementById("resetMapView").addEventListener("click", () => {
        globals.map.setView(config.mapCenter, config.mapZoom);
        console.log("Map view reset to default.");
      });

      // Toggle Flow Lines Button
      document
        .getElementById("toggleLinesLayer")
        .addEventListener("click", () => {
          if (globals.linesVisible) {
            globals.map.removeLayer(globals.markersLayer_line);
            console.log("Flow lines hidden.");
          } else {
            globals.map.addLayer(globals.markersLayer_line);
            console.log("Flow lines shown.");
          }
          globals.linesVisible = !globals.linesVisible;
        });

      // Stop Visualization Button
      document
        .getElementById("stopVisualization")
        .addEventListener("click", () => {
          globals.stopLoop = true;
          if (globals.intervalId) {
            clearInterval(globals.intervalId);
            globals.intervalId = null;
          }
          console.log("Visualization stopped.");
        });

      // Show Flows Button
      document
        .getElementById("showFlows")
        .addEventListener("click", flowModule.showMarkers_line);

      // Visualize All Combinations Button
      document.getElementById("visualizeAll").addEventListener("click", () => {
        const selectedValues = flowModule.getSelectedValues();
        flowModule.visualizeAllCombinationsWithDelay(
          selectedValues.year,
          selectedValues.season,
          selectedValues.block,
        );
        console.log("Started visualizing all combinations.");
      });

      // Clear Map Button
      document.getElementById("clearButton").addEventListener("click", () => {
        globals.markersLayer_line.clearLayers();
        document.getElementById("yearSelect_line").value = "TITLE";
        document.getElementById("seasonSelect_line").value = "TITLE";
        document.getElementById("blockSelect_line").value = "TITLE";
        document.getElementById("messageYear_line").textContent = "";
        document.getElementById("messageSeason_line").textContent = "";
        document.getElementById("messageBlock_line").textContent = "";
        document.getElementById("message_line").textContent = "";
        // Remove existing pie charts
        globals.g.selectAll(".bus-pie").remove();
        console.log("Map cleared and controls reset.");
      });
    },
    toggleGendispControls: () => {
      const gendispControls = document.getElementById("gendisp-controls");
      if (globals.currentDataset === "gendisp") {
        gendispControls.style.display = "block";
        uiModule.updateBlockOptions();
      } else {
        gendispControls.style.display = "none";
      }
    },

    // toggleGendispControls: () => {
    //   const gendispControls = document.getElementById("gendisp-controls");
    //   if (globals.currentDataset === "gendisp") {
    //     gendispControls.style.display = "block";
    //     uiModule.updateBlockOptions();
    //   } else {
    //     gendispControls.style.display = "none";
    //   }
    // },

    updateBlockOptions: () => {
      const blockSelect = document.getElementById("block-select");
      blockSelect.innerHTML = ""; // Clear existing options

      if (globals.currentSeason === "Peak") {
        const option = document.createElement("option");
        option.value = "1";
        option.textContent = "1";
        blockSelect.appendChild(option);
      } else {
        for (let i = 1; i <= 4; i++) {
          const option = document.createElement("option");
          option.value = i.toString();
          option.textContent = i.toString();
          blockSelect.appendChild(option);
        }
      }
      // updateBlockOptions: () => {
      //   const blockSelect = document.getElementById("block-select");
      //   blockSelect.innerHTML = ""; // Clear existing options
      //
      //   if (globals.currentSeason === "Peak") {
      //     const option = document.createElement("option");
      //     option.value = "1";
      //     option.textContent = "1";
      //     blockSelect.appendChild(option);
      //   } else {
      //     for (let i = 1; i <= 4; i++) {
      //       const option = document.createElement("option");
      //       option.value = i.toString();
      //       option.textContent = i.toString();
      //       blockSelect.appendChild(option);
      //     }
      //   }

      // Set default selection
      globals.currentBlock = blockSelect.options[0].value;
    },
  };

  // Visualization functions
  const visualizationModule = {
    // drawPieCharts: () => {
    //   console.log("Drawing pie charts...");
    //   globals.g.selectAll(".bus-pie").remove();
    //
    //   const groupedData = Object.values(globals.busData);
    //
    //   if (groupedData.length === 0) {
    //     console.warn("No data available for the selected filters.");
    //     alert("No data available for the selected filters.");
    //     return;
    //   }
    //
    //   groupedData.forEach((bus) => {
    //     visualizationModule.drawPieChart(bus);
    //   });
    //
    //   mapModule.updatePosition();
    // },
    drawPieCharts: () => {
      console.log("Drawing pie charts...");
      globals.g.selectAll(".bus-pie").remove();

      const groupedData = Object.values(globals.busData);

      if (groupedData.length === 0) {
        console.warn("No data available for the selected filters.");
        alert("No data available for the selected filters.");
        return;
      }

      console.log("Grouped data:", groupedData);
      console.log("Current dataset:", globals.currentDataset);
      console.log("Current year:", globals.currentYear);
      console.log("Current season:", globals.currentSeason);
      console.log("Current block:", globals.currentBlock);

      groupedData.forEach((bus) => {
        console.log("Drawing pie chart for bus:", bus);
        visualizationModule.drawPieChart(bus);
      });

      mapModule.updatePosition();
    },
    drawPieChart: (bus) => {
      try {
        const radius = 15;
        const investments = bus.investments;
        const labels = Object.keys(investments);
        const data = Object.values(investments);

        if (labels.length === 0 || data.length === 0) {
          console.warn(
            `No investments data for bus ${bus.bus}. Skipping pie chart.`,
          );
          return;
        }

        const total = data.reduce((acc, val) => acc + val, 0);
        const pie = d3.pie();
        const arc = d3.arc().innerRadius(0).outerRadius(radius);
        const point = globals.map.latLngToLayerPoint([
          bus.latitude,
          bus.longitude,
        ]);

        const group = globals.g
          .append("g")
          .datum(bus)
          .attr("transform", `translate(${point.x},${point.y})`)
          .attr("class", "bus-pie")
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            uiModule.showTooltip(
              event,
              d,
              "Total Investments",
              Object.entries(d.investments),
            );
          })
          .on("mouseout", uiModule.hideTooltip);

        const arcs = group
          .selectAll(".arc")
          .data(pie(data))
          .enter()
          .append("g")
          .attr("class", "arc");

        arcs
          .append("path")
          .attr("d", arc)
          .attr(
            "fill",
            (d, i) => config.labelColors[labels[i]] || config.labelColors.Other,
          )
          .style("cursor", "pointer");

        arcs
          .append("text")
          .attr("transform", (d) => `translate(${arc.centroid(d)})`)
          .attr("dy", "0.35em")
          .style("text-anchor", "middle")
          .style("font-size", "10px")
          .text((d) => `${((d.value / total) * 100).toFixed(0)}%`);
      } catch (e) {
        console.error("Error drawing pie chart:", e);
      }
    },
    updateVisualization: () => {
      console.log("Updating visualization...");
      dataModule
        .loadData()
        .then(() => {
          visualizationModule.drawPieCharts();
          mapModule.updatePosition(); // Force position update after drawing
        })
        .catch((error) => {
          console.error("Error updating visualization:", error);
          alert(
            "Error updating visualization. Please check the console for details.",
          );
        });
    },
    // updateVisualization: () => {
    //   console.log("Updating visualization...");
    //   dataModule.loadData().then(() => {
    //     visualizationModule.drawPieCharts();
    //   });
    // },
  };

  // Flow visualization functions
  const flowModule = {
    setupSeasonDropdownListener: () => {
      const seasonSelect = document.getElementById("seasonSelect_line");
      seasonSelect.addEventListener("change", (event) => {
        const selectedSeason = event.target.value;
        flowModule.updateBlockOptions(selectedSeason);
      });

      flowModule.updateBlockOptions(seasonSelect.value);
    },

    updateBlockOptions: (selectedSeason) => {
      const blockSelect = document.getElementById("blockSelect_line");
      blockSelect.innerHTML = "";

      if (globals.seasonBlockMapping[selectedSeason]) {
        globals.seasonBlockMapping[selectedSeason].forEach((block) => {
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
    },

    getSelectedValues: () => ({
      year: document.getElementById("yearSelect_line").value,
      season: document.getElementById("seasonSelect_line").value,
      block: document.getElementById("blockSelect_line").value,
    }),

    displayMessages: (selectedValues) => {
      const messages = {
        Year_line: "Please choose the Year.",
        Season_line: "Please choose the Season.",
        Block_line: "Please choose the Block.",
      };
      Object.entries(selectedValues).forEach(([key, value]) => {
        const messageElement = document.getElementById(`message${key}`);
        if (messageElement) {
          messageElement.textContent = value === "TITLE" ? messages[key] : "";
        }
      });
    },

    createMapElementsToLayer: (filteredData, layer) => {
      filteredData.forEach((row) => {
        flowModule.createCircleMarker(
          [row.latitude_i, row.longitude_i],
          "red",
          row.from,
          layer,
        );
        flowModule.createCircleMarker(
          [row.latitude_j, row.longitude_j],
          "blue",
          row.to,
          layer,
        );
        flowModule.createPolyline(row, layer);
        const flowMarker = flowModule.createFlowMarker(row, layer);
        flowModule.moveMarker(row, flowMarker);
      });
    },

    createCircleMarker: (coords, color, popupContent, layer) => {
      const marker = L.circleMarker(coords, {
        radius: 2,
        color,
        fillOpacity: 1,
      }).addTo(layer);
      marker.bindPopup(popupContent.toString());
      return marker;
    },

    createPolyline: (row, layer) => {
      const lineWeight = flowModule.getLineWidth(row.level.toFixed(1));

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
        customTooltip.setLatLng(e.latlng).addTo(globals.map);
      });

      interactivePolyline.on("mouseout", () => {
        globals.map.closeTooltip(customTooltip);
      });

      return polyline;
    },

    createFlowMarker: (row, layer) => {
      const iconSize = [20, 20];
      const iconAnchor = [iconSize[0] / 2, iconSize[1] / 2];
      return L.marker([row.latitude_i, row.longitude_i], {
        icon: L.icon({
          iconUrl: "assets/back_curve.png", // Ensure this file exists in your project directory
          iconSize,
          iconAnchor,
        }),
        rotationAngle: flowModule.calculateAngle(
          row.latitude_i,
          row.longitude_i,
          row.latitude_j,
          row.longitude_j,
        ),
      }).addTo(layer);
    },

    calculateAngle: (lat1, lon1, lat2, lon2) => {
      const angle = -Math.atan2(lat2 - lat1, lon2 - lon1) * (180 / Math.PI);
      return angle >= 0 ? angle : 360 + angle;
    },

    getLineWidth: (level) => {
      if (level > 1000) return 5;
      if (level > 500) return 3;
      if (level > 100) return 2;
      return 1;
    },

    moveMarker: (set, marker) => {
      const latStep = globals.forward
        ? (set.latitude_j - set.latitude_i) / globals.steps
        : (set.latitude_i - set.latitude_j) / globals.steps;
      const lonStep = globals.forward
        ? (set.longitude_j - set.longitude_i) / globals.steps
        : (set.longitude_i - set.longitude_j) / globals.steps;
      let stepIndex = 0;
      const moveInterval = setInterval(() => {
        if (stepIndex >= globals.steps || globals.stopLoop) {
          clearInterval(moveInterval);
          stepIndex = 0;
          flowModule.moveMarker(set, marker);
          return;
        }
        const newLat = globals.forward
          ? set.latitude_i + latStep * stepIndex
          : set.latitude_j + latStep * stepIndex;
        const newLon = globals.forward
          ? set.longitude_i + lonStep * stepIndex
          : set.longitude_j + lonStep * stepIndex;
        marker.setLatLng([newLat, newLon]);
        marker.setRotationAngle(
          flowModule.calculateAngle(
            newLat,
            newLon,
            set.latitude_j,
            set.longitude_j,
          ),
        );
        marker.update();
        stepIndex++;
      }, 20); // Adjusted interval for smoother animation
    },

    showMarkers_line: () => {
      const tempLayer = L.layerGroup();
      const selectedValues = flowModule.getSelectedValues();
      flowModule.displayMessages(selectedValues);

      if (Object.values(selectedValues).some((value) => value === "TITLE")) {
        return;
      }

      // Filter the flowData instead of parsing the CSV again
      const filteredData = globals.flowData.filter(
        (row) =>
          row.year == selectedValues.year &&
          row.season == selectedValues.season &&
          row.block == selectedValues.block,
      );

      const messageElement = document.getElementById("message_line");
      if (filteredData.length === 0) {
        messageElement.textContent = "There is no flow in this combination.";
      } else {
        messageElement.textContent = "";
        flowModule.createMapElementsToLayer(filteredData, tempLayer);
        tempLayer.addTo(globals.map);
        globals.map.removeLayer(globals.markersLayer_line);
        globals.markersLayer_line = tempLayer;
      }
    },

    visualizeWithDelay: (combinations) => {
      if (globals.index >= combinations.length || globals.stopLoop) return;

      const { year, season, block } = combinations[globals.index];
      document.getElementById("yearSelect_line").value = year;
      document.getElementById("seasonSelect_line").value = season;
      document.getElementById("blockSelect_line").value = block;

      // Update the information box
      flowModule.updateInfoBox(year, season, block);

      flowModule.showMarkers_line();

      globals.index++;

      globals.intervalId = setTimeout(
        () => flowModule.visualizeWithDelay(combinations),
        10000,
      );
    },

    getAllPossibleValues: () => {
      const years = Array.from(
        document.getElementById("yearSelect_line").options,
      )
        .map((option) => option.value)
        .filter((value) => value !== "TITLE");
      const seasons = Array.from(
        document.getElementById("seasonSelect_line").options,
      )
        .map((option) => option.value)
        .filter((value) => value !== "TITLE");
      const blocks = Array.from(
        document.getElementById("blockSelect_line").options,
      )
        .map((option) => option.value)
        .filter((value) => value !== "TITLE");
      return { years, seasons, blocks };
    },

    updateInfoBox: (year, season, block) => {
      // If the infoBox does not exist, create it
      if (!globals.infoBox) {
        globals.infoBox = L.control({ position: "topright" });
        globals.infoBox.onAdd = function () {
          const div = L.DomUtil.create("div", "info-box");
          div.style.background = "white";
          div.style.padding = "10px";
          div.style.border = "1px solid black";
          div.style.zIndex = "1000"; // Ensure it's above other elements
          div.style.margin = "10px"; // Offset it from the map edge
          this._div = div;
          return div;
        };
        globals.infoBox.addTo(globals.map);
      }
      // Update the content of the info box
      globals.infoBox._div.innerHTML = `<strong>Year:</strong> ${year}<br><strong>Season:</strong> ${season}<br><strong>Block:</strong> ${block}`;
    },

    visualizeAllCombinationsWithDelay: (startYear, startSeason, startBlock) => {
      const { years, seasons, blocks } = flowModule.getAllPossibleValues();
      globals.combinations = []; // Reset combinations array

      years.forEach((year) => {
        seasons.forEach((season) => {
          blocks.forEach((block) => {
            globals.combinations.push({ year, season, block });
          });
        });
      });

      globals.index = globals.combinations.findIndex(
        (comb) =>
          comb.year == startYear &&
          comb.season == startSeason &&
          comb.block == startBlock,
      );

      if (globals.index === -1) globals.index = 0;

      globals.stopLoop = false;
      flowModule.visualizeWithDelay(globals.combinations);
    },
  };
  const geoJsonModule = {
    loadGeoJson: () => {
      fetch(
        "https://www.dropbox.com/scl/fi/9vn7vihngwvmgrp5gohix/transmission_lines_all_USA.geojson?rlkey=0u52dptk1mugml234gkid37ox&st=0e2r9pbg&dl=1",
      )
        .then((response) => response.json())
        .then((data) => {
          geoJsonModule.addGeoJsonToMap(data);
        })
        .catch((error) => console.error("Error loading GeoJSON:", error));
    },

    addGeoJsonToMap: (data) => {
      const geoJsonLayer = L.geoJSON(data, {
        style: geoJsonModule.styleFunction,
        onEachFeature: geoJsonModule.onEachFeature,
      }).addTo(globals.map);

      // Add layer control if not already added
      if (!globals.layerControl) {
        globals.layerControl = L.control
          .layers(
            null,
            { "Existing Transmission Lines": geoJsonLayer },
            { collapsed: false },
          )
          .addTo(globals.map);
      } else {
        globals.layerControl.addOverlay(
          geoJsonLayer,
          "Existing Transmission Lines",
        );
      }
    },

    styleFunction: (feature) => {
      const voltage = feature.properties.VOLTAGE;
      let lineColor = "black"; // default color

      if (voltage) {
        // You'll need to define voltage_colors similar to your Python code
        const voltageColors = {
          69: "#ff0000",
          100: "#ff0000",
          115: "#ffa500",
          138: "#ffa500",
          161: "#ffa500",
          230: "#ff00ff",
          345: "#800080",
          500: "#0000ff",
          765: "#008000",
          // ... add more voltage levels and colors as needed
        };

        const voltagelevels = Object.keys(voltageColors).map(Number);
        const closestVoltage = voltagelevels.reduce((prev, curr) =>
          Math.abs(curr - voltage) < Math.abs(prev - voltage) ? curr : prev,
        );
        lineColor = voltageColors[closestVoltage] || "black";
      }

      return {
        color: lineColor,
        weight: 2,
        opacity: 0.8,
      };
    },

    onEachFeature: (feature, layer) => {
      if (feature.properties) {
        layer.bindTooltip(`
        <strong>Line Name:</strong> ${feature.properties.Name}<br>
        <strong>Voltage (kV):</strong> ${feature.properties.VOLTAGE}<br>
        <strong>Type:</strong> ${feature.properties.TYPE}
      `);
      }
    },
  };

  // Initialize the application
  const init = () => {
    console.log("Initializing application...");
    mapModule.initMap();
    mapModule.initSVGOverlay();
    uiModule.initTooltip();
    mapModule.registerMapEvents();
    uiModule.toggleGendispControls();
    uiModule.registerControlEvents();
    uiModule.initLegend();
    visualizationModule.updateVisualization();

    // Load flows.csv and store the data in flowData
    dataModule.loadFlowData().then(() => {
      flowModule.setupSeasonDropdownListener();
    });

    // Load and display GeoJSON data
    geoJsonModule.loadGeoJson();
  };

  // Start the application
  init();
});
