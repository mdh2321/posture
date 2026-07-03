// STRETCHES and DEFAULT_SETTINGS are loaded via script tags in HTML

// Show warning if notifications are not permitted
async function checkNotificationPermission() {
  try {
    const permission = await chrome.notifications.getPermissionLevel();
    document.getElementById('permissionWarning').hidden = permission === 'granted';
  } catch (error) {
    console.error('Error checking notification permission:', error);
  }
}

// Load and display current settings
async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const settings = response.settings;

  updateThemeSelector(settings.theme || 'system');
  updateAccentSelector(settings.accent || 'indigo');

  document.getElementById('postureInterval').value = settings.intervals.postureCheck;
  document.getElementById('stretchInterval').value = settings.intervals.stretchReminder;

  document.getElementById('enableWorkingHours').checked = settings.workingHours.enabled;
  document.getElementById('workHoursStart').value = settings.workingHours.start;
  document.getElementById('workHoursEnd').value = settings.workingHours.end;
  toggleWorkingHoursSettings(settings.workingHours.enabled);

  document.getElementById('enableAudio').checked = settings.audio.enabled;
  document.getElementById('volume').value = settings.audio.volume * 100;
  updateVolumeDisplay();
  toggleAudioSettings(settings.audio.enabled);
  updateSoundSelector(settings.audio.sound || 'chime');
}

// Clamp a numeric input to its range, falling back when not a number
function clampInput(id, min, max, fallback) {
  const input = document.getElementById(id);
  const value = parseInt(input.value, 10);
  const clamped = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  input.value = clamped;
  return clamped;
}

function showSaveMessage(text, isError = false) {
  const saveMessage = document.getElementById('saveMessage');
  saveMessage.textContent = text;
  saveMessage.classList.toggle('error', isError);
  saveMessage.hidden = false;
  clearTimeout(showSaveMessage._timeout);
  showSaveMessage._timeout = setTimeout(() => {
    saveMessage.hidden = true;
  }, 3000);
}

// Validate settings before saving
function validateSettings() {
  clampInput('postureInterval', 5, 60, 10);
  clampInput('stretchInterval', 15, 120, 30);
  clampInput('volume', 0, 100, 70);
  updateVolumeDisplay();

  const workingHoursEnabled = document.getElementById('enableWorkingHours').checked;
  const start = document.getElementById('workHoursStart').value;
  const end = document.getElementById('workHoursEnd').value;

  if (workingHoursEnabled && start >= end) {
    showSaveMessage('Start time must be before end time', true);
    return false;
  }

  return true;
}

// Save settings
async function saveSettings() {
  if (!validateSettings()) return;

  // Preserve enabled/paused states, which are managed from the popup
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const currentSettings = response.settings;

  const settings = {
    intervals: {
      postureCheck: parseInt(document.getElementById('postureInterval').value, 10),
      stretchReminder: parseInt(document.getElementById('stretchInterval').value, 10)
    },
    audio: {
      enabled: document.getElementById('enableAudio').checked,
      volume: parseInt(document.getElementById('volume').value, 10) / 100,
      sound: getSelectedSound()
    },
    enabled: currentSettings ? currentSettings.enabled : true,
    paused: currentSettings ? currentSettings.paused : false,
    workingHours: {
      enabled: document.getElementById('enableWorkingHours').checked,
      start: document.getElementById('workHoursStart').value,
      end: document.getElementById('workHoursEnd').value
    },
    theme: getSelectedTheme(),
    accent: getSelectedAccent()
  };

  await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
  showSaveMessage('✓ Settings saved');
}

// Reset to default settings
async function resetSettings() {
  if (!confirm('Reset all settings to defaults?')) {
    return;
  }

  await chrome.runtime.sendMessage({
    action: 'updateSettings',
    settings: { ...DEFAULT_SETTINGS }
  });

  loadSettings();
  showSaveMessage('✓ Reset to defaults');
}

function toggleWorkingHoursSettings(enabled) {
  document.getElementById('workingHoursSettings').hidden = !enabled;
  document.getElementById('enableWorkingHours').setAttribute('aria-expanded', String(enabled));
}

function toggleAudioSettings(enabled) {
  document.getElementById('audioSettings').hidden = !enabled;
  document.getElementById('enableAudio').setAttribute('aria-expanded', String(enabled));
}

function updateVolumeDisplay() {
  document.getElementById('volumeValue').textContent = `${document.getElementById('volume').value}%`;
}

// Render stretch library
function renderStretchList() {
  const container = document.getElementById('stretchList');

  if (typeof STRETCHES === 'undefined' || STRETCHES.length === 0) {
    container.innerHTML = '<p class="help-text">No stretches available.</p>';
    return;
  }

  container.innerHTML = '';

  STRETCHES.forEach(stretch => {
    const item = document.createElement('div');
    item.className = 'stretch-item';

    item.innerHTML = `
      <h3>${stretch.name}</h3>
      <div class="stretch-meta">
        <span>${stretch.duration}s</span>
        <span>${stretch.difficulty}</span>
        <span>${stretch.category}</span>
      </div>
      <p class="stretch-description">${stretch.description}</p>
      <p class="stretch-benefits"><strong>Benefits:</strong> ${stretch.benefits}</p>
    `;

    container.appendChild(item);
  });
}

// Sound helpers
function getSelectedSound() {
  const active = document.querySelector('.sound-option.active');
  return active ? active.dataset.sound : 'chime';
}

function updateSoundSelector(sound) {
  document.querySelectorAll('.sound-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sound === sound);
  });
}

async function previewSound(style) {
  const volume = parseInt(document.getElementById('volume').value, 10) / 100;
  await chrome.runtime.sendMessage({ action: 'testSound', style, variant: 'posture', volume });
}

// Theme helpers
function getSelectedTheme() {
  const active = document.querySelector('.theme-option.active');
  return active ? active.dataset.theme : 'system';
}

function updateThemeSelector(theme) {
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// Apply a theme immediately so the choice can be previewed before saving
function previewTheme(theme) {
  const dark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

// Accent helpers
function getSelectedAccent() {
  const active = document.querySelector('.accent-option.active');
  return active ? active.dataset.accent : 'indigo';
}

function updateAccentSelector(accent) {
  document.querySelectorAll('.accent-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.accent === accent);
  });
}

// Apply an accent immediately so the choice can be previewed before saving
function previewAccent(accent) {
  const html = document.documentElement;
  html.classList.remove('accent-green', 'accent-amber');
  if (accent === 'green' || accent === 'amber') {
    html.classList.add(`accent-${accent}`);
  }
}

// Event listeners
document.getElementById('saveBtn').addEventListener('click', saveSettings);
document.getElementById('resetBtn').addEventListener('click', resetSettings);
document.getElementById('enableWorkingHours').addEventListener('change', (e) => {
  toggleWorkingHoursSettings(e.target.checked);
});
document.getElementById('enableAudio').addEventListener('change', (e) => {
  toggleAudioSettings(e.target.checked);
});
document.getElementById('volume').addEventListener('input', updateVolumeDisplay);
document.getElementById('volume').addEventListener('change', () => previewSound(getSelectedSound()));
document.querySelectorAll('.sound-option').forEach(btn => {
  btn.addEventListener('click', () => {
    updateSoundSelector(btn.dataset.sound);
    previewSound(btn.dataset.sound);
  });
});
document.getElementById('testPostureBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'testPostureNotification' });
});
document.getElementById('testBreakBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'testMovementBreak' });
});

document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    updateThemeSelector(btn.dataset.theme);
    previewTheme(btn.dataset.theme);
  });
});

document.querySelectorAll('.accent-option').forEach(btn => {
  btn.addEventListener('click', () => {
    updateAccentSelector(btn.dataset.accent);
    previewAccent(btn.dataset.accent);
  });
});

// Initialize
loadSettings();
renderStretchList();
checkNotificationPermission();
