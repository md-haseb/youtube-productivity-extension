
const settings = {
    'hideShorts': false,
    'hideComments': false,
    'hideLiveChat': false,
    'hideRecommendations': false,
    'hidePlaylist': false,
    'hideEndScreenFeed': false,
    'hideEndScreenCards': false,
    'hideMix': false,
    'hideNotificationsBtn': false,
    'hideExplore': false,
    'hidePlayables': false
  }

chrome.storage.sync.get(settings, (result) => {
  Object.assign(settings, result);

  toggleShorts(settings.hideShorts);
  toggleComments(settings.hideComments);
  toggleLiveChat(settings.hideLiveChat);
  toggleRecommendations(settings.hideRecommendations);
  togglePlaylist(settings.hidePlaylist);
  toggleEndScreenFeed(settings.hideEndScreenFeed);
  toggleEndScreenCards(settings.hideEndScreenCards);
  toggleMixes(settings.hideMix);
  toggleNotificationsBtn(settings.hideNotificationsBtn);
  toggleExplore(settings.hideExplore);
  togglePlayables(settings.hidePlayables);

  startMutationObserver(settings);
});




chrome.runtime.onMessage.addListener((message) => {
  console.log(message.type);
  console.log(message.enabled);

  // if (message.type !== "hideShorts") return;

  switch (message.type) {
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
    
    case "hideEndScreenFeed":
      settings.hideEndScreenFeed = message.enabled;
      toggleEndScreenFeed(settings.hideEndScreenFeed);
      break;

    case "hideEndScreenCards":
      settings.hideEndScreenCards = message.enabled;
      toggleEndScreenCards(settings.hideEndScreenCards);
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
    
  }
});




