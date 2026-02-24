// Quick movement tips for desk workers
const MOVEMENT_TIPS = [
  { id: 'stand-up', message: 'Stand up and stretch your legs for 30 seconds.' },
  { id: 'walk-around', message: 'Take a quick walk around your room or office.' },
  { id: 'hydrate', message: 'Grab a glass of water and hydrate.' },
  { id: 'deep-breaths', message: 'Take 5 slow, deep breaths — in through the nose, out through the mouth.' },
  { id: 'eye-rest', message: 'Close your eyes or look at something 20+ feet away for 20 seconds.' },
  { id: 'calf-raises', message: 'Do 10 calf raises — stand on your toes, then lower slowly.' },
  { id: 'march-in-place', message: 'March in place for 30 seconds to get the blood flowing.' },
  { id: 'window-gaze', message: 'Walk to a window and look outside for a minute.' },
  { id: 'toe-touches', message: 'Stand up and gently reach toward your toes a few times.' },
  { id: 'refill-water', message: 'Refill your water bottle — the walk counts too!' }
];

// Get a random movement tip, avoiding recent ones
function getRandomMovementTip(recentTipIds = []) {
  let filtered = MOVEMENT_TIPS;

  if (recentTipIds.length > 0) {
    const notRecent = filtered.filter(t => !recentTipIds.includes(t.id));
    if (notRecent.length > 0) {
      filtered = notRecent;
    }
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MOVEMENT_TIPS, getRandomMovementTip };
}
