// Shared settings module
// Default settings used across the extension

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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_SETTINGS };
}
