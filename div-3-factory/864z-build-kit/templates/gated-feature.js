// ============================================================
// GATED FEATURE SCAFFOLD
// Template for implementing tier-gated features.
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

// Add to MESSAGE_TYPES object:
export const MESSAGE_TYPES = {
  // ... existing types ...
  [FEATURE_ACTION]: '[FEATURE_ACTION]',
};

// Add to FEATURE_TIERS object:
export const FEATURE_TIERS = {
  // ... existing tiers ...
  '[feature-id]': '[tier]', // free | starter | pro | power
};


// ============================================================
// STEP 2: Service Worker Handler (background/service-worker.js)
// ============================================================

// Add case to message handler switch:
case MESSAGE_TYPES.[FEATURE_ACTION]:
  return handle[FeatureName](payload);

// Add handler function:
async function handle[FeatureName](payload) {
  log('handle[FeatureName] called with:', payload);

  try {
    // 1. Check tier access
    const hasAccess = await getFeatureAccess('[feature-id]');
    if (!hasAccess) {
      return {
        success: false,
        error: 'tier_required',
        requiredTier: '[tier]'
      };
    }

    // 2. Validate payload
    if (!payload.[requiredField]) {
      return { success: false, error: 'Missing required field: [requiredField]' };
    }

    // 3. Perform the operation
    // [Your feature logic here]
    const result = await doSomething(payload);

    // 4. Return success
    return {
      success: true,
      data: result
    };

  } catch (error) {
    log('[FeatureName] error:', error);
    return { success: false, error: error.message };
  }
}


// ============================================================
// STEP 3: Sidepanel UI Trigger (sidepanel/main.js)
// ============================================================

// Add to feature names (for upgrade prompt):
const featureNames = {
  // ... existing ...
  '[feature-id]': '[Display Name]',
};

// Add to feature descriptions (for upgrade prompt):
const featureDescriptions = {
  // ... existing ...
  '[feature-id]': '[Description of what this feature does]',
};

// Add event listener for UI trigger:
document.getElementById('[trigger-element-id]').addEventListener('click', async () => {
  // Show loading state
  const button = event.currentTarget;
  button.disabled = true;
  button.classList.add('loading');

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.[FEATURE_ACTION],
      payload: {
        [field]: [value],
      }
    });

    if (response.success) {
      // Handle success
      showToast('[Success message]');
      // Update UI with response.data
    } else if (response.error === 'tier_required') {
      // Show upgrade prompt
      showUpgradePrompt('[feature-id]', response.requiredTier);
    } else {
      // Handle other errors
      showToast(response.error || '[Error message]', 'error');
    }
  } catch (error) {
    console.error('[FeatureName] error:', error);
    showToast('[Error message]', 'error');
  } finally {
    // Reset loading state
    button.disabled = false;
    button.classList.remove('loading');
  }
});


// ============================================================
// STEP 4: Upgrade Prompt (already exists in main.js)
// ============================================================

// The showUpgradePrompt function handles displaying the upgrade dialog.
// Make sure your feature-id is in the featureNames and featureDescriptions objects.

function showUpgradePrompt(feature, requiredTier) {
  const tierPrices = {
    'starter': '$1.99',
    'pro': '$3.99',
    'power': '$5.99'
  };

  const dialog = document.createElement('div');
  dialog.className = 'upgrade-dialog';
  dialog.innerHTML = `
    <div class="upgrade-dialog__overlay"></div>
    <div class="upgrade-dialog__content">
      <button class="upgrade-dialog__close" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div class="upgrade-dialog__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h2 class="upgrade-dialog__title">Unlock ${featureNames[feature]}</h2>
      <p class="upgrade-dialog__description">${featureDescriptions[feature]}</p>
      <div class="upgrade-dialog__tier">
        <span class="upgrade-dialog__tier-name">${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}</span>
        <span class="upgrade-dialog__tier-price">${tierPrices[requiredTier]}/month</span>
      </div>
      <button class="oia-btn oia-btn-primary upgrade-dialog__cta">Upgrade Now</button>
      <button class="upgrade-dialog__dismiss">Maybe later</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // Event handlers
  dialog.querySelector('.upgrade-dialog__close').addEventListener('click', () => dialog.remove());
  dialog.querySelector('.upgrade-dialog__overlay').addEventListener('click', () => dialog.remove());
  dialog.querySelector('.upgrade-dialog__dismiss').addEventListener('click', () => dialog.remove());
  dialog.querySelector('.upgrade-dialog__cta').addEventListener('click', () => {
    // TODO: Open checkout
    showToast('Coming soon!');
    dialog.remove();
  });
}


// ============================================================
// STEP 5: Feature Access Check Helper (lib/tiers.js)
// ============================================================

// This should already exist in your tiers.js:
export async function getFeatureAccess(featureId) {
  const tier = await getTier();
  const requiredTier = FEATURE_TIERS[featureId];

  if (!requiredTier) return true; // Feature not gated

  const tierLevels = { free: 0, starter: 1, pro: 2, power: 3 };
  return tierLevels[tier] >= tierLevels[requiredTier];
}


// ============================================================
// TESTING CHECKLIST
// ============================================================
//
// [ ] Set tier to required level:
//     chrome.storage.local.set({ 'clipboard_tier': '[tier]' })
//
// [ ] Test feature works at required tier
//
// [ ] Set tier below required:
//     chrome.storage.local.set({ 'clipboard_tier': 'free' })
//
// [ ] Verify upgrade prompt appears
//
// [ ] Test upgrade prompt dismiss (X, overlay click, "Maybe later")
//
// [ ] Test loading state on trigger button
//
// [ ] Test error handling (network error, invalid data)
//
