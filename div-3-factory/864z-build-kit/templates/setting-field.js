// ============================================================
// SETTING FIELD SCAFFOLD
// Template for adding settings to the Options page.
// Handles load, save, and sync for various input types.
// ============================================================
//
// USAGE:
// 1. Copy relevant sections to your files
// 2. Replace all [PLACEHOLDERS] with actual values
// 3. Delete these instruction comments
//
// ============================================================


// ============================================================
// STEP 1: Add HTML to options/options.html
// ============================================================

// --- Toggle/Checkbox ---
/*
<div class="option-row">
  <div class="option-info">
    <label for="[setting-id]" class="option-label">[Setting Label]</label>
    <span class="option-desc">[Description of what this setting does]</span>
  </div>
  <label class="oia-toggle">
    <input type="checkbox" id="[setting-id]">
    <span class="oia-toggle__slider"></span>
  </label>
</div>
*/

// --- Select/Dropdown ---
/*
<div class="option-row">
  <div class="option-info">
    <label for="[setting-id]" class="option-label">[Setting Label]</label>
    <span class="option-desc">[Description]</span>
  </div>
  <select id="[setting-id]" class="oia-select">
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
    <option value="option3">Option 3</option>
  </select>
</div>
*/

// --- Text Input ---
/*
<div class="option-row option-row--column">
  <div class="option-info">
    <label for="[setting-id]" class="option-label">[Setting Label]</label>
    <span class="option-desc">[Description]</span>
  </div>
  <input type="text" id="[setting-id]" class="oia-input" placeholder="[Placeholder text]">
</div>
*/

// --- Text Input with Button ---
/*
<div class="option-row option-row--column">
  <div class="option-info">
    <label for="[setting-id]" class="option-label">[Setting Label]</label>
    <span class="option-desc">[Description]</span>
  </div>
  <div class="option-input-group">
    <input type="text" id="[setting-id]" class="oia-input" placeholder="[Placeholder]">
    <button class="oia-btn oia-btn-primary" id="[setting-id]-save">Save</button>
  </div>
</div>
*/

// --- Password Input with Toggle ---
/*
<div class="option-row option-row--column">
  <div class="option-info">
    <label for="[setting-id]" class="option-label">[Setting Label]</label>
    <span class="option-desc">[Description]</span>
    <span class="option-status" id="[setting-id]-status"></span>
  </div>
  <div class="option-input-group">
    <input type="password" id="[setting-id]" class="oia-input" placeholder="[Placeholder]">
    <button class="oia-btn oia-btn-secondary" id="[setting-id]-toggle" type="button" aria-label="Toggle visibility">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </button>
    <button class="oia-btn oia-btn-primary" id="[setting-id]-save">Save</button>
  </div>
</div>
*/

// --- Slider/Range ---
/*
<div class="option-row">
  <div class="option-info">
    <label for="[setting-id]" class="option-label">[Setting Label]</label>
    <span class="option-desc">[Description]</span>
  </div>
  <div class="option-slider">
    <input type="range" id="[setting-id]" min="0" max="100" step="1" class="oia-range">
    <span class="option-slider__value" id="[setting-id]-value">50</span>
  </div>
</div>
*/

// --- Radio Group ---
/*
<div class="option-row option-row--column">
  <div class="option-info">
    <span class="option-label">[Setting Label]</span>
    <span class="option-desc">[Description]</span>
  </div>
  <div class="option-radio-group">
    <label class="oia-radio">
      <input type="radio" name="[setting-name]" value="option1">
      <span class="oia-radio__label">Option 1</span>
    </label>
    <label class="oia-radio">
      <input type="radio" name="[setting-name]" value="option2">
      <span class="oia-radio__label">Option 2</span>
    </label>
  </div>
</div>
*/


// ============================================================
// STEP 2: Add CSS to options/options.css
// ============================================================

/*
.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--oia-border);
  gap: 16px;
}

.option-row--column {
  flex-direction: column;
  align-items: stretch;
}

.option-info {
  flex: 1;
}

.option-label {
  display: block;
  font-size: var(--oia-size-body);
  font-weight: var(--oia-weight-semibold);
  color: var(--oia-text);
  margin-bottom: 4px;
}

.option-desc {
  display: block;
  font-size: var(--oia-size-body-sm);
  color: var(--oia-text-muted);
}

.option-status {
  display: block;
  font-size: var(--oia-size-body-sm);
  margin-top: 4px;
}

.option-input-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.option-input-group .oia-input {
  flex: 1;
}

.option-slider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-slider__value {
  min-width: 40px;
  text-align: center;
  font-weight: var(--oia-weight-semibold);
}

.option-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

// Toggle switch
.oia-toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
}

.oia-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.oia-toggle__slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--oia-bg-tertiary);
  border-radius: 28px;
  transition: all 150ms ease;
}

.oia-toggle__slider::before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: all 150ms ease;
}

.oia-toggle input:checked + .oia-toggle__slider {
  background-color: var(--oia-sage);
}

.oia-toggle input:checked + .oia-toggle__slider::before {
  transform: translateX(20px);
}
*/


// ============================================================
// STEP 3: Add to options/options.js
// ============================================================

import { getSettings, updateSettings } from '../lib/store.js';
import { APP_SLUG } from '../lib/constants.js';

// --- DOM References ---
const [settingId]Element = document.getElementById('[setting-id]');
// For inputs with buttons:
const [settingId]Save = document.getElementById('[setting-id]-save');
const [settingId]Status = document.getElementById('[setting-id]-status');
// For password toggles:
const [settingId]Toggle = document.getElementById('[setting-id]-toggle');


// ============================================================
// PATTERN: Simple Toggle
// ============================================================

// Load
async function loadSettings() {
  const settings = await getSettings();

  if ([settingId]Element) {
    [settingId]Element.checked = settings.[settingKey] ?? false;
  }
}

// Save on change
if ([settingId]Element) {
  [settingId]Element.addEventListener('change', async () => {
    await updateSettings({ [settingKey]: [settingId]Element.checked });
    showFeedback('Setting saved');
  });
}


// ============================================================
// PATTERN: Select Dropdown
// ============================================================

// Load
async function loadSettings() {
  const settings = await getSettings();

  if ([settingId]Element && settings.[settingKey]) {
    [settingId]Element.value = settings.[settingKey];
  }
}

// Save on change
if ([settingId]Element) {
  [settingId]Element.addEventListener('change', async () => {
    await updateSettings({ [settingKey]: [settingId]Element.value });
    showFeedback('Setting saved');
  });
}


// ============================================================
// PATTERN: Text Input with Save Button
// ============================================================

// Load
async function loadSettings() {
  const settings = await getSettings();

  if ([settingId]Element && settings.[settingKey]) {
    [settingId]Element.value = settings.[settingKey];
  }
}

// Save on button click
if ([settingId]Save && [settingId]Element) {
  [settingId]Save.addEventListener('click', async () => {
    const value = [settingId]Element.value.trim();

    if (!value) {
      showFeedback('Please enter a value', 'error');
      return;
    }

    await updateSettings({ [settingKey]: value });
    showFeedback('Setting saved');
  });

  // Also save on Enter
  [settingId]Element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      [settingId]Save.click();
    }
  });
}


// ============================================================
// PATTERN: Secure Value (API Key, Password)
// ============================================================

// Load status only (never show actual value)
async function load[SettingId]Status() {
  const result = await chrome.storage.local.get(`${APP_SLUG}_[storage_key]`);
  const hasValue = !!result[`${APP_SLUG}_[storage_key]`];

  if ([settingId]Status) {
    if (hasValue) {
      [settingId]Status.textContent = 'Configured';
      [settingId]Status.style.color = 'var(--oia-sage)';
    } else {
      [settingId]Status.textContent = 'Not configured';
      [settingId]Status.style.color = 'var(--oia-text-muted)';
    }
  }

  // Clear input and show placeholder
  if ([settingId]Element) {
    [settingId]Element.value = '';
    [settingId]Element.placeholder = hasValue ? '••••••••••••••••' : 'Enter value';
  }
}

// Toggle visibility
if ([settingId]Toggle && [settingId]Element) {
  [settingId]Toggle.addEventListener('click', () => {
    const isPassword = [settingId]Element.type === 'password';
    [settingId]Element.type = isPassword ? 'text' : 'password';

    // Update icon
    [settingId]Toggle.innerHTML = isPassword
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`;
  });
}

// Save secure value
if ([settingId]Save && [settingId]Element) {
  [settingId]Save.addEventListener('click', async () => {
    const value = [settingId]Element.value.trim();

    if (!value) {
      showFeedback('Please enter a value', 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ [`${APP_SLUG}_[storage_key]`]: value });
      showFeedback('Saved successfully');
      await load[SettingId]Status();
    } catch (error) {
      showFeedback('Failed to save', 'error');
    }
  });

  [settingId]Element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      [settingId]Save.click();
    }
  });
}


// ============================================================
// PATTERN: Range Slider
// ============================================================

const [settingId]Value = document.getElementById('[setting-id]-value');

// Load
async function loadSettings() {
  const settings = await getSettings();

  if ([settingId]Element) {
    [settingId]Element.value = settings.[settingKey] ?? 50;
    if ([settingId]Value) {
      [settingId]Value.textContent = [settingId]Element.value;
    }
  }
}

// Update display on input (live feedback)
if ([settingId]Element && [settingId]Value) {
  [settingId]Element.addEventListener('input', () => {
    [settingId]Value.textContent = [settingId]Element.value;
  });
}

// Save on change (when user releases)
if ([settingId]Element) {
  [settingId]Element.addEventListener('change', async () => {
    await updateSettings({ [settingKey]: parseInt([settingId]Element.value) });
    showFeedback('Setting saved');
  });
}


// ============================================================
// PATTERN: Radio Group
// ============================================================

const [settingName]Radios = document.querySelectorAll('input[name="[setting-name]"]');

// Load
async function loadSettings() {
  const settings = await getSettings();

  if (settings.[settingKey]) {
    const radio = document.querySelector(`input[name="[setting-name]"][value="${settings.[settingKey]}"]`);
    if (radio) radio.checked = true;
  }
}

// Save on change
[settingName]Radios.forEach(radio => {
  radio.addEventListener('change', async () => {
    if (radio.checked) {
      await updateSettings({ [settingKey]: radio.value });
      showFeedback('Setting saved');
    }
  });
});


// ============================================================
// FEEDBACK TOAST (should already exist in options.js)
// ============================================================

function showFeedback(message, type = 'success') {
  // Remove existing
  const existing = document.querySelector('.options-feedback');
  if (existing) existing.remove();

  const feedback = document.createElement('div');
  feedback.className = `options-feedback options-feedback--${type}`;
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background-color: ${type === 'error' ? 'var(--oia-error)' : 'var(--oia-sage)'};
    color: white;
    border-radius: var(--oia-radius-md);
    font-size: var(--oia-size-body-sm);
    font-weight: var(--oia-weight-semibold);
    box-shadow: var(--oia-shadow-md);
    z-index: 1000;
    animation: fadeIn 150ms ease-out;
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transition = 'opacity 150ms ease-out';
    setTimeout(() => feedback.remove(), 150);
  }, 2000);
}


// ============================================================
// STORAGE SYNC (listen for changes from other contexts)
// ============================================================

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // Reload if our settings changed
  if (`${APP_SLUG}_settings` in changes || `${APP_SLUG}_[storage_key]` in changes) {
    loadSettings();
    // For secure values:
    // load[SettingId]Status();
  }
});


// ============================================================
// INITIALIZE
// ============================================================

loadSettings();
// For secure values:
// load[SettingId]Status();
