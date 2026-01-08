// Import stretch library
importScripts('../lib/stretches.js');

// Default settings
const DEFAULT_SETTINGS = {
  intervals: {
    postureCheck: 10, // minutes
    stretchReminder: 30 // minutes
  },
  audio: {
    enabled: true,
    volume: 0.7
  },
  enabled: true,
  workingHours: {
    enabled: false,
    start: '09:00',
    end: '17:00'
  }
};

// Alarm names
const ALARMS = {
  POSTURE: 'posture-check',
  STRETCH: 'stretch-reminder'
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Posture & Tension Relief extension installed');

  // Load or set default settings
  const result = await chrome.storage.sync.get('settings');
  if (!result.settings) {
    console.log('Initializing default settings');
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }

  // Start alarms
  await startAlarms();
});

// Also initialize on startup (when browser starts)
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension starting up');
  const result = await chrome.storage.sync.get('settings');
  if (!result.settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
  await startAlarms();
});

// Start all alarms based on current settings
async function startAlarms() {
  const { settings } = await chrome.storage.sync.get('settings');
  const config = settings || DEFAULT_SETTINGS;

  // Clear existing alarms
  await chrome.alarms.clearAll();

  if (!config.enabled) {
    console.log('Extension disabled, not starting alarms');
    return;
  }

  // Check if we're in working hours (if enabled)
  if (config.workingHours.enabled && !isWithinWorkingHours(config.workingHours)) {
    console.log('Outside working hours, not starting alarms');
    return;
  }

  // Create posture check alarm
  chrome.alarms.create(ALARMS.POSTURE, {
    delayInMinutes: config.intervals.postureCheck,
    periodInMinutes: config.intervals.postureCheck
  });

  // Create stretch reminder alarm
  chrome.alarms.create(ALARMS.STRETCH, {
    delayInMinutes: config.intervals.stretchReminder,
    periodInMinutes: config.intervals.stretchReminder
  });

  console.log(`Alarms started: Posture every ${config.intervals.postureCheck}min, Stretch every ${config.intervals.stretchReminder}min`);
}

// Stop all alarms
async function stopAlarms() {
  await chrome.alarms.clearAll();
  console.log('All alarms stopped');
}

// Check if current time is within working hours
function isWithinWorkingHours(workingHours) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentTime >= workingHours.start && currentTime <= workingHours.end;
}

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const { settings } = await chrome.storage.sync.get('settings');
  const config = settings || DEFAULT_SETTINGS;

  // Check if extension is enabled
  if (!config.enabled) {
    return;
  }

  // Check working hours
  if (config.workingHours.enabled && !isWithinWorkingHours(config.workingHours)) {
    console.log('Outside working hours, skipping alarm');
    return;
  }

  switch (alarm.name) {
    case ALARMS.POSTURE:
      showPostureReminder(config);
      break;
    case ALARMS.STRETCH:
      showStretchReminder(config);
      break;
  }
});

// Show posture check reminder
async function showPostureReminder(config) {
  const notificationId = `posture-${Date.now()}`;

  await chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: '../assets/icons/icon128.png',
    title: 'Posture Check',
    message: 'Take a moment to check your posture. Sit up straight, shoulders back, chin level.',
    priority: 1,
    requireInteraction: false
  });

  // Play audio if enabled
  if (config.audio.enabled) {
    playSound('posture-chime', config.audio.volume);
  }

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    chrome.notifications.clear(notificationId);
  }, 10000);
}

// Show stretch reminder with a random stretch
async function showStretchReminder(config) {
  const stretch = getRandomStretch();
  const notificationId = `stretch-${Date.now()}`;

  const message = `Time for a stretch break!\n\n${stretch.name}\n${stretch.description}`;

  await chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: '../assets/icons/icon128.png',
    title: 'Stretch Break',
    message: message,
    priority: 2,
    requireInteraction: false,
    buttons: [
      { title: 'Show Instructions' }
    ]
  });

  // Store stretch ID for later retrieval
  await chrome.storage.local.set({ [`stretch-${notificationId}`]: stretch.id });

  // Play audio if enabled
  if (config.audio.enabled) {
    playSound('stretch-bell', config.audio.volume);
  }

  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    chrome.notifications.clear(notificationId);
  }, 15000);
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId.startsWith('stretch-') && buttonIndex === 0) {
    // Get stretch ID from storage
    const key = `stretch-${notificationId}`;
    const result = await chrome.storage.local.get(key);
    const stretchId = result[key];

    if (stretchId) {
      const stretch = getStretchById(stretchId);
      if (stretch) {
        showStretchInstructions(stretch);
      }
    }

    // Clear the notification
    chrome.notifications.clear(notificationId);
  }
});

// Show detailed stretch instructions in a new notification
async function showStretchInstructions(stretch) {
  const instructions = stretch.instructions.join('\n• ');
  const message = `${stretch.name}\n\n• ${instructions}\n\nBenefits: ${stretch.benefits}`;

  await chrome.notifications.create(`instructions-${Date.now()}`, {
    type: 'basic',
    iconUrl: '../assets/icons/icon128.png',
    title: 'Stretch Instructions',
    message: message,
    priority: 2,
    requireInteraction: true
  });
}

// Play notification sound
function playSound(soundType, volume = 0.7) {
  // Create an offscreen document to play audio (required in Manifest V3)
  // For MVP, we'll use a simpler approach with notification sounds
  // Note: Chrome's built-in notification sounds will play automatically

  // In a future version, we can add custom audio using offscreen documents
  console.log(`Playing sound: ${soundType} at volume ${volume}`);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle async operations properly
  (async () => {
    try {
      switch (request.action) {
        case 'toggleEnabled':
          const result1 = await chrome.storage.sync.get('settings');
          const settings = result1.settings || DEFAULT_SETTINGS;
          settings.enabled = !settings.enabled;
          await chrome.storage.sync.set({ settings });

          if (settings.enabled) {
            await startAlarms();
          } else {
            await stopAlarms();
          }

          sendResponse({ enabled: settings.enabled });
          break;

        case 'updateSettings':
          await chrome.storage.sync.set({ settings: request.settings });
          await startAlarms(); // Restart with new settings
          sendResponse({ success: true });
          break;

        case 'getSettings':
          const result = await chrome.storage.sync.get('settings');
          sendResponse({ settings: result.settings || DEFAULT_SETTINGS });
          break;

        case 'testPostureNotification':
          const result2 = await chrome.storage.sync.get('settings');
          await showPostureReminder(result2.settings || DEFAULT_SETTINGS);
          sendResponse({ success: true });
          break;

        case 'testStretchNotification':
          const result3 = await chrome.storage.sync.get('settings');
          await showStretchReminder(result3.settings || DEFAULT_SETTINGS);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();

  return true; // Keep message channel open for async response
});

// Check working hours periodically and restart alarms if needed
chrome.alarms.create('check-working-hours', {
  periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'check-working-hours') {
    const { settings } = await chrome.storage.sync.get('settings');
    const config = settings || DEFAULT_SETTINGS;

    if (config.workingHours.enabled) {
      const withinHours = isWithinWorkingHours(config.workingHours);
      const alarmsExist = await chrome.alarms.get(ALARMS.POSTURE);

      // Start alarms if we just entered working hours
      if (withinHours && !alarmsExist && config.enabled) {
        console.log('Entered working hours, starting alarms');
        startAlarms();
      }
      // Stop alarms if we just left working hours
      else if (!withinHours && alarmsExist) {
        console.log('Left working hours, stopping alarms');
        stopAlarms();
      }
    }
  }
});

console.log('Service worker loaded');
