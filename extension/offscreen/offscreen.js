// Offscreen document for playing audio in Manifest V3

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'playSound') {
    playSound(message.soundType, message.volume);
    sendResponse({ success: true });
  }
  return true;
});

// Play a sound using Web Audio API
function playSound(soundType, volume = 0.7) {
  console.log(`Playing ${soundType} at volume ${volume}`);

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Set volume
  gainNode.gain.value = volume;

  // Different sounds for different notification types
  if (soundType === 'posture-chime') {
    // Beautiful chime: C6 with harmonics for bell-like quality
    const fundamental = 1046.5; // C6
    const duration = 1.2;

    // Create multiple oscillators for harmonics (like a real bell/chime)
    const harmonics = [
      { freq: fundamental, gain: 1.0 },      // Fundamental
      { freq: fundamental * 2, gain: 0.5 },  // Octave
      { freq: fundamental * 3, gain: 0.25 }, // Fifth
      { freq: fundamental * 4, gain: 0.15 }  // Third harmonic
    ];

    harmonics.forEach((harmonic, index) => {
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc.frequency.value = harmonic.freq;
      osc.type = 'sine';

      // Each harmonic decays at slightly different rate for natural sound
      const harmonicVolume = volume * harmonic.gain;
      const decayTime = duration * (1 + index * 0.1); // Higher harmonics decay slightly faster

      gainNode.gain.setValueAtTime(harmonicVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + decayTime);

      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + decayTime);
    });
  } else if (soundType === 'stretch-bell') {
    // Two-tone bell: E6 then C6
    oscillator.frequency.value = 1318.5; // E6
    oscillator.type = 'sine';

    // First tone
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Second tone
    setTimeout(() => {
      const audioContext2 = new AudioContext();
      const oscillator2 = audioContext2.createOscillator();
      const gainNode2 = audioContext2.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext2.destination);

      oscillator2.frequency.value = 1046.5; // C6
      oscillator2.type = 'sine';
      gainNode2.gain.value = volume;

      gainNode2.gain.setValueAtTime(volume, audioContext2.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext2.currentTime + 0.4);

      oscillator2.start(audioContext2.currentTime);
      oscillator2.stop(audioContext2.currentTime + 0.4);
    }, 350);
  }
}

console.log('Offscreen document loaded for audio playback');
