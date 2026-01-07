// Import stretches (using dynamic import since we can't use importScripts in options page)
let STRETCHES = [];

// Load stretches from lib
async function loadStretches() {
  try {
    const response = await fetch(chrome.runtime.getURL('lib/stretches.js'));
    const text = await response.text();

    // Execute the stretches.js code
    eval(text);

    // Now STRETCHES should be available
    if (typeof STRETCHES !== 'undefined') {
      renderStretchList();
    }
  } catch (error) {
    console.error('Error loading stretches:', error);
  }
}

// Load and display current settings
async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const settings = response.settings;

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

// Save settings
async function saveSettings() {
  const settings = {
    intervals: {
      postureCheck: parseInt(document.getElementById('postureInterval').value),
      stretchReminder: parseInt(document.getElementById('stretchInterval').value)
    },
    audio: {
      enabled: document.getElementById('enableAudio').checked,
      volume: parseInt(document.getElementById('volume').value) / 100
    },
    enabled: true, // Always enabled unless manually paused from popup
    workingHours: {
      enabled: document.getElementById('enableWorkingHours').checked,
      start: document.getElementById('workHoursStart').value,
      end: document.getElementById('workHoursEnd').value
    }
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

  const defaultSettings = {
    intervals: {
      postureCheck: 10,
      stretchReminder: 30
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

  await chrome.runtime.sendMessage({
    action: 'updateSettings',
    settings: defaultSettings
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
}

// Toggle audio settings visibility
function toggleAudioSettings(enabled) {
  const settingsDiv = document.getElementById('audioSettings');
  settingsDiv.style.display = enabled ? 'block' : 'none';
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

// Initialize
loadSettings();
loadStretches();
