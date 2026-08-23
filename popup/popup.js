
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





//page navigation

const navItems = document.querySelectorAll(".nav-item");
const pageSlider = document.querySelector(".page-slider");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const page = item.dataset.page;

    navItems.forEach((nav) => {
      nav.classList.remove("active");
    });

    item.classList.add("active");

    if (page === "home") {
      pageSlider.style.transform = "translateX(0)";
    } else if (page === "allowlist") {
      pageSlider.style.transform = "translateX(-50%)";
    }
  });
});




const channelName = document.querySelector('.channel-label');
const channelDetectionStatus = document.querySelector('.channel-detection-status');
const channelIconImage = document.querySelector('.channel-icon-img');
const allowlistActionButton = document.querySelector('.allowlist-action-btn');
const allowlistedChannelList = document.querySelector('.allowlisted-channel-list');
const allowlistedChannelCount = document.querySelector('.channel-count');




let currentChannelInfo = null;

chrome.storage.session.get("currentChannelInfo", (result) => {
    currentChannelInfo = result.currentChannelInfo;

    if (!currentChannelInfo) {
        return;
    }

    console.log(currentChannelInfo);

    channelName.textContent = currentChannelInfo.channelName;
    channelDetectionStatus.textContent =
        currentChannelInfo.channelDetectionStatus;
    channelIconImage.src = currentChannelInfo.channelIcon;

    if (!currentChannelInfo.channelId) {
        allowlistActionButton.setAttribute("disabled", "");
        return;
    }

    chrome.storage.sync.get(
        "allowlistedChannels",
        ({ allowlistedChannels = [] }) => {

            const alreadyAllowlisted = allowlistedChannels.some(
                channel => channel.channelId === currentChannelInfo.channelId
            );

            if (alreadyAllowlisted) {
                allowlistActionButton.setAttribute("disabled", "");
                allowlistActionButton.textContent = "Added";
            } else {
                allowlistActionButton.removeAttribute("disabled");
                allowlistActionButton.textContent = "Add";
            }
        }
    );
});






allowlistActionButton.addEventListener('click', () => {
    if (!currentChannelInfo?.channelId) {
        return;
    }

    addChannelToAllowlist(
        {
            channelId: currentChannelInfo.channelId,
            channelName: currentChannelInfo.channelName,
            channelIcon: currentChannelInfo.channelIcon
        },
        (added) => {
            if (!added) {
                return;
            }

            const channelItem = createAllowlistedChannelItem(
                currentChannelInfo.channelId,
                currentChannelInfo.channelName,
                currentChannelInfo.channelIcon
            );

            allowlistedChannelList.prepend(channelItem);

            allowlistActionButton.textContent = 'Added';
            allowlistActionButton.setAttribute('disabled', '');
        }
    );
});





function createAllowlistedChannelItem(channelId, channelName, channelIcon) {
    const listItem = document.createElement("li");
    listItem.className = "allowlisted-channel-item";

    const channelInfo = document.createElement("div");
    channelInfo.className = "allowlisted-channel-info";

    const channelAvatar = document.createElement("div");
    channelAvatar.className = "channel-avatar";

    const image = document.createElement("img");
    image.src = channelIcon;
    image.alt = `${channelName} channel icon`;

    const name = document.createElement("span");
    name.className = "allowlisted-channel-name";
    name.textContent = channelName;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-channel-btn";
    removeButton.setAttribute(
        "aria-label",
        `Remove ${channelName} from allowlist`
    );
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
        removeChannelFromAllowlist(channelId, listItem);
    });

    channelAvatar.appendChild(image);
    channelInfo.append(channelAvatar, name);
    listItem.append(channelInfo, removeButton);

    return listItem;
}





function removeChannelFromAllowlist(channelId, listItem) {
    chrome.storage.sync.get(
        "allowlistedChannels",
        ({ allowlistedChannels = [] }) => {

            const updatedChannels = allowlistedChannels.filter(
                channel => channel.channelId !== channelId
            );

            chrome.storage.sync.set(
                { allowlistedChannels: updatedChannels },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Failed to remove channel:",
                            chrome.runtime.lastError
                        );
                        return;
                    }

                    listItem.remove();

                    if (currentChannelInfo?.channelId === channelId) {
                        allowlistActionButton.disabled = false;
                        allowlistActionButton.textContent = "Add";
                    }

                    updateAllowlistCount();
                }
            );
        }
    );
}





function addChannelToAllowlist(channel, callback) {
    chrome.storage.sync.get(
        "allowlistedChannels",
        ({ allowlistedChannels = [] }) => {

            const alreadyExists = allowlistedChannels.some(
                item => item.channelId === channel.channelId
            );

            if (alreadyExists) {
                callback(false);
                return;
            }

            allowlistedChannels.unshift(channel);

            chrome.storage.sync.set(
                { allowlistedChannels },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Failed to add channel:",
                            chrome.runtime.lastError
                        );

                        callback(false);
                        return;
                    }

                    callback(true);
                    updateAllowlistCount();
                }
            );
        }
    );
}







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

        allowlistedChannelCount.textContent = allowlistedChannels.length;
    }
);





function updateAllowlistCount() {
    chrome.storage.sync.get(
        "allowlistedChannels",
        ({ allowlistedChannels = [] }) => {
            allowlistedChannelCount.textContent = allowlistedChannels.length;
        }
    );
}