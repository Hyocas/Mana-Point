const axios = require("axios");
const axiosRetry = require("axios-retry").default;

const apiClient = axios.create({ timeout: 5000 });

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay
});

module.exports = apiClient;
