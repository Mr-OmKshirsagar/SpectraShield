# SpectraShield Chrome Extension (MVP)

- **Popup:** Paste email content and optionally link/sender; analyze with the local backend.
- **Gmail:** On mail.google.com the extension runs automatically: it scans each visible email row, extracts subject and sender only (privacy-first), calls the backend with `private_mode: true` (no storage), and shows a risk badge after each subject—green (safe), yellow (suspicious), red (high risk). Hover a badge to see the risk percentage.

## Setup

1. Start the backend: `cd backend && uvicorn app.main:app --reload --port 8000`
2. In Chrome: open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**
3. Select the `extension` folder (this directory)

## Use

- **Popup:** Click the extension icon, paste content, optionally set link/sender and private mode, then click **Analyze**.
- **Gmail:** Open https://mail.google.com. Badges appear automatically next to each email subject after a short delay. Backend must be running on localhost:8000.

The extension talks only to `http://localhost:8000`. No email content is sent elsewhere; Gmail scans use private_mode so nothing is stored.
