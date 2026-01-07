# Posture & Tension Relief Chrome Extension

A Chrome extension that helps improve posture and relieve tension headaches through gentle reminders and guided stretches.

## Features

- **Posture Check Reminders**: Customizable reminders (default: every 10 minutes) to check and correct your posture
- **Stretch Break Reminders**: Guided stretch breaks (default: every 30 minutes) with detailed instructions
- **10 Curated Stretches**: Focused on neck and shoulder tension relief, specifically targeting tension headache triggers
- **Audio Notifications**: Gentle chimes for each reminder type
- **Working Hours Schedule**: Optional feature to only show reminders during work hours
- **Pause/Resume**: Easily pause reminders when needed
- **Educational Content**: Tips and guidance for better posture and ergonomic setup

## Installation

### Quick Start (For Testing)

1. **Generate Icons** (required for first install):
   ```bash
   # Open the icon generator in your browser
   open extension/assets/icons/create-icons.html
   # Click "Generate & Download Icons" button
   # Move the downloaded icons to extension/assets/icons/
   ```

2. **Load Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `extension` folder from this project
   - The extension icon should appear in your toolbar

3. **Configure Settings**:
   - Click the extension icon to open the popup
   - Click "⚙️ Settings" to customize intervals and preferences
   - Test the notifications using the "Test" buttons in the popup

## Usage

### Quick Controls (Popup)

Click the extension icon to access:
- **Pause/Resume**: Temporarily disable reminders
- **Current Status**: See if reminders are active
- **Interval Display**: View current reminder frequencies
- **Test Buttons**: Try out posture and stretch notifications

### Settings Page

Access via the popup's "⚙️ Settings" link:

#### Reminder Intervals
- **Posture Check**: 5-60 minutes (default: 10 min)
- **Stretch Break**: 15-120 minutes (default: 30 min)

#### Working Hours (Optional)
- Enable scheduled reminders only during work hours
- Set custom start and end times
- Always-on by default with manual pause option

#### Audio Notifications
- Enable/disable notification sounds
- Adjustable volume (0-100%)

#### Stretch Library
- Browse all 10 available stretches
- View difficulty, duration, and benefits
- Categories: neck, shoulder, back, chest, wrist

#### Educational Tips
- Monitor positioning
- Keyboard & mouse ergonomics
- Chair height adjustment
- Break recommendations
- Phone usage guidance

## Stretch Library

The extension includes 10 carefully curated stretches:

### Neck Stretches (Primary for Headaches)
1. **Chin Tuck** - Counteracts forward head posture
2. **Neck Side Tilt** - Stretches side neck muscles
3. **Upper Trapezius Stretch** - Deep stretch for upper back/neck
4. **Gentle Neck Rotation** - Improves neck mobility

### Shoulder & Back
5. **Shoulder Blade Squeeze** - Strengthens upper back
6. **Shoulder Rolls** - Loosens shoulder tension
7. **Doorway Chest Stretch** - Opens chest and shoulders
8. **Seated Spinal Twist** - Releases back tension

### Additional
9. **Wrist and Finger Stretch** - Prevents wrist strain
10. **Standing Backbend** - Counteracts forward slouching

## How It Works

### Technical Overview

- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background script manages alarms and notifications
- **Chrome Alarms API**: Reliable, battery-efficient timers
- **Chrome Notifications API**: System notifications with action buttons
- **Chrome Storage API**: Persistent settings across sessions

### Notification Flow

1. Service worker creates periodic alarms based on your settings
2. When alarm fires, notification is displayed with audio cue
3. For stretch reminders, a random stretch is selected from the library
4. Click "Show Instructions" on stretch notifications for detailed guidance
5. Notifications auto-dismiss after 10-15 seconds

### Working Hours Logic

When enabled:
- Checks current time against your configured hours
- Only starts alarms within working hours
- Automatically pauses when outside work hours
- Checks every minute to resume when entering work hours

## Customization

### Adjusting Intervals

Based on your needs:
- **Frequent reminders**: 5-10 min for posture, 15-20 min for stretches
- **Moderate**: 10-15 min for posture, 30 min for stretches (default)
- **Occasional**: 20+ min for posture, 60+ min for stretches

### Working Hours Examples

**Standard 9-5 office**:
- Enable: Yes
- Start: 09:00
- End: 17:00

**Flexible schedule**:
- Enable: No
- Use manual pause/resume as needed

**Part-time hours**:
- Enable: Yes
- Set your specific work window

## Troubleshooting

### Icons Not Showing
If you see a gray puzzle piece icon:
1. Open `extension/assets/icons/create-icons.html` in browser
2. Click "Generate & Download Icons"
3. Move downloaded PNG files to `extension/assets/icons/`
4. Reload extension in `chrome://extensions/`

### Notifications Not Appearing
1. Check Chrome notification permissions: `chrome://settings/content/notifications`
2. Ensure extension is enabled in popup
3. If using working hours, verify current time is within range
4. Test notifications using popup buttons

### Alarms Not Firing
1. Close and reopen Chrome (service workers need refresh sometimes)
2. Check extension errors in `chrome://extensions/` (click "Details" > "Errors")
3. Disable and re-enable the extension
4. Check that intervals are set to reasonable values (minimum 5 minutes for posture)

### Audio Not Playing
1. Verify audio is enabled in settings
2. Check system volume and Chrome isn't muted
3. Note: Chrome uses system notification sounds for MVP (custom audio in future version)

## Future Enhancements

Potential additions based on user feedback:
- Progress tracking and analytics
- Custom audio files (currently uses system sounds)
- Video demonstrations of stretches
- More exercises and strengthening routines
- Mobile/web app companion
- Camera-based posture detection
- Integration with fitness trackers
- Dark mode UI

## Privacy

- **No data collection**: All data stored locally on your device
- **No analytics**: No tracking or external servers
- **No permissions abuse**: Only uses necessary Chrome APIs
- **Sync storage**: Uses Chrome sync for settings (tied to your Google account)

## Development

### Project Structure

```
extension/
├── manifest.json              # Extension config
├── background/
│   └── service-worker.js      # Timer & notification logic
├── popup/
│   ├── popup.html            # Quick controls UI
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html          # Settings page
│   ├── options.css
│   └── options.js
├── lib/
│   └── stretches.js          # Stretch library data
└── assets/
    └── icons/
        ├── create-icons.html  # Icon generator
        ├── icon16.png
        ├── icon48.png
        └── icon128.png
```

### Modifying Stretches

Edit `extension/lib/stretches.js`:

```javascript
{
  id: 'unique-id',
  name: 'Stretch Name',
  category: 'neck|shoulder|back|chest|wrist',
  duration: 30, // seconds
  difficulty: 'easy|medium|hard',
  description: 'Brief description',
  instructions: [
    'Step 1',
    'Step 2',
    // ...
  ],
  benefits: 'What this stretch helps with'
}
```

### Building Custom Features

Key files to modify:
- **Alarm logic**: `background/service-worker.js`
- **UI changes**: `popup/` or `options/` directories
- **Settings structure**: Update `DEFAULT_SETTINGS` in service-worker.js
- **Notification content**: `showPostureReminder()` and `showStretchReminder()`

## Credits

Created to help relieve tension headaches and improve posture during long computer work sessions.

Stretches curated from ergonomic and physical therapy best practices focusing on:
- Forward head posture correction
- Neck and shoulder tension relief
- Upper back strengthening
- Desk worker-friendly exercises

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review `IMPLEMENTATION_PLAN.md` for technical details
3. Verify all installation steps were completed

## License

Built for personal use and improvement. Feel free to modify and extend based on your needs.

---

**Version**: 1.0.0
**Compatibility**: Chrome 88+ (Manifest V3 compatible)
**Status**: MVP - Simple testing version
