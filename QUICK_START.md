# Quick Start Guide

Get your Posture & Tension Relief extension running in 5 minutes!

## Step 1: Generate Icons (One-Time Setup)

The extension needs icons to display properly in Chrome.

### Option A: Use the Icon Generator (Recommended)
1. Open `extension/assets/icons/create-icons.html` in any web browser
2. Click the "Generate & Download Icons" button
3. Three PNG files will download: `icon16.png`, `icon48.png`, `icon128.png`
4. Move these files to `extension/assets/icons/` (replace the .html file location)

### Option B: Use Any Icons You Like
- Create or download 16x16, 48x48, and 128x128 pixel PNG images
- Name them `icon16.png`, `icon48.png`, `icon128.png`
- Place in `extension/assets/icons/`

## Step 2: Load Extension in Chrome

1. Open Chrome and go to: **`chrome://extensions/`**

2. Enable **"Developer mode"** (toggle switch in top-right corner)

3. Click **"Load unpacked"** button

4. Navigate to and select the **`extension`** folder in this project

5. The extension should now appear in your list with a purple icon!

## Step 3: Pin the Extension (Optional but Recommended)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "Posture & Tension Relief"
3. Click the pin icon to keep it visible

## Step 4: Test It Out!

1. **Click the extension icon** - You should see the popup with status and controls

2. **Test Notifications**:
   - Click "Test Posture Reminder" - You should get a notification
   - Click "Test Stretch Reminder" - You should get a stretch notification with "Show Instructions" button

3. **Configure Your Preferences**:
   - Click "⚙️ Settings" in the popup
   - Adjust intervals to your preference
   - Enable working hours if desired
   - Check out the stretch library!

## Step 5: Start Using It!

That's it! The extension will now:
- Remind you to check posture every 10 minutes (adjustable)
- Remind you to stretch every 30 minutes (adjustable)
- Show you random stretches from the curated library
- Respect your working hours if configured

### Quick Tips

- **Pause anytime**: Click extension icon → "Pause Reminders"
- **Adjust intervals**: Settings page → Reminder Intervals
- **Browse stretches**: Settings page → Stretch Library (scroll down)
- **Working hours**: Settings page → Enable working hours schedule

## Troubleshooting

### "This site can't be reached" or errors loading
- Make sure you selected the `extension` folder, not the root `posture` folder
- The correct path should show something like: `.../posture/extension`

### Icons show as gray puzzle pieces
- Complete Step 1 (generate icons) before loading the extension
- After adding icons, click the refresh icon on the extension card in chrome://extensions/

### No notifications appearing
- Check Chrome notification settings: chrome://settings/content/notifications
- Make sure "Posture & Tension Relief" extension is enabled in the popup
- If using working hours, verify current time is within your set range
- Try the test buttons in the popup

### Notifications appearing but no sound
- Check your system volume
- Audio uses Chrome's default notification sound (custom audio planned for future)
- Verify "Enable notification sounds" is checked in Settings

## What's Next?

Now that you're set up:

1. **Use it for a few days** - See how the default 10/30 minute intervals feel
2. **Adjust as needed** - Too frequent? Increase intervals. Too rare? Decrease them.
3. **Try the stretches** - When you get a stretch reminder, actually do it! Click "Show Instructions"
4. **Pay attention to results** - Notice if tension headaches decrease over time

## Settings Recommendations

### If you're new to posture awareness:
- Posture checks: 10 minutes
- Stretch breaks: 30 minutes
- Working hours: Enable if you have set hours

### If you're already posture-conscious:
- Posture checks: 15-20 minutes
- Stretch breaks: 45-60 minutes
- Working hours: As needed

### If headaches are severe:
- Posture checks: 5-10 minutes (more frequent)
- Stretch breaks: 20-30 minutes (more frequent)
- Focus on neck stretches when they appear

---

**You're all set!** The extension is now working to help improve your posture and relieve tension headaches. 🎉

Questions? Check the main [README.md](README.md) for detailed documentation.
