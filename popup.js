document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const restoreBtn = document.getElementById("restoreBtn");
  const markBtn = document.getElementById("markBtn");
  const markStatusEl = document.getElementById("markStatus");

  function setStatus(text) {
    if (statusEl) {
      statusEl.textContent = text;
    }
  }

  function setMarkStatus(text) {
    if (markStatusEl) {
      markStatusEl.textContent = text;
    }
  }

  function withActiveTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        setStatus("Error: " + chrome.runtime.lastError.message);
        return;
      }

      if (!tabs || !tabs.length) {
        setStatus("No active tab.");
        return;
      }

      callback(tabs[0]);
    });
  }

  function sendMessageToActiveTab(message, callback) {
    withActiveTab((tab) => {
      if (!tab.id) {
        setStatus("No active tab.");
        return;
      }

      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          setStatus("ReadMark not available on this page.");
          if (callback) {
            callback(null);
          }
          return;
        }

        if (callback) {
          callback(response || null);
        }
      });
    });
  }

  function formatPercentage(percentage) {
    if (typeof percentage !== "number" || isNaN(percentage)) {
      return "N/A";
    }
    return percentage.toFixed(1) + "%";
  }

  function refreshStatus() {
    sendMessageToActiveTab({ type: "GET_STATUS" }, (response) => {
      if (!response || !response.success) {
        setStatus("No saved position.");
        return;
      }

      const data = response.data;
      if (!data) {
        setStatus("No saved position.");
        setMarkStatus("No mark set.");
        return;
      }

      const percentText = formatPercentage(data.percentage);
      let statusText = `Saved progress: ${percentText}`;

      if (data.timestamp) {
        const date = new Date(data.timestamp);
        statusText += " at " + date.toLocaleString();
      }

      setStatus(statusText);

      if (data.marker && typeof data.marker.percentage === "number") {
        const markPercent = formatPercentage(data.marker.percentage);
        let markText = `Marked at: ${markPercent}`;
        if (data.marker.timestamp) {
          const mDate = new Date(data.marker.timestamp);
          markText += " on " + mDate.toLocaleString();
        }
        setMarkStatus(markText);
      } else {
        setMarkStatus("No mark set.");
      }
    });
  }


  if (restoreBtn) {
    restoreBtn.addEventListener("click", () => {
      setStatus("Restoring...");
      sendMessageToActiveTab({ type: "RESTORE_POSITION" }, (response) => {
        if (!response) {
          setStatus("Failed to restore.");
          return;
        }
        if (response.restored) {
          setStatus("Position restored.");
        } else {
          setStatus("No saved position to restore.");
        }
      });
    });
  }

  if (markBtn) {
    markBtn.addEventListener("click", () => {
      setStatus("Marking...");
      sendMessageToActiveTab({ type: "MARK_POSITION" }, (response) => {
        if (!response || !response.success) {
          setStatus("Failed to mark position.");
          return;
        }
        setStatus("Marked current position.");
        refreshStatus();
      });
    });
  }

  function loadSavedArticles() {
    chrome.storage.local.get(null, function (items) {
      var savedList = document.getElementById("savedList");
      if (!savedList) {
        return;
      }

      var entries = [];
      for (var key in items) {
        if (items.hasOwnProperty(key)) {
          var item = items[key];
          if (item && typeof item === "object" && item.url) {
            entries.push(item);
          }
        }
      }

      entries.sort(function (a, b) {
        return (b.timestamp || 0) - (a.timestamp || 0);
      });

      if (entries.length === 0) {
        savedList.innerHTML = '<p class="saved-empty">No saved articles yet.</p>';
        return;
      }

      savedList.innerHTML = "";

      entries.forEach(function (entry) {
        var item = document.createElement("a");
        item.className = "saved-item";
        item.href = entry.url;
        item.title = entry.title || entry.url;
        item.addEventListener("click", function (e) {
          e.preventDefault();
          chrome.tabs.create({ url: entry.url });
        });

        var favicon = document.createElement("img");
        favicon.className = "saved-favicon";
        favicon.width = 16;
        favicon.height = 16;
        favicon.alt = "";
        favicon.src = entry.favicon || "";
        favicon.onerror = function () {
          this.style.display = "none";
        };

        var textWrap = document.createElement("div");
        textWrap.className = "saved-text";

        var titleEl = document.createElement("span");
        titleEl.className = "saved-item-title";
        titleEl.textContent = entry.title || entry.url;

        var progressEl = document.createElement("span");
        progressEl.className = "saved-item-progress";
        if (typeof entry.percentage === "number") {
          progressEl.textContent = entry.percentage.toFixed(0) + "%";
        }

        textWrap.appendChild(titleEl);
        textWrap.appendChild(progressEl);
        item.appendChild(favicon);
        item.appendChild(textWrap);
        savedList.appendChild(item);
      });
    });
  }

  refreshStatus();
  loadSavedArticles();
});
