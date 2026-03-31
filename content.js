(function () {
  const DEBOUNCE_DELAY = 1000;
  let scrollTimeoutId = null;

  // Cache the last known caret/selection so it survives popup focus steal
  var cachedSelection = null;

  function cacheCurrentSelection() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    var range = sel.getRangeAt(0);
    var node = range.startContainer;
    if (!node) return;
    // Only cache if the caret is in a text node on the page
    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
      cachedSelection = {
        node: node,
        offset: range.startOffset
      };
    }
  }

  document.addEventListener("mouseup", function () {
    setTimeout(cacheCurrentSelection, 0);
  }, true);
  document.addEventListener("keyup", function () {
    setTimeout(cacheCurrentSelection, 0);
  }, true);

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
        timestamp: Date.now(),
        title: document.title || cleanURL,
        url: window.location.href,
        favicon: (document.querySelector('link[rel*="icon"]') || {}).href || (window.location.origin + '/favicon.ico')
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
    var sel = window.getSelection();
    var startNode = null;
    var startOffset = 0;

    // Try live selection first
    if (sel && sel.rangeCount > 0) {
      var range = sel.getRangeAt(0);
      startNode = range.startContainer;
      startOffset = range.startOffset;
    }

    // Fallback to cached selection if live selection is empty/invalid
    if (!startNode && cachedSelection && cachedSelection.node) {
      // Verify the cached node is still in the document
      if (document.contains(cachedSelection.node)) {
        startNode = cachedSelection.node;
        startOffset = cachedSelection.offset;
      }
    }

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

    var absoluteY = 0;
    try {
      var tempRange = document.createRange();
      tempRange.setStart(startNode, startOffset);
      tempRange.setEnd(startNode, startOffset);
      var rect = tempRange.getBoundingClientRect();
      absoluteY = rect ? rect.top + (window.scrollY || window.pageYOffset || 0) : window.scrollY || 0;
    } catch (e) {
      absoluteY = window.scrollY || 0;
    }
    var percentage = calculateProgress(absoluteY);

    return {
      path,
      offset: startOffset,
      percentage,
      timestamp: Date.now()
    };
  }

  function applyHighlight(node, offset) {
    try {
      if (!node || node.nodeType !== Node.TEXT_NODE) return;

      var textLength = (node.textContent || "").length;
      if (textLength === 0) return;

      if (offset < 0) offset = 0;
      if (offset >= textLength) offset = textLength - 1;

      // Ensure the highlight spans the whole word, not just 1 invisible character/space
      var text = node.textContent;
      var start = offset;
      var end = offset;
      
      while (start > 0 && /\S/.test(text[start - 1])) start--;
      while (end < textLength && /\S/.test(text[end])) end++;
      
      // If purely whitespace, expand artificially so it is visible
      if (start === end) {
        start = Math.max(0, offset);
        end = Math.min(textLength, offset + 4);
      }

      if (!document.getElementById("text-anchor-highlight-style")) {
        var styleEl = document.createElement("style");
        styleEl.id = "text-anchor-highlight-style";
        styleEl.textContent =
          ".text-anchor-highlight { background-color: rgba(255, 230, 0, 0.55) !important; color: black !important; border-radius: 3px !important; padding: 1px 2px !important; font-weight: bold !important; display: inline-block !important; box-shadow: 0 0 8px 2px rgba(255, 230, 0, 0.35) !important; transition: background-color 0.8s ease, box-shadow 0.8s ease, opacity 0.8s ease !important; }" +
          ".text-anchor-highlight-fade { background-color: transparent !important; box-shadow: none !important; opacity: 0 !important; }";
        document.head.appendChild(styleEl);
      }

      var range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);

      var span = document.createElement("span");
      span.className = "text-anchor-highlight";
      // Inline styles as a fallback against strict Content Security Policies blocking injected <style> tags
      span.style.cssText = "background-color: rgba(255, 230, 0, 0.55) !important; color: black !important; border-radius: 3px !important; padding: 1px 2px !important; font-weight: bold !important; box-shadow: 0 0 8px 2px rgba(255, 230, 0, 0.35) !important; transition: background-color 0.8s ease, box-shadow 0.8s ease, opacity 0.8s ease !important;";
      
      range.surroundContents(span);

      // After 3s visible, trigger a smooth 0.8s fade-out, then clean up the DOM
      setTimeout(function () {
        if (span && span.parentNode) {
          span.classList.add("text-anchor-highlight-fade");
          span.style.backgroundColor = "transparent";
          span.style.boxShadow = "none";
          span.style.opacity = "0";

          setTimeout(function () {
            if (span && span.parentNode) {
              var parent = span.parentNode;
              span.replaceWith(document.createTextNode(span.textContent));
              // normalization is extremely important to merge text nodes, otherwise future DOM paths break
              parent.normalize();
            }
          }, 850);
        }
      }, 3000);
    } catch (e) {
      // Exit silently
    }
  }

  function restoreMarker(marker) {
    if (!marker || !Array.isArray(marker.path)) {
      return false;
    }

    var node = getNodeFromPath(marker.path);
    if (!node) {
      return false;
    }

    var offset = typeof marker.offset === "number" ? marker.offset : 0;

    var scrollTarget = 0;
    if (node.nodeType === Node.TEXT_NODE) {
      var tempRange = document.createRange();
      try {
        var safeOffset = Math.min(offset, (node.textContent || "").length);
        tempRange.setStart(node, safeOffset);
        tempRange.setEnd(node, safeOffset);
        var rect = tempRange.getBoundingClientRect();
        scrollTarget = rect.top + (window.scrollY || window.pageYOffset || 0) - window.innerHeight * 0.3;
      } catch (e) {
        scrollTarget = 0;
      }
    } else {
      var nodeRect = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
      if (nodeRect) {
        scrollTarget = nodeRect.top + (window.scrollY || window.pageYOffset || 0) - window.innerHeight * 0.3;
      }
    }

    if (scrollTarget < 0) scrollTarget = 0;

    window.scrollTo({
      top: scrollTarget,
      left: 0,
      behavior: "smooth"
    });

    var savedPath = marker.path.slice();
    var savedOffset = offset;

    setTimeout(function () {
      var freshNode = getNodeFromPath(savedPath);
      if (!freshNode) return;

      if (freshNode.nodeType === Node.TEXT_NODE) {
        applyHighlight(freshNode, savedOffset);
      } else {
        var walker = document.createTreeWalker(freshNode, NodeFilter.SHOW_TEXT, null, false);
        var firstText = walker.nextNode();
        if (firstText) {
          applyHighlight(firstText, 0);
        }
      }
    }, 600);

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
        const data = Object.assign({}, existing, {
          marker: markerInfo,
          title: document.title || cleanURL,
          url: window.location.href,
          favicon: (document.querySelector('link[rel*="icon"]') || {}).href || (window.location.origin + '/favicon.ico')
        });

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
