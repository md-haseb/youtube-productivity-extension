
const settings = {
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




// Load saved settings and apply them when the content script initializes.
chrome.storage.sync.get(settings, (result) => {
  Object.assign(settings, result);

  toggleHomeFeed(settings.hideHomeFeed);
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

  startMutationObserver(settings);
});




// Apply setting changes received from the extension popup.
chrome.runtime.onMessage.addListener((message) => {

  switch (message.type) {
    case "hideHomeFeed":
      settings.hideHomeFeed = message.enabled;
      toggleHomeFeed(settings.hideHomeFeed);
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




