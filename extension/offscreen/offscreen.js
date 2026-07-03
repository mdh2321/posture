// Offscreen document for playing audio in Manifest V3

// Reuse a single AudioContext to avoid resource leaks
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Only handle messages addressed to this document; returning true for other
// messages would hijack the response channel of popup/options requests
chrome.runtime.onMessage.addListener((message) => {
  if (message.target === 'offscreen' && message.action === 'playSound') {
    playSound(message.style, message.variant, message.volume);
  }
  return false;
});

// Each style defines two variants:
//   posture — short, ascending (a quick nudge)
//   stretch — longer, descending (time to wind down)
// note: { freq, time (offset s), duration (s) }
// overtone adds a quiet partial at freq × overtone for timbre.
const SOUND_STYLES = {
  chime: {
    wave: 'sine',
    peak: 0.6,
    attack: 0.02,
    posture: [
      { freq: 523.25, time: 0, duration: 0.15 },
      { freq: 659.25, time: 0.08, duration: 0.15 },
      { freq: 783.99, time: 0.16, duration: 0.25 }
    ],
    stretch: [
      { freq: 783.99, time: 0, duration: 0.2 },
      { freq: 659.25, time: 0.12, duration: 0.2 },
      { freq: 523.25, time: 0.24, duration: 0.25 },
      { freq: 392.00, time: 0.38, duration: 0.3 }
    ]
  },
  bell: {
    wave: 'sine',
    peak: 0.5,
    attack: 0.005,
    overtone: 2.76, // inharmonic partial gives a bell-like shimmer
    posture: [
      { freq: 659.25, time: 0, duration: 1.1 }
    ],
    stretch: [
      { freq: 783.99, time: 0, duration: 1.0 },
      { freq: 523.25, time: 0.5, duration: 1.4 }
    ]
  },
  marimba: {
    wave: 'sine',
    peak: 0.7,
    attack: 0.005,
    overtone: 4, // strong 4th partial is characteristic of marimba bars
    posture: [
      { freq: 261.63, time: 0, duration: 0.3 },
      { freq: 329.63, time: 0.12, duration: 0.3 },
      { freq: 392.00, time: 0.24, duration: 0.45 }
    ],
    stretch: [
      { freq: 392.00, time: 0, duration: 0.35 },
      { freq: 329.63, time: 0.16, duration: 0.35 },
      { freq: 261.63, time: 0.32, duration: 0.5 },
      { freq: 196.00, time: 0.5, duration: 0.6 }
    ]
  },
  woodblock: {
    wave: 'triangle',
    peak: 0.8,
    attack: 0.002,
    posture: [
      { freq: 880, time: 0, duration: 0.07 },
      { freq: 1174.66, time: 0.12, duration: 0.07 }
    ],
    stretch: [
      { freq: 1174.66, time: 0, duration: 0.07 },
      { freq: 880, time: 0.14, duration: 0.07 },
      { freq: 659.25, time: 0.28, duration: 0.09 }
    ]
  }
};

function scheduleNote(ctx, freq, startTime, duration, wave, gainPeak, attack) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.frequency.value = freq;
  osc.type = wave;

  const endTime = startTime + duration;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gainPeak, startTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

  osc.start(startTime);
  osc.stop(endTime);
}

function playSound(style, variant, volume = 0.7) {
  const def = SOUND_STYLES[style] || SOUND_STYLES.chime;
  const notes = def[variant] || def.posture;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  notes.forEach(note => {
    const startTime = ctx.currentTime + note.time;
    scheduleNote(ctx, note.freq, startTime, note.duration, def.wave, volume * def.peak, def.attack);
    if (def.overtone) {
      scheduleNote(ctx, note.freq * def.overtone, startTime, note.duration * 0.6, def.wave, volume * def.peak * 0.25, def.attack);
    }
  });
}
