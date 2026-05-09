/**
 * oia.focus (timer) - Panel Controller
 * Focus timer with ADHD-friendly design
 */

import { CONFIG, SOUND_OPTIONS } from './lib/constants.js';
import { getSettings, saveSettings, getSoundType, saveSoundType, saveLastFocusText } from './lib/store.js';

class ADHDTimer {
  constructor() {
    this.timerInterval = null;
    this.remainingTime = 0;
    this.totalTime = 0;
    this.isPaused = false;
    this.alertTimeout = null;
    this.audioContext = null;

    this.elements = {
      container: document.getElementById('container'),
      selectionView: document.getElementById('selectionView'),
      timerView: document.getElementById('timerView'),
      completionOverlay: document.getElementById('completionOverlay'),
      soundSelect: document.getElementById('soundSelect'),
      playSound: document.getElementById('playSound'),
      focusInput: document.getElementById('focusInput'),
      timeRemaining: document.getElementById('timeRemaining'),
      progressCircle: document.getElementById('progressCircle'),
      sessionType: document.getElementById('sessionType'),
      sessionDuration: document.getElementById('sessionDuration'),
      pauseButton: document.getElementById('pauseButton'),
      pauseText: document.getElementById('pauseText'),
      resetButton: document.getElementById('resetButton')
    };

    this.sounds = {
      'soft-chime': this.createSoftChime(),
      'nature-pop': this.createNaturePop(),
      'breath': this.createBreathSound()
    };

    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  async loadSettings() {
    try {
      const settings = await getSettings();

      if (settings.soundType) {
        this.elements.soundSelect.value = settings.soundType;
      }

      if (settings.lastFocusText) {
        this.elements.focusInput.value = settings.lastFocusText;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  setupEventListeners() {
    // Time selection buttons - use updated OIA class
    document.querySelectorAll('.oia-time-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const minutes = parseInt(e.currentTarget.dataset.minutes);
        this.startTimer(minutes);
      });
    });

    // Sound selection
    this.elements.soundSelect.addEventListener('change', async () => {
      await saveSoundType(this.elements.soundSelect.value);
    });

    // Play sound preview
    this.elements.playSound.addEventListener('click', () => {
      this.previewSound();
    });

    // Focus input - auto-save on input with debounce
    let focusInputTimeout;
    this.elements.focusInput.addEventListener('input', () => {
      clearTimeout(focusInputTimeout);
      focusInputTimeout = setTimeout(async () => {
        await saveLastFocusText(this.elements.focusInput.value.trim());
      }, 500);
    });

    // Timer controls
    this.elements.pauseButton.addEventListener('click', () => {
      this.togglePause();
    });

    this.elements.resetButton.addEventListener('click', () => {
      this.resetTimer();
    });

    // Completion overlay
    this.elements.completionOverlay.addEventListener('click', () => {
      this.dismissCompletion();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.elements.completionOverlay.classList.contains('oia-hidden')) {
          this.dismissCompletion();
        } else if (!this.elements.timerView.classList.contains('oia-hidden')) {
          this.resetTimer();
        }
      } else if (e.key === ' ' && !this.elements.timerView.classList.contains('oia-hidden')) {
        e.preventDefault();
        this.togglePause();
      }
    });
  }

  async startTimer(minutes) {
    this.totalTime = minutes * 60;
    this.remainingTime = this.totalTime;
    this.isPaused = false;

    // Get focus text
    const focusText = this.elements.focusInput.value.trim();

    // Update session info
    if (focusText) {
      this.elements.sessionType.textContent = `Focus: ${focusText}`;
      this.elements.sessionDuration.textContent = `${minutes} minutes`;
    } else {
      this.elements.sessionType.textContent = 'Focus Session';
      this.elements.sessionDuration.textContent = `${minutes} minutes`;
    }

    // Save the focus text
    await saveLastFocusText(focusText);

    // Show timer view
    this.showView('timer');

    // Start the countdown
    this.updateDisplay();
    this.startInterval();
  }

  startInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.remainingTime--;
        this.updateDisplay();

        if (this.remainingTime <= 0) {
          this.completeTimer();
        }
      }
    }, 1000);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.elements.pauseText.textContent = this.isPaused ? 'Resume' : 'Pause';

    if (!this.isPaused && this.remainingTime > 0) {
      this.startInterval();
    }
  }

  resetTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.remainingTime = 0;
    this.totalTime = 0;
    this.isPaused = false;
    this.elements.pauseText.textContent = 'Pause';

    this.showView('selection');
  }

  completeTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.showCompletion();
    this.playAlertSound();
    this.showNotification();

    // Auto-dismiss after configured time
    this.alertTimeout = setTimeout(() => {
      this.dismissCompletion();
    }, CONFIG.completionAutoDismissMs);
  }

  showCompletion() {
    this.elements.completionOverlay.classList.remove('oia-hidden');
  }

  dismissCompletion() {
    this.elements.completionOverlay.classList.add('oia-hidden');

    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }

    this.resetTimer();
  }

  updateDisplay() {
    // Update time display
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    this.elements.timeRemaining.textContent =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update progress ring
    const progress = (this.totalTime - this.remainingTime) / this.totalTime;
    const circumference = 2 * Math.PI * 54; // radius = 54
    const dashOffset = circumference - (progress * circumference);
    this.elements.progressCircle.style.strokeDashoffset = dashOffset;
  }

  showView(viewName) {
    this.elements.selectionView.classList.add('oia-hidden');
    this.elements.timerView.classList.add('oia-hidden');

    if (viewName === 'selection') {
      this.elements.selectionView.classList.remove('oia-hidden');
    } else if (viewName === 'timer') {
      this.elements.timerView.classList.remove('oia-hidden');
    }
  }

  async previewSound() {
    const soundType = this.elements.soundSelect.value;

    if (soundType === SOUND_OPTIONS.OFF) {
      return;
    }

    // Disable button temporarily to prevent spam
    this.elements.playSound.disabled = true;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const soundFunction = this.sounds[soundType];
      if (soundFunction) {
        await soundFunction();
      }
    } catch (error) {
      console.error('Error previewing sound:', error);
    } finally {
      // Re-enable button after 1 second
      setTimeout(() => {
        this.elements.playSound.disabled = false;
      }, 1000);
    }
  }

  async playAlertSound() {
    const soundType = this.elements.soundSelect.value;

    if (soundType === SOUND_OPTIONS.OFF) return;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const soundFunction = this.sounds[soundType];
      if (soundFunction) {
        await soundFunction();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  createSoftChime() {
    return async () => {
      const context = this.audioContext;
      const gainNode = context.createGain();

      // Create a soft bell-like sound
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

      frequencies.forEach((freq, index) => {
        const oscillator = context.createOscillator();
        const noteGain = context.createGain();

        oscillator.frequency.setValueAtTime(freq, context.currentTime);
        oscillator.type = 'sine';

        noteGain.gain.setValueAtTime(0, context.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.1 + index * 0.2);
        noteGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2 + index * 0.2);

        oscillator.connect(noteGain);
        noteGain.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(context.currentTime + index * 0.2);
        oscillator.stop(context.currentTime + 2 + index * 0.2);
      });

      gainNode.gain.setValueAtTime(0.3, context.currentTime);
    };
  }

  createNaturePop() {
    return async () => {
      const context = this.audioContext;
      const gainNode = context.createGain();

      // Create a gentle pop sound like a water drop
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();

      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, context.currentTime + 0.3);
      oscillator.type = 'sine';

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, context.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3);
    };
  }

  createBreathSound() {
    return async () => {
      const context = this.audioContext;
      const gainNode = context.createGain();

      // Create a breathing-like whoosh sound
      const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = context.createBufferSource();
      const filter = context.createBiquadFilter();

      noiseSource.buffer = noiseBuffer;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, context.currentTime);
      filter.Q.setValueAtTime(2, context.currentTime);

      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.5);
      gainNode.gain.linearRampToValueAtTime(0.05, context.currentTime + 1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(context.destination);

      noiseSource.start(context.currentTime);
      noiseSource.stop(context.currentTime + 2);
    };
  }

  async showNotification() {
    try {
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'oia.focus',
          message: 'Focus session complete!',
          silent: true
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ADHDTimer());
} else {
  new ADHDTimer();
}
