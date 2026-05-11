/**
 * Chronicle Service Worker
 * Simple message routing, no ports
 */

import * as db from './lib/db.js';

// Strike 024: real ExtPay checkout integration (replaces Strike 013 stub).
// Per RULE-007 §ExtPay 3rd-party verdict: ExtPay handles card data directly
// via Stripe; 864zeros never sees payment details — only payment-status metadata.
//
// Strike 027: switched to the single-call pattern initPayments(callback).
// The wrapper now registers the onPaid listener BEFORE startBackground() polls,
// eliminating the race where the first poll could fire before a separately
// deferred addListener() landed (could cause a missed payment-confirmation
// event on SW restart when the user had already paid in a prior session).
import { initPayments } from './lib/payments/extpay-wrapper.js';
import { setTier, TIER_VAULT } from './lib/tier.js';

initPayments(async (user) => {
  // Strike 026: diagnostic logging — confirms the onPaid callback fired
  // and we have a user object. Visible in chrome://extensions DevTools for
  // the SW. Kept in production: payment-confirmation path is critical and
  // benefits from observability when an operator reports a flow issue.
  console.log('[Chronicle SW] onPaid fired:', { email: user?.email || '(none)', paid: !!user?.paid });

  try {
    await setTier(TIER_VAULT);
    console.log('[Chronicle SW] setTier(TIER_VAULT) committed to chrome.storage.local');
  } catch (err) {
    console.error('[Chronicle SW] setTier failed:', err);
    return; // do not broadcast on persistence failure
  }

  // Notify any open Options tab(s) so the tier card flips visually.
  // Shared listener in lib/options-tier-init.js (Strike 024) re-renders;
  // chronicle's options.js (Strike 026) also shows a "Payment Successful!" toast.
  try {
    await chrome.runtime.sendMessage({
      type: 'TIER_UNLOCKED',
      tier: TIER_VAULT,
      extpayUserEmail: user?.email || null
    });
    console.log('[Chronicle SW] TIER_UNLOCKED broadcast sent');
  } catch (err) {
    // chrome.runtime.sendMessage rejects when no listener is present
    // (no Options tab open). Not fatal — Options page will pick up
    // the change on next renderTier() (storage.onChanged or focus listener).
    console.log('[Chronicle SW] TIER_UNLOCKED: no Options tab listening (will pick up on tab focus)');
  }

  // Strike 026 Task 3: best-effort "redirect" back to options.html.
  // ExtPay SDK doesn't support a return URL (verified — open_payment_page
  // only accepts a plan_nickname arg). Storage-passed tab ID approach: the
  // Options page recorded its tab ID to chrome.storage.local.paymentReturnTabId
  // BEFORE calling openPaymentPage(). We read it here and call chrome.tabs.update
  // directly — no chrome.tabs.query needed, so no 'tabs' permission required.
  try {
    const { paymentReturnTabId } = await chrome.storage.local.get('paymentReturnTabId');
    if (typeof paymentReturnTabId === 'number') {
      try {
        const tab = await chrome.tabs.update(paymentReturnTabId, { active: true });
        if (tab?.windowId !== undefined) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
        console.log('[Chronicle SW] Focused options tab', paymentReturnTabId, '(redirect attempt)');
      } catch (innerErr) {
        // Tab may have been closed by the user; not fatal — focus listener
        // (Strike 026 Task 4 in lib/options-tier-init.js) will pick up the
        // unlock the next time the user returns to any Chronicle options tab.
        console.log('[Chronicle SW] Recorded options tab', paymentReturnTabId, 'no longer reachable:', innerErr?.message);
      }
      // Clear the key whether the update succeeded or not (one-shot).
      await chrome.storage.local.remove('paymentReturnTabId');
    } else {
      console.log('[Chronicle SW] No paymentReturnTabId recorded (user may have closed options tab pre-checkout)');
    }
  } catch (err) {
    console.warn('[Chronicle SW] Options-tab focus attempt failed (non-fatal):', err);
  }
}); // <-- end of initPayments(onPaidCallback) (Strike 027 single-call pattern)


// Initialize DB on load
db.openDB().then(() => {
}).catch(err => {
  console.error('[Chronicle SW] Database failed to open:', err);
});

// Open side panel on icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .then(() => {})
  .catch(err => console.error('[Chronicle SW] Side panel setup failed:', err));

// Message handler - all communication via sendMessage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  handleMessage(message, sender)
    .then(response => {
      sendResponse(response);
    })
    .catch(err => {
      console.error('[Chronicle SW] Error handling', message.type, ':', err);
      sendResponse({ error: err.message });
    });

  return true; // Keep channel open for async response
});

async function handleMessage(msg, sender) {
  switch (msg.type) {
    case 'RECORD_ENTRY':
      return await recordEntry(msg.entry, msg.exchanges);

    case 'GET_ENTRIES':
      const entries = await db.getEntries(msg.options);
      return { entries };

    case 'GET_ENTRY':
      return await db.getEntry(msg.id);

    case 'DELETE_ENTRY':
      await db.deleteEntry(msg.id);
      return { success: true };

    case 'UPDATE_ENTRY':
      await db.updateEntry(msg.id, msg.updates);
      return { success: true };

    case 'SEARCH':
      return { entries: await db.searchEntries(msg.query) };

    case 'CLEAR_ALL':
      await db.clearAll();
      return { success: true };

    case 'PING':
      return { pong: true };

    default:
      console.warn('[Chronicle SW] Unknown message type:', msg.type);
      return { error: 'Unknown message type' };
  }
}

async function recordEntry(entry, exchanges) {
  await db.saveEntry(entry, exchanges);

  // Notify side panel of new entry (fire and forget)
  chrome.runtime.sendMessage({
    type: 'ENTRY_RECORDED',
    entry: entry
  }).catch(() => {
    // Side panel might not be open, that's fine
  });

  return { success: true, id: entry.id };
}

