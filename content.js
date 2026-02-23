(function () {
  const DEBOUNCE_DELAY = 1000;
  let scrollTimeoutId = null;

  function getCleanUrl() {
    return window.location.origin + window.location.pathname;
  }

  function calculateProgress(scrollY) {
    const doc = document.documentElement || document.body;
    const maxScroll = doc.scrollHeight - window.innerHeight;

    if (maxScroll <= 0) {
      return 100;
    }

    const percentage = (scrollY / maxScroll) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  function getSavedData() {
    return new Promise((resolve) => {
      const cleanURL = getCleanUrl();
      chrome.storage.local.get(cleanURL, (result) => {
        resolve(result[cleanURL] || null);
      });
    });
  }

  function savePosition() {
    return new Promise((resolve) => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const percentage = calculateProgress(scrollY);
      const cleanURL = getCleanUrl();

      const baseData = {
        scrollY,
        percentage,
        timestamp: Date.now()
      };

      chrome.storage.local.get(cleanURL, (result) => {
        const existing = result[cleanURL] || {};
        const data = Object.assign({}, existing, baseData);

        chrome.storage.local.set({ [cleanURL]: data }, () => {
          resolve(data);
        });
      });
    });
  }

  function restorePosition(options = {}) {
    const { smooth = true } = options;

    return new Promise((resolve) => {
      const cleanURL = getCleanUrl();

      chrome.storage.local.get(cleanURL, (result) => {
        const data = result[cleanURL];

        if (!data || typeof data.scrollY !== "number") {
          resolve({ restored: false, data: null });
          return;
        }

        window.scrollTo({
          top: data.scrollY,
          left: 0,
          behavior: smooth ? "smooth" : "auto"
        });

        resolve({ restored: true, data });
      });
    });
  }

  function getPathFromNode(node) {
    const path = [];
    let current = node;
    const root = document.body || document.documentElement;

    while (current && current !== root) {
      const parent = current.parentNode;
      if (!parent) {
        break;
      }
      const index = Array.prototype.indexOf.call(parent.childNodes, current);
      if (index === -1) {
        break;
      }
      path.unshift(index);
      current = parent;
    }

    return path;
  }

  function getNodeFromPath(path) {
    if (!Array.isArray(path)) {
      return null;
    }

    let current = document.body || document.documentElement;
    if (!current) {
      return null;
    }

    for (let i = 0; i < path.length; i += 1) {
      const index = path[i];
      if (!current.childNodes || index < 0 || index >= current.childNodes.length) {
        return null;
      }
      current = current.childNodes[index];
    }

    return current || null;
  }

  function getMarkerFromSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return null;
    }

    const range = sel.getRangeAt(0);
    const startNode = range.startContainer;
    let startOffset = range.startOffset;

    if (!startNode) {
      return null;
    }

    const path = getPathFromNode(startNode);
    if (!path.length) {
      return null;
    }

    let textLength = 0;
    if (startNode.nodeType === Node.TEXT_NODE) {
      textLength = (startNode.textContent || "").length;
    }

    if (textLength > 0) {
      if (startOffset >= textLength) {
        startOffset = textLength - 1;
      }
      if (startOffset < 0) {
        startOffset = 0;
      }
    } else if (startOffset < 0) {
      startOffset = 0;
    }

    const rect = range.getBoundingClientRect();
    const absoluteY = rect ? rect.top + (window.scrollY || window.pageYOffset || 0) : window.scrollY || 0;
    const percentage = calculateProgress(absoluteY);

    return {
      path,
      offset: startOffset,
      percentage,
      timestamp: Date.now()
    };
  }

  function highlightRangeTemporarily(range) {
    if (!range) {
      return;
    }

    const highlight = document.createElement("span");
    highlight.style.backgroundColor = "yellow";
    highlight.style.padding = "0";
    highlight.style.margin = "0";
    highlight.style.borderRadius = "2px";
    highlight.style.transition = "background-color 0.5s ease";

    let applied = false;
    try {
      range.surroundContents(highlight);
      applied = true;
    } catch (e) {
      applied = false;
    }

    if (!applied) {
      return;
    }

    setTimeout(() => {
      highlight.style.backgroundColor = "transparent";
      setTimeout(() => {
        const parent = highlight.parentNode;
        if (!parent) {
          return;
        }
        while (highlight.firstChild) {
          parent.insertBefore(highlight.firstChild, highlight);
        }
        parent.removeChild(highlight);
      }, 500);
    }, 3000);
  }

  function restoreMarker(marker) {
    if (!marker || !Array.isArray(marker.path)) {
      return false;
    }

    const node = getNodeFromPath(marker.path);
    if (!node) {
      return false;
    }

    const range = document.createRange();
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const length = text.length;
      if (length === 0) {
        return false;
      }
      let start = typeof marker.offset === "number" ? marker.offset : 0;
      if (start < 0) {
        start = 0;
      }
      if (start >= length) {
        start = length - 1;
      }
      const end = Math.min(start + 1, length);
      try {
        range.setStart(node, start);
        range.setEnd(node, end);
      } catch (e) {
        return false;
      }
    } else {
      try {
        range.selectNode(node);
      } catch (e) {
        return false;
      }
    }

    const rect = range.getBoundingClientRect();
    if (!rect) {
      return false;
    }

    const absoluteY = rect.top + (window.scrollY || window.pageYOffset || 0);
    const targetY = absoluteY - window.innerHeight * 0.3;

    window.scrollTo({
      top: targetY < 0 ? 0 : targetY,
      left: 0,
      behavior: "smooth"
    });

    highlightRangeTemporarily(range);
    return true;
  }

  function saveMarkerPosition() {
    return new Promise((resolve, reject) => {
      const markerInfo = getMarkerFromSelection();
      if (!markerInfo) {
        reject(new Error("NO_SELECTION"));
        return;
      }

      const cleanURL = getCleanUrl();

      chrome.storage.local.get(cleanURL, (result) => {
        const existing = result[cleanURL] || {};
        const data = Object.assign({}, existing, { marker: markerInfo });

        chrome.storage.local.set({ [cleanURL]: data }, () => {
          resolve(data);
        });
      });
    });
  }

  function handleScroll() {
    if (scrollTimeoutId !== null) {
      clearTimeout(scrollTimeoutId);
    }

    scrollTimeoutId = setTimeout(() => {
      savePosition();
      scrollTimeoutId = null;
    }, DEBOUNCE_DELAY);
  }

  function autoRestoreOnLoad() {
    setTimeout(() => {
      getSavedData().then((data) => {
        if (data && data.marker) {
          const ok = restoreMarker(data.marker);
          if (!ok) {
            restorePosition({ smooth: false });
          }
        } else {
          restorePosition({ smooth: false });
        }
      });
    }, 500);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) {
      return;
    }

    if (message.type === "SAVE_POSITION") {
      savePosition()
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error && error.message });
        });
      return true;
    }

    if (message.type === "RESTORE_POSITION") {
      restorePosition({ smooth: true })
        .then((result) => {
          sendResponse({ success: true, ...result });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error && error.message });
        });
      return true;
    }

    if (message.type === "MARK_POSITION") {
      saveMarkerPosition()
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error && error.message });
        });
      return true;
    }

    if (message.type === "GET_STATUS") {
      getSavedData()
        .then((data) => {
          if (!data) {
            sendResponse({ success: true, data: null });
          } else {
            sendResponse({ success: true, data });
          }
        })
        .catch((error) => {
          sendResponse({ success: false, error: error && error.message });
        });
      return true;
    }
  });

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("load", autoRestoreOnLoad);
})();
