# Chrome Web Store — Submission Plan (Aligned)

Step-by-step plan to publish **Aligned - Posture and Movement Reminders**.
Work top to bottom; tick each box as you go.

- **Package:** `~/Projects/posture/aligned-v1.0.0.zip` (built, validated, ready to upload)
- **Dashboard:** https://chrome.google.com/webstore/devconsole
- **Full listing copy & permission text:** `STORE_SUBMISSION.md`
- **Privacy policy source:** `PRIVACY_POLICY.md`

---

## Status — already done
- [x] Final icon set (figure logo) generated at all sizes
- [x] Accent themes (indigo / sage / amber) shipped
- [x] Store name set: `Aligned - Posture and Movement Reminders`
- [x] manifest.json valid, version `1.0.0`, all JS syntax-checked
- [x] Package zipped with `manifest.json` at the root, no dev files

## Status — still to do (only you can do these)
- [ ] Pay $5 and register developer account
- [x] Host the privacy policy at a public URL — done: https://github.com/mdh2321/posture/blob/HEAD/PRIVACY_POLICY.md
- [x] Take at least one 1280×800 screenshot — done: five ready in `store-assets/` (real extension rendered in headless Chromium)
- [ ] Fill the listing + privacy tab and submit

---

## Step 1 — Register the developer account (one-time, ~5 min)
1. Open https://chrome.google.com/webstore/devconsole
2. Sign in with the Google account you want publicly associated with the listing
3. Pay the **$5 one-time** registration fee
4. Accept the developer agreement

## Step 2 — Host the privacy policy (required) — DONE
`PRIVACY_POLICY.md` is committed to the public GitHub repo. Use this URL in Step 5:

> https://github.com/mdh2321/posture/blob/HEAD/PRIVACY_POLICY.md

(`HEAD` follows the default branch, so the link stays stable.)

## Step 3 — Take screenshots (1 required, up to 5) — DONE
Five 1280×800 PNGs are ready in `~/Projects/posture/store-assets/`:
- `popup-dark.png` — popup, dark theme, indigo
- `popup-amber-light.png` — popup, light theme, amber accent
- `options-light.png` — settings page, light theme
- `welcome-dark.png` — welcome/onboarding page, dark theme
- `stretch-modal-light.png` — guided stretch instructions with timer

They render the real extension UI (loaded unpacked in headless Chromium). Retake any of them manually if you prefer different framing.

## Step 4 — Upload the package
1. In the dashboard, click **+ New Item**
2. Drag in `~/Projects/posture/aligned-v1.0.0.zip`
3. Wait for processing (manifest is read automatically)

## Step 5 — Fill the store listing
Copy/paste from `STORE_SUBMISSION.md` §3:
- **Name:** `Aligned - Posture and Movement Reminders`
- **Summary** (≤132 chars) and the bulleted **Description**
- **Category:** Productivity (or Health & Fitness if offered)
- **Language:** English
- **Icon:** auto-pulled from the package (128×128) — no action needed
- **Screenshots:** upload from Step 3
- **Privacy policy URL:** paste the URL from Step 2

## Step 6 — Privacy practices tab
From `STORE_SUBMISSION.md` §5:
- **Single purpose:** "Reminds the user to check their posture and take movement breaks at configurable intervals."
- **Permission justifications** — one line each for `alarms`, `notifications`, `storage`, `offscreen`, `idle` (text in the doc)
- **Remote code:** No
- **Data collection:** declare **none** — collects no user data, makes no network requests
- Tick the data-use certification checkboxes

## Step 7 — Submit for review
1. Set visibility: **Public** (or **Unlisted** for a link-only soft launch)
2. Click **Submit for review**
3. Expect a few business days (faster with no host permissions / no remote code)

---

## Pre-submit smoke test (2 min)
Behavior changed this build — verify after loading unpacked:
- [ ] Options → **Test movement break** → notification title reads **"Movement Break"** (not "Stretch Break")
- [ ] The reminder **stays up** until you click Done or Snooze
- [ ] Clicking **Done** increments **"Breaks taken today"** in the popup
- [ ] Movement-break chime differs from the posture chime
- [ ] Pause → pick a duration → the duration buttons **disappear**; badge shows `II`
- [ ] Options → Appearance → **Accent** switches indigo / sage / amber live, in both light and dark

## Resubmitting later (updates)
1. Bump `version` in `extension/manifest.json` (e.g. `1.0.1`)
2. Rebuild: `cd ~/Projects/posture/extension && zip -r ../aligned-v<version>.zip . -x "*.DS_Store" "*/.*"`
3. Dashboard → the existing item → **Package** → upload new zip → **Submit for review**

## Notes
- The PNG logo does **not** recolor with the user's accent choice (static image) — expected.
- Icon generators live in `tools/` (`generate_icons_a.py`, `logo_mockups.py`); excluded from the package.
