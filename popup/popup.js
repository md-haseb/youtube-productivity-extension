
const settings = {
    'extensionEnabled': true,
    'hideHomeFeed': false,
    'hideShorts': false,
    'hideComments': false,
    'hideLiveChat': false,
    'hideRecommendations': false,
    'hidePlaylist': false,
    'hideEndScreens': false,
    'hideMix': false,
    'hideNotificationsBtn': false,
    'hideExplore': false,
    'hidePlayables': false,
    'hideMoreFromYouTube': false,
    'hideSubscriptions': false,
    'hideSearchSuggestions': false,
    'disableInfiniteScrolling': false
  }



const toggles = document.querySelectorAll('.feature-toggle');
const extensionToggle = document.querySelector('.extension-toggle-input');
const popupMain = document.querySelector(".popup-main");



//initialization
loadSettings();



toggles.forEach(toggle => {
 toggle.addEventListener('change', handleToggleChange);
});

extensionToggle.addEventListener('change', handleExtensionToggle);




//settings
async function loadSettings() {
    const result = await chrome.storage.sync.get(settings);

    Object.assign(settings, result);

    extensionToggle.checked = settings.extensionEnabled;

    updatePopupState(settings.extensionEnabled);
    loadFeatureToggleStates();
    await restoreFocusSession();
}
// async function loadSettings() {
//   chrome.storage.sync.get(settings, async (result) => {
//     Object.assign(settings, result);

//     extensionToggle.checked = settings.extensionEnabled;

//     updatePopupState(settings.extensionEnabled);
//     loadFeatureToggleStates();
//     await restoreFocusSession();
//   });
// }

function loadFeatureToggleStates() {
  toggles.forEach((toggle) => {
    const setting = toggle.dataset.setting;

    toggle.checked = settings[setting];
  });
}




//feature toggle
function handleToggleChange(event) {
  const setting = event.target.dataset.setting;
  const enabled = event.target.checked;

  settings[setting] = enabled;

  setChromeStorage(setting, enabled);
  sendMessage(setting, enabled);
}




//extension toggle
function handleExtensionToggle(event) {
  const enabled = event.target.checked;

  settings.extensionEnabled = enabled;

  setChromeStorage("extensionEnabled", enabled);
  updatePopupState(enabled);

  if (enabled) {
    sendMessage("APPLY_ALL_FEATURES", true);
  } else {
    sendMessage("RESTORE_ALL_FEATURES", false);
  }
}




//update popup state
function updatePopupState(enabled) {
  popupMain.classList.toggle("is-disabled", !enabled);
}





//storage
function setChromeStorage(setting, enabled) {
  chrome.storage.sync.set({
    [setting]: enabled
  }
);
}




/**
 * Sends the updated setting to all open YouTube tabs so their content
 * scripts can apply the change.
 *
 * @param {string} type - The setting/message type.
 * @param {boolean} enabled - Whether the setting is enabled.
 */

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





// Support view navigation

const mainView = document.querySelector(".popup-main-view");
const supportView = document.querySelector(".support-view");

const supportBtn = document.querySelector(".support-button-container");
const supportBackBtn = document.querySelector(".support-back-btn");

supportBtn.addEventListener("click", () => {
  mainView.hidden = true;
  supportView.hidden = false;
});

supportBackBtn.addEventListener("click", () => {
  supportView.hidden = true;
  mainView.hidden = false;
});








// =========================================================
// Page navigation
// =========================================================

const navItems = document.querySelectorAll(".nav-item");
const pageSlider = document.querySelector(".page-slider");

const pagePositions = {
  home: "translateX(0)",
  allowlist: "translateX(-33.333333%)",
  schedule: "translateX(-66.666667%)"
};

navItems.forEach((item) => {

  item.addEventListener("click", () => {

    const page = item.dataset.page;

    // Update active navigation item
    navItems.forEach((nav) => {
      nav.classList.remove("active");
    });

    item.classList.add("active");

    // Move page slider
    if (pagePositions[page]) {
      pageSlider.style.transform = pagePositions[page];
    }

  });

});



// =========================================================
// Focus session duration selection
// =========================================================

// const durationOptions = document.querySelectorAll(
//   ".focus-duration-option"
// );

// const firstDurationOption = document.querySelector(
//     ".focus-duration-option"
// );

// let selectedFocusDuration = 1;

// let selectedFocusDurationElm = firstDurationOption;

// let breakUntil = null;

// let countdownInterval = null;

// durationOptions.forEach((option) => {

//   option.addEventListener("click", () => {

//     if(!breakUntil) {
//         // Remove selection from all options
//         durationOptions.forEach((item) => {
//             item.classList.remove("selected");
//         });

//         // Select clicked option
//         option.classList.add("selected");
//         selectedFocusDurationElm = option;

//         // Store selected duration
//         selectedFocusDuration = Number(
//         option.dataset.duration
//         );
//     } 

//   });

// });



// const startFocusButton = document.querySelector(
//   ".start-focus-btn"
// );

// const startFocusBtnText = document.querySelector(
//     ".start-focus-btn-text"
// );

// const countdownElement = document.querySelector(
//     ".schedule-countdown"
// );

// startFocusButton.addEventListener("click", async () => {
//     if (breakUntil && Date.now() < breakUntil) {
//         // Stop current focus session
//         await stopFocusSession(true);
//     } else {
//         // Start a new focus session
//         await startFocusSession();
//     }
// });


// async function startFocusSession() {
//     breakUntil = Date.now() + selectedFocusDuration * 60 * 1000;

//     countdownElement.style.display = "block";

//     clearInterval(countdownInterval);
//     countdownInterval = setInterval(updateCountdown, 1000);
//     updateCountdown();

//     await chrome.storage.sync.set({
//         breakUntil,
//         selectedFocusDuration,
//         previousSettings: { ...settings }
//     });

//     Object.keys(settings).forEach((key) => {
//         if (key !== "extensionEnabled") {
//             settings[key] = false;
//         }
//     });

//     await chrome.storage.sync.set({ settings });

//     sendMessage("RESTORE_ALL_FEATURES", false);

//     startFocusBtnText.textContent = "Stop Focus Session";

//     durationOptions.forEach((option) => {

//             if(!option.classList.contains('selected')) {
//                 option.classList.add('is-disabled');
//             }
//     });

//     const remaining = breakUntil - Date.now();

//     setTimeout(() => {
//         stopFocusSession();
//     }, remaining);
// }


// async function stopFocusSession(manual = false) {
//     const result = await chrome.storage.sync.get([
//         "breakUntil",
//         "previousSettings"
//     ]);

//     if (!manual && (!result.breakUntil || Date.now() < result.breakUntil)) {
//         return;
//     }

//     Object.assign(settings, result.previousSettings);

//     breakUntil = null;

//     await chrome.storage.sync.set({
//         breakUntil: null,
//         settings
//     });

//     sendMessage("APPLY_ALL_FEATURES", settings);

//     startFocusBtnText.textContent = "Start Focus Session";

//     clearInterval(countdownInterval);
//     countdownInterval = null;
//     countdownElement.style.display = "none";

//     durationOptions.forEach((option) => {

//             if(!option.classList.contains('selected')) {
//                 option.classList.remove('is-disabled');
//             }
//     });
// }

// function updateCountdown() {
//     const remaining = breakUntil - Date.now();

//     if (remaining <= 0) {
//         countdownElement.textContent = "00:00";
//         clearInterval(countdownInterval);
//         return;
//     }

//     const totalSeconds = Math.ceil(remaining / 1000);

//     const minutes = Math.floor(totalSeconds / 60);
//     const seconds = totalSeconds % 60;

//     countdownElement.textContent =
//         `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
// }

// async function restoreFocusSession() {
//     const result = await chrome.storage.sync.get([
//         "breakUntil",
//         "selectedFocusDuration"
//     ]);

//     breakUntil = result.breakUntil;
//     selectedFocusDuration = result.selectedFocusDuration;


//     if (!breakUntil) {
//         return;
//     }

//     const selectedOption = document.querySelector(
//         `.focus-duration-option[data-duration="${selectedFocusDuration}"]`
//     );

//     durationOptions.forEach((option) => {
//         option.classList.remove("selected");
//         option.classList.add("is-disabled");
//     });

//     if (selectedOption) {
//         selectedOption.classList.add("selected");
//         selectedOption.classList.remove("is-disabled");

//         selectedFocusDurationElm = selectedOption;
//     }

//     const remaining = breakUntil - Date.now();

//     if (remaining <= 0) {
//         await stopFocusSession();
//         return;
//     }

//     // Session is still running
//     countdownElement.style.display = "block";

//     durationOptions.forEach((option) => {

//         if(!option.classList.contains('selected')) {
//             option.classList.add('is-disabled');
//         }
//     });

//     startFocusBtnText.textContent = "Stop Focus Session";

//     clearInterval(countdownInterval);
//     countdownInterval = setInterval(updateCountdown, 1000);

//     updateCountdown();
// }




const durationOptions = document.querySelectorAll(
    ".focus-duration-option"
);

const startFocusButton = document.querySelector(
    ".start-focus-btn"
);

const startFocusBtnText = document.querySelector(
    ".start-focus-btn-text"
);

const countdownElement = document.querySelector(
    ".schedule-countdown"
);

let selectedFocusDuration = 1;
let breakUntil = null;
let countdownInterval = null;


// ============================================================
// DURATION SELECTION
// ============================================================

durationOptions.forEach((option) => {
    option.addEventListener("click", () => {
        if (breakUntil) {
            return;
        }

        durationOptions.forEach((item) => {
            item.classList.remove("selected");
        });

        option.classList.add("selected");

        selectedFocusDuration = Number(
            option.dataset.duration
        );
    });
});


// ============================================================
// FOCUS SESSION
// ============================================================

startFocusButton.addEventListener("click", async () => {
    if (breakUntil && Date.now() < breakUntil) {
        await stopFocusSession(true);
    } else {
        await startFocusSession();
    }
});

async function startFocusSession() {
    breakUntil =
        Date.now() + selectedFocusDuration * 60 * 1000;

    await chrome.storage.sync.set({
        breakUntil,
        selectedFocusDuration,
        previousSettings: { ...settings }
    });

    Object.keys(settings).forEach((key) => {
        if (key !== "extensionEnabled") {
            settings[key] = false;
        }
    });

    await chrome.storage.sync.set({ settings });

    sendMessage("RESTORE_ALL_FEATURES", false);

    countdownElement.style.display = "block";

    startFocusBtnText.textContent = "Stop Focus Session";

    setDurationOptionsDisabled(true);

    clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdown, 1000);

    updateCountdown();

    const remaining = breakUntil - Date.now();

    setTimeout(() => {
        stopFocusSession();
    }, remaining);
}

async function stopFocusSession(manual = false) {
    const result = await chrome.storage.sync.get([
        "breakUntil",
        "previousSettings"
    ]);

    if (
        !manual &&
        (!result.breakUntil || Date.now() < result.breakUntil)
    ) {
        return;
    }

    Object.assign(settings, result.previousSettings);

    breakUntil = null;

    await chrome.storage.sync.set({
        breakUntil: null,
        settings
    });

    sendMessage("APPLY_ALL_FEATURES", settings);

    startFocusBtnText.textContent = "Start Focus Session";

    clearInterval(countdownInterval);
    countdownInterval = null;

    countdownElement.style.display = "none";

    setDurationOptionsDisabled(false);
}


// ============================================================
// COUNTDOWN
// ============================================================

function updateCountdown() {
    const remaining = breakUntil - Date.now();

    if (remaining <= 0) {
        countdownElement.textContent = "00:00";
        clearInterval(countdownInterval);
        countdownInterval = null;
        return;
    }

    const totalSeconds = Math.ceil(remaining / 1000);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    countdownElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


// ============================================================
// SESSION RESTORATION
// ============================================================

async function restoreFocusSession() {
    const result = await chrome.storage.sync.get([
        "breakUntil",
        "selectedFocusDuration"
    ]);

    breakUntil = result.breakUntil;

    if (!breakUntil) {
        return;
    }

    selectedFocusDuration = result.selectedFocusDuration;

    const remaining = breakUntil - Date.now();

    if (remaining <= 0) {
        await stopFocusSession();
        return;
    }

    const selectedOption = document.querySelector(
        `.focus-duration-option[data-duration="${selectedFocusDuration}"]`
    );

    durationOptions.forEach((option) => {
        option.classList.remove("selected");
    });

    if (selectedOption) {
        selectedOption.classList.add("selected");
    }

    countdownElement.style.display = "block";

    startFocusBtnText.textContent = "Stop Focus Session";

    setDurationOptionsDisabled(true);

    clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdown, 1000);

    updateCountdown();
}


// ============================================================
// UI HELPERS
// ============================================================

function setDurationOptionsDisabled(disabled) {
    durationOptions.forEach((option) => {
        // option.disabled = disabled;
        if(!option.classList.contains('selected')) {
            option.disabled = disabled;
        }

            // durationOptions.forEach((option) => {

            //         if(!option.classList.contains('selected')) {
            //             option.classList.add('is-disabled');
            //         }
            // });
    });
}










// ============================================================
// DOM REFERENCES
// ============================================================

// Automatic detection

const channelName =
    document.querySelector('.channel-label');

const channelDetectionStatus =
    document.querySelector('.channel-detection-status');

const channelIconImage =
    document.querySelector('.channel-icon-img');

const automaticAllowlistActionButton =
    document.querySelector('.automatic-detected-allowlist-btn');

const automaticDetectionHeader =
    document.querySelector('.automatic-detection-header');

const automaticDetectionCard =
    document.querySelector('.automatic-detection-card');

const automaticDetectionBottom =
    document.querySelector('.automatic-detection-bottom');


// Manual detection
const manualForm =
    document.querySelector('.manual-detection-form');

const manualInput =
    document.querySelector('.manual-channel-input');

const manualFindButton =
    document.querySelector('.manual-detection-find-btn');

const manualChannelCard =
    document.querySelector('.manual-detection-card');

const manualChannelName =
    document.querySelector('.manual-channel-label');

const manualChannelDetectionStatus =
    document.querySelector('.manual-channel-detection-status');

const manualChannelIconImage =
    document.querySelector('.manual-channel-icon-img');

const manualAllowlistActionButton =
    document.querySelector('.manual-detected-allowlist-btn');

const manualSectionBottom =
    document.querySelector('.manual-section-bottom');


// Allowlist
const allowlistedChannelList =
    document.querySelector('.allowlisted-channel-list');

const allowlistedChannelCount =
    document.querySelector('.channel-count');


// ============================================================
// STATE
// ============================================================

let currentAutomaticChannelInfo = null;
let currentManualChannelInfo = null;

let isManualDetectionActive = false;
let automaticDetectionPaused = false;


// ============================================================
// INITIALIZATION
// ============================================================

// Restore the latest automatic detection result
chrome.storage.session.get("currentChannelInfo", (result) => {
    currentAutomaticChannelInfo = result.currentChannelInfo;

    if (!currentAutomaticChannelInfo) {
        return;
    }

    console.log(currentAutomaticChannelInfo);

    channelName.textContent =
        currentAutomaticChannelInfo.channelName;

    channelDetectionStatus.textContent =
        currentAutomaticChannelInfo.channelDetectionStatus;

    channelIconImage.src =
        currentAutomaticChannelInfo.channelIcon;

    updateAllowlistButton(
        currentAutomaticChannelInfo,
        automaticAllowlistActionButton
    );
});


// Render allowlisted channels
chrome.storage.sync.get(
    "allowlistedChannels",
    ({ allowlistedChannels = [] }) => {

        allowlistedChannels.forEach(channel => {
            const channelItem = createAllowlistedChannelItem(
                channel.channelId,
                channel.channelName,
                channel.channelIcon
            );

            allowlistedChannelList.appendChild(channelItem);
        });

        allowlistedChannelCount.textContent =
            allowlistedChannels.length;
    }
);


// ============================================================
// CHANNEL INFO MESSAGE
// ============================================================

chrome.runtime.onMessage.addListener((message) => {
    console.log('hello1');
    if (message.type !== "CHANNEL_INFO") {
        console.log('hello2');
        return;
    }

    const channelInfo = message.channelInfo;

    console.log("CHANNEL_INFO received:", channelInfo);
    console.log(
        "Manual detection:",
        isManualDetectionActive
    );

    // Manual detection result
    if (isManualDetectionActive) {
        currentManualChannelInfo = channelInfo;

        manualInput.value = '';
        manualSectionBottom.textContent = '';
        manualSectionBottom.style.color = '#92929b';

        manualFindButton.textContent = 'Find';

        manualChannelCard.style.display = 'flex';

        manualChannelName.textContent =
            channelInfo.channelName;

        manualChannelDetectionStatus.textContent =
            channelInfo.channelDetectionStatus;

        manualChannelIconImage.src =
            channelInfo.channelIcon;

        updateAllowlistButton(
            channelInfo,
            manualAllowlistActionButton
        );

        isManualDetectionActive = false;

        return;
    }

    // Automatic detection result
    currentAutomaticChannelInfo = channelInfo;

    channelName.textContent =
        channelInfo.channelName;

    channelDetectionStatus.textContent =
        channelInfo.channelDetectionStatus;

    channelIconImage.src =
        channelInfo.channelIcon;

    updateAllowlistButton(
        channelInfo,
        automaticAllowlistActionButton
    );
});


// ============================================================
// ALLOWLIST BUTTON HANDLERS
// ============================================================

automaticAllowlistActionButton.addEventListener('click', () => {
    addCurrentChannelToAllowlist(
        currentAutomaticChannelInfo,
        automaticAllowlistActionButton,
        automaticDetectionBottom
    );
});


manualAllowlistActionButton.addEventListener('click', () => {
    addCurrentChannelToAllowlist(
        currentManualChannelInfo,
        manualAllowlistActionButton,
        manualSectionBottom
    );
});





// ============================================================
// MANUAL DETECTION
// ============================================================

manualForm.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault();

        const manualInputUrl =
            manualInput.value.trim();

        const urlType =
            getYouTubeUrlType(manualInputUrl);

        // Invalid URL
        if (
            urlType !== "watch" &&
            urlType !== "channel"
        ) {
            console.log("Invalid YouTube URL");
            return;
        }


        // Start manual detection
        manualSectionBottom.textContent =
            'Finding Channel...';

        manualSectionBottom.style.color =
            '#92929b';

        manualFindButton.textContent =
            'Finding';

        manualChannelCard.style.display =
            'none';


        isManualDetectionActive =
            true;

        automaticDetectionPaused =
            true;


        // Reset automatic detection UI
        resetAutomaticDetectionUI();

        setAutomaticDetectionPaused(true);


        // Navigate active tab
        const [tab] =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

        await chrome.tabs.update(
            tab.id,
            {
                url: manualInputUrl
            }
        );
    }
);


function getYouTubeUrlType(input) {
    try {
        const url =
            new URL(input.trim());


        // Must be YouTube
        if (
            url.protocol !== "https:" ||
            ![
                "www.youtube.com",
                "youtube.com"
            ].includes(url.hostname)
        ) {
            return null;
        }


        // Watch page
        const videoId =
            url.searchParams.get("v");

        if (
            url.pathname === "/watch" &&
            videoId &&
            /^[A-Za-z0-9_-]{11}$/.test(videoId)
        ) {
            return "watch";
        }


        // Handle-based channel page
        const match =
            url.pathname.match(
                /^\/@([\w.-]+)(?:\/[\w.-]+)?$/
            );

        if (match) {
            return "channel";
        }


        return null;

    } catch {
        return null;
    }
}


// ============================================================
// AUTOMATIC DETECTION UI
// ============================================================

function setAutomaticDetectionPaused(paused) {
    automaticDetectionHeader.classList.toggle(
        'is-disabled',
        paused
    );

    automaticDetectionCard.classList.toggle(
        'is-disabled',
        paused
    );

    automaticDetectionBottom.style.color =
        "#92929b";


    if (paused) {
        automaticDetectionBottom.textContent =
            'Automatic detection paused';
    } else {
        automaticDetectionBottom.textContent =
            'Automatic detection works on YouTube watch pages and channel pages.';
    }
}


function resetAutomaticDetectionUI() {
    channelName.textContent =
        "—";

    channelDetectionStatus.textContent =
        "No channel detected";

    channelIconImage.src =
        chrome.runtime.getURL(
            "assets/icons/allowlist/default-channel-icon.svg"
        );

    automaticAllowlistActionButton.disabled =
        true;

    automaticAllowlistActionButton.textContent =
        "Add";
}