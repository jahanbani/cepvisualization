// js/tooltip.js

let tooltip;

/**
 * Initializes the tooltip element.
 */
export const initTooltip = () => {
  console.log("Initializing tooltip...");
  tooltip = window.d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
};

/**
 * Displays the tooltip with given content.
 * @param {Object} event - The mouse event.
 * @param {Object} bus - The bus data.
 * @param {string} title - The title to display in the tooltip.
 * @param {Array} data - The data to display in the tooltip.
 */
export const showTooltip = (event, bus, title, data) => {
  const tooltipContent = `
    <strong>Bus: ${bus.bus}</strong><br>
    <strong>${title}</strong><br>
    ${data.map(([tech, value]) => `${tech}: ${value.toFixed(2)}`).join("<br>")}
  `;

  tooltip
    .html(tooltipContent)
    .style("left", event.pageX + 20 + "px")
    .style("top", event.pageY - 20 + "px")
    .transition()
    .duration(200)
    .style("opacity", 0.9);
};

/**
 * Hides the tooltip.
 */
export const hideTooltip = () => {
  tooltip.transition().duration(500).style("opacity", 0);
};
