// js/visualization.js
import { calculateAngle, getLineWidth } from "./utils.js";
import { showTooltip, hideTooltip } from "./tooltip.js";

/**
 * Pie chart label colors.
 */
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

/**
 * Draws pie charts on the map based on bus data.
 * @param {Object} busData - The processed bus data.
 * @param {Object} svg - The SVG element.
 * @param {Object} g - The group (`g`) element within SVG.
 */
export const drawPieCharts = (busData, svg, g) => {
  console.log("Drawing pie charts...");
  // Clear existing pie charts
  g.selectAll(".bus-pie").remove();

  const groupedData = Object.values(busData);

  if (groupedData.length === 0) {
    console.warn("No data available for the selected filters.");
    alert("No data available for the selected filters.");
    return;
  }

  groupedData.forEach((bus) => {
    drawPieChart(bus, svg, g);
  });

  updatePosition(svg, g);
};

/**
 * Draws a single pie chart for a bus.
 * @param {Object} bus - The bus data.
 * @param {Object} svg - The SVG element.
 * @param {Object} g - The group (`g`) element within SVG.
 */
const drawPieChart = (bus, svg, g) => {
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
    const pie = window.d3.pie();
    const arc = window.d3.arc().innerRadius(0).outerRadius(radius);
    const mapInstance = window.mapInstance;
    const point = mapInstance.latLngToLayerPoint([bus.latitude, bus.longitude]);

    const group = g
      .append("g")
      .datum(bus)
      .attr("transform", `translate(${point.x},${point.y})`)
      .attr("class", "bus-pie")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        showTooltip(
          event,
          d,
          "Total Investments",
          Object.entries(d.investments),
        );
      })
      .on("mouseout", hideTooltip);

    const arcs = group
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => labelColors[labels[i]] || labelColors.Other)
      .style("cursor", "pointer");

    // Add percentage labels to each arc
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
};

/**
 * Updates the positions of pie charts based on map movements.
 * @param {Object} svg - The SVG element.
 * @param {Object} g - The group (`g`) element within SVG.
 */
export const updatePosition = (svg, g) => {
  try {
    const mapInstance = window.mapInstance;
    const bounds = mapInstance.getBounds();
    const topLeft = mapInstance.latLngToLayerPoint(bounds.getNorthWest());
    const bottomRight = mapInstance.latLngToLayerPoint(bounds.getSouthEast());

    svg
      .attr("width", mapInstance.getSize().x)
      .attr("height", mapInstance.getSize().y)
      .style("left", "0px")
      .style("top", "0px");

    g.attr("transform", `translate(${-topLeft.x},${-topLeft.y})`);

    window.d3.selectAll(".bus-pie").attr("transform", function (d) {
      let point = mapInstance.latLngToLayerPoint([d.latitude, d.longitude]);
      return `translate(${point.x},${point.y})`;
    });
  } catch (e) {
    console.error("Error updating pie chart positions:", e);
  }
};
