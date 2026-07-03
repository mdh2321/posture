# Aligned — Posture & Stretch Breaks (Chrome Extension)

A Chrome extension that helps improve posture and relieve tension headaches through gentle reminders, movement breaks, and guided stretches.

## Features

- **Posture nudges**: customizable reminders (default: every 10 minutes) to check and correct your posture
- **Movement breaks**: alternating quick movement tips and guided stretches (default: every 30 minutes), with a 5-minute snooze
- **10 curated stretches**: neck, shoulder, chest, back, and wrist — with step-by-step instructions and a built-in timer
- **Smart pausing**: pause for 30 min / 1 hour / rest of day / indefinitely; auto-resumes, with a toolbar badge while paused
- **Away detection**: reminders are skipped while you're idle (5+ min away from the keyboard)
- **Working hours**: optionally limit reminders to a schedule
- **Daily stats**: posture checks and breaks completed today (kept 30 days, local only)
- **4 notification sounds**: chime, bell, marimba, wood block — synthesized, no audio files
- **Light/dark theme**: follows system or set manually

## Installation (development)

1. Open `chrome://extensions/`, enable **Developer mode**
2. Click **Load unpacked** and select the `extension/` folder
3. A welcome page opens — use it to send yourself a test reminder

For Chrome Web Store packaging and submission, see [STORE_SUBMISSION.md](STORE_SUBMISSION.md). Privacy policy: [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## How it works

- **Manifest V3**, no host permissions, no network requests
- Permissions: `alarms` (reminder scheduling, snooze, auto-resume), `notifications`, `storage` (settings via sync, stats via local), `offscreen` (audio playback — MV3 service workers can't play sound), `idle` (away detection)
- The service worker reconciles alarms with settings on install/startup/change (`syncAlarms`)
- A once-a-minute watcher alarm runs **only** while working hours are enabled and reminders are active, starting/stopping reminders at the schedule boundaries
- Movement breaks alternate tip → stretch → tip. Snoozing a break replays the *same* break 5 minutes later and restarts the break interval from that point; posture checks are unaffected
- Stretch notifications: click the body for step-by-step instructions, buttons for Done / Snooze

## Project structure

```
extension/
├── manifest.json
├── background/service-worker.js   # alarms, notifications, pause/snooze, stats
├── popup/                         # toolbar popup (status, pause, stats)
├── options/                       # settings page + stretch library + tips
├── welcome/                       # first-run onboarding page
├── modals/stretch-modal.html      # stretch instructions + timer window
├── offscreen/                     # Web Audio chime synthesis
├── lib/                           # settings defaults, stretches, tips, theme
└── assets/icons/
tools/create-icons.html            # dev-only icon generator (not packaged)
```

## Troubleshooting

**Notifications not appearing**
1. Check `chrome://settings/content/notifications`
2. macOS: System Settings → Notifications → Google Chrome → Allow, style **Alerts** (otherwise action buttons are hidden)
3. Make sure reminders aren't paused (toolbar badge shows `II` when paused) and you're within working hours if enabled
4. Use the Preview buttons on the settings page

**Alarms not firing**
1. Check extension errors at `chrome://extensions/` → Details → Errors
2. Reminders are intentionally skipped while you're idle 5+ minutes

**No sound**
1. Enable sound in settings and check the volume slider
2. System volume / Chrome not muted

## Modifying stretches

Edit `extension/lib/stretches.js`:

```javascript
{
  id: 'unique-id',
  name: 'Stretch Name',
  category: 'neck|shoulder|neck-shoulder|back|chest|wrist',
  duration: 30, // seconds
  difficulty: 'easy|medium|hard',
  description: 'Brief description',
  instructions: ['Step 1', 'Step 2'],
  benefits: 'What this stretch helps with'
}
```

## Privacy

No data collection, no analytics, no network requests. Settings sync via your Chrome profile; stats stay on-device. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).
