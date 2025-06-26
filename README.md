# LinkedIn AI Comment Generator

This is a Chrome extension that uses Claude Opus 4 to generate intelligent comments for LinkedIn posts.

## Features
- Injects a "✨ Gen AI" button into the action bar of LinkedIn posts.
- Clicking the button generates a relevant comment using the Claude Opus 4 API.
- Automatically fills the comment box with the generated text.
- Securely stores your Claude API key in Chrome's local storage.

## Project Structure

- `manifest.json`: The core configuration file for the Chrome extension.
- `background.js`: The service worker that handles communication with the Claude API.
- `content.js`: The script injected into LinkedIn pages to add the button and handle DOM manipulation.
- `popup.html` / `popup.js`: The UI and logic for the extension's popup.
- `options.html` / `options.js`: The settings page where the user enters their Claude API key.
- `images/`: Directory for the extension's icons.

## Setup

1.  **Add Icons**: Create and add your own icons named `icon16.png`, `icon48.png`, and `icon128.png` to the `images/` directory. These are required by the manifest.
2.  **Install the extension in Chrome**:
    - Open Chrome and navigate to `chrome://extensions`.
    - Enable "Developer mode" using the toggle in the top-right corner.
    - Click "Load unpacked" and select the entire `linkedin-comment-generator` directory.
3.  **Set API Key**:
    - After installing, click on the extension's icon in your Chrome toolbar.
    - Click the "Go to Settings" button. This will open the options page.
    - Enter your Claude API key (from Anthropic) and click "Save Key".

## How to Use

1.  Navigate to your LinkedIn feed (`https://www.linkedin.com/feed/`).
2.  Find a post you want to comment on.
3.  Click the ✨ **Gen AI** button located in the post's action bar (next to Like, Comment, etc.).
4.  Wait for Claude to generate a comment.
5.  The comment box will be automatically filled with the generated text.
6.  Review and edit the comment as you see fit, then post it manually. 