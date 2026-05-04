// ============================================================
// CREDIT SYSTEM SCAFFOLD
// Template for pay-per-use / credit-based monetization.
// Low friction, scales with usage, great for AI features.
// ============================================================
//
// USAGE:
// 1. Copy relevant sections to your files
// 2. Replace all [PLACEHOLDERS] with actual values
// 3. Delete these instruction comments
//
// ============================================================


// ============================================================
// STEP 1: Add to lib/constants.js
// ============================================================

export const APP_SLUG = '[app-slug]';

export const STORAGE_KEYS = {
  credits: `${APP_SLUG}_credits`,
  creditHistory: `${APP_SLUG}_credit_history`,
};

export const MESSAGE_TYPES = {
  // Credit operations
  GET_CREDITS: 'GET_CREDITS',
  DEDUCT_CREDITS: 'DEDUCT_CREDITS',
  ADD_CREDITS: 'ADD_CREDITS',
  GET_CREDIT_HISTORY: 'GET_CREDIT_HISTORY',
};

// Credit costs per action
export const CREDIT_COSTS = {
  'ai-summary': 1,
  'ai-auto-tag': 1,
  'ai-vision': 2,
  'ai-translate': 1,
  'ai-rewrite': 2,
  // Add more actions...
};

// Credit pack pricing
export const CREDIT_PACKS = [
  { id: 'pack-50', credits: 50, price: 2.99, popular: false },
  { id: 'pack-200', credits: 200, price: 9.99, popular: true },
  { id: 'pack-500', credits: 500, price: 19.99, popular: false },
];

// Free credits on signup
export const FREE_CREDITS = 10;


// ============================================================
// STEP 2: Credit Store (lib/credits.js)
// ============================================================

import { STORAGE_KEYS, CREDIT_COSTS, FREE_CREDITS } from './constants.js';

/**
 * Get current credit balance.
 * @returns {Promise<number>}
 */
export async function getCredits() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.credits);
  return result[STORAGE_KEYS.credits] ?? FREE_CREDITS;
}

/**
 * Set credit balance (use for purchases and admin).
 * @param {number} amount
 */
export async function setCredits(amount) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.credits]: Math.max(0, amount)
  });
}

/**
 * Add credits (after purchase).
 * @param {number} amount
 * @param {string} source - 'purchase', 'bonus', 'refund'
 * @returns {Promise<number>} New balance
 */
export async function addCredits(amount, source = 'purchase') {
  const current = await getCredits();
  const newBalance = current + amount;
  await setCredits(newBalance);

  // Log transaction
  await logCreditTransaction({
    type: 'add',
    amount,
    source,
    balanceAfter: newBalance,
    timestamp: new Date().toISOString()
  });

  return newBalance;
}

/**
 * Deduct credits for an action.
 * @param {string} action - Action ID from CREDIT_COSTS
 * @param {object} metadata - Additional context
 * @returns {Promise<{success: boolean, balance?: number, error?: string}>}
 */
export async function deductCredits(action, metadata = {}) {
  const cost = CREDIT_COSTS[action];
  if (!cost) {
    return { success: false, error: `Unknown action: ${action}` };
  }

  const current = await getCredits();
  if (current < cost) {
    return {
      success: false,
      error: 'insufficient_credits',
      required: cost,
      available: current
    };
  }

  const newBalance = current - cost;
  await setCredits(newBalance);

  // Log transaction
  await logCreditTransaction({
    type: 'deduct',
    amount: cost,
    action,
    metadata,
    balanceAfter: newBalance,
    timestamp: new Date().toISOString()
  });

  return { success: true, balance: newBalance };
}

/**
 * Check if user has enough credits for an action.
 * @param {string} action
 * @returns {Promise<{canAfford: boolean, cost: number, balance: number}>}
 */
export async function canAfford(action) {
  const cost = CREDIT_COSTS[action] || 0;
  const balance = await getCredits();
  return {
    canAfford: balance >= cost,
    cost,
    balance
  };
}

/**
 * Log credit transaction for history.
 */
async function logCreditTransaction(transaction) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.creditHistory);
  const history = result[STORAGE_KEYS.creditHistory] || [];

  history.unshift(transaction);

  // Keep last 100 transactions
  if (history.length > 100) {
    history.pop();
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.creditHistory]: history
  });
}

/**
 * Get credit transaction history.
 * @param {number} limit
 * @returns {Promise<array>}
 */
export async function getCreditHistory(limit = 50) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.creditHistory);
  const history = result[STORAGE_KEYS.creditHistory] || [];
  return history.slice(0, limit);
}


// ============================================================
// STEP 3: Service Worker Handlers (background/service-worker.js)
// ============================================================

import {
  getCredits,
  addCredits,
  deductCredits,
  canAfford,
  getCreditHistory
} from '../lib/credits.js';
import { CREDIT_COSTS } from '../lib/constants.js';

// Add to message handler switch:

case MESSAGE_TYPES.GET_CREDITS:
  return handleGetCredits();

case MESSAGE_TYPES.DEDUCT_CREDITS:
  return handleDeductCredits(payload);

case MESSAGE_TYPES.ADD_CREDITS:
  return handleAddCredits(payload);

case MESSAGE_TYPES.GET_CREDIT_HISTORY:
  return handleGetCreditHistory(payload);

// Handlers:

async function handleGetCredits() {
  try {
    const balance = await getCredits();
    return { success: true, balance };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleDeductCredits(payload) {
  try {
    const result = await deductCredits(payload.action, payload.metadata);

    if (result.success) {
      // Broadcast balance update
      broadcast('CREDITS_UPDATED', { balance: result.balance });
    }

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleAddCredits(payload) {
  try {
    const newBalance = await addCredits(payload.amount, payload.source);

    // Broadcast balance update
    broadcast('CREDITS_UPDATED', { balance: newBalance });

    return { success: true, balance: newBalance };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleGetCreditHistory(payload) {
  try {
    const history = await getCreditHistory(payload?.limit);
    return { success: true, history };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


// ============================================================
// STEP 4: Integrate with Features (modify existing handlers)
// ============================================================

// Example: AI Summary with credit deduction
async function handleSummarizeClip(payload) {
  try {
    // 1. Check credits FIRST (before doing work)
    const affordCheck = await canAfford('ai-summary');
    if (!affordCheck.canAfford) {
      return {
        success: false,
        error: 'insufficient_credits',
        required: affordCheck.cost,
        available: affordCheck.balance
      };
    }

    // 2. Get the clip
    const clip = await get('clips', payload.clipId);
    if (!clip) {
      return { success: false, error: 'Clip not found' };
    }

    // 3. Call AI API
    const summary = await summarize(clip.content);

    // 4. Deduct credits AFTER success
    const deductResult = await deductCredits('ai-summary', {
      clipId: payload.clipId
    });

    if (!deductResult.success) {
      // Unlikely, but handle race condition
      return deductResult;
    }

    // 5. Save and return
    clip.summary = summary;
    await put('clips', clip);

    return {
      success: true,
      summary,
      creditsRemaining: deductResult.balance
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}


// ============================================================
// STEP 5: UI — Credit Balance Display (sidepanel/main.js)
// ============================================================

// Add to header or sidebar:
let creditBalance = 0;

async function loadCredits() {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.GET_CREDITS
  });

  if (response.success) {
    creditBalance = response.balance;
    renderCreditBadge();
  }
}

function renderCreditBadge() {
  const badge = document.getElementById('credit-badge');
  if (!badge) return;

  badge.textContent = creditBalance;
  badge.classList.toggle('credit-badge--low', creditBalance < 5);
  badge.classList.toggle('credit-badge--empty', creditBalance === 0);
}

// Listen for updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CREDITS_UPDATED') {
    creditBalance = message.payload.balance;
    renderCreditBadge();
  }
});

// Load on init
loadCredits();


// ============================================================
// STEP 6: UI — Insufficient Credits Prompt
// ============================================================

function showInsufficientCreditsPrompt(required, available) {
  const dialog = document.createElement('div');
  dialog.className = 'credits-dialog';
  dialog.innerHTML = `
    <div class="credits-dialog__overlay"></div>
    <div class="credits-dialog__content">
      <button class="credits-dialog__close" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="credits-dialog__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>

      <h2 class="credits-dialog__title">Not enough credits</h2>
      <p class="credits-dialog__description">
        This action requires <strong>${required}</strong> credits.
        You have <strong>${available}</strong> credits remaining.
      </p>

      <div class="credits-dialog__packs">
        ${CREDIT_PACKS.map(pack => `
          <button class="credits-dialog__pack ${pack.popular ? 'credits-dialog__pack--popular' : ''}"
                  data-pack-id="${pack.id}">
            ${pack.popular ? '<span class="credits-dialog__pack-badge">Most Popular</span>' : ''}
            <span class="credits-dialog__pack-credits">${pack.credits} credits</span>
            <span class="credits-dialog__pack-price">$${pack.price.toFixed(2)}</span>
          </button>
        `).join('')}
      </div>

      <button class="credits-dialog__dismiss">Maybe later</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // Event handlers
  dialog.querySelector('.credits-dialog__close').addEventListener('click', () => dialog.remove());
  dialog.querySelector('.credits-dialog__overlay').addEventListener('click', () => dialog.remove());
  dialog.querySelector('.credits-dialog__dismiss').addEventListener('click', () => dialog.remove());

  dialog.querySelectorAll('.credits-dialog__pack').forEach(btn => {
    btn.addEventListener('click', () => {
      const packId = btn.dataset.packId;
      purchaseCredits(packId);
      dialog.remove();
    });
  });
}


// ============================================================
// STEP 7: Purchase Flow (Stripe integration)
// ============================================================

async function purchaseCredits(packId) {
  const pack = CREDIT_PACKS.find(p => p.id === packId);
  if (!pack) return;

  try {
    // Option A: Open Stripe checkout link
    const checkoutUrl = `https://buy.stripe.com/[YOUR_LINK]?client_reference_id=${packId}`;
    chrome.tabs.create({ url: checkoutUrl });

    // Option B: Use Stripe.js in options page
    // window.open(chrome.runtime.getURL('options/checkout.html?pack=' + packId));

  } catch (error) {
    console.error('Purchase error:', error);
    showToast('Purchase failed. Please try again.', 'error');
  }
}

// Webhook handler (server-side, calls extension API):
// After successful payment, call:
// chrome.runtime.sendMessage({ type: 'ADD_CREDITS', payload: { amount: pack.credits, source: 'purchase' } });


// ============================================================
// STEP 8: UI Components (HTML)
// ============================================================

/*
<!-- Credit Badge (in header) -->
<div class="credit-badge-container">
  <button class="credit-badge" id="credit-badge" title="Your credits">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
    <span id="credit-count">0</span>
  </button>
</div>

<!-- Credit cost indicator on action button -->
<button class="action-btn" data-action="ai-summary">
  <svg>...</svg>
  Summarize
  <span class="action-btn__cost">1 credit</span>
</button>
*/


// ============================================================
// STEP 9: Styles (CSS)
// ============================================================

/*
.credit-badge-container {
  position: relative;
}

.credit-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--oia-bg-secondary);
  border: 1px solid var(--oia-border);
  border-radius: var(--oia-radius-full);
  font-size: var(--oia-size-body-sm);
  font-weight: var(--oia-weight-semibold);
  color: var(--oia-text);
  cursor: pointer;
  transition: all 150ms ease;
}

.credit-badge:hover {
  background-color: var(--oia-bg-tertiary);
}

.credit-badge--low {
  color: var(--oia-warning);
  border-color: var(--oia-warning);
}

.credit-badge--empty {
  color: var(--oia-error);
  border-color: var(--oia-error);
}

.action-btn__cost {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 4px;
}

.credits-dialog__overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 400;
}

.credits-dialog__content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 48px);
  max-width: 400px;
  background-color: var(--oia-bg);
  border-radius: var(--oia-radius-lg);
  padding: 32px 24px;
  text-align: center;
  z-index: 401;
}

.credits-dialog__packs {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
}

.credits-dialog__pack {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: var(--oia-bg-secondary);
  border: 1px solid var(--oia-border);
  border-radius: var(--oia-radius-md);
  cursor: pointer;
  transition: all 150ms ease;
  position: relative;
}

.credits-dialog__pack:hover {
  border-color: var(--oia-sage);
}

.credits-dialog__pack--popular {
  border-color: var(--oia-sage);
  background-color: var(--oia-sage-light);
}

.credits-dialog__pack-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 8px;
  background-color: var(--oia-sage);
  color: white;
  font-size: 10px;
  font-weight: var(--oia-weight-bold);
  text-transform: uppercase;
  border-radius: var(--oia-radius-sm);
}

.credits-dialog__pack-credits {
  font-weight: var(--oia-weight-semibold);
}

.credits-dialog__pack-price {
  font-weight: var(--oia-weight-bold);
  color: var(--oia-sage);
}
*/


// ============================================================
// TESTING CHECKLIST
// ============================================================
//
// [ ] Free credits granted on first install
// [ ] Credit balance displays correctly
// [ ] Credit deduction works for each action
// [ ] Insufficient credits shows purchase prompt
// [ ] Credit packs display with prices
// [ ] Purchase flow opens Stripe checkout
// [ ] Credits added after successful purchase
// [ ] Credit balance syncs across contexts
// [ ] Transaction history records correctly
// [ ] Low credit warning displays (< 5 credits)
// [ ] Empty credit state handled gracefully
//
