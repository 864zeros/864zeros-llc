/**
 * Local API Response Cache
 * Caches API responses to filesystem to avoid repeated queries
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, '../../cache');

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Get cached data by key
 * @param {string} key - Cache key (becomes filename)
 * @returns {object|null} Cached data or null if not found
 */
export function getCached(key) {
  ensureCacheDir();
  const filepath = path.join(CACHE_DIR, `${key}.json`);

  if (!fs.existsSync(filepath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.warn(`Cache read error for ${key}:`, err.message);
    return null;
  }
}

/**
 * Set cached data
 * @param {string} key - Cache key (becomes filename)
 * @param {object} data - Data to cache
 */
export function setCache(key, data) {
  ensureCacheDir();
  const filepath = path.join(CACHE_DIR, `${key}.json`);

  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`Cache write error for ${key}:`, err.message);
  }
}

/**
 * Check if cache exists for key
 * @param {string} key - Cache key
 * @returns {boolean}
 */
export function hasCache(key) {
  ensureCacheDir();
  const filepath = path.join(CACHE_DIR, `${key}.json`);
  return fs.existsSync(filepath);
}

/**
 * Clear specific cache entry
 * @param {string} key - Cache key
 */
export function clearCache(key) {
  const filepath = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      fs.unlinkSync(path.join(CACHE_DIR, file));
    }
  }
}
