/**
 * oia.focus.note - Main App
 * 864z-build-kit compliant
 */

import { CONFIG } from './lib/constants.js';
import { getNotes, saveNotes, filterExpiredNotes } from './lib/store.js';

class ADHDNoteApp {
  constructor() {
    this.notes = [];

    this.elements = {
      brainDumpTextarea: document.getElementById('brainDump'),
      saveButton: document.getElementById('saveButton'),
      copyButton: document.getElementById('copyButton'),
      downloadButton: document.getElementById('downloadButton'),
      notesContainer: document.getElementById('notesContainer')
    };

    this.init();
  }

  async init() {
    await this.loadNotes();
    this.setupEventListeners();
    this.renderNotes();
  }

  async loadNotes() {
    try {
      const notes = await getNotes();
      // Filter out expired notes (older than 24 hours)
      this.notes = filterExpiredNotes(notes);
      // Save filtered notes back to storage
      await saveNotes(this.notes);
    } catch (error) {
      console.error('Error loading notes:', error);
      this.notes = [];
    }
  }

  setupEventListeners() {
    // Action buttons
    this.elements.saveButton.addEventListener('click', () => this.saveNote());
    this.elements.copyButton.addEventListener('click', () => this.copyAllNotes());
    this.elements.downloadButton.addEventListener('click', () => this.downloadNotes());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.saveNote();
      }
    });
  }

  async saveNote() {
    const text = this.elements.brainDumpTextarea.value.trim();

    if (!text) {
      return;
    }

    // Create new note
    const note = {
      id: Date.now().toString(),
      text: text,
      timestamp: Date.now(),
      title: this.generateNoteTitle(text)
    };

    // Add to beginning of notes array
    this.notes.unshift(note);

    // Save to storage
    await saveNotes(this.notes);

    // Clear textarea
    this.elements.brainDumpTextarea.value = '';

    // Re-render notes
    this.renderNotes();

    // Auto-expand the new note
    setTimeout(() => {
      const newNoteElement = document.querySelector(`[data-note-id="${note.id}"]`);
      if (newNoteElement) {
        this.toggleNote(newNoteElement);
      }
    }, 100);
  }

  generateNoteTitle(text) {
    // Extract first meaningful part of the text as title
    const words = text.split(' ');
    const title = words.slice(0, CONFIG.titleWordCount).join(' ');
    return title.length < text.length ? title : text;
  }

  renderNotes() {
    const container = this.elements.notesContainer;

    if (this.notes.length === 0) {
      container.innerHTML = `
        <div class="oia-empty">
          <p class="oia-empty__text">no notes yet. start by writing something above.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    this.notes.forEach(note => {
      const noteElement = this.createNoteElement(note);
      container.appendChild(noteElement);
    });
  }

  createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'oia-card';
    noteDiv.setAttribute('data-note-id', note.id);

    const timeString = new Date(note.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();

    noteDiv.innerHTML = `
      <div class="oia-card__header">
        <div class="oia-card__title">${this.escapeHtml(note.title)}</div>
        <button class="oia-btn-delete" aria-label="delete note">&times;</button>
      </div>
      <div class="oia-card__content">
        <div class="oia-card__text">${this.escapeHtml(note.text)}</div>
        <div class="oia-card__meta">${timeString}</div>
      </div>
    `;

    // Add event listeners
    const header = noteDiv.querySelector('.oia-card__header');
    const deleteButton = noteDiv.querySelector('.oia-btn-delete');

    header.addEventListener('click', (e) => {
      if (e.target !== deleteButton) {
        this.toggleNote(noteDiv);
      }
    });

    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteNote(note.id, noteDiv);
    });

    return noteDiv;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  toggleNote(noteElement) {
    // Close all other notes
    document.querySelectorAll('.oia-card').forEach(note => {
      if (note !== noteElement) {
        note.classList.remove('expanded');
      }
    });

    // Toggle current note
    noteElement.classList.toggle('expanded');
  }

  async deleteNote(noteId, noteElement) {
    // Remove note with gentle animation
    noteElement.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
    noteElement.style.opacity = '0';
    noteElement.style.transform = 'scale(0.95)';

    setTimeout(async () => {
      // Remove from notes array
      this.notes = this.notes.filter(note => note.id !== noteId);

      // Save to storage
      await saveNotes(this.notes);

      // Re-render notes
      this.renderNotes();
    }, 250);
  }

  async copyAllNotes() {
    if (this.notes.length === 0) {
      return;
    }

    const allText = this.notes.map(note => note.text).join('\n\n');

    try {
      await navigator.clipboard.writeText(allText);
      // Visual feedback could be added here (toast)
    } catch (error) {
      console.error('Failed to copy notes:', error);
    }
  }

  downloadNotes() {
    if (this.notes.length === 0) {
      return;
    }

    const allText = this.notes.map(note => note.text).join('\n\n');
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `oia-notes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ADHDNoteApp());
} else {
  new ADHDNoteApp();
}
