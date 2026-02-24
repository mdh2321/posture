// Check notification permission and show warning if needed
async function checkNotificationPermission() {
  try {
    const permission = await chrome.notifications.getPermissionLevel();
    const warningElement = document.getElementById('permissionWarning');

    if (permission !== 'granted') {
      warningElement.style.display = 'block';
    } else {
      warningElement.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking notification permission:', error);
  }
}

// Load current settings and update UI
async function loadSettings() {
  try {
    console.log('Requesting settings from background...');
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    console.log('Response received:', response);

    if (!response || !response.settings) {
      console.error('Failed to load settings from background', response);
      // Try to show default state at least
      updateStatus(true);
      return;
    }
    const settings = response.settings;
    console.log('Settings loaded:', settings);

    // Update status indicator (effective enabled state = enabled && !paused)
    const effectiveEnabled = settings.enabled && !settings.paused;
    updateStatus(effectiveEnabled);

    // Update interval displays
    document.getElementById('postureInterval').textContent = `Every ${settings.intervals.postureCheck} min`;
    document.getElementById('stretchInterval').textContent = `Every ${settings.intervals.stretchReminder} min`;

    // Update working hours display
    if (settings.workingHours.enabled) {
      document.getElementById('workingHoursRow').style.display = 'flex';
      document.getElementById('workingHours').textContent =
        `${settings.workingHours.start} - ${settings.workingHours.end}`;
    } else {
      document.getElementById('workingHoursRow').style.display = 'none';
    }

    // Update theme button
    updateThemeButton(settings.theme || 'system');

    // Check notification permission
    await checkNotificationPermission();
  } catch (error) {
    console.error('Error loading settings:', error);
    // Show default state
    updateStatus(true);
  }
}

// Update status indicator
function updateStatus(enabled) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleBtn');

  if (enabled) {
    statusDot.classList.add('enabled');
    statusDot.classList.remove('disabled');
    statusText.textContent = 'Active';
    toggleBtn.textContent = 'Pause Reminders';
    toggleBtn.classList.remove('paused');
  } else {
    statusDot.classList.remove('enabled');
    statusDot.classList.add('disabled');
    statusText.textContent = 'Paused';
    toggleBtn.textContent = 'Resume Reminders';
    toggleBtn.classList.add('paused');
  }
}

// Toggle enabled/disabled
document.getElementById('toggleBtn').addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({ action: 'toggleEnabled' });
  if (response && response.enabled !== undefined) {
    updateStatus(response.enabled);
  } else {
    console.error('Failed to toggle enabled state');
  }
});

// Test posture notification
document.getElementById('testPostureBtn').addEventListener('click', async () => {
  console.log('Test posture button clicked');
  const response = await chrome.runtime.sendMessage({ action: 'testPostureNotification' });
  console.log('Test posture response:', response);
});

// Test movement break (alternates between tip and stretch)
document.getElementById('testStretchBtn').addEventListener('click', async () => {
  console.log('Test movement break button clicked');
  const response = await chrome.runtime.sendMessage({ action: 'testMovementBreak' });
  console.log('Test movement break response:', response);
});

// Open settings page
document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Theme toggle — cycles light → dark → system
const themeOrder = ['light', 'dark', 'system'];
const themeIcons = { light: '☀️', dark: '🌙', system: '💻' };

function updateThemeButton(theme) {
  document.getElementById('themeToggleBtn').textContent = themeIcons[theme] || '💻';
}

document.getElementById('themeToggleBtn').addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const settings = response.settings;
  const currentTheme = settings.theme || 'system';
  const nextIndex = (themeOrder.indexOf(currentTheme) + 1) % themeOrder.length;
  const nextTheme = themeOrder[nextIndex];
  settings.theme = nextTheme;
  await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
  updateThemeButton(nextTheme);
});

// Load stats
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    if (response && response.stats) {
      const today = new Date().toISOString().split('T')[0];
      const todayCount = response.stats.dailyCounts[today] || 0;
      document.getElementById('todayCount').textContent = todayCount;
      document.getElementById('currentStreak').textContent = `${response.stats.currentStreak} day${response.stats.currentStreak !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load settings and stats on popup open
loadSettings();
loadStats();
