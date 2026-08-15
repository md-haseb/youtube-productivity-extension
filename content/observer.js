

let observer = null;



/**
 * Observes YouTube's DOM for dynamic content and reapplies enabled settings
 * when the DOM changes.
 *
 * @param {Object} settings - Current extension settings.
 */

function startMutationObserver(settings) {

  if (!settings.extensionEnabled) return;

  // Prevent multiple observers
  stopMutationObserver();

  observer = new MutationObserver(() => {
    if (settings.hideHomeFeed) {
      toggleHomeFeed(settings.hideHomeFeed);
    }

    if (settings.hideShorts) {
      toggleShorts(settings.hideShorts);
    }

    if (settings.hideComments) {
      toggleComments(settings.hideComments);
    }

    if (settings.hideLiveChat) {
      toggleLiveChat(settings.hideLiveChat);
    }

    if (settings.hideRecommendations) {
      toggleRecommendations(settings.hideRecommendations);
    }

    if (settings.hidePlaylist) {
      togglePlaylist(settings.hidePlaylist);
    }

    if (settings.hideEndScreens) {
      toggleEndScreens(settings.hideEndScreens);
    }

    if (settings.hideMix) {
      toggleMixes(settings.hideMix);
    }

    if (settings.hideNotificationsBtn) {
      toggleNotificationsBtn(settings.hideNotificationsBtn);
    }

    if (settings.hideExplore) {
      toggleExplore(settings.hideExplore);
    }

    if (settings.hidePlayables) {
      togglePlayables(settings.hidePlayables);
    }

    if (settings.hideMoreFromYouTube) {
      toggleMoreFromYouTube(settings.hideMoreFromYouTube);
    }

    if (settings.hideSubscriptions) {
      toggleSidebarSubscriptionsButtons(settings.hideSubscriptions);
    }

    if (settings.hideSearchSuggestions) {
      toggleSearchSuggestions(settings.hideSearchSuggestions);
    }

  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}





function stopMutationObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}