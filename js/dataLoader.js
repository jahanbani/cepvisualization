// js/dataLoader.js

/**
 * Loads and processes bus data from a CSV file.
 * @param {string} dataFile - The path to the CSV file containing bus data.
 * @param {string} currentYear - The current year to filter data.
 * @returns {Promise<Object>} - A promise that resolves to the processed bus data.
 */
export const loadBusData = (dataFile, currentYear) => {
  console.log("Loading bus data...");
  return new Promise((resolve, reject) => {
    window.Papa.parse(dataFile, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      download: true,
      complete: (results) => {
        console.log("Bus data loaded successfully.");
        const busData = processBusData(results.data, currentYear);
        resolve(busData);
      },
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        alert("Error loading bus data. Please try again later.");
        reject(error);
      },
    });
  });
};

/**
 * Processes raw bus data.
 * @param {Array<Object>} data - The raw bus data from the CSV.
 * @param {string} currentYearStr - The current year as a string for filtering.
 * @returns {Object} - The processed bus data.
 */
const processBusData = (data, currentYearStr) => {
  console.log("Processing bus data...");
  const busData = {};
  data.forEach((row, index) => {
    // Ensure required fields are present
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

    // Convert values to strings and trim whitespace
    const rowYear = String(row.year).trim();
    const currentYearTrimmed = String(currentYearStr).trim();

    // Filter based on current year
    if (rowYear !== currentYearTrimmed) {
      return;
    }

    const key = row.bus;
    if (!busData[key]) {
      busData[key] = {
        bus: row.bus,
        latitude: row.latitude,
        longitude: row.longitude,
        investments: {},
      };
    }

    if (!row.tech) {
      console.warn(`Row ${index} missing 'tech' field. Skipping.`);
      return;
    }

    if (!busData[key].investments[row.tech]) {
      busData[key].investments[row.tech] = 0;
    }
    busData[key].investments[row.tech] += row.level;
  });
  console.log("Processed busData:", busData);
  return busData;
};

/**
 * Loads flow data from a CSV file.
 * @param {string} dataFile - The path to the CSV file containing flow data.
 * @returns {Promise<Array<Object>>} - A promise that resolves to the flow data array.
 */
export const loadFlowData = (dataFile) => {
  console.log("Loading flow data...");
  return new Promise((resolve, reject) => {
    window.Papa.parse(dataFile, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      download: true,
      complete: (results) => {
        console.log("Flow data loaded successfully.");
        resolve(results.data);
      },
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        alert("Error loading flow data. Please try again later.");
        reject(error);
      },
    });
  });
};
