// Load current settings and update UI
async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  if (!response || !response.settings) {
    console.error('Failed to load settings from background');
    return;
  }
  const settings = response.settings;

  // Update status indicator
  updateStatus(settings.enabled);

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
  await chrome.runtime.sendMessage({ action: 'testPostureNotification' });
});

// Test stretch notification
document.getElementById('testStretchBtn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'testStretchNotification' });
});

// Open settings page
document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Load settings on popup open
loadSettings();
