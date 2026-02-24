// STRETCHES array is loaded from ../lib/stretches.js via script tag in HTML

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

// Initialize stretch list rendering
function loadStretches() {
  // STRETCHES is already available from the script tag
  if (typeof STRETCHES !== 'undefined' && STRETCHES.length > 0) {
    renderStretchList();
  } else {
    console.error('STRETCHES not loaded');
  }
}

// Load and display current settings
async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const settings = response.settings;

  // Theme
  updateThemeSelector(settings.theme || 'system');

  // Interval settings
  document.getElementById('postureInterval').value = settings.intervals.postureCheck;
  document.getElementById('stretchInterval').value = settings.intervals.stretchReminder;

  // Working hours
  document.getElementById('enableWorkingHours').checked = settings.workingHours.enabled;
  document.getElementById('workHoursStart').value = settings.workingHours.start;
  document.getElementById('workHoursEnd').value = settings.workingHours.end;
  toggleWorkingHoursSettings(settings.workingHours.enabled);

  // Audio settings
  document.getElementById('enableAudio').checked = settings.audio.enabled;
  document.getElementById('volume').value = settings.audio.volume * 100;
  document.getElementById('volumeValue').textContent = `${Math.round(settings.audio.volume * 100)}%`;
  toggleAudioSettings(settings.audio.enabled);
}

// Validate settings before saving
function validateSettings() {
  const postureInterval = parseInt(document.getElementById('postureInterval').value);
  const stretchInterval = parseInt(document.getElementById('stretchInterval').value);
  const volume = parseInt(document.getElementById('volume').value);
  const workingHoursEnabled = document.getElementById('enableWorkingHours').checked;
  const start = document.getElementById('workHoursStart').value;
  const end = document.getElementById('workHoursEnd').value;

  // Clamp intervals
  document.getElementById('postureInterval').value = Math.max(5, Math.min(60, postureInterval || 10));
  document.getElementById('stretchInterval').value = Math.max(15, Math.min(120, stretchInterval || 30));
  document.getElementById('volume').value = Math.max(0, Math.min(100, volume || 70));
  updateVolumeDisplay();

  // Validate working hours
  if (workingHoursEnabled && start >= end) {
    const saveMessage = document.getElementById('saveMessage');
    saveMessage.textContent = 'Start time must be before end time';
    saveMessage.style.color = '#e53935';
    saveMessage.style.display = 'block';
    setTimeout(() => {
      saveMessage.style.color = '';
      saveMessage.textContent = '\u2713 Settings saved!';
      saveMessage.style.display = 'none';
    }, 3000);
    return false;
  }

  return true;
}

// Save settings
async function saveSettings() {
  if (!validateSettings()) return;

  // Get current settings to preserve enabled and paused states
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const currentSettings = response.settings;

  const settings = {
    intervals: {
      postureCheck: parseInt(document.getElementById('postureInterval').value),
      stretchReminder: parseInt(document.getElementById('stretchInterval').value)
    },
    audio: {
      enabled: document.getElementById('enableAudio').checked,
      volume: parseInt(document.getElementById('volume').value) / 100
    },
    // Preserve enabled and paused states from current settings
    enabled: currentSettings ? currentSettings.enabled : true,
    paused: currentSettings ? currentSettings.paused : false,
    workingHours: {
      enabled: document.getElementById('enableWorkingHours').checked,
      start: document.getElementById('workHoursStart').value,
      end: document.getElementById('workHoursEnd').value
    },
    theme: getSelectedTheme()
  };

  await chrome.runtime.sendMessage({
    action: 'updateSettings',
    settings: settings
  });

  // Show save confirmation
  const saveMessage = document.getElementById('saveMessage');
  saveMessage.style.display = 'block';
  setTimeout(() => {
    saveMessage.style.display = 'none';
  }, 3000);
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

  // Reload settings display
  loadSettings();

  // Show confirmation
  const saveMessage = document.getElementById('saveMessage');
  saveMessage.textContent = '✓ Reset to defaults!';
  saveMessage.style.display = 'block';
  setTimeout(() => {
    saveMessage.textContent = '✓ Settings saved!';
    saveMessage.style.display = 'none';
  }, 3000);
}

// Toggle working hours settings visibility
function toggleWorkingHoursSettings(enabled) {
  const settingsDiv = document.getElementById('workingHoursSettings');
  settingsDiv.style.display = enabled ? 'block' : 'none';
  document.getElementById('enableWorkingHours').setAttribute('aria-expanded', String(enabled));
}

// Toggle audio settings visibility
function toggleAudioSettings(enabled) {
  const settingsDiv = document.getElementById('audioSettings');
  settingsDiv.style.display = enabled ? 'block' : 'none';
  document.getElementById('enableAudio').setAttribute('aria-expanded', String(enabled));
}

// Update volume display
function updateVolumeDisplay() {
  const volumeSlider = document.getElementById('volume');
  const volumeValue = document.getElementById('volumeValue');
  volumeValue.textContent = `${volumeSlider.value}%`;
}

// Render stretch library
function renderStretchList() {
  const container = document.getElementById('stretchList');

  if (!STRETCHES || STRETCHES.length === 0) {
    container.innerHTML = '<p class="help-text">Loading stretches...</p>';
    return;
  }

  container.innerHTML = '';

  STRETCHES.forEach(stretch => {
    const item = document.createElement('div');
    item.className = 'stretch-item';

    const categoryIcons = {
      'neck': '🦒',
      'shoulder': '💪',
      'neck-shoulder': '🤸',
      'chest': '🫁',
      'back': '🧘',
      'wrist': '🖐️'
    };

    item.innerHTML = `
      <h3>${categoryIcons[stretch.category] || '✨'} ${stretch.name}</h3>
      <div class="stretch-meta">
        <span>⏱️ ${stretch.duration}s</span>
        <span>📊 ${stretch.difficulty}</span>
        <span>🏷️ ${stretch.category}</span>
      </div>
      <p class="stretch-description">${stretch.description}</p>
      <p class="stretch-benefits"><strong>Benefits:</strong> ${stretch.benefits}</p>
    `;

    container.appendChild(item);
  });
}

// Test sound buttons
async function testSound(soundType) {
  const volume = parseInt(document.getElementById('volume').value) / 100;
  await chrome.runtime.sendMessage({
    action: 'testSound',
    soundType: soundType,
    volume: volume
  });
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
document.getElementById('testPostureSound').addEventListener('click', () => testSound('posture-chime'));
document.getElementById('testStretchSound').addEventListener('click', () => testSound('stretch-bell'));

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

// Theme selector event listeners
document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    updateThemeSelector(btn.dataset.theme);
  });
});

// Initialize
loadSettings();
loadStretches();
checkNotificationPermission();
