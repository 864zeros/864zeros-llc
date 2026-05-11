/**
 * Chronicle ExtPay Wrapper (Strike 024)
 *
 * Minimal wrapper around the vendored ExtPay.js SDK. Adapts ExtPay's
 * paid/free user model to Chronicle's TIER_FREE / TIER_VAULT state machine.
 *
 * Per RULE-007: ExtPay handles credit-card data directly via Stripe; 864zeros
 * never sees payment details. This wrapper only consumes payment-status
 * metadata (paid: boolean, email).
 *
 * Imported by:
 *   - service-worker.js — initPayments() + onPaid() to persist tier on payment
 *   - options/options.js — initPayments() + openPaymentPage() on Unlock CTA
 *
 * Idempotent: initPayments() safely returns the existing instance if called
 * twice (SW + Options page each call it; both share the same ExtPay singleton).
 *
 * Generalization: this wrapper pattern can be replicated to the other 11
 * Rung-3 extensions (per CHRONICLE_CHECKOUT_BLUEPRINT.md §VI). For chronicle
 * specifically, the tier model is binary (free/vault) — simpler than clipboard's
 * 4-tier model.
 */

import ExtPay from './ExtPay.js';
import { EXTPAY_ID } from '../../js/config.js';

let extpay = null;

/**
 * Strike 027: initPayments now accepts an optional onPaid callback and
 * registers it BEFORE startBackground(). Closes the theoretical race window
 * where ExtPay's first poll could fire between startBackground() and a
 * separate addListener() call. The exported onPaid() is retained for
 * backwards-compatibility + secondary listeners (e.g., from options.js).
 *
 *   Preferred SW pattern (single call):
 *     initPayments(async (user) => { ... });
 *
 *   Legacy pattern (still supported):
 *     initPayments();
 *     onPaid(async (user) => { ... });
 */
export function initPayments(onPaidCallback) {
  if (extpay) {
    if (typeof onPaidCallback === 'function') {
      extpay.onPaid.addListener(onPaidCallback);
    }
    return extpay;
  }
  extpay = ExtPay(EXTPAY_ID);
  // Register the listener BEFORE startBackground() polls. Eliminates the
  // narrow race where the first poll could fire before a separately-deferred
  // addListener call lands.
  if (typeof onPaidCallback === 'function') {
    extpay.onPaid.addListener(onPaidCallback);
  }
  extpay.startBackground();
  return extpay;
}

export function onPaid(callback) {
  if (!extpay) initPayments();
  extpay.onPaid.addListener(callback);
}

export function openPaymentPage() {
  if (!extpay) initPayments();
  extpay.openPaymentPage();
}

export async function getCurrentTier() {
  if (!extpay) initPayments();
  const user = await extpay.getUser();
  return user?.paid ? 'vault' : 'free';
}

export async function getUser() {
  if (!extpay) initPayments();
  return await extpay.getUser();
}
