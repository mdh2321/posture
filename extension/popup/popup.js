// Local-time date key (YYYY-MM-DD), matching the service worker's stats keys
function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Show warning if notifications are not permitted
async function checkNotificationPermission() {
  try {
    const permission = await chrome.notifications.getPermissionLevel();
    document.getElementById('permissionWarning').hidden = permission === 'granted';
  } catch (error) {
    console.error('Error checking notification permission:', error);
  }
}

// Load current settings and update UI
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (!response || !response.settings) {
      updateStatus(true);
      return;
    }
    const settings = response.settings;

    updateStatus(settings.enabled && !settings.paused, settings.pausedUntil);

    document.getElementById('postureInterval').textContent = `every ${settings.intervals.postureCheck} min`;
    document.getElementById('stretchInterval').textContent = `every ${settings.intervals.stretchReminder} min`;

    const workingHoursRow = document.getElementById('workingHoursRow');
    if (settings.workingHours.enabled) {
      workingHoursRow.hidden = false;
      document.getElementById('workingHours').textContent =
        `${settings.workingHours.start} – ${settings.workingHours.end}`;
    } else {
      workingHoursRow.hidden = true;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    updateStatus(true);
  }
}

function formatResumeTime(pausedUntil) {
  const resume = new Date(pausedUntil);
  const now = new Date();
  const time = resume.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (resume.getDate() !== now.getDate()) {
    return `Resumes tomorrow at ${time}`;
  }
  return `Resumes at ${time}`;
}

function updateStatus(enabled, pausedUntil = null) {
  const statusPill = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleBtn');
  const resumeInfo = document.getElementById('resumeInfo');

  statusPill.classList.toggle('active', enabled);
  statusText.textContent = enabled ? 'Active' : 'Paused';
  toggleBtn.textContent = enabled ? 'Pause reminders' : 'Resume reminders';
  toggleBtn.classList.toggle('paused', !enabled);

  if (!enabled && pausedUntil) {
    resumeInfo.textContent = formatResumeTime(pausedUntil);
    resumeInfo.hidden = false;
  } else {
    resumeInfo.hidden = true;
  }

  if (enabled) {
    hidePauseOptions();
  }
}

function hidePauseOptions() {
  document.getElementById('pauseOptions').hidden = true;
}

async function pauseFor(choice) {
  let until = null;
  if (choice === 'tomorrow') {
    // Next local midnight
    const t = new Date();
    t.setHours(24, 0, 0, 0);
    until = t.getTime();
  } else if (choice !== 'forever') {
    until = Date.now() + parseInt(choice, 10) * 60000;
  }

  const response = await chrome.runtime.sendMessage({ action: 'pause', until });
  if (response && response.paused) {
    hidePauseOptions();
    updateStatus(false, response.pausedUntil);
  }
}

document.getElementById('toggleBtn').addEventListener('click', async () => {
  const toggleBtn = document.getElementById('toggleBtn');
  if (toggleBtn.classList.contains('paused')) {
    const response = await chrome.runtime.sendMessage({ action: 'resume' });
    if (response && response.paused === false) {
      updateStatus(true);
    }
  } else {
    const pauseOptions = document.getElementById('pauseOptions');
    pauseOptions.hidden = !pauseOptions.hidden;
  }
});

document.querySelectorAll('.pause-option').forEach(btn => {
  btn.addEventListener('click', () => pauseFor(btn.dataset.minutes));
});

document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    if (response && response.stats) {
      const today = localDateKey();
      document.getElementById('todayPosture').textContent = response.stats.postureChecks[today] || 0;
      document.getElementById('todayBreaks').textContent = response.stats.breaksCounts[today] || 0;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

loadSettings();
loadStats();
checkNotificationPermission();
