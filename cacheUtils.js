// Simple in-memory cache
const cache = {};
function generateCacheKey(prefix, parameters) {
  return `${prefix}_${Object.values(parameters).join("_")}`;
}
// Function to get data from cache by key
function getFromCache(key) {
  return cache[key];
}
// Function to set data to cache with a key and TTL (time to live)
function setToCache(key, data, ttl = 300000) { // Default TTL 5 minutes
  cache[key] = { data, expiry: Date.now() + ttl };
}
// Function to check cache validity
function isCacheValid(entry) {
  return entry && entry.expiry > Date.now();
}

module.exports = { generateCacheKey, getFromCache, setToCache,isCacheValid };