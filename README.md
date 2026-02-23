# TextAnchor

Save and return to the exact word where you stopped reading on any article or blog page.

TextAnchor is a Chrome extension that lets you drop a precise reading anchor in the text using your caret (text cursor). When you come back to the same page, the extension scrolls you back to that exact spot and briefly highlights it so you can resume reading instantly.

## Features

- **Precise text anchors**: Mark the exact word/character using the text cursor and a single click.
- **Automatic restore**: When you revisit the same page, TextAnchor scrolls back to the saved position.
- **Temporary highlight**: The saved word/character is highlighted for a few seconds when restored.
- **Per‑page storage**: Anchors are stored per normalized URL using Chrome's `chrome.storage.local`.
- **Simple popup UI**: Quickly mark, save, and restore your reading state from the extension popup.

## Installation (Load Unpacked in Chrome)

1. **Download or clone** this project to your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (toggle in the top-right corner).
4. Click **“Load unpacked”**.
5. Select the project folder (for you, this is typically:  
   `/home/nik/Desktop/Projects/Project-k`).
6. You should now see **TextAnchor** in the list of extensions and its icon in the toolbar.

## Usage

1. Open any article or blog page you want to read.
2. Read until you want to stop.
3. Place the **text cursor (caret)** at the exact word/character where you stop.
4. Click the **TextAnchor** icon in the Chrome toolbar to open the popup.
5. Click **“Mark Position”** in the popup to save that text anchor.
6. Later, when you revisit the same page:
   - The extension will automatically scroll to your saved anchor.
   - The anchored word/character will be briefly highlighted so you can easily spot it.

You can also use the **Save Position** / **Restore Position** buttons to work with scroll‑based positions if you prefer.

## Screenshots

> _Add screenshots here once you capture them._
>
> Suggested screenshots:
> - Popup UI (TextAnchor window)
> - Example page before marking
> - Example page after restore with highlighted text

## Tech Stack

- **Platform**: Chrome Extension (Manifest V3)
- **Languages**: HTML, CSS, JavaScript (vanilla)
- **APIs**:
  - `chrome.storage.local` for per‑page anchor storage
  - `chrome.tabs` and `chrome.runtime` for messaging
  - `window.getSelection()` and `Range` API for caret‑based anchors

## Project Structure

- `manifest.json` – Extension configuration (permissions, scripts, icons, etc.).
- `background.js` – Background service worker for lifecycle events.
- `content.js` – Content script that reads/writes anchors and scrolls/highlights on the page.
- `popup.html` – Mark/restore UI layout.
- `popup.js` – Popup behavior and messaging with the content script.
- `styles.css` – Popup styling.
- `icons/` – Extension icons (toolbar and Chrome Web UI).

## Git & GitHub: Step‑by‑Step Guide

The commands below assume your project folder is:

```bash
/home/nik/Desktop/Projects/Project-k
```

### 1. Initialize a local git repository

Open a terminal and run:

```bash
cd /home/nik/Desktop/Projects/Project-k
git init
```

- `git init` turns the current folder into a new git repository.

### 2. See which files will be tracked

```bash
git status
```

- This shows all untracked files (in red) that git sees in the folder.

### 3. Add all project files to git

```bash
git add .
```

- `git add .` stages all files (except those ignored by `.gitignore`) for commit.

### 4. Create your first commit

```bash
git commit -m "Initial commit: TextAnchor Chrome extension"
```

- This takes a snapshot of the current project state with a descriptive message.

### 5. Create a new repository on GitHub

1. Go to `https://github.com` in your browser and log in.
2. Click the **“+”** button in the top-right corner and choose **“New repository”**.
3. Set the **Repository name** to something like `textanchor` (or your preferred name).
4. Choose **Public** or **Private** according to your needs.
5. **Do not** add a README, `.gitignore`, or license from GitHub (you already have them locally).
6. Click **“Create repository”**.

On the next page, GitHub will show you the repository URL. For HTTPS it will look like:

```text
https://github.com/YOUR_GITHUB_USERNAME/textanchor.git
```

### 6. Connect your local repo to GitHub

Back in your terminal (still in the project folder), add the remote:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/textanchor.git
```

- `git branch -M main` ensures your main branch is called `main`.
- `git remote add origin ...` tells git where the GitHub repo lives.

### 7. Push your code to GitHub

```bash
git push -u origin main
```

- The first push may prompt you to log in to GitHub or use a personal access token.
- `-u` sets `origin main` as the default so future pushes can be just `git push`.

### 8. Updating your repo later

Whenever you make changes to TextAnchor:

```bash
git status               # See what changed
git add .                # Stage changes
git commit -m "Describe what you changed"
git push                 # Upload to GitHub
```

Your project is now version‑controlled and backed up on GitHub.

