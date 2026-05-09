// ============================================================
// CONSOLE DEBUG HELPER — Template
// Standardized developer console for all 864zeros extensions.
// Usage: window.[slug].help()
// ============================================================
//
// USAGE:
// 1. Copy relevant sections to your extension
// 2. Replace [APP_SLUG] with your app slug (e.g., 'cb', 'wi')
// 3. Customize extension-specific commands
// 4. Delete instruction comments
//
// ============================================================


// ============================================================
// STEP 1: Add to lib/constants.js (if not already present)
// ============================================================

export const MESSAGE_TYPES = {
  // ... existing types ...

  // Token tracking (debug)
  GET_TOKEN_USAGE: 'GET_TOKEN_USAGE',
  RESET_TOKEN_USAGE: 'RESET_TOKEN_USAGE'
};


// ============================================================
// STEP 2: Add to lib/api-client.js (token tracking)
// ============================================================

// Add session token tracking at top of file:
let sessionTokens = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  calls: 0
};

// Add after successful API calls:
// sessionTokens.promptTokens += promptTokens;
// sessionTokens.completionTokens += completionTokens;
// sessionTokens.totalTokens += promptTokens + completionTokens;
// sessionTokens.calls += 1;

// Export functions:
export function getTokenUsage() {
  return { ...sessionTokens };
}

export function resetTokenUsage() {
  sessionTokens = { promptTokens: 0, completionTokens: 0, totalTokens: 0, calls: 0 };
}


// ============================================================
// STEP 3: Add handlers to service-worker.js
// ============================================================

/*
import { getTokenUsage, resetTokenUsage } from '../lib/api-client.js';

// In message handler switch:
case MESSAGE_TYPES.GET_TOKEN_USAGE:
  return { success: true, usage: getTokenUsage() };

case MESSAGE_TYPES.RESET_TOKEN_USAGE:
  resetTokenUsage();
  return { success: true };
*/


// ============================================================
// STEP 4: Console Helper Implementation (sidepanel/main.js)
// ============================================================

// Replace [APP_SLUG] with your app's short name (e.g., 'cb', 'wi', 'tm')
// Replace [APP_NAME] with display name (e.g., 'ClipBoard', 'WebInsights')

// --- AI Provider Pricing (per 1M tokens) ---
const AI_PRICING = {
  gemini: { input: 0.15, output: 0.60 },      // Gemini Flash
  claude: { input: 0.25, output: 1.25 }       // Claude Haiku 3
};

// --- Helper Utilities ---
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function calculateCost(promptTokens, completionTokens, provider = 'gemini') {
  const pricing = AI_PRICING[provider] || AI_PRICING.gemini;
  const inputCost = promptTokens * (pricing.input / 1_000_000);
  const outputCost = completionTokens * (pricing.output / 1_000_000);
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

// --- Debug Helper Object ---
window.[APP_SLUG] = {

  // ========================================
  // UNIVERSAL: Status & Overview
  // ========================================

  async status() {
    const tier = await this.tier();
    const credits = await this.credits();
    const tokenResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TOKEN_USAGE });
    const t = tokenResponse.usage;
    const { totalCost } = calculateCost(t.promptTokens, t.completionTokens);
    const estimate = await navigator.storage.estimate();
    const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1);
    const quotaMB = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
    const pct = estimate.quota > 0 ? ((estimate.usage / estimate.quota) * 100).toFixed(1) : 0;
    // [EXTENSION-SPECIFIC] Add your data counts here
    const dataCount = 0; // e.g., clips.length, notes.length

    console.log(`
📋 [APP_NAME] Status
───────────────────────
🎫 Tier:     ${tier}
💰 Credits:  ${credits}
📦 Data:     ${dataCount} items
💾 Storage:  ${usedMB} MB / ${quotaMB} MB (${pct}%)

🔢 Session Tokens
─────────────────
📥 Input:   ${t.promptTokens.toLocaleString()}
📤 Output:  ${t.completionTokens.toLocaleString()}
📊 Total:   ${t.totalTokens.toLocaleString()}
🔄 Calls:   ${t.calls}
💵 Cost:    $${totalCost.toFixed(4)}
    `);
  },

  version() {
    const manifest = chrome.runtime.getManifest();
    console.log(`
📦 [APP_NAME] v${manifest.version}
─────────────────────────
📋 Manifest:  v${manifest.manifest_version}
🌐 Browser:   ${navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0] || 'Unknown'}
💻 Platform:  ${navigator.platform}
    `);
    return { version: manifest.version, manifestVersion: manifest.manifest_version };
  },

  help() {
    console.log(`
📋 [APP_NAME] Debug Commands
════════════════════════════

STATUS & INFO
─────────────
[slug].status()         → Full status dashboard
[slug].version()        → Version and environment info
[slug].help()           → Show this help

TIER & CREDITS
──────────────
[slug].tier()           → Show current tier
[slug].setTier('pro')   → Set tier (free|starter|pro|power)
[slug].credits()        → Show credit balance
[slug].setCredits(100)  → Set credit balance
[slug].addCredits(50)   → Add credits

AI & TOKENS
───────────
[slug].tokens()         → Show LLM tokens + cost
[slug].resetTokens()    → Reset token counters

STORAGE
───────
[slug].storage()        → Show storage usage
[slug].settings()       → Show all settings
[slug].clearData()      → Clear all data (destructive!)

TESTING
───────
[slug].simulate.offline()     → Toggle offline mode
[slug].simulate.slowNetwork() → Add network latency
[slug].reset()                → Reset to defaults
    `);
  },

  // ========================================
  // TIER & SUBSCRIPTION
  // ========================================

  async tier() {
    const result = await chrome.storage.local.get('[APP_SLUG]_tier');
    const tier = result['[APP_SLUG]_tier'] || 'free';
    console.log(`🎫 Tier: ${tier}`);
    return tier;
  },

  async setTier(tier) {
    const valid = ['free', 'starter', 'pro', 'power'];
    if (!valid.includes(tier)) {
      console.log(`❌ Invalid tier. Use: ${valid.join(', ')}`);
      return;
    }
    await chrome.storage.local.set({ '[APP_SLUG]_tier': tier });
    console.log(`✅ Tier set to: ${tier}`);
  },

  async tiers() {
    // [CUSTOMIZE] Import TIERS from constants.js
    const tiers = {
      free: { level: 0, price: 0, features: ['Basic features'] },
      starter: { level: 1, price: 1.99, features: ['+ Screenshots', '+ AI Summary'] },
      pro: { level: 2, price: 3.99, features: ['+ Vision AI', '+ Bulk ops'] },
      power: { level: 3, price: 5.99, features: ['+ InsightForge', '+ Priority'] }
    };
    console.table(tiers);
    return tiers;
  },

  // ========================================
  // CREDITS (Pay-Per-Use)
  // ========================================

  async credits() {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_CREDITS });
    console.log(`💰 Credits: ${response.balance}`);
    return response.balance;
  },

  async setCredits(amount) {
    if (amount < 0 || !Number.isInteger(amount)) {
      console.log('❌ Amount must be a non-negative integer');
      return;
    }
    await chrome.storage.local.set({ '[APP_SLUG]_credits': amount });
    console.log(`✅ Credits set to: ${amount}`);
  },

  async addCredits(amount) {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.ADD_CREDITS,
      payload: { amount, source: 'debug' }
    });
    console.log(`✅ Added ${amount} credits. New balance: ${response.newBalance}`);
    return response.newBalance;
  },

  async creditCosts() {
    // [CUSTOMIZE] Import CREDIT_CONFIG from constants.js
    const costs = {
      'ai-summary': 1,
      'ai-auto-tag': 1,
      'ai-vision': 2,
      'synthesize-clips': 3
    };
    console.table(costs);
    return costs;
  },

  // ========================================
  // AI & TOKEN TRACKING
  // ========================================

  async tokens() {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TOKEN_USAGE });
    const u = response.usage;
    const { inputCost, outputCost, totalCost } = calculateCost(u.promptTokens, u.completionTokens);
    console.log(`
🔢 Token Usage (Session)
────────────────────────
📥 Input:   ${u.promptTokens.toLocaleString()} tokens  ($${inputCost.toFixed(6)})
📤 Output:  ${u.completionTokens.toLocaleString()} tokens  ($${outputCost.toFixed(6)})
📊 Total:   ${u.totalTokens.toLocaleString()} tokens  ($${totalCost.toFixed(6)})
🔄 Calls:   ${u.calls}
💵 Cost:    $${totalCost.toFixed(4)} (Gemini Flash)
    `);
    return { ...u, cost: totalCost };
  },

  async resetTokens() {
    await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.RESET_TOKEN_USAGE });
    console.log('✅ Token counters reset');
  },

  // ========================================
  // STORAGE
  // ========================================

  async storage() {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const pct = quota > 0 ? ((used / quota) * 100).toFixed(2) : 0;
    console.log(`
💾 Storage Usage
────────────────
📦 Used:      ${formatBytes(used)}
📊 Quota:     ${formatBytes(quota)}
📈 Percent:   ${pct}%
    `);
    return { used, quota, percent: parseFloat(pct) };
  },

  async settings() {
    const all = await chrome.storage.local.get(null);
    // Filter to only show this extension's keys
    const filtered = {};
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith('[APP_SLUG]_')) {
        filtered[key.replace('[APP_SLUG]_', '')] = value;
      }
    }
    console.table(filtered);
    return filtered;
  },

  async clearData() {
    const confirm = window.confirm('⚠️ This will delete ALL data. Are you sure?');
    if (!confirm) {
      console.log('❌ Cancelled');
      return;
    }
    // [CUSTOMIZE] Clear your IndexedDB stores
    // await clearStore('clips');
    // await clearStore('tags');
    console.log('✅ All data cleared');
  },

  // ========================================
  // TESTING & SIMULATION
  // ========================================

  simulate: {
    _offline: false,
    _slowNetwork: 0,

    offline() {
      this._offline = !this._offline;
      console.log(`📡 Offline mode: ${this._offline ? 'ON' : 'OFF'}`);
      // [IMPLEMENT] Hook into fetch to block requests
      return this._offline;
    },

    slowNetwork(delay = 2000) {
      this._slowNetwork = this._slowNetwork ? 0 : delay;
      console.log(`🐌 Slow network: ${this._slowNetwork ? this._slowNetwork + 'ms delay' : 'OFF'}`);
      // [IMPLEMENT] Hook into fetch to add delay
      return this._slowNetwork;
    },

    reset() {
      this._offline = false;
      this._slowNetwork = 0;
      console.log('✅ All simulations reset');
    }
  },

  async reset() {
    const confirm = window.confirm('⚠️ Reset ALL settings and data to defaults?');
    if (!confirm) {
      console.log('❌ Cancelled');
      return;
    }
    // [CUSTOMIZE] Reset your extension
    await chrome.storage.local.clear();
    console.log('✅ Extension reset to defaults. Reload to apply.');
  },

  // ========================================
  // EXTENSION-SPECIFIC COMMANDS
  // [CUSTOMIZE] Add your extension's unique commands here
  // ========================================

  // Example for ClipBoard:
  // async clips(limit = 10) {
  //   console.log(`📎 Recent ${limit} clips:`);
  //   console.table(clips.slice(0, limit).map(c => ({
  //     id: c.id.slice(0, 8),
  //     type: c.clipType,
  //     content: (c.content || '').slice(0, 50) + '...',
  //     created: new Date(c.createdAt).toLocaleString()
  //   })));
  // },

  // Example for WebInsights:
  // async pages(limit = 10) {
  //   console.log(`📄 Recent ${limit} pages:`);
  //   // ...
  // },

};

// Show help hint on load (only in debug mode)
if (DEBUG) {
  console.log('💡 [APP_NAME] debug: Type [slug].help() for commands');
}


// ============================================================
// TESTING CHECKLIST
// ============================================================
//
// [ ] status() shows all relevant metrics
// [ ] tier() and setTier() work correctly
// [ ] credits() and setCredits() work correctly
// [ ] tokens() shows usage with cost calculation
// [ ] storage() shows IndexedDB usage
// [ ] settings() shows extension settings
// [ ] help() lists all commands with descriptions
// [ ] simulate.offline() toggles network
// [ ] reset() clears all data with confirmation
// [ ] Extension-specific commands work
//
