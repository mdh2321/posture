// Shared settings module
// Default settings used across the extension
// This file is imported via importScripts() in service worker
// and used directly in options/popup pages

const DEFAULT_SETTINGS = {
  intervals: {
    postureCheck: 10, // minutes
    stretchReminder: 30 // minutes
  },
  audio: {
    enabled: true,
    volume: 0.7
  },
  enabled: true, // Extension active/inactive
  paused: false,  // Temporary pause state (separate from enabled)
  workingHours: {
    enabled: false,
    start: '09:00',
    end: '17:00'
  }
};

// In Chrome extensions, importScripts() makes variables globally available
// No need for module.exports pattern
