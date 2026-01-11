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
    // iPhone-style pleasant chime: Three soft ascending notes
    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },    // C5
      { freq: 659.25, time: 0.08, duration: 0.15 },  // E5
      { freq: 783.99, time: 0.16, duration: 0.25 }   // G5
    ];

    notes.forEach(note => {
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc.frequency.value = note.freq;
      osc.type = 'sine'; // Smooth, soft sine wave

      // Soft attack and decay
      const startTime = audioContext.currentTime + note.time;
      const endTime = startTime + note.duration;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.6, startTime + 0.02); // Soft attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, endTime); // Gentle fade

      osc.start(startTime);
      osc.stop(endTime);
    });
  } else if (soundType === 'stretch-bell') {
    // Pleasant stretch bell: Four descending notes (relaxing)
    const notes = [
      { freq: 783.99, time: 0, duration: 0.2 },     // G5
      { freq: 659.25, time: 0.12, duration: 0.2 },   // E5
      { freq: 523.25, time: 0.24, duration: 0.25 },  // C5
      { freq: 392.00, time: 0.38, duration: 0.3 }    // G4
    ];

    notes.forEach(note => {
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc.frequency.value = note.freq;
      osc.type = 'sine'; // Smooth, soft sine wave

      // Soft attack and decay
      const startTime = audioContext.currentTime + note.time;
      const endTime = startTime + note.duration;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.02); // Gentle attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, endTime); // Smooth fade

      osc.start(startTime);
      osc.stop(endTime);
    });
  }
}

console.log('Offscreen document loaded for audio playback');
