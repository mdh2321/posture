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
