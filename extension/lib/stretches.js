// Curated stretch library focused on neck and shoulder tension relief
const STRETCHES = [
  {
    id: 'chin-tuck',
    name: 'Chin Tuck',
    category: 'neck',
    duration: 30,
    difficulty: 'easy',
    description: 'Counteracts forward head posture',
    instructions: [
      'Sit or stand with good posture',
      'Look straight ahead',
      'Gently pull your chin straight back (like making a double chin)',
      'Hold for 5 seconds',
      'Repeat 5 times'
    ],
    benefits: 'Strengthens deep neck flexors and reduces forward head posture, a major cause of tension headaches'
  },
  {
    id: 'neck-side-tilt',
    name: 'Neck Side Tilt',
    category: 'neck',
    duration: 30,
    difficulty: 'easy',
    description: 'Stretches side neck muscles',
    instructions: [
      'Sit up straight with shoulders relaxed',
      'Slowly tilt your head toward your right shoulder',
      'Hold for 15-20 seconds',
      'Return to center',
      'Repeat on the left side',
      'Do 2-3 times each side'
    ],
    benefits: 'Relieves tension in the upper trapezius and levator scapulae muscles'
  },
  {
    id: 'upper-trap-stretch',
    name: 'Upper Trapezius Stretch',
    category: 'neck-shoulder',
    duration: 45,
    difficulty: 'easy',
    description: 'Deep stretch for upper back and neck',
    instructions: [
      'Sit up straight',
      'Tilt your head to the right',
      'Place your right hand on the left side of your head',
      'Gently apply light pressure to increase the stretch',
      'Hold for 20-30 seconds',
      'Repeat on the other side'
    ],
    benefits: 'Targets the upper trapezius muscle, commonly tight from computer work'
  },
  {
    id: 'shoulder-blade-squeeze',
    name: 'Shoulder Blade Squeeze',
    category: 'shoulder',
    duration: 20,
    difficulty: 'easy',
    description: 'Strengthens upper back',
    instructions: [
      'Sit or stand with arms at your sides',
      'Squeeze your shoulder blades together',
      'Hold for 5 seconds',
      'Release',
      'Repeat 10 times'
    ],
    benefits: 'Strengthens rhomboid muscles and counteracts rounded shoulders'
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    category: 'shoulder',
    duration: 30,
    difficulty: 'easy',
    description: 'Loosens shoulder tension',
    instructions: [
      'Sit or stand with good posture',
      'Roll your shoulders backward in a circular motion',
      'Do 10 backward rolls',
      'Then do 10 forward rolls',
      'Move slowly and with control'
    ],
    benefits: 'Increases blood flow and releases tension in shoulders and upper back'
  },
  {
    id: 'doorway-chest-stretch',
    name: 'Doorway Chest Stretch',
    category: 'chest',
    duration: 45,
    difficulty: 'easy',
    description: 'Opens chest and shoulders',
    instructions: [
      'Stand in a doorway with arms at 90 degrees on door frame',
      'Step forward with one foot',
      'Lean forward gently until you feel a stretch across your chest',
      'Hold for 30 seconds',
      'Repeat 2-3 times'
    ],
    benefits: 'Counteracts rounded shoulders and forward posture from desk work'
  },
  {
    id: 'seated-spinal-twist',
    name: 'Seated Spinal Twist',
    category: 'back',
    duration: 45,
    difficulty: 'easy',
    description: 'Releases back tension',
    instructions: [
      'Sit up straight in your chair',
      'Place your right hand on the back of the chair',
      'Twist your torso to the right, looking over your right shoulder',
      'Hold for 20-30 seconds',
      'Repeat on the left side'
    ],
    benefits: 'Improves spinal mobility and releases tension in the mid-back'
  },
  {
    id: 'wrist-circles',
    name: 'Wrist and Finger Stretch',
    category: 'wrist',
    duration: 30,
    difficulty: 'easy',
    description: 'Prevents wrist strain',
    instructions: [
      'Extend your right arm forward, palm up',
      'Gently pull fingers back with your left hand',
      'Hold for 15 seconds',
      'Then flip palm down and pull fingers toward you',
      'Hold for 15 seconds',
      'Repeat on the left hand'
    ],
    benefits: 'Prevents carpal tunnel syndrome and relieves tension from typing'
  },
  {
    id: 'neck-rotation',
    name: 'Gentle Neck Rotation',
    category: 'neck',
    duration: 30,
    difficulty: 'easy',
    description: 'Improves neck mobility',
    instructions: [
      'Sit or stand with good posture',
      'Slowly turn your head to look over your right shoulder',
      'Hold for 10 seconds',
      'Return to center',
      'Turn to look over your left shoulder',
      'Hold for 10 seconds',
      'Repeat 3 times each side'
    ],
    benefits: 'Maintains neck mobility and reduces stiffness'
  },
  {
    id: 'standing-backbend',
    name: 'Standing Backbend',
    category: 'back',
    duration: 30,
    difficulty: 'medium',
    description: 'Counteracts forward slouching',
    instructions: [
      'Stand with feet hip-width apart',
      'Place your hands on your lower back for support',
      'Gently arch backward, looking up slightly',
      'Hold for 10 seconds',
      'Return to neutral',
      'Repeat 3 times'
    ],
    benefits: 'Opens the chest and counteracts hours of forward-leaning posture'
  }
];

// Get a random stretch, optionally filtered by category
function getRandomStretch(category = null) {
  const filtered = category
    ? STRETCHES.filter(s => s.category === category)
    : STRETCHES;

  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Get all stretches by category
function getStretchesByCategory(category) {
  return STRETCHES.filter(s => s.category === category);
}

// Get stretch by ID
function getStretchById(id) {
  return STRETCHES.find(s => s.id === id);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STRETCHES, getRandomStretch, getStretchesByCategory, getStretchById };
}
