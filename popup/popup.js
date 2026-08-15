
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
function loadSettings() {
  chrome.storage.sync.get(settings, (result) => {
    Object.assign(settings, result);

    extensionToggle.checked = settings.extensionEnabled;

    updatePopupState(settings.extensionEnabled);
    loadFeatureToggleStates();
  });
}

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

