# Chrome Web Store Submission Guide

Everything needed to publish **Aligned - Posture and Movement Reminders** to the Chrome Web Store.

## Naming

"Posture Check" collided with an existing extension of the same name and a crowded field (PostureMinder, Posture Reminder, Mind Your Posture, Sit upright, Sit Better, PosturePanda). **Aligned** is a distinct brand word, and the full store title keeps "posture" and "movement" as search keywords. "Upright" was rejected — it's an existing posture-wearable brand (trademark risk).

## 1. Package the extension

```bash
cd ~/Projects/posture/extension
zip -r ../aligned-v1.0.0.zip . -x "*.DS_Store"
```

The zip must contain `manifest.json` at its root (it does, when zipped from inside `extension/`).

## 2. Developer account

- Register at https://chrome.google.com/webstore/devconsole ($5 one-time fee)
- Use a Google account you're happy to have publicly associated with the listing

## 3. Listing content (copy/paste)

**Name:** Aligned - Posture and Movement Reminders

**Summary (132 chars max):**
> Gentle posture reminders, movement breaks, and guided stretches for desk workers.

**Description:**
> Aligned helps you build better posture habits while you work.
>
> • Posture nudges — a gentle reminder every 10 minutes (configurable 5–60) to sit up straight
> • Movement breaks — alternating quick movement tips and guided stretches every 30 minutes (configurable 15–120), with a snooze button for when you're mid-flow
> • 10 guided stretches — neck, shoulder, chest, back, and wrist stretches with step-by-step instructions and a built-in timer
> • Smart pausing — pause for 30 minutes, an hour, the rest of the day, or until you say so; reminders resume automatically
> • Away detection — no reminders pile up while you're away from your desk
> • Working hours — optionally limit reminders to your work schedule
> • Daily stats — see how many posture checks and breaks you've completed today
> • Four notification sounds — chime, bell, marimba, or wood block, with volume control
> • Light & dark themes plus indigo, sage, and amber accent colours — follows your system or set manually
>
> No account, no tracking, no data collection. Everything stays in your browser.

**Category:** Productivity (or Health & Fitness if available)

**Language:** English

## 4. Required assets

| Asset | Size | Status |
|---|---|---|
| Store icon | 128×128 PNG | ✅ `extension/assets/icons/icon128.png` |
| Screenshots (1–5) | 1280×800 or 640×400 | ❌ Take these: popup, options page, a notification, the stretch modal, the welcome page |
| Small promo tile (optional) | 440×280 | optional |

Screenshot tip: load the extension, open the popup/options in both themes, and capture with `Cmd+Shift+4`. Resize to 1280×800 on a neutral background.

## 5. Privacy tab answers

- **Single purpose:** Reminds the user to check their posture and take movement breaks at configurable intervals.
- **Permission justifications:**
  - `alarms` — schedule recurring posture and stretch reminders, snoozes, and auto-resume after a timed pause
  - `notifications` — display the reminder notifications
  - `storage` — save user settings (sync) and local stats/recent-stretch history
  - `offscreen` — play a short notification chime (Manifest V3 service workers cannot play audio directly)
  - `idle` — skip reminders while the user is away from the computer, so they don't pile up
- **Remote code:** No
- **Data collection:** None. The extension collects no user data and makes no network requests.

A privacy policy is still required by the store. Host `PRIVACY_POLICY.md` (e.g. as a GitHub Pages page or public gist) and paste its URL into the listing.

## 6. Pre-submission checklist

- [ ] Bump `version` in `manifest.json` for any resubmission
- [ ] Test fresh install: load unpacked → welcome page opens, test reminder works, reminders fire, popup/options work in both themes
- [ ] Test pause options (30 min auto-resume, badge shows/clears) and snooze on a movement break
- [ ] Test with system notifications enabled for Chrome (macOS: System Settings → Notifications → Google Chrome → Allow + "Alerts" style so buttons show)
- [ ] Take screenshots
- [ ] Host privacy policy and note URL
- [ ] Zip from inside `extension/` so manifest.json is at the zip root

Review typically takes a few business days for an extension with no host permissions and no remote code.
