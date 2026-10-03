console.log("SERVICE WORKER LOADED");

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "CHANNEL_INFO") {
        chrome.storage.session.set({
            currentChannelInfo: message.channelInfo
        });
    }
});






chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type !== "START_FOCUS_SESSION") {
        return;
    }

    const { breakUntil } = await chrome.storage.sync.get("breakUntil");

    if (!breakUntil) {
        return;
    }

    chrome.alarms.create("focus-session-end", {
        when: breakUntil
    });
});




chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "focus-session-end") {
        return;
    }

    console.log("FOCUS SESSION ALARM FIRED");

    const { previousSettings } =
        await chrome.storage.sync.get("previousSettings");

    console.log("previousSettings:", previousSettings);

    if (!previousSettings) {
        return;
    }

    await chrome.storage.sync.set({
        breakUntil: null,
        settings: previousSettings,
        previousSettings: null
    });

    console.log("Settings restored to storage");

    sendMessage("APPLY_ALL_FEATURES", true);

    chrome.runtime.sendMessage({
        type: "FOCUS_SESSION_ENDED"
    });
});




function sendMessage(type, enabled) {
  chrome.tabs.query(
    {
      url: ["https://www.youtube.com/*"]
    },
    (tabs) => {
      if (tabs.length === 0) return;

      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type,
          enabled
        });
      });
    }
  );
}


// chrome.alarms.onAlarm.addListener(async (alarm) => {
//     if (alarm.name !== "focus-session-end") {
//         return;
//     }

//     // Restore previous settings
//     const { previousSettings } = await chrome.storage.sync.get("previousSettings");
//     Object.assign(settings, previousSettings);
//     breakUntil = null;

//     await chrome.storage.sync.set({
//         breakUntil: null,
//         settings
//     });

//     sendMessage("APPLY_ALL_FEATURES", true);

//     startFocusBtnText.textContent = "Start Focus Session";

//     clearInterval(countdownInterval);
//     countdownInterval = null;

//     countdownElement.style.display = "none";

//     setDurationOptionsDisabled(false);


// });