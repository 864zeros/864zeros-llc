// ============================================================
// BATCH RENDERER — Who Is Watching
// High-performance event rendering with smart batching.
// Prevents UI flicker on high-activity sites (CNN, SAP, Oracle).
// ============================================================

/**
 * BatchRenderer - Batches rapid events to prevent UI flicker
 *
 * Features:
 * - Collects events and renders in batches
 * - Detects high velocity and enters burst mode
 * - Collapses rapid same-vendor events into burst items
 * - Shows velocity indicator during high activity
 */
export class BatchRenderer {
  constructor(renderFn, options = {}) {
    this.buffer = [];
    this.renderFn = renderFn;
    this.batchMs = options.batchMs || 100;
    this.maxBatch = options.maxBatch || 50;
    this.timeout = null;
    this.lastRender = 0;
    this.highVelocityMode = false;
    this.velocityThreshold = options.velocityThreshold || 30;
    this.currentVelocity = 0;
    this.recentTimestamps = []; // For velocity calculation
  }

  /**
   * Push an event to the buffer for batched rendering
   */
  push(item) {
    const now = Date.now();
    this.buffer.push({ ...item, _bufferTime: now });

    // Track timestamps for velocity calculation
    this.recentTimestamps.push(now);

    // Keep only last 2 seconds of timestamps
    const twoSecondsAgo = now - 2000;
    this.recentTimestamps = this.recentTimestamps.filter(t => t > twoSecondsAgo);

    // Calculate velocity (events per second)
    const velocity = this.recentTimestamps.length / 2;
    this.currentVelocity = Math.round(velocity);

    // Enter high velocity mode if threshold exceeded
    if (velocity > this.velocityThreshold && !this.highVelocityMode) {
      this.enterHighVelocityMode();
    }

    // Schedule flush if not already scheduled
    if (!this.timeout) {
      const delay = this.highVelocityMode ? this.batchMs * 2 : this.batchMs;
      this.timeout = setTimeout(() => this.flush(), delay);
    }
  }

  /**
   * Flush the buffer and render
   */
  flush() {
    if (this.buffer.length === 0) {
      this.timeout = null;
      return;
    }

    let batch;

    if (this.highVelocityMode) {
      // In high velocity mode, collapse rapid events from same vendor
      batch = this.collapseRapidEvents(this.buffer.splice(0, this.maxBatch * 2));
    } else {
      batch = this.buffer.splice(0, this.maxBatch);
    }

    // Call render function with batch and metadata
    this.renderFn(batch, {
      velocity: this.currentVelocity,
      highVelocity: this.highVelocityMode,
      remaining: this.buffer.length
    });

    this.lastRender = Date.now();
    this.timeout = null;

    // Continue if more buffered
    if (this.buffer.length > 0) {
      const delay = this.highVelocityMode ? this.batchMs * 2 : this.batchMs;
      this.timeout = setTimeout(() => this.flush(), delay);
    } else if (this.highVelocityMode) {
      // Check if we should exit high velocity mode
      this.checkExitHighVelocity();
    }
  }

  /**
   * Enter high velocity mode - activates burst collapsing
   */
  enterHighVelocityMode() {
    this.highVelocityMode = true;
    console.log('[batch-renderer] Entering high velocity mode:', this.currentVelocity, 'events/sec');
  }

  /**
   * Check if we should exit high velocity mode
   */
  checkExitHighVelocity() {
    // Exit if velocity drops below half threshold
    if (this.currentVelocity < this.velocityThreshold / 2) {
      this.exitHighVelocityMode();
    } else {
      // Check again in 1 second
      setTimeout(() => {
        if (this.buffer.length === 0 && this.currentVelocity < this.velocityThreshold / 2) {
          this.exitHighVelocityMode();
        }
      }, 1000);
    }
  }

  /**
   * Exit high velocity mode
   */
  exitHighVelocityMode() {
    this.highVelocityMode = false;
    this.currentVelocity = 0;
    console.log('[batch-renderer] Exiting high velocity mode');
  }

  /**
   * Collapse rapid events from the same vendor into burst items
   */
  collapseRapidEvents(events) {
    const collapsed = [];
    const vendorGroups = new Map();

    for (const event of events) {
      // Get vendor key for grouping
      const key = event.vendorKey || event.vendor?.key || event.vendorName || 'unknown';
      const existing = vendorGroups.get(key);

      const eventTime = event.timestamp || event._bufferTime;

      if (existing && eventTime - existing.lastTimestamp < 500) {
        // Group rapid events from same vendor (within 500ms)
        existing.count++;
        existing.lastTimestamp = eventTime;
        existing.events.push(event);
      } else {
        // Start new group
        const group = {
          type: 'burst',
          vendor: event.vendor,
          vendorKey: key,
          vendorName: event.vendorName,
          count: 1,
          firstTimestamp: eventTime,
          lastTimestamp: eventTime,
          events: [event],
          category: event.category
        };
        vendorGroups.set(key, group);
        collapsed.push(group);
      }
    }

    // Convert groups to events, marking bursts
    return collapsed.map(group => {
      if (group.count > 1) {
        // Return burst item
        return {
          ...group.events[0],
          _burst: true,
          _burstCount: group.count,
          _burstEvents: group.events,
          _burstVendor: group.vendorName || group.vendorKey
        };
      }
      // Single event, return as-is
      return group.events[0];
    });
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      buffered: this.buffer.length,
      velocity: this.currentVelocity,
      highVelocity: this.highVelocityMode
    };
  }

  /**
   * Force flush all remaining events
   */
  forceFlush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    while (this.buffer.length > 0) {
      const batch = this.buffer.splice(0, this.maxBatch);
      this.renderFn(batch, {
        velocity: 0,
        highVelocity: false,
        remaining: this.buffer.length
      });
    }
  }

  /**
   * Clear buffer without rendering
   */
  clear() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.buffer = [];
    this.recentTimestamps = [];
    this.highVelocityMode = false;
    this.currentVelocity = 0;
  }

  /**
   * Destroy the renderer
   */
  destroy() {
    this.forceFlush();
    this.clear();
  }
}

console.log('[who-is-watching] batch-renderer.js loaded');
