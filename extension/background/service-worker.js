// Import stretch library, settings defaults, and movement tips
importScripts('../lib/stretches.js', '../lib/settings.js', '../lib/movement-tips.js');

// Alarm names
const ALARMS = {
  POSTURE: 'posture-check',
  STRETCH: 'stretch-reminder',
  WORKING_HOURS_CHECK: 'check-working-hours',
  AUTO_RESUME: 'auto-resume',
  SNOOZE: 'snoozed-break'
};

const SNOOZE_MINUTES = 5;
// Skip reminders when the user has been inactive this long (seconds)
const IDLE_THRESHOLD_SECONDS = 300;

// --- Settings ---

// Merge stored settings over defaults so new fields (including nested audio
// fields) are always present
async function getSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    audio: { ...DEFAULT_SETTINGS.audio, ...(settings && settings.audio) }
  };
}

async function saveSettings(settings) {
  await chrome.storage.sync.set({ settings });
}

// --- Lifecycle ---

chrome.runtime.onInstalled.addListener(async (details) => {
  await saveSettings(await getSettings());
  await syncAlarms();

  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await syncAlarms();
});

// --- Pause / resume ---

function updateBadge(paused) {
  chrome.action.setBadgeText({ text: paused ? 'II' : '' });
  if (paused) {
    chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
  }
}

async function pauseReminders(until = null) {
  const settings = { ...(await getSettings()), paused: true, pausedUntil: until };
  await saveSettings(settings);

  if (until) {
    chrome.alarms.create(ALARMS.AUTO_RESUME, { when: until });
  } else {
    await chrome.alarms.clear(ALARMS.AUTO_RESUME);
  }

  await syncAlarms();
  return settings;
}

async function resumeReminders() {
  const settings = { ...(await getSettings()), paused: false, pausedUntil: null };
  await saveSettings(settings);
  await chrome.alarms.clear(ALARMS.AUTO_RESUME);
  await syncAlarms();
  return settings;
}

// --- Alarms ---

function createReminderAlarms(config) {
  chrome.alarms.create(ALARMS.POSTURE, {
    delayInMinutes: config.intervals.postureCheck,
    periodInMinutes: config.intervals.postureCheck
  });
  chrome.alarms.create(ALARMS.STRETCH, {
    delayInMinutes: config.intervals.stretchReminder,
    periodInMinutes: config.intervals.stretchReminder
  });
}

async function clearReminderAlarms() {
  await chrome.alarms.clear(ALARMS.POSTURE);
  await chrome.alarms.clear(ALARMS.STRETCH);
}

// Reconcile all alarms with current settings. Called on install, startup,
// settings change, and pause/resume — resetting reminder countdowns is
// intended in those cases.
async function syncAlarms() {
  let config = await getSettings();

  // Recover if an auto-resume moment passed while the browser was closed
  if (config.paused && config.pausedUntil && Date.now() >= config.pausedUntil) {
    config = { ...config, paused: false, pausedUntil: null };
    await saveSettings(config);
    await chrome.alarms.clear(ALARMS.AUTO_RESUME);
  }

  const active = config.enabled && !config.paused;
  updateBadge(!active);

  // The working-hours watcher only needs to run while reminders are active
  // and a schedule is set; otherwise it would wake the worker every minute.
  if (active && config.workingHours.enabled) {
    chrome.alarms.create(ALARMS.WORKING_HOURS_CHECK, { periodInMinutes: 1 });
  } else {
    await chrome.alarms.clear(ALARMS.WORKING_HOURS_CHECK);
  }

  if (!active || (config.workingHours.enabled && !isWithinWorkingHours(config.workingHours))) {
    await clearReminderAlarms();
    return;
  }

  createReminderAlarms(config);
}

// Check if current time is within working hours (HH:MM string comparison)
function isWithinWorkingHours(workingHours) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= workingHours.start && currentTime <= workingHours.end;
}

async function isUserActive() {
  const state = await chrome.idle.queryState(IDLE_THRESHOLD_SECONDS);
  return state === 'active';
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARMS.AUTO_RESUME) {
    await resumeReminders();
    return;
  }

  const config = await getSettings();

  // Watcher: start/stop reminder alarms when crossing working-hours boundaries
  if (alarm.name === ALARMS.WORKING_HOURS_CHECK) {
    if (!config.enabled || config.paused || !config.workingHours.enabled) {
      await chrome.alarms.clear(ALARMS.WORKING_HOURS_CHECK);
      return;
    }
    const within = isWithinWorkingHours(config.workingHours);
    const postureAlarm = await chrome.alarms.get(ALARMS.POSTURE);
    if (within && !postureAlarm) {
      createReminderAlarms(config);
    } else if (!within && postureAlarm) {
      await clearReminderAlarms();
    }
    return;
  }

  if (!config.enabled || config.paused) return;
  if (config.workingHours.enabled && !isWithinWorkingHours(config.workingHours)) return;

  if (alarm.name === ALARMS.SNOOZE) {
    // If the user is still away, push the snoozed break back again rather
    // than letting it fire into an empty room
    if (!(await isUserActive())) {
      chrome.alarms.create(ALARMS.SNOOZE, { delayInMinutes: SNOOZE_MINUTES });
      return;
    }
    await showSnoozedBreak(config);
    return;
  }

  // Don't nag an empty chair (and don't count it in stats)
  if (!(await isUserActive())) return;

  switch (alarm.name) {
    case ALARMS.POSTURE:
      showPostureReminder(config);
      break;
    case ALARMS.STRETCH:
      showMovementBreak(config);
      break;
  }
});

// --- Notifications ---

const POSTURE_MESSAGES = [
  'Check your posture',
  'Sit up straight',
  'Shoulders back, chin level',
  'Straighten your spine',
  "How's that posture?",
  'Roll your shoulders back',
  'Align your neck and spine',
  'Lengthen your spine',
  'Pull your shoulders down',
  'Tuck your chin slightly'
];

async function canNotify() {
  const permission = await chrome.notifications.getPermissionLevel();
  return permission === 'granted';
}

async function showPostureReminder(config, isTest = false) {
  if (!(await canNotify())) {
    console.error('Notifications are not permitted; reminder skipped.');
    return;
  }

  const message = POSTURE_MESSAGES[Math.floor(Math.random() * POSTURE_MESSAGES.length)];

  try {
    await chrome.notifications.create(`posture-${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
      title: 'Posture Check',
      message: message,
      priority: 1,
      requireInteraction: false
    });
  } catch (error) {
    console.error('Error creating posture notification:', error);
  }

  if (!isTest) {
    await recordPostureCheck();
  }

  if (config.audio.enabled) {
    await playSound('posture', config);
  }
}

// Alternate between a quick movement tip and a guided stretch
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

async function showMovementTipNotification(config, fixedTip = null) {
  if (!(await canNotify())) {
    console.error('Notifications are not permitted; reminder skipped.');
    return;
  }

  let tip = fixedTip;
  if (!tip) {
    const { recentMovementTips = [] } = await chrome.storage.local.get('recentMovementTips');
    tip = getRandomMovementTip(recentMovementTips);
    await chrome.storage.local.set({ recentMovementTips: [tip.id, ...recentMovementTips.slice(0, 4)] });
  }

  const notificationId = `movtip-${Date.now()}`;

  try {
    await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
      title: 'Movement Break',
      message: tip.message,
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: 'Done' },
        { title: `Snooze ${SNOOZE_MINUTES} min` }
      ]
    });
    await chrome.storage.local.set({ [`break-${notificationId}`]: { type: 'tip', id: tip.id } });
  } catch (error) {
    console.error('Error creating movement tip notification:', error);
  }

  if (config.audio.enabled) {
    await playSound('stretch', config);
  }
}

async function showStretchReminder(config, fixedStretch = null) {
  if (!(await canNotify())) {
    console.error('Notifications are not permitted; reminder skipped.');
    return;
  }

  let stretch = fixedStretch;
  if (!stretch) {
    const { recentStretches = [] } = await chrome.storage.local.get('recentStretches');
    stretch = getRandomStretch(null, recentStretches);
    await chrome.storage.local.set({ recentStretches: [stretch.id, ...recentStretches.slice(0, 4)] });
  }

  const notificationId = `stretch-${Date.now()}`;

  try {
    await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
      title: `Movement Break: ${stretch.name}`,
      message: `${stretch.description} — ${stretch.duration}s. Click for instructions.`,
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: 'Done' },
        { title: `Snooze ${SNOOZE_MINUTES} min` }
      ]
    });
    await chrome.storage.local.set({ [`break-${notificationId}`]: { type: 'stretch', id: stretch.id } });
  } catch (error) {
    console.error('Error creating stretch notification:', error);
  }

  if (config.audio.enabled) {
    await playSound('stretch', config);
  }
}

// --- Snooze (movement breaks only — posture checks keep their own rhythm) ---

async function snoozeBreak(breakInfo) {
  await chrome.storage.local.set({ snoozedBreak: breakInfo });
  chrome.alarms.create(ALARMS.SNOOZE, { delayInMinutes: SNOOZE_MINUTES });
}

// Re-show the exact break that was snoozed, then restart the movement-break
// cycle from now — so the next regular break comes a full interval after the
// snoozed one, instead of crowding it. Posture checks are not affected.
async function showSnoozedBreak(config) {
  const { snoozedBreak } = await chrome.storage.local.get('snoozedBreak');
  await chrome.storage.local.remove('snoozedBreak');
  if (!snoozedBreak) return;

  if (snoozedBreak.type === 'tip') {
    const tip = MOVEMENT_TIPS.find(t => t.id === snoozedBreak.id);
    await showMovementTipNotification(config, tip || null);
  } else {
    const stretch = getStretchById(snoozedBreak.id);
    await showStretchReminder(config, stretch || null);
  }

  chrome.alarms.create(ALARMS.STRETCH, {
    delayInMinutes: config.intervals.stretchReminder,
    periodInMinutes: config.intervals.stretchReminder
  });
}

// --- Notification interaction ---

async function getBreakInfo(notificationId) {
  const key = `break-${notificationId}`;
  const result = await chrome.storage.local.get(key);
  return result[key];
}

async function clearBreakNotification(notificationId) {
  chrome.notifications.clear(notificationId);
  await chrome.storage.local.remove(`break-${notificationId}`);
}

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (!notificationId.startsWith('movtip-') && !notificationId.startsWith('stretch-')) return;

  if (buttonIndex === 0) {
    await recordCompletion();
  } else if (buttonIndex === 1) {
    const breakInfo = await getBreakInfo(notificationId);
    if (breakInfo) {
      await snoozeBreak(breakInfo);
    }
  }

  await clearBreakNotification(notificationId);
});

// Clicking a stretch notification body opens the step-by-step instructions
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId.startsWith('stretch-')) {
    const breakInfo = await getBreakInfo(notificationId);
    if (breakInfo && breakInfo.id) {
      showStretchModal(breakInfo.id);
    }
  }
  await clearBreakNotification(notificationId);
});

chrome.notifications.onClosed.addListener(async (notificationId) => {
  await chrome.storage.local.remove(`break-${notificationId}`);
});

// Show detailed stretch instructions in a small popup window
async function showStretchModal(stretchId) {
  await chrome.windows.create({
    url: chrome.runtime.getURL(`modals/stretch-modal.html?id=${stretchId}`),
    type: 'popup',
    width: 600,
    height: 700,
    focused: true
  });
}

// --- Audio (offscreen document) ---

// variant: 'posture' (short, ascending) or 'stretch' (longer, descending)
async function playSound(variant, config, styleOverride = null, volumeOverride = null) {
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: 'offscreen/offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Play notification sounds for posture and stretch reminders'
      });
    }

    await chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'playSound',
      style: styleOverride || config.audio.sound,
      variant: variant,
      volume: volumeOverride !== null ? volumeOverride : config.audio.volume
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

// --- Stats ---

// Local-time date key (YYYY-MM-DD); toISOString would shift days for non-UTC users
function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function getStats() {
  const result = await chrome.storage.local.get('stats');
  const stats = result.stats || {};
  if (!stats.postureChecks) stats.postureChecks = {};
  if (!stats.breaksCounts) stats.breaksCounts = {};
  return stats;
}

async function recordPostureCheck() {
  const stats = await getStats();
  const today = localDateKey();
  stats.postureChecks[today] = (stats.postureChecks[today] || 0) + 1;
  pruneOldDates(stats.postureChecks);
  await chrome.storage.local.set({ stats });
}

async function recordCompletion() {
  const stats = await getStats();
  const today = localDateKey();
  stats.breaksCounts[today] = (stats.breaksCounts[today] || 0) + 1;
  pruneOldDates(stats.breaksCounts);
  await chrome.storage.local.set({ stats });
}

function pruneOldDates(counts) {
  const cutoff = localDateKey(new Date(Date.now() - 30 * 86400000));
  for (const date of Object.keys(counts)) {
    if (date < cutoff) {
      delete counts[date];
    }
  }
}

// --- Messages ---

const messageHandlers = {
  async pause(request) {
    const settings = await pauseReminders(request.until || null);
    return { paused: true, pausedUntil: settings.pausedUntil };
  },

  async resume() {
    await resumeReminders();
    return { paused: false };
  },

  async updateSettings(request) {
    await saveSettings(request.settings);
    await syncAlarms();
    return { success: true };
  },

  async getSettings() {
    return { settings: await getSettings() };
  },

  async testPostureNotification() {
    await showPostureReminder(await getSettings(), true);
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
    await playSound('posture', await getSettings());
    return { success: true };
  },

  async stretchCompleted() {
    await recordCompletion();
    return { success: true };
  },

  async testSound(request) {
    await playSound(request.variant || 'posture', await getSettings(), request.style, request.volume);
    return { success: true };
  },

  async getStats() {
    return { stats: await getStats() };
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages addressed to the offscreen document are not for us
  if (request.target === 'offscreen') return false;

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
