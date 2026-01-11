// Get stretch ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const stretchId = urlParams.get('id');

let timerInterval = null;
let timeRemaining = 0;

// Load stretch data
async function loadStretch() {
  if (!stretchId) {
    console.error('No stretch ID provided');
    return;
  }

  // Get stretch data from background
  const response = await chrome.runtime.sendMessage({
    action: 'getStretchData',
    stretchId: stretchId
  });

  if (!response || !response.stretch) {
    console.error('Failed to load stretch data');
    return;
  }

  const stretch = response.stretch;

  // Populate the page
  document.getElementById('stretchName').textContent = stretch.name;
  document.getElementById('duration').textContent = `⏱️ ${stretch.duration}s`;
  document.getElementById('difficulty').textContent = `📊 ${stretch.difficulty.charAt(0).toUpperCase() + stretch.difficulty.slice(1)}`;
  document.getElementById('category').textContent = `🏷️ ${stretch.category}`;
  document.getElementById('description').textContent = stretch.description;
  document.getElementById('benefits').textContent = stretch.benefits;

  // Populate instructions
  const instructionsList = document.getElementById('instructionsList');
  instructionsList.innerHTML = '';
  stretch.instructions.forEach(instruction => {
    const li = document.createElement('li');
    li.textContent = instruction;
    instructionsList.appendChild(li);
  });

  // Set timer to stretch duration
  timeRemaining = stretch.duration;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  document.getElementById('timerDisplay').textContent =
    `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
  const timerDisplay = document.getElementById('timerDisplay');
  const startBtn = document.getElementById('startTimerBtn');

  if (timerInterval) {
    // Timer is running, pause it
    clearInterval(timerInterval);
    timerInterval = null;
    startBtn.textContent = 'Resume Timer';
    timerDisplay.classList.remove('active');
  } else {
    // Start or resume timer
    timerDisplay.classList.add('active');
    startBtn.textContent = 'Pause Timer';

    timerInterval = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        startBtn.textContent = 'Start Timer';
        timerDisplay.classList.remove('active');

        // Play a completion sound
        chrome.runtime.sendMessage({
          action: 'playCompletionSound'
        });
      }
    }, 1000);
  }
}

// Event listeners
document.getElementById('closeBtn').addEventListener('click', () => {
  window.close();
});

document.getElementById('startTimerBtn').addEventListener('click', startTimer);

document.getElementById('doneBtn').addEventListener('click', () => {
  // Log completion (future feature)
  chrome.runtime.sendMessage({
    action: 'stretchCompleted',
    stretchId: stretchId
  });
  window.close();
});

document.getElementById('skipBtn').addEventListener('click', () => {
  window.close();
});

// Load stretch on page load
loadStretch();
