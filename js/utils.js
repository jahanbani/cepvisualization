// js/utils.js

/**
 * Calculates the angle between two geographic coordinates.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} - The calculated angle in degrees.
 */
export const calculateAngle = (lat1, lon1, lat2, lon2) => {
  const angle = -Math.atan2(lat2 - lat1, lon2 - lon1) * (180 / Math.PI);
  return angle >= 0 ? angle : 360 + angle;
};

/**
 * Determines the line width based on the level value.
 * @param {number} level - The level value to determine line width.
 * @returns {number} - The calculated line width.
 */
export const getLineWidth = (level) => {
  if (level > 1000) return 5;
  if (level > 500) return 3;
  if (level > 100) return 2;
  return 1;
};
