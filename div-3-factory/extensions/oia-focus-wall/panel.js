/**
 * oia.focus.wall - Sticky Note Wall for ADHD minds
 * Implements drag & drop sticky notes with 24-hour expiry
 */

import { CONFIG, NOTE_TYPES } from './lib/constants.js';
import { getNotes, saveNotes, filterExpiredNotes } from './lib/store.js';

class ADHDWallApp {
  constructor() {
    this.notes = [];
    this.currentZIndex = 1;
    this.currentTypeIndex = 0;
    this.editingNoteId = null;
    this.isDragging = false;

    this.elements = {
      corkBoard: document.getElementById('corkBoard'),
      brainDumpTextarea: document.getElementById('brainDump'),
      saveButton: document.getElementById('saveButton'),
      copyButton: document.getElementById('copyButton'),
      downloadButton: document.getElementById('downloadButton'),
      noteCount: document.getElementById('noteCount'),
      notesContainer: document.getElementById('notesContainer'),
      emptyWallMessage: document.getElementById('emptyWallMessage'),
      resizeHandle: document.getElementById('resizeHandle')
    };

    this.init();
  }

  async init() {
    await this.loadNotes();
    this.setupEventListeners();
    this.renderNotes();
    this.updateNoteCount();
    this.setupResize();
  }

  async loadNotes() {
    try {
      this.notes = await getNotes();
      // Filter out expired notes
      this.notes = filterExpiredNotes(this.notes);
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
      if (e.key === 'Escape' && this.editingNoteId) {
        this.cancelEdit();
      }
    });

    // Cork board click for deselection
    this.elements.corkBoard.addEventListener('click', (e) => {
      if (e.target === this.elements.corkBoard && this.editingNoteId) {
        this.cancelEdit();
      }
    });
  }

  setupResize() {
    let startX, isDragging = false;

    this.elements.resizeHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;

      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);

      e.preventDefault();
    });

    const handleResize = (e) => {
      if (!isDragging) return;

      const diff = startX - e.clientX;

      if (diff > 50) {
        const newWidth = Math.min(diff, window.innerWidth - 450);
        this.elements.corkBoard.style.width = newWidth + 'px';
        this.elements.corkBoard.style.right = '420px';
        this.elements.corkBoard.classList.add('oia-expanded');
        this.elements.resizeHandle.style.right = (400 + newWidth) + 'px';
      } else {
        this.elements.corkBoard.style.width = '0px';
        this.elements.corkBoard.classList.remove('oia-expanded');
        this.elements.resizeHandle.style.right = '400px';
      }
    };

    const stopResize = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
  }

  async saveNote() {
    const text = this.elements.brainDumpTextarea.value.trim();

    if (!text) {
      return;
    }

    if (this.editingNoteId) {
      const note = this.notes.find(n => n.id === this.editingNoteId);
      if (note) {
        note.text = text;
        note.timestamp = Date.now();
        await saveNotes(this.notes);
        this.renderNotes();
        this.cancelEdit();
      }
      return;
    }

    if (this.notes.length >= CONFIG.maxNotes) {
      alert('Maximum 10 sticky notes allowed. Delete some notes first.');
      return;
    }

    // Auto-expand cork board if collapsed
    if (this.elements.corkBoard.offsetWidth === 0) {
      this.elements.corkBoard.style.width = '400px';
      this.elements.corkBoard.classList.add('oia-expanded');
      this.elements.resizeHandle.style.right = '800px';
    }

    // Get next note type
    const noteType = NOTE_TYPES[this.currentTypeIndex];
    this.currentTypeIndex = (this.currentTypeIndex + 1) % NOTE_TYPES.length;

    // Get cork board dimensions for positioning
    const boardWidth = Math.max(400, this.elements.corkBoard.offsetWidth);
    const boardHeight = this.elements.corkBoard.offsetHeight;

    // Create new note with random position
    const note = {
      id: Date.now().toString(),
      text: text,
      timestamp: Date.now(),
      type: noteType,
      x: Math.random() * (boardWidth - 150),
      y: Math.random() * (boardHeight - 150),
      zIndex: this.currentZIndex++
    };

    this.notes.push(note);
    await saveNotes(this.notes);
    this.elements.brainDumpTextarea.value = '';
    this.renderNotes();
    this.updateNoteCount();
  }

  renderNotes() {
    // Clear existing sticky notes
    const existingStickies = this.elements.corkBoard.querySelectorAll('.oia-sticky-note');
    existingStickies.forEach(note => note.remove());

    // Clear existing accordion notes
    this.elements.notesContainer.innerHTML = '';

    // Show/hide empty message
    if (this.notes.length === 0) {
      this.elements.emptyWallMessage.style.display = 'block';
      this.elements.notesContainer.innerHTML = '<div class="oia-empty">no notes yet. start by writing something above.</div>';
    } else {
      this.elements.emptyWallMessage.style.display = 'none';
    }

    // Create both sticky notes and accordion notes
    this.notes.forEach(note => {
      const stickyElement = this.createStickyNote(note);
      this.elements.corkBoard.appendChild(stickyElement);

      const accordionElement = this.createAccordionNote(note);
      this.elements.notesContainer.appendChild(accordionElement);
    });
  }

  createStickyNote(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = `oia-sticky-note oia-${note.type}`;
    noteDiv.style.left = note.x + 'px';
    noteDiv.style.top = note.y + 'px';
    noteDiv.style.zIndex = note.zIndex;
    noteDiv.style.transform = `rotate(${(Math.random() - 0.5) * 6}deg)`;
    noteDiv.setAttribute('data-note-id', note.id);

    noteDiv.innerHTML = `
      <div class="oia-sticky-ribbon oia-${note.type}-ribbon"></div>
      <button class="oia-sticky-delete" aria-label="delete note">&times;</button>
      <div class="oia-sticky-content">${this.sanitizeInput(note.text)}</div>
    `;

    this.setupStickyNoteEvents(noteDiv, note);
    return noteDiv;
  }

  createAccordionNote(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'oia-note-accordion';
    noteDiv.setAttribute('data-note-id', note.id);

    const timeString = new Date(note.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();

    const title = this.generateNoteTitle(note.text);

    noteDiv.innerHTML = `
      <div class="oia-note-header">
        <div class="oia-note-type-indicator oia-${note.type}-indicator"></div>
        <div class="oia-note-title">${title}</div>
        <button class="oia-btn-delete" aria-label="delete note">&times;</button>
      </div>
      <div class="oia-note-content">
        <div class="oia-note-text">${this.sanitizeInput(note.text)}</div>
        <div class="oia-note-timestamp">${timeString}</div>
      </div>
    `;

    this.setupAccordionNoteEvents(noteDiv, note);
    return noteDiv;
  }

  generateNoteTitle(text) {
    const words = text.split(' ');
    const title = words.slice(0, CONFIG.titleWordCount).join(' ');
    return title.length < text.length ? title : text;
  }

  setupStickyNoteEvents(noteElement, note) {
    const deleteButton = noteElement.querySelector('.oia-sticky-delete');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteNote(note.id);
    });

    noteElement.addEventListener('dblclick', (e) => {
      if (!isDragging) {
        this.editNote(note.id);
      }
    });

    noteElement.addEventListener('mousedown', (e) => {
      if (e.target === deleteButton) return;

      this.bringNoteToFront(noteElement);

      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(noteElement.style.left);
      startTop = parseInt(noteElement.style.top);

      const handleMouseMove = (e) => {
        if (!isDragging && (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5)) {
          isDragging = true;
          noteElement.classList.add('oia-dragging');
        }

        if (isDragging) {
          const newX = startLeft + (e.clientX - startX);
          const newY = startTop + (e.clientY - startY);

          const maxX = Math.max(250, this.elements.corkBoard.offsetWidth - 150);
          const maxY = this.elements.corkBoard.offsetHeight - 150;

          noteElement.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
          noteElement.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        }
      };

      const handleMouseUp = () => {
        if (isDragging) {
          noteElement.classList.remove('oia-dragging');
          this.updateNotePosition(note.id, parseInt(noteElement.style.left), parseInt(noteElement.style.top));
        }

        setTimeout(() => {
          isDragging = false;
        }, 10);

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      e.preventDefault();
    });
  }

  setupAccordionNoteEvents(noteElement, note) {
    const header = noteElement.querySelector('.oia-note-header');
    const deleteButton = noteElement.querySelector('.oia-btn-delete');

    header.addEventListener('click', (e) => {
      if (e.target !== deleteButton) {
        this.toggleAccordionNote(noteElement);
      }
    });

    noteElement.addEventListener('click', (e) => {
      if (e.target !== deleteButton && !noteElement.classList.contains('oia-expanded')) {
        this.editNote(note.id);
        this.highlightConnectedElements(note.id);
      }
    });

    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteNote(note.id);
    });
  }

  toggleAccordionNote(noteElement) {
    document.querySelectorAll('.oia-note-accordion').forEach(note => {
      if (note !== noteElement) {
        note.classList.remove('oia-expanded');
      }
    });

    noteElement.classList.toggle('oia-expanded');
  }

  highlightConnectedElements(noteId) {
    document.querySelectorAll('.oia-highlighted').forEach(el => {
      el.classList.remove('oia-highlighted');
    });

    const stickyNote = document.querySelector(`[data-note-id="${noteId}"].oia-sticky-note`);
    const accordionNote = document.querySelector(`[data-note-id="${noteId}"].oia-note-accordion`);

    if (stickyNote) stickyNote.classList.add('oia-highlighted');
    if (accordionNote) accordionNote.classList.add('oia-highlighted');

    setTimeout(() => {
      if (stickyNote) stickyNote.classList.remove('oia-highlighted');
      if (accordionNote) accordionNote.classList.remove('oia-highlighted');
    }, 2000);
  }

  bringNoteToFront(noteElement) {
    noteElement.style.zIndex = this.currentZIndex++;

    const noteId = noteElement.getAttribute('data-note-id');
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.zIndex = this.currentZIndex - 1;
      saveNotes(this.notes);
    }
  }

  editNote(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      this.elements.brainDumpTextarea.value = note.text;
      this.elements.brainDumpTextarea.focus();
      this.editingNoteId = noteId;
      this.elements.saveButton.textContent = 'update sticky';
      this.highlightConnectedElements(noteId);
    }
  }

  cancelEdit() {
    this.editingNoteId = null;
    this.elements.brainDumpTextarea.value = '';
    this.elements.saveButton.textContent = 'save sticky';
  }

  async updateNotePosition(noteId, x, y) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.x = x;
      note.y = y;
      await saveNotes(this.notes);
    }
  }

  async deleteNote(noteId) {
    this.notes = this.notes.filter(note => note.id !== noteId);
    await saveNotes(this.notes);
    this.renderNotes();
    this.updateNoteCount();

    if (this.editingNoteId === noteId) {
      this.cancelEdit();
    }
  }

  updateNoteCount() {
    this.elements.noteCount.textContent = `${this.notes.length} of ${CONFIG.maxNotes} notes`;
    this.elements.saveButton.disabled = this.notes.length >= CONFIG.maxNotes && !this.editingNoteId;
  }

  async copyAllNotes() {
    if (this.notes.length === 0) {
      return;
    }

    const allText = this.notes.map(note => note.text).join('\n\n');

    try {
      await navigator.clipboard.writeText(allText);
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
    a.download = `oia-wall-notes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, CONFIG.maxNoteLength);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ADHDWallApp());
} else {
  new ADHDWallApp();
}
