/**
 * oia.focus.sound - Panel Controller
 * Background sounds for ADHD focus
 */

import { SOUND_TYPES, SOUND_NAMES } from './lib/constants.js';
import { getSettings, saveSettings, saveCurrentSound, saveIsPlaying } from './lib/store.js';

class ADHDSoundApp {
  constructor() {
    this.currentSound = SOUND_TYPES.WHITE_NOISE;
    this.isPlaying = false;
    this.audio = null;

    // Sound file URLs - using local bundled audio files
    this.soundUrls = {
      [SOUND_TYPES.WHITE_NOISE]: chrome.runtime.getURL('audio/white-noise.mp3'),
      [SOUND_TYPES.PINK_NOISE]: chrome.runtime.getURL('audio/gray-noise.mp3'),
      [SOUND_TYPES.BROWN_NOISE]: chrome.runtime.getURL('audio/brown-noise.mp3'),
      [SOUND_TYPES.RAIN]: chrome.runtime.getURL('audio/rain.mp3')
    };

    this.elements = {
      toggleButton: document.getElementById('toggleButton'),
      statusDisplay: document.getElementById('statusDisplay'),
      whiteNoiseButton: document.getElementById('whiteNoiseButton'),
      pinkNoiseButton: document.getElementById('pinkNoiseButton'),
      brownNoiseButton: document.getElementById('brownNoiseButton'),
      rainButton: document.getElementById('rainButton')
    };

    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateSoundButtons();
    this.updateUI();
  }

  async loadSettings() {
    try {
      const settings = await getSettings();

      if (settings.currentSound) {
        this.currentSound = settings.currentSound;
      }

      // Don't auto-resume playback on load
      this.isPlaying = false;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  setupEventListeners() {
    // Main toggle button
    this.elements.toggleButton.addEventListener('click', () => this.togglePlayback());

    // Sound selection buttons
    this.elements.whiteNoiseButton.addEventListener('click', () => this.selectSound(SOUND_TYPES.WHITE_NOISE));
    this.elements.pinkNoiseButton.addEventListener('click', () => this.selectSound(SOUND_TYPES.PINK_NOISE));
    this.elements.brownNoiseButton.addEventListener('click', () => this.selectSound(SOUND_TYPES.BROWN_NOISE));
    this.elements.rainButton.addEventListener('click', () => this.selectSound(SOUND_TYPES.RAIN));
  }

  updateSoundButtons() {
    // Remove active class from all sound buttons
    document.querySelectorAll('.oia-sound-btn').forEach(button => {
      button.classList.remove('oia-active');
    });

    // Add active class to current sound button
    const soundButtonMap = {
      [SOUND_TYPES.WHITE_NOISE]: this.elements.whiteNoiseButton,
      [SOUND_TYPES.PINK_NOISE]: this.elements.pinkNoiseButton,
      [SOUND_TYPES.BROWN_NOISE]: this.elements.brownNoiseButton,
      [SOUND_TYPES.RAIN]: this.elements.rainButton
    };

    const activeButton = soundButtonMap[this.currentSound];
    if (activeButton) {
      activeButton.classList.add('oia-active');
    }
  }

  updateUI() {
    if (this.isPlaying) {
      this.elements.toggleButton.textContent = 'stop sound';
      this.elements.toggleButton.classList.add('oia-playing');
      this.elements.statusDisplay.textContent = `playing: ${SOUND_NAMES[this.currentSound]}`;
    } else {
      this.elements.toggleButton.textContent = 'start sound';
      this.elements.toggleButton.classList.remove('oia-playing');
      this.elements.statusDisplay.textContent = 'sound off';
    }

    this.updateSoundButtons();
  }

  async togglePlayback() {
    try {
      if (this.isPlaying) {
        await this.stopSound();
      } else {
        await this.playSound(this.currentSound);
      }

      this.updateUI();
      await saveIsPlaying(this.isPlaying);
    } catch (error) {
      console.error('Error toggling playback:', error);
      this.isPlaying = false;
      this.updateUI();
    }
  }

  async selectSound(soundType) {
    if (soundType === this.currentSound) {
      return;
    }

    try {
      const wasPlaying = this.isPlaying;

      if (this.isPlaying) {
        await this.stopSound();
      }

      this.currentSound = soundType;

      if (wasPlaying) {
        await this.playSound(this.currentSound);
      }

      this.updateUI();
      await saveCurrentSound(this.currentSound);
    } catch (error) {
      console.error('Error changing sound:', error);
    }
  }

  async playSound(soundType) {
    try {
      await this.stopSound();

      const url = this.soundUrls[soundType];
      if (!url) {
        throw new Error(`Unknown sound type: ${soundType}`);
      }

      this.audio = new Audio(url);
      this.audio.loop = true;
      this.audio.preload = 'auto';

      this.audio.addEventListener('error', (e) => {
        console.error(`Audio error for ${soundType}:`, e);
        this.isPlaying = false;
        this.updateUI();
      });

      this.audio.addEventListener('ended', () => {
        if (this.isPlaying) {
          this.audio.currentTime = 0;
          this.audio.play().catch(error => {
            console.error('Error restarting audio:', error);
            this.isPlaying = false;
            this.updateUI();
          });
        }
      });

      await this.audio.play();
      this.isPlaying = true;

    } catch (error) {
      console.error(`Error playing sound ${soundType}:`, error);
      this.isPlaying = false;
      throw error;
    }
  }

  async stopSound() {
    try {
      if (this.audio) {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.src = '';
        this.audio = null;
      }

      this.isPlaying = false;
    } catch (error) {
      console.error('Error stopping sound:', error);
      this.isPlaying = false;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ADHDSoundApp());
} else {
  new ADHDSoundApp();
}
