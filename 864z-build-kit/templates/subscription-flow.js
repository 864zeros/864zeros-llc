// ============================================================
// SUBSCRIPTION FLOW SCAFFOLD
// Template for recurring subscription monetization.
// High ARPU, professional niches, predictable revenue.
// ============================================================
//
// USAGE:
// 1. Copy relevant sections to your files
// 2. Replace all [PLACEHOLDERS] with actual values
// 3. Set up Stripe products and webhooks
// 4. Delete these instruction comments
//
// ============================================================


// ============================================================
// STEP 1: Add to lib/constants.js
// ============================================================

export const APP_SLUG = '[app-slug]';

export const STORAGE_KEYS = {
  subscription: `${APP_SLUG}_subscription`,
  subscriptionExpiry: `${APP_SLUG}_subscription_expiry`,
};

export const MESSAGE_TYPES = {
  // Subscription operations
  GET_SUBSCRIPTION: 'GET_SUBSCRIPTION',
  CHECK_SUBSCRIPTION: 'CHECK_SUBSCRIPTION',
  UPDATE_SUBSCRIPTION: 'UPDATE_SUBSCRIPTION',
  CANCEL_SUBSCRIPTION: 'CANCEL_SUBSCRIPTION',
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    interval: 'month',
    stripePriceId: 'price_[STRIPE_MONTHLY_PRICE_ID]',
  },
  annual: {
    id: 'annual',
    name: 'Annual',
    price: 99.99,
    interval: 'year',
    savings: '17%',
    stripePriceId: 'price_[STRIPE_ANNUAL_PRICE_ID]',
  },
};

// Trial and grace period
export const TRIAL_DAYS = 7;
export const GRACE_PERIOD_DAYS = 3;


// ============================================================
// STEP 2: Subscription Store (lib/subscription.js)
// ============================================================

import { STORAGE_KEYS, SUBSCRIPTION_PLANS, TRIAL_DAYS, GRACE_PERIOD_DAYS } from './constants.js';

/**
 * Subscription object structure:
 * {
 *   status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'none',
 *   planId: 'monthly' | 'annual',
 *   currentPeriodEnd: ISO timestamp,
 *   cancelAtPeriodEnd: boolean,
 *   stripeCustomerId: string,
 *   stripeSubscriptionId: string,
 * }
 */

/**
 * Get current subscription status.
 * @returns {Promise<object>}
 */
export async function getSubscription() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.subscription);
  return result[STORAGE_KEYS.subscription] || { status: 'none' };
}

/**
 * Update subscription data (called after webhook or check).
 * @param {object} subscriptionData
 */
export async function setSubscription(subscriptionData) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.subscription]: subscriptionData
  });
}

/**
 * Check if subscription is active (includes trial and grace period).
 * @returns {Promise<boolean>}
 */
export async function isSubscriptionActive() {
  const sub = await getSubscription();

  // Active or trialing
  if (sub.status === 'active' || sub.status === 'trialing') {
    return true;
  }

  // Past due but within grace period
  if (sub.status === 'past_due' && sub.currentPeriodEnd) {
    const graceEnd = new Date(sub.currentPeriodEnd);
    graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);
    return new Date() < graceEnd;
  }

  return false;
}

/**
 * Check if user is in trial period.
 * @returns {Promise<{inTrial: boolean, daysRemaining: number}>}
 */
export async function getTrialStatus() {
  const sub = await getSubscription();

  if (sub.status !== 'trialing' || !sub.currentPeriodEnd) {
    return { inTrial: false, daysRemaining: 0 };
  }

  const endDate = new Date(sub.currentPeriodEnd);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

  return { inTrial: true, daysRemaining };
}

/**
 * Start a trial (first-time users only).
 * @returns {Promise<object>}
 */
export async function startTrial() {
  const existing = await getSubscription();
  if (existing.status !== 'none') {
    return { success: false, error: 'User already has subscription history' };
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  const trialSub = {
    status: 'trialing',
    planId: null,
    currentPeriodEnd: trialEnd.toISOString(),
    cancelAtPeriodEnd: false,
    trialStarted: new Date().toISOString(),
  };

  await setSubscription(trialSub);
  return { success: true, subscription: trialSub };
}

/**
 * Get days until subscription expires.
 * @returns {Promise<number|null>}
 */
export async function getDaysUntilExpiry() {
  const sub = await getSubscription();
  if (!sub.currentPeriodEnd) return null;

  const endDate = new Date(sub.currentPeriodEnd);
  const now = new Date();
  return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
}


// ============================================================
// STEP 3: Service Worker Handlers (background/service-worker.js)
// ============================================================

import {
  getSubscription,
  setSubscription,
  isSubscriptionActive,
  getTrialStatus,
  startTrial
} from '../lib/subscription.js';

// Add to message handler switch:

case MESSAGE_TYPES.GET_SUBSCRIPTION:
  return handleGetSubscription();

case MESSAGE_TYPES.CHECK_SUBSCRIPTION:
  return handleCheckSubscription();

case MESSAGE_TYPES.UPDATE_SUBSCRIPTION:
  return handleUpdateSubscription(payload);

// Handlers:

async function handleGetSubscription() {
  try {
    const subscription = await getSubscription();
    const isActive = await isSubscriptionActive();
    const trialStatus = await getTrialStatus();

    return {
      success: true,
      subscription,
      isActive,
      ...trialStatus
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleCheckSubscription() {
  try {
    const isActive = await isSubscriptionActive();
    return { success: true, isActive };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleUpdateSubscription(payload) {
  try {
    await setSubscription(payload.subscription);

    // Broadcast status change
    broadcast('SUBSCRIPTION_UPDATED', payload.subscription);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


// ============================================================
// STEP 4: Gate Features by Subscription
// ============================================================

// Replace tier-based gating with subscription check:
async function handlePremiumFeature(payload) {
  try {
    // Check subscription instead of tier
    const isActive = await isSubscriptionActive();
    if (!isActive) {
      return {
        success: false,
        error: 'subscription_required'
      };
    }

    // Proceed with feature...
    return { success: true, data: result };

  } catch (error) {
    return { success: false, error: error.message };
  }
}


// ============================================================
// STEP 5: UI — Subscription Status Display
// ============================================================

let subscription = null;

async function loadSubscription() {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.GET_SUBSCRIPTION
  });

  if (response.success) {
    subscription = response.subscription;
    renderSubscriptionBadge(response);
  }
}

function renderSubscriptionBadge(data) {
  const badge = document.getElementById('subscription-badge');
  if (!badge) return;

  if (data.isActive) {
    if (data.inTrial) {
      badge.className = 'subscription-badge subscription-badge--trial';
      badge.textContent = `Trial: ${data.daysRemaining} days left`;
    } else {
      badge.className = 'subscription-badge subscription-badge--active';
      badge.textContent = 'Pro';
    }
  } else {
    badge.className = 'subscription-badge subscription-badge--inactive';
    badge.textContent = 'Free';
  }
}

// Listen for updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SUBSCRIPTION_UPDATED') {
    loadSubscription();
  }
});


// ============================================================
// STEP 6: UI — Subscription Required Prompt
// ============================================================

function showSubscriptionPrompt() {
  const dialog = document.createElement('div');
  dialog.className = 'subscription-dialog';
  dialog.innerHTML = `
    <div class="subscription-dialog__overlay"></div>
    <div class="subscription-dialog__content">
      <button class="subscription-dialog__close" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="subscription-dialog__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>

      <h2 class="subscription-dialog__title">Upgrade to Pro</h2>
      <p class="subscription-dialog__description">
        Unlock all premium features with a Pro subscription.
      </p>

      <div class="subscription-dialog__features">
        <div class="subscription-dialog__feature">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          [Premium Feature 1]
        </div>
        <div class="subscription-dialog__feature">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          [Premium Feature 2]
        </div>
        <div class="subscription-dialog__feature">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          [Premium Feature 3]
        </div>
      </div>

      <div class="subscription-dialog__plans">
        <button class="subscription-dialog__plan" data-plan="monthly">
          <span class="subscription-dialog__plan-name">Monthly</span>
          <span class="subscription-dialog__plan-price">$${SUBSCRIPTION_PLANS.monthly.price}/mo</span>
        </button>
        <button class="subscription-dialog__plan subscription-dialog__plan--popular" data-plan="annual">
          <span class="subscription-dialog__plan-badge">Save ${SUBSCRIPTION_PLANS.annual.savings}</span>
          <span class="subscription-dialog__plan-name">Annual</span>
          <span class="subscription-dialog__plan-price">$${(SUBSCRIPTION_PLANS.annual.price / 12).toFixed(2)}/mo</span>
          <span class="subscription-dialog__plan-billed">Billed annually at $${SUBSCRIPTION_PLANS.annual.price}</span>
        </button>
      </div>

      <p class="subscription-dialog__trial">
        Start with a ${TRIAL_DAYS}-day free trial. Cancel anytime.
      </p>

      <button class="subscription-dialog__dismiss">Maybe later</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // Event handlers
  dialog.querySelector('.subscription-dialog__close').addEventListener('click', () => dialog.remove());
  dialog.querySelector('.subscription-dialog__overlay').addEventListener('click', () => dialog.remove());
  dialog.querySelector('.subscription-dialog__dismiss').addEventListener('click', () => dialog.remove());

  dialog.querySelectorAll('.subscription-dialog__plan').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.dataset.plan;
      startCheckout(planId);
      dialog.remove();
    });
  });
}


// ============================================================
// STEP 7: Stripe Checkout Integration
// ============================================================

async function startCheckout(planId) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) return;

  try {
    // Option A: Direct Stripe checkout link
    const checkoutUrl = `https://buy.stripe.com/[YOUR_CHECKOUT_LINK]?` +
      `prefilled_promo_code=&` +
      `client_reference_id=${planId}`;
    chrome.tabs.create({ url: checkoutUrl });

    // Option B: Stripe Customer Portal (for existing customers)
    // const portalUrl = await getCustomerPortalUrl();
    // chrome.tabs.create({ url: portalUrl });

  } catch (error) {
    console.error('Checkout error:', error);
    showToast('Unable to start checkout. Please try again.', 'error');
  }
}

async function openCustomerPortal() {
  // For managing existing subscriptions
  const sub = await getSubscription();
  if (!sub.stripeCustomerId) {
    showToast('No subscription found', 'error');
    return;
  }

  // Call your backend to create portal session
  // Then redirect to portal URL
  const portalUrl = `https://billing.stripe.com/p/session/[SESSION_ID]`;
  chrome.tabs.create({ url: portalUrl });
}


// ============================================================
// STEP 8: Webhook Handling (server-side)
// ============================================================

/*
Your backend should handle these Stripe webhooks and call the extension:

1. customer.subscription.created
2. customer.subscription.updated
3. customer.subscription.deleted
4. invoice.payment_succeeded
5. invoice.payment_failed

Example webhook handler (Node.js):

app.post('/webhook/stripe', async (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'customer.subscription.updated':
      const subscription = event.data.object;

      // Store in your database
      await db.updateSubscription(subscription.customer, {
        status: subscription.status,
        planId: subscription.items.data[0].price.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      // The extension should periodically check your API for updates
      // Or use a notification service to push updates
      break;
  }

  res.json({ received: true });
});
*/


// ============================================================
// STEP 9: Periodic Subscription Check
// ============================================================

// In service worker, periodically verify subscription:
chrome.alarms.create('check-subscription', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'check-subscription') {
    await verifySubscription();
  }
});

async function verifySubscription() {
  const sub = await getSubscription();
  if (sub.status === 'none') return;

  try {
    // Call your backend API to verify subscription status
    const response = await fetch('https://api.[yourdomain].com/subscription/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: sub.stripeCustomerId,
        subscriptionId: sub.stripeSubscriptionId
      })
    });

    const data = await response.json();

    if (data.subscription) {
      await setSubscription(data.subscription);
      broadcast('SUBSCRIPTION_UPDATED', data.subscription);
    }
  } catch (error) {
    console.error('Subscription verification failed:', error);
    // Don't revoke access on network errors
  }
}


// ============================================================
// STEP 10: Styles (CSS)
// ============================================================

/*
.subscription-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: var(--oia-size-body-sm);
  font-weight: var(--oia-weight-semibold);
  border-radius: var(--oia-radius-full);
}

.subscription-badge--active {
  background-color: var(--oia-sage-light);
  color: var(--oia-sage);
}

.subscription-badge--trial {
  background-color: var(--oia-warning-light);
  color: var(--oia-warning);
}

.subscription-badge--inactive {
  background-color: var(--oia-bg-secondary);
  color: var(--oia-text-muted);
}

.subscription-dialog__plans {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
}

.subscription-dialog__plan {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: var(--oia-bg-secondary);
  border: 2px solid var(--oia-border);
  border-radius: var(--oia-radius-md);
  cursor: pointer;
  transition: all 150ms ease;
  position: relative;
}

.subscription-dialog__plan:hover {
  border-color: var(--oia-sage);
}

.subscription-dialog__plan--popular {
  border-color: var(--oia-sage);
  background-color: var(--oia-sage-light);
}

.subscription-dialog__plan-badge {
  position: absolute;
  top: -12px;
  padding: 4px 12px;
  background-color: var(--oia-sage);
  color: white;
  font-size: 11px;
  font-weight: var(--oia-weight-bold);
  text-transform: uppercase;
  border-radius: var(--oia-radius-full);
}

.subscription-dialog__plan-name {
  font-size: var(--oia-size-body);
  font-weight: var(--oia-weight-semibold);
  margin-bottom: 4px;
}

.subscription-dialog__plan-price {
  font-size: var(--oia-size-h3);
  font-weight: var(--oia-weight-bold);
  color: var(--oia-sage);
}

.subscription-dialog__plan-billed {
  font-size: var(--oia-size-body-sm);
  color: var(--oia-text-muted);
  margin-top: 4px;
}

.subscription-dialog__features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 20px 0;
  text-align: left;
}

.subscription-dialog__feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--oia-size-body-sm);
  color: var(--oia-text-secondary);
}

.subscription-dialog__feature svg {
  color: var(--oia-sage);
  flex-shrink: 0;
}

.subscription-dialog__trial {
  font-size: var(--oia-size-body-sm);
  color: var(--oia-text-muted);
  margin-bottom: 16px;
}
*/


// ============================================================
// TESTING CHECKLIST
// ============================================================
//
// [ ] Free users see subscription prompt on premium features
// [ ] Trial starts correctly for new users
// [ ] Trial countdown displays accurately
// [ ] Subscription badge shows correct status
// [ ] Monthly checkout flow works
// [ ] Annual checkout flow works
// [ ] Subscription activates after payment
// [ ] Grace period works for failed payments
// [ ] Subscription expires after grace period
// [ ] Cancel flow works via customer portal
// [ ] Periodic verification updates status
// [ ] Status syncs across extension contexts
//
