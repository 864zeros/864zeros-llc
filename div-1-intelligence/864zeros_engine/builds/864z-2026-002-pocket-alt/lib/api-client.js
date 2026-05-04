// api-client.js - API Client Stub [PAID TIER ONLY]
// 864zeros Build Kit - Cloud Sync Foundation
//
// IMPORTANT: This is a STUB for future paid tier functionality.
// The free tier is 100% offline-first and requires NO server communication.
//
// Cloud sync will be implemented as an OPTIONAL paid feature.
// All core functionality remains completely offline.

import { isPaidTier } from './tiers.js';

// ===== CONFIGURATION =====

const API_BASE = 'https://api.readvault.864zeros.com'; // Future endpoint
const API_VERSION = 'v1';

// ===== API CLIENT =====

class APIClient {
  constructor() {
    this.baseUrl = `${API_BASE}/${API_VERSION}`;
    this.token = null;
  }

  /**
   * Check if API features are available.
   * Always returns false for free tier.
   */
  async isAvailable() {
    return await isPaidTier();
  }

  /**
   * Authenticate with API.
   * STUB: Not implemented for free tier.
   */
  async authenticate(licenseKey) {
    if (!await this.isAvailable()) {
      throw new Error('API features require paid tier');
    }

    // PLACEHOLDER: Implement authentication
    console.log('[api-client] Authentication not yet implemented');
    return false;
  }

  /**
   * Sync articles to cloud.
   * STUB: Not implemented for free tier.
   */
  async syncArticles(articles) {
    if (!await this.isAvailable()) {
      throw new Error('Cloud sync requires paid tier');
    }

    // PLACEHOLDER: Implement sync
    console.log('[api-client] Sync not yet implemented');
    return { success: false, message: 'Not implemented' };
  }

  /**
   * Fetch articles from cloud.
   * STUB: Not implemented for free tier.
   */
  async fetchArticles(since = null) {
    if (!await this.isAvailable()) {
      throw new Error('Cloud sync requires paid tier');
    }

    // PLACEHOLDER: Implement fetch
    console.log('[api-client] Fetch not yet implemented');
    return [];
  }

  /**
   * Get sync status.
   */
  async getSyncStatus() {
    const available = await this.isAvailable();

    if (!available) {
      return {
        available: false,
        message: 'Cloud sync available with Pro upgrade',
        lastSync: null
      };
    }

    // PLACEHOLDER: Return actual sync status
    return {
      available: true,
      connected: false,
      lastSync: null,
      message: 'Cloud sync coming soon'
    };
  }
}

// ===== SINGLETON EXPORT =====

export const apiClient = new APIClient();

// ===== HELPER FUNCTIONS =====

/**
 * Check if cloud features are available.
 */
export async function isCloudAvailable() {
  return apiClient.isAvailable();
}

/**
 * Get human-readable sync status.
 */
export async function getSyncStatusMessage() {
  const status = await apiClient.getSyncStatus();
  return status.message;
}
