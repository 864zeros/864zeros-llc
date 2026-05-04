/**
 * oia.focus.signal - Panel Controller
 * Signal-to-noise prioritization for ADHD minds
 */

import { CONFIG } from './lib/constants.js';
import { getSignals, saveSignals, getSelectedRatio, saveSelectedRatio, filterExpiredSignals } from './lib/store.js';

class ADHDSignalApp {
  constructor() {
    this.signals = [];

    this.elements = {
      container: document.getElementById('container'),
      signalPillContainer: document.getElementById('signalPillContainer'),
      signalInput: document.getElementById('signalInput'),
      saveSignalBtn: document.getElementById('saveSignalBtn'),
      copyAllSignalsBtn: document.getElementById('copyAllSignalsBtn'),
      downloadSignalsBtn: document.getElementById('downloadSignalsBtn'),
      accordionContainer: document.getElementById('accordionContainer'),
      emptyState: document.getElementById('emptyState'),
      ratioStatus: document.getElementById('ratioStatus'),
      ratioButtons: document.querySelectorAll('input[name="signalRatio"]')
    };

    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadSignals();
    await this.performCleanup();
    this.setupEventListeners();
    this.updateDisplay();
  }

  async loadSettings() {
    try {
      const selectedRatio = await getSelectedRatio();
      const ratioButton = document.getElementById(`ratio${selectedRatio}`);
      if (ratioButton) {
        ratioButton.checked = true;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadSignals() {
    try {
      this.signals = await getSignals();
    } catch (error) {
      console.error('Error loading signals:', error);
      this.signals = [];
    }
  }

  async performCleanup() {
    const initialCount = this.signals.length;
    this.signals = filterExpiredSignals(this.signals);

    if (initialCount > this.signals.length) {
      await saveSignals(this.signals);
      console.log(`Cleaned up ${initialCount - this.signals.length} expired signals`);
    }
  }

  setupEventListeners() {
    // Signal-to-noise ratio buttons
    this.elements.ratioButtons.forEach(button => {
      button.addEventListener('change', async () => {
        await saveSelectedRatio(parseInt(button.value));
        this.updateRatioStatus();
      });
    });

    // Save signal button
    this.elements.saveSignalBtn.addEventListener('click', () => {
      this.saveSignal();
    });

    // Bulk actions
    this.elements.copyAllSignalsBtn.addEventListener('click', () => {
      this.copyAllSignals();
    });

    this.elements.downloadSignalsBtn.addEventListener('click', () => {
      this.downloadSignals();
    });

    // Signal input - save on Enter
    this.elements.signalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        this.saveSignal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.oia-accordion.oia-expanded').forEach(accordion => {
          accordion.classList.remove('oia-expanded');
        });
        this.elements.signalInput.focus();
      }
    });
  }

  generateSignalId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  generateSignalTitle(text) {
    const truncated = text.length <= CONFIG.titleMaxLength ? text : text.substr(0, CONFIG.titleMaxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 20 ? truncated.substr(0, lastSpace) + '...' : truncated + '...';
  }

  async saveSignal() {
    const text = this.elements.signalInput.value.trim();

    if (!text) {
      this.elements.signalInput.focus();
      return;
    }

    if (this.signals.length >= CONFIG.maxSignals) {
      alert(`Maximum ${CONFIG.maxSignals} signals allowed. Please delete a signal before adding a new one.`);
      return;
    }

    const signal = {
      id: this.generateSignalId(),
      text: text,
      title: this.generateSignalTitle(text),
      isMarked: false,
      timestamp: Date.now()
    };

    this.signals.unshift(signal);
    await saveSignals(this.signals);

    this.elements.signalInput.value = '';
    this.elements.signalInput.focus();

    this.updateDisplay();
  }

  async deleteSignal(id) {
    this.signals = this.signals.filter(signal => signal.id !== id);
    await saveSignals(this.signals);
    this.updateDisplay();
  }

  async toggleSignalMark(id) {
    const signal = this.signals.find(s => s.id === id);
    if (!signal) return;

    const currentMarkedCount = this.signals.filter(s => s.isMarked).length;
    if (!signal.isMarked && currentMarkedCount >= CONFIG.maxPrioritySignals) {
      alert(`Maximum ${CONFIG.maxPrioritySignals} priority signals allowed. Please unmark a signal first.`);
      return;
    }

    signal.isMarked = !signal.isMarked;
    await saveSignals(this.signals);

    this.updateSignalPill();
    this.updateSpecificAccordion(id);
    this.updateRatioStatus();
  }

  updateDisplay() {
    this.updateSignalPill();
    this.renderAccordions();
    this.updateEmptyState();
    this.updateRatioStatus();
  }

  getSignalRatioLimit() {
    const selectedRatio = document.querySelector('input[name="signalRatio"]:checked')?.value || '70';
    return Math.floor(parseInt(selectedRatio) / 10);
  }

  updateRatioStatus() {
    const ratioLimit = this.getSignalRatioLimit();
    const currentCount = this.signals.length;

    if (currentCount >= ratioLimit) {
      this.elements.ratioStatus.textContent = "you've reached the signal ratio goal.";
      this.elements.ratioStatus.style.display = 'block';
    } else {
      this.elements.ratioStatus.style.display = 'none';
    }
  }

  updateSignalPill() {
    const markedSignals = this.signals.filter(signal => signal.isMarked).slice(0, CONFIG.maxPrioritySignals);

    if (markedSignals.length === 0) {
      this.elements.signalPillContainer.className = 'oia-signal-pills oia-empty';
      this.elements.signalPillContainer.innerHTML = 'mark your priority signals to see them here';
    } else {
      this.elements.signalPillContainer.className = 'oia-signal-pills';
      this.elements.signalPillContainer.innerHTML = markedSignals
        .map(signal => `
          <div class="oia-pill-item" data-signal-id="${signal.id}">
            ${this.sanitizeText(signal.title)}
            <button class="oia-pill-delete" aria-label="remove from priority">&times;</button>
          </div>
        `)
        .join('');

      markedSignals.forEach(signal => {
        const pillItem = document.querySelector(`.oia-pill-item[data-signal-id="${signal.id}"]`);
        const deleteBtn = pillItem?.querySelector('.oia-pill-delete');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteSignal(signal.id);
          });
        }
      });
    }
  }

  renderAccordions() {
    if (this.signals.length === 0) {
      this.elements.accordionContainer.innerHTML = '';
      return;
    }

    const expandedAccordions = new Set();
    document.querySelectorAll('.oia-accordion.oia-expanded').forEach(acc => {
      const signalId = acc.getAttribute('data-signal-id');
      if (signalId) expandedAccordions.add(signalId);
    });

    this.elements.accordionContainer.innerHTML = this.signals
      .map(signal => this.createAccordionHTML(signal))
      .join('');

    this.signals.forEach(signal => {
      const accordion = document.querySelector(`[data-signal-id="${signal.id}"]`);
      if (accordion) {
        if (expandedAccordions.has(signal.id)) {
          accordion.classList.add('oia-expanded');
          const header = accordion.querySelector('.oia-accordion-header');
          if (header) header.setAttribute('aria-expanded', 'true');
        }

        this.attachAccordionListeners(signal.id);
      }
    });
  }

  createAccordionHTML(signal) {
    const timestamp = new Date(signal.timestamp).toLocaleString();
    const markButtonText = signal.isMarked ? 'unmark signal' : 'mark as signal';
    const markButtonClass = signal.isMarked ? 'oia-btn-mark oia-marked' : 'oia-btn-mark';

    return `
      <div class="oia-accordion" data-signal-id="${signal.id}">
        <div class="oia-accordion-header" tabindex="0" role="button" aria-expanded="false">
          <div class="oia-accordion-title">${this.sanitizeText(signal.title)}</div>
          <button class="oia-btn-delete" aria-label="delete signal">&times;</button>
        </div>
        <div class="oia-accordion-content">
          <div class="oia-accordion-text">${this.sanitizeText(signal.text)}</div>
          <div class="oia-accordion-actions">
            <button class="${markButtonClass}">${markButtonText}</button>
            <div class="oia-accordion-timestamp">${timestamp}</div>
          </div>
        </div>
      </div>
    `;
  }

  attachAccordionListeners(signalId) {
    const accordion = document.querySelector(`[data-signal-id="${signalId}"]`);
    if (!accordion) return;

    if (accordion.hasAttribute('data-listeners-attached')) return;

    const header = accordion.querySelector('.oia-accordion-header');
    const deleteBtn = accordion.querySelector('.oia-btn-delete');
    const markBtn = accordion.querySelector('.oia-btn-mark');

    if (!header || !deleteBtn || !markBtn) return;

    header.addEventListener('click', (e) => {
      if (e.target === deleteBtn || e.target.closest('.oia-btn-delete')) return;
      this.toggleAccordion(accordion);
    });

    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleAccordion(accordion);
      }
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteSignal(signalId);
    });

    markBtn.addEventListener('click', () => {
      this.toggleSignalMark(signalId);
    });

    accordion.setAttribute('data-listeners-attached', 'true');
  }

  updateSpecificAccordion(signalId) {
    const accordion = document.querySelector(`[data-signal-id="${signalId}"]`);
    if (!accordion) return;

    const signal = this.signals.find(s => s.id === signalId);
    if (!signal) return;

    const markBtn = accordion.querySelector('.oia-btn-mark');
    if (markBtn) {
      markBtn.textContent = signal.isMarked ? 'unmark signal' : 'mark as signal';
      markBtn.className = signal.isMarked ? 'oia-btn-mark oia-marked' : 'oia-btn-mark';
    }
  }

  toggleAccordion(accordion) {
    document.querySelectorAll('.oia-accordion.oia-expanded').forEach(acc => {
      if (acc !== accordion) {
        acc.classList.remove('oia-expanded');
        acc.querySelector('.oia-accordion-header').setAttribute('aria-expanded', 'false');
      }
    });

    accordion.classList.toggle('oia-expanded');
    const header = accordion.querySelector('.oia-accordion-header');
    header.setAttribute('aria-expanded', accordion.classList.contains('oia-expanded'));
  }

  updateEmptyState() {
    if (this.signals.length === 0) {
      this.elements.emptyState.classList.remove('oia-hidden');
      this.elements.accordionContainer.classList.add('oia-hidden');
    } else {
      this.elements.emptyState.classList.add('oia-hidden');
      this.elements.accordionContainer.classList.remove('oia-hidden');
    }
  }

  async copyAllSignals() {
    if (this.signals.length === 0) {
      return;
    }

    const text = this.signals
      .map(signal => signal.text)
      .join('\n\n---\n\n');

    try {
      await navigator.clipboard.writeText(text);

      const originalText = this.elements.copyAllSignalsBtn.innerHTML;
      this.elements.copyAllSignalsBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
        copied!
      `;

      setTimeout(() => {
        this.elements.copyAllSignalsBtn.innerHTML = originalText;
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }

  downloadSignals() {
    if (this.signals.length === 0) {
      return;
    }

    const text = this.signals
      .map(signal => {
        const timestamp = new Date(signal.timestamp).toLocaleString();
        const marked = signal.isMarked ? ' [PRIORITY]' : '';
        return `${signal.text}${marked}\n--- ${timestamp} ---`;
      })
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `oia-focus-signals-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    const originalText = this.elements.downloadSignalsBtn.innerHTML;
    this.elements.downloadSignalsBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
      downloaded!
    `;

    setTimeout(() => {
      this.elements.downloadSignalsBtn.innerHTML = originalText;
    }, 2000);
  }

  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[<>]/g, '');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ADHDSignalApp());
} else {
  new ADHDSignalApp();
}
