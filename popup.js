document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const saveBtn = document.getElementById("saveBtn");
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

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      setStatus("Saving...");
      sendMessageToActiveTab({ type: "SAVE_POSITION" }, (response) => {
        if (!response || !response.success) {
          setStatus("Failed to save position.");
          return;
        }
        refreshStatus();
      });
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

  refreshStatus();
});
