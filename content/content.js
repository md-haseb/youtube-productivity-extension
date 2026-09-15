
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


let allowlistedChannels = [];
async function initializeContentScript() {
    const [settingsResult, allowlistResult] = await Promise.all([
        chrome.storage.sync.get(settings),
        chrome.storage.sync.get("allowlistedChannels")
    ]);

    Object.assign(settings, settingsResult);
    allowlistedChannels = allowlistResult.allowlistedChannels || [];

    window.postMessage({
        type: "ALLOWLIST_UPDATED",
        allowlistedChannels
    }, "*");

    if (!settings.extensionEnabled) return;

    applyAllFeatures();
    startMutationObserver(settings);
}

initializeContentScript();

// Load saved settings and apply them when the content script initializes.
// chrome.storage.sync.get(settings, (result) => {
//   Object.assign(settings, result);

//   if (!settings.extensionEnabled) return; 

//   applyAllFeatures();

//   startMutationObserver(settings);
// });




// Apply setting changes received from the extension popup.
chrome.runtime.onMessage.addListener((message) => {

  switch (message.type) {
    case "RESTORE_ALL_FEATURES":
      settings.extensionEnabled = message.enabled;
      stopMutationObserver();
      restoreAllFeatures();
      break;

    case "APPLY_ALL_FEATURES":
      settings.extensionEnabled = message.enabled;
      applyAllFeatures();
      startMutationObserver(settings);
      break;

    // case "hideHomeFeed":
    //   settings.hideHomeFeed = message.enabled;
    //   toggleHomeFeed(settings.hideHomeFeed);
    //   break;
    case "hideHomeFeed":
      settings.hideHomeFeed = message.enabled;
      console.log('culprit');
      applyHomeFeedFeature();
      break;

    case "hideShorts":
      settings.hideShorts = message.enabled;
      toggleShorts(settings.hideShorts);
      break;

    case "hideComments":
      settings.hideComments = message.enabled;
      toggleComments(settings.hideComments);
      break;

    case "hideRecommendations":
      settings.hideRecommendations = message.enabled;
      toggleRecommendations(settings.hideRecommendations);
      break;

    case "hidePlaylist":
      settings.hidePlaylist = message.enabled;
      togglePlaylist(settings.hidePlaylist);
      break;
    
    case "hideEndScreens":
      settings.hideEndScreens = message.enabled;
      toggleEndScreens(settings.hideEndScreens);
      break;

    case "hideLiveChat":
      settings.hideLiveChat = message.enabled;
      toggleLiveChat(settings.hideLiveChat);
      break;

    case "hideMix":
      settings.hideMix = message.enabled;
      toggleMixes(settings.hideMix);
      break;

    case "hideNotificationsBtn":
      settings.hideNotificationsBtn = message.enabled;
      toggleNotificationsBtn(settings.hideNotificationsBtn);
      break;

    case "hideExplore":
      settings.hideExplore = message.enabled;
      toggleExplore(settings.hideExplore);
      break;

    case "hidePlayables":
      settings.hidePlayables = message.enabled;
      togglePlayables(settings.hidePlayables);
      break;

    case "hideMoreFromYouTube":
      settings.hideMoreFromYouTube = message.enabled;
      toggleMoreFromYouTube(settings.hideMoreFromYouTube);
      break;

    case "hideSubscriptions":
      settings.hideSubscriptions = message.enabled;
      toggleSidebarSubscriptionsButtons(settings.hideSubscriptions);
      break;

    case "hideSearchSuggestions":
      settings.hideSearchSuggestions = message.enabled;
      toggleSearchSuggestions(settings.hideSearchSuggestions);
      break;

    case "disableInfiniteScrolling": 
      settings.disableInfiniteScrolling = message.enabled;
      startInfiniteScrollingObserver(settings.disableInfiniteScrolling);
      break;
    
  }
});





function restoreAllFeatures() {
  toggleHomeFeed(false);
  toggleShorts(false);
  toggleComments(false);
  toggleLiveChat(false);
  toggleRecommendations(false);
  togglePlaylist(false);
  toggleEndScreens(false);
  toggleMixes(false);
  toggleNotificationsBtn(false);
  toggleExplore(false);
  togglePlayables(false);
  toggleMoreFromYouTube(false);
  toggleSidebarSubscriptionsButtons(false);
  toggleSearchSuggestions(false);
  startInfiniteScrollingObserver(false);
}




function applyAllFeatures() {
  applyHomeFeedFeature();
  toggleShorts(settings.hideShorts);
  toggleComments(settings.hideComments);
  toggleLiveChat(settings.hideLiveChat);
  toggleRecommendations(settings.hideRecommendations);
  togglePlaylist(settings.hidePlaylist);
  toggleEndScreens(settings.hideEndScreens);
  toggleMixes(settings.hideMix);
  toggleNotificationsBtn(settings.hideNotificationsBtn);
  toggleExplore(settings.hideExplore);
  togglePlayables(settings.hidePlayables);
  toggleMoreFromYouTube(settings.hideMoreFromYouTube);
  toggleSidebarSubscriptionsButtons(settings.hideSubscriptions);
  toggleSearchSuggestions(settings.hideSearchSuggestions);
  startInfiniteScrollingObserver(settings.disableInfiniteScrolling);
}




function applyHomeFeedFeature() {
    console.log("hideHomeFeed:", settings.hideHomeFeed);
    console.log("allowlistedChannels:", allowlistedChannels);

    if (!settings.hideHomeFeed) {
        console.log("Home feed: SHOW");
        toggleHomeFeed(false);

    } else if (allowlistedChannels.length === 0) {
        console.log("Home feed: HIDE ENTIRE FEED");
        toggleHomeFeed(true);

    } else {
        console.log("Home feed: FILTER");
        window.postMessage({
            type: "START_FILTER_INITIAL_FEED"
        }, "*");
    }
}
// function applyHomeFeedFeature() {
//     if (!settings.hideHomeFeed) {
//         toggleHomeFeed(settings.hideHomeFeed);
//         console.log('culprit');
//     } else if (allowlistedChannels.length === 0) {
//         console.log('culprit');
//         toggleHomeFeed(settings.hideHomeFeed);
//     } else {
//         console.log('culprit');
//         window.postMessage({
//             type: "START_FILTER_INITIAL_FEED"
//         }, "*");
//     }
// }




window.addEventListener("message", (event) => {
    // Only accept messages from this same page
    if (event.source !== window) {
        return;
    }

    if (event.data?.type !== "CHANNEL_INFO") {
        return;
    }

    const channelInfo = {
        ...event.data.channelInfo,
        channelIcon: event.data.channelInfo.channelIcon ||
            chrome.runtime.getURL(
                "assets/icons/allowlist/default-channel-icon.svg"
            )
    };

    console.log("Received channel info:", channelInfo);

    console.log("Channel ID:", channelInfo.channelId);
    console.log("Channel Name:", channelInfo.channelName);
    console.log("channel Handle:", channelInfo.channelHandle);
    console.log("Channel Icon:", channelInfo.channelIcon);
    console.log(
        "Channel Detection Status:",
        channelInfo.channelDetectionStatus
    );

    chrome.runtime.sendMessage({
        type: "CHANNEL_INFO",
        channelInfo
    });
});





// let allowlistedChannels = [];

// async function sendAllowlistedChannelsToPage() {
//     const { allowlistedChannels = [] } =
//         await chrome.storage.sync.get("allowlistedChannels");

//     window.postMessage({
//         type: "ALLOWLIST_UPDATED",
//         allowlistedChannels
//     }, "*");
// }
// async function sendAllowlistedChannelsToPage() {
//     const result = await chrome.storage.sync.get("allowlistedChannels");

//     allowlistedChannels = result.allowlistedChannels || [];

//     window.postMessage({
//         type: "ALLOWLIST_UPDATED",
//         allowlistedChannels
//     }, "*");
// }

// sendAllowlistedChannelsToPage();





chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;

    if (!changes.allowlistedChannels) return;

    allowlistedChannels =
        changes.allowlistedChannels.newValue || [];

    window.postMessage(
        {
            type: "ALLOWLIST_UPDATED",
            allowlistedChannels
        },
        "*"
    );
});


// window.addEventListener("message", (event) => {
//     // Only accept messages from this same page
//     if (event.source !== window) {
//         return;
//     }

//     if (event.data?.type !== "CHANNEL_INFO") {
//         return;
//     }

//     const channelInfo = event.data.channelInfo;

//     console.log("Received channel info:", channelInfo);

//     console.log("Channel ID:", channelInfo.channelId);
//     console.log("Channel Name:", channelInfo.channelName);
//     console.log("Channel Icon:", channelInfo.channelIcon);
//     console.log("Channel Detection Status:", channelInfo.channelDetectionStatus);

//     chrome.runtime.sendMessage({
//         type: "CHANNEL_INFO",
//         channelInfo
//     });
// });






window.addEventListener("message", (event) => {
    if (event.source !== window) {
        return;
    }

    if (event.data?.type === "START_INFINITE_SCROLLING") {
        startInfiniteScrollingObserver(event.data.isDisable);
    }
});