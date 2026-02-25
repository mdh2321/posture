// Import stretch library and settings
importScripts('../lib/stretches.js', '../lib/settings.js', '../lib/movement-tips.js');

// Track notification auto-dismiss timeouts so they can be cancelled on manual close
const notificationTimeouts = new Map();

// Cached settings helper (2-second TTL)
let _settingsCache = null;
let _settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 2000;

async function getSettings() {
  const now = Date.now();
  if (_settingsCache && (now - _settingsCacheTime) < SETTINGS_CACHE_TTL) {
    return _settingsCache;
  }
  const result = await chrome.storage.sync.get('settings');
  _settingsCache = result.settings || DEFAULT_SETTINGS;
  _settingsCacheTime = now;
  return _settingsCache;
}

function invalidateSettingsCache() {
  _settingsCache = null;
  _settingsCacheTime = 0;
}

// Invalidate cache when settings change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.settings) {
    invalidateSettingsCache();
  }
});

// Stretch icon cache
const _stretchIconCache = {};

// Alarm names
const ALARMS = {
  POSTURE: 'posture-check',
  STRETCH: 'stretch-reminder',
  WORKING_HOURS_CHECK: 'check-working-hours'
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Posture & Tension Relief extension installed');

  // Check notification permission
  const permission = await chrome.notifications.getPermissionLevel();
  console.log('Notification permission level:', permission);
  if (permission !== 'granted') {
    console.warn('Notification permission not granted! Notifications will not appear.');
  }

  // Load or set default settings
  const result = await chrome.storage.sync.get('settings');
  if (!result.settings) {
    console.log('Initializing default settings');
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  } else {
    // Migrate existing settings to include new fields
    const settings = result.settings;
    let needsUpdate = false;

    if (settings.paused === undefined) {
      settings.paused = false;
      needsUpdate = true;
    }

    if (settings.theme === undefined) {
      settings.theme = 'system';
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log('Migrating settings to include new fields');
      await chrome.storage.sync.set({ settings });
    }
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
  } else {
    // Ensure paused field exists in existing settings
    const settings = result.settings;
    if (settings.paused === undefined) {
      settings.paused = false;
      await chrome.storage.sync.set({ settings });
    }
  }
  await startAlarms();
});

// Start all alarms based on current settings
async function startAlarms() {
  const config = await getSettings();

  // Clear only posture and stretch alarms (preserve working-hours check alarm)
  await chrome.alarms.clear(ALARMS.POSTURE);
  await chrome.alarms.clear(ALARMS.STRETCH);

  // Check if extension is enabled (considering both enabled and paused states)
  const isEnabled = config.enabled && !config.paused;
  if (!isEnabled) {
    console.log('Extension disabled or paused, not starting alarms');
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

  // Ensure working-hours check alarm exists
  const workingHoursAlarm = await chrome.alarms.get(ALARMS.WORKING_HOURS_CHECK);
  if (!workingHoursAlarm) {
    chrome.alarms.create(ALARMS.WORKING_HOURS_CHECK, {
      periodInMinutes: 1
    });
    console.log('Working hours check alarm created');
  }

  console.log(`Alarms started: Posture every ${config.intervals.postureCheck}min, Stretch every ${config.intervals.stretchReminder}min`);
}

// Stop all alarms (except working-hours check)
async function stopAlarms() {
  await chrome.alarms.clear(ALARMS.POSTURE);
  await chrome.alarms.clear(ALARMS.STRETCH);
  console.log('Posture and stretch alarms stopped');
}

// Check if current time is within working hours
function isWithinWorkingHours(workingHours) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentTime >= workingHours.start && currentTime <= workingHours.end;
}

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Handle working hours check alarm separately
  if (alarm.name === ALARMS.WORKING_HOURS_CHECK) {
    const config = await getSettings();

    if (config.workingHours.enabled) {
      const withinHours = isWithinWorkingHours(config.workingHours);
      const alarmsExist = await chrome.alarms.get(ALARMS.POSTURE);

      // Start alarms if we just entered working hours
      if (withinHours && !alarmsExist && config.enabled && !config.paused) {
        console.log('Entered working hours, starting alarms');
        startAlarms();
      }
      // Stop alarms if we just left working hours
      else if (!withinHours && alarmsExist) {
        console.log('Left working hours, stopping alarms');
        stopAlarms();
      }
    }
    return;
  }

  // Handle posture and stretch alarms
  const config = await getSettings();

  // Check if extension is enabled and not paused
  if (!config.enabled || config.paused) {
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
      showMovementBreak(config);
      break;
  }
});

// Posture reminder messages (rotated for variety)
const POSTURE_MESSAGES = [
  "Check your posture",
  "Sit up straight",
  "Shoulders back, chin level",
  "Straighten your spine",
  "How's that posture?",
  "Roll your shoulders back",
  "Align your neck and spine",
  "Lengthen your spine",
  "Pull your shoulders down",
  "Tuck your chin slightly"
];

// Show posture check reminder
async function showPostureReminder(config) {
  console.log('showPostureReminder called with config:', config);

  // Check permission first
  const permission = await chrome.notifications.getPermissionLevel();
  console.log('Current notification permission:', permission);
  if (permission !== 'granted') {
    console.error('Cannot show notification - permission not granted!');
    console.log('Please enable notifications in chrome://settings/content/notifications');
    return;
  }

  // Get random message from the list
  const message = POSTURE_MESSAGES[Math.floor(Math.random() * POSTURE_MESSAGES.length)];

  const notificationId = `posture-${Date.now()}`;

  try {
    const createdId = await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
      title: 'Posture Check',
      message: message,
      priority: 1,
      requireInteraction: false
    });
    console.log('Posture notification created with ID:', createdId);
  } catch (error) {
    console.error('Error creating posture notification:', error);
  }

  // Record the posture check
  await recordPostureCheck();

  // Play audio if enabled
  if (config.audio.enabled) {
    await playSound('posture-chime', config.audio.volume);
  }

  // Auto-dismiss after 10 seconds
  const timeoutId = setTimeout(() => {
    chrome.notifications.clear(notificationId);
    notificationTimeouts.delete(notificationId);
  }, 10000);
  notificationTimeouts.set(notificationId, timeoutId);
}

// Generate a simple SVG icon for stretch notifications (cached)
function generateStretchIcon(category) {
  if (_stretchIconCache[category]) {
    return _stretchIconCache[category];
  }

  // Color scheme based on category
  const colors = {
    'neck': '#FF6B6B',
    'shoulder': '#4ECDC4',
    'neck-shoulder': '#95E1D3',
    'chest': '#F38181',
    'back': '#AA96DA',
    'wrist': '#FCBAD3'
  };

  const color = colors[category] || '#667eea';

  // Simple SVG with category indicator
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="200" height="200" fill="${color}" rx="10"/>
      <circle cx="100" cy="80" r="30" fill="white" opacity="0.9"/>
      <circle cx="70" cy="120" r="15" fill="white" opacity="0.8"/>
      <circle cx="130" cy="120" r="15" fill="white" opacity="0.8"/>
      <circle cx="100" cy="150" r="20" fill="white" opacity="0.8"/>
      <text x="100" y="185" font-size="14" fill="white" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">${category.toUpperCase()}</text>
    </svg>
  `;

  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  _stretchIconCache[category] = dataUrl;
  return dataUrl;
}

// Dispatcher: alternate between movement tip and stretch suggestion
async function showMovementBreak(config) {
  const { lastBreakType = 'stretch' } = await chrome.storage.local.get('lastBreakType');
  const nextType = lastBreakType === 'stretch' ? 'tip' : 'stretch';
  await chrome.storage.local.set({ lastBreakType: nextType });

  if (nextType === 'tip') {
    await showMovementTipNotification(config);
  } else {
    await showStretchReminder(config);
  }
}

// Show a simple movement tip notification
async function showMovementTipNotification(config) {
  const permission = await chrome.notifications.getPermissionLevel();
  if (permission !== 'granted') {
    console.error('Cannot show notification - permission not granted!');
    return;
  }

  const { recentMovementTips = [] } = await chrome.storage.local.get('recentMovementTips');
  const tip = getRandomMovementTip(recentMovementTips);

  const updatedRecent = [tip.id, ...recentMovementTips.slice(0, 4)];
  await chrome.storage.local.set({ recentMovementTips: updatedRecent });

  const notificationId = `movtip-${Date.now()}`;

  try {
    await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
      title: '\ud83d\udeb6 Movement Break',
      message: tip.message,
      priority: 2,
      requireInteraction: false,
      buttons: [
        { title: 'Done' }
      ]
    });
    console.log('Movement tip notification created:', notificationId);
  } catch (error) {
    console.error('Error creating movement tip notification:', error);
  }

  if (config.audio.enabled) {
    await playSound('posture-chime', config.audio.volume);
  }

  const timeoutId = setTimeout(() => {
    chrome.notifications.clear(notificationId);
    notificationTimeouts.delete(notificationId);
  }, 15000);
  notificationTimeouts.set(notificationId, timeoutId);
}

// Show stretch reminder with a random stretch
async function showStretchReminder(config) {
  console.log('showStretchReminder called with config:', config);

  // Check permission first
  const permission = await chrome.notifications.getPermissionLevel();
  console.log('Current notification permission:', permission);
  if (permission !== 'granted') {
    console.error('Cannot show notification - permission not granted!');
    console.log('Please enable notifications in chrome://settings/content/notifications');
    return;
  }

  // Get recent stretches to avoid repetition
  const { recentStretches = [] } = await chrome.storage.local.get('recentStretches');
  const stretch = getRandomStretch(null, recentStretches);

  // Update recent stretches (keep last 5)
  const updatedRecent = [stretch.id, ...recentStretches.slice(0, 4)];
  await chrome.storage.local.set({ recentStretches: updatedRecent });
  console.log('Recent stretches:', updatedRecent);

  const notificationId = `stretch-${Date.now()}`;

  const message = `${stretch.name}\n\n${stretch.description}\n\nDuration: ${stretch.duration}s • ${stretch.difficulty}`;

  // Generate a visual icon for the stretch category
  const stretchImage = generateStretchIcon(stretch.category);

  try {
    const createdId = await chrome.notifications.create(notificationId, {
      type: 'image',
      iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
      imageUrl: stretchImage,
      title: '🧘 Stretch Break Time!',
      message: message,
      priority: 2,
      requireInteraction: false,
      buttons: [
        { title: 'Show Instructions' },
        { title: 'Done' }
      ]
    });
    console.log('Stretch notification created with ID:', createdId);
  } catch (error) {
    console.error('Error creating stretch notification:', error);
  }

  // Store stretch ID for later retrieval
  await chrome.storage.local.set({ [`stretch-${notificationId}`]: stretch.id });

  // Play audio if enabled
  if (config.audio.enabled) {
    await playSound('stretch-bell', config.audio.volume);
  }

  // Auto-dismiss after 30 seconds (increased from 15)
  const timeoutId = setTimeout(() => {
    chrome.notifications.clear(notificationId);
    notificationTimeouts.delete(notificationId);
  }, 30000);
  notificationTimeouts.set(notificationId, timeoutId);
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId.startsWith('movtip-')) {
    // Movement tip: button 0 = "Done"
    if (buttonIndex === 0) {
      console.log('Movement tip marked as done');
      await recordCompletion();
    }

    chrome.notifications.clear(notificationId);
    if (notificationTimeouts.has(notificationId)) {
      clearTimeout(notificationTimeouts.get(notificationId));
      notificationTimeouts.delete(notificationId);
    }
  } else if (notificationId.startsWith('stretch-')) {
    // Get stretch ID from storage
    const key = `stretch-${notificationId}`;
    const result = await chrome.storage.local.get(key);
    const stretchId = result[key];

    if (buttonIndex === 0 && stretchId) {
      // "Show Instructions" button clicked
      showStretchModal(stretchId);
    } else if (buttonIndex === 1) {
      // "Done" button clicked
      console.log('Stretch marked as done:', stretchId);
      await recordCompletion();
    }

    // Clear the notification and cancel auto-dismiss
    chrome.notifications.clear(notificationId);
    if (notificationTimeouts.has(notificationId)) {
      clearTimeout(notificationTimeouts.get(notificationId));
      notificationTimeouts.delete(notificationId);
    }

    // Clean up storage entry
    await chrome.storage.local.remove(key);
    console.log('Cleaned up storage for:', key);
  }
});

// Handle notification close (cleanup storage)
chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {
  // Cancel auto-dismiss timeout on manual close
  if (notificationTimeouts.has(notificationId)) {
    clearTimeout(notificationTimeouts.get(notificationId));
    notificationTimeouts.delete(notificationId);
  }

  if (notificationId.startsWith('stretch-')) {
    const key = `stretch-${notificationId}`;
    await chrome.storage.local.remove(key);
    console.log('Cleaned up storage for closed notification:', key);
  }
});

// Show detailed stretch instructions in a modal window
async function showStretchModal(stretchId) {
  const url = chrome.runtime.getURL(`modals/stretch-modal.html?id=${stretchId}`);

  // Create a new window with the stretch modal
  await chrome.windows.create({
    url: url,
    type: 'popup',
    width: 600,
    height: 700,
    focused: true
  });
}

// Play notification sound using offscreen document
async function playSound(soundType, volume = 0.7) {
  console.log(`Playing sound: ${soundType} at volume ${volume}`);

  try {
    // Check if offscreen document exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    // Create offscreen document if it doesn't exist
    if (existingContexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: 'offscreen/offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Play notification sounds for posture and stretch reminders'
      });
      console.log('Offscreen document created for audio playback');
    }

    // Send message to offscreen document to play sound
    await chrome.runtime.sendMessage({
      action: 'playSound',
      soundType: soundType,
      volume: volume
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

// Stats helpers
async function getStats() {
  const result = await chrome.storage.local.get('stats');
  const stats = result.stats || {};
  if (!stats.postureChecks) stats.postureChecks = {};
  if (!stats.breaksCounts) stats.breaksCounts = {};
  return stats;
}

async function recordPostureCheck() {
  const stats = await getStats();
  const today = new Date().toISOString().split('T')[0];
  stats.postureChecks[today] = (stats.postureChecks[today] || 0) + 1;
  pruneOldDates(stats.postureChecks);
  await chrome.storage.local.set({ stats });
  return stats;
}

async function recordCompletion() {
  const stats = await getStats();
  const today = new Date().toISOString().split('T')[0];
  stats.breaksCounts[today] = (stats.breaksCounts[today] || 0) + 1;
  pruneOldDates(stats.breaksCounts);
  await chrome.storage.local.set({ stats });
  return stats;
}

function pruneOldDates(counts) {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  for (const date of Object.keys(counts)) {
    if (date < cutoff) {
      delete counts[date];
    }
  }
}

// Message handler map
const messageHandlers = {
  async toggleEnabled(request) {
    const current = await getSettings();
    const settings = { ...current, paused: !current.paused };
    await chrome.storage.sync.set({ settings });
    if (!settings.paused && settings.enabled) {
      await startAlarms();
    } else {
      await stopAlarms();
    }
    return { enabled: settings.enabled && !settings.paused };
  },

  async updateSettings(request) {
    await chrome.storage.sync.set({ settings: request.settings });
    await startAlarms();
    return { success: true };
  },

  async getSettings() {
    return { settings: await getSettings() };
  },

  async testPostureNotification() {
    await showPostureReminder(await getSettings());
    return { success: true };
  },

  async testStretchNotification() {
    await showStretchReminder(await getSettings());
    return { success: true };
  },

  async testMovementBreak() {
    await showMovementBreak(await getSettings());
    return { success: true };
  },

  async getStretchData(request) {
    return { stretch: getStretchById(request.stretchId) };
  },

  async playCompletionSound() {
    const config = await getSettings();
    await playSound('posture-chime', config.audio.volume);
    return { success: true };
  },

  async stretchCompleted(request) {
    console.log('Stretch completed:', request.stretchId);
    await recordCompletion();
    return { success: true };
  },

  async testSound(request) {
    await playSound(request.soundType, request.volume);
    return { success: true };
  },

  async getStats() {
    return { stats: await getStats() };
  }
};

// Message dispatcher
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handler = messageHandlers[request.action];
  if (!handler) {
    sendResponse({ error: 'Unknown action' });
    return false;
  }
  handler(request).then(sendResponse).catch(error => {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  });
  return true;
});

console.log('Service worker loaded');
