<div align="center">

# ⚓ TextAnchor

### *Never lose your place again.*

A Chrome extension that bookmarks the **exact word** where you stopped reading — and brings you right back to it.

[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![JavaScript](https://img.shields.io/badge/Built%20with-JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

**Reading a long article?** Place your cursor on the exact word where you stopped, click **Mark Position**, and walk away.  
When you come back — even days later — TextAnchor scrolls to that exact spot and highlights it so you can pick up right where you left off.

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Precise Text Anchors** | Marks the exact word/character using the browser's text cursor — not just a scroll position |
| 🔄 **Auto-Restore** | Automatically scrolls back to your saved anchor when you revisit a page |
| 💡 **Temporary Highlight** | Briefly highlights the anchored word so you can spot it instantly |
| 🔗 **Per-Page Storage** | Each page gets its own saved reading position — anchors never collide |
| 💾 **URL Saving** | Automatically saves and manages URLs of your bookmarked articles |
| 📚 **Saved Articles** | Automatically saves a list of bookmarked pages so you can easily return to them from the popup |
| 📊 **Reading Progress** | Tracks and displays how far through the page you've read (percentage) |
| 🖱️ **Scroll Position Fallback** | Also saves scroll-based positions as a secondary restore method |
| 🌙 **Dark Mode UI** | Sleek dark-themed popup that adapts to your system preference |

---

## 🚀 How It Works

```
1. Read an article or blog post
2. Stop at any word → place your text cursor there
3. Click TextAnchor icon → "Mark Position"
4. Come back anytime → auto-restored & highlighted ✨
```

Under the hood, TextAnchor uses the browser's **Selection & Range API** to build a DOM path to the exact text node and character offset where your cursor sits. This path is saved to `chrome.storage.local` keyed by the page URL, so every page has its own independent anchor. On revisit, the extension walks the DOM path, scrolls to the node, and wraps the character in a temporary highlight that fades out after 3 seconds.

---

## 📦 Installation

> **Note:** TextAnchor is not yet on the Chrome Web Store. Install it locally with these steps:

1. **Clone** this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/TextAnchor.git
   ```

2. Open Chrome and navigate to **`chrome://extensions`**

3. Enable **Developer Mode** (toggle in the top-right corner)

4. Click **"Load unpacked"**

5. Select the cloned project folder

6. ✅ TextAnchor should now appear in your extensions toolbar!

---

## 📖 Usage

| Action | How |
|--------|-----|
| **Mark your position** | Place cursor on a word → click TextAnchor icon → **Mark Position** |
| **Save scroll position** | Click TextAnchor icon → **Save Position** (saves scroll-based position) |
| **Restore manually** | Click TextAnchor icon → **Restore Position** |
| **Auto-restore** | Just revisit the page — it happens automatically |

### Popup UI

The popup shows:
- 📊 Your saved **reading progress** (percentage + timestamp)
- 📌 Your **marked position** (percentage + timestamp)
- Three action buttons: **Save**, **Restore**, and **Mark**
- 💾 **URL Saving** integration directly via the popup
- 📚 A list of your **Saved Articles** to quickly jump back in

---

## 🛠️ Tech Stack

- **Platform** — Chrome Extension (Manifest V3)
- **Language** — Vanilla JavaScript, HTML, CSS
- **Storage** — `chrome.storage.local` for per-page anchor persistence
- **APIs** — `window.getSelection()`, `Range`, `chrome.tabs`, `chrome.runtime`

---

## 📁 Project Structure

```
TextAnchor/
├── manifest.json      # Extension config — permissions, scripts, icons
├── background.js      # Service worker for extension lifecycle
├── content.js         # Core logic — anchor creation, restore, highlight
├── popup.html         # Popup UI layout
├── popup.js           # Popup behavior & messaging with content script
├── styles.css         # Popup styling (dark mode support)
└── icons/
    ├── icon16.png     # Toolbar icon (16×16)
    ├── icon32.png     # Toolbar icon (32×32)
    ├── icon48.png     # Extension page icon (48×48)
    ├── icon128.png    # Chrome Web Store icon (128×128)
    └── icon_updated.jpg # Active extension icon
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** this repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

### Ideas for Contribution

- [ ] Sync anchors across devices using `chrome.storage.sync`
- [ ] Add keyboard shortcut to mark position (e.g., `Ctrl+Shift+M`)
- [ ] Support for multiple anchors per page
- [ ] Export/import reading history
- [ ] Chrome Web Store listing

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for avid readers who hate losing their place.**

⭐ Star this repo if you find it useful!

</div>
