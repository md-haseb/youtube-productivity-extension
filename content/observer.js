
function startMutationObserver(settings) {
  const observer = new MutationObserver(() => {
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

    if (settings.hideEndScreenFeed) {
      toggleEndScreenFeed(settings.hideEndScreenFeed);
    }

    if (settings.hideEndScreenCards) {
      toggleEndScreenCards(settings.hideEndScreenCards);
    }

    if (settings.hideMix) {
      toggleMixes(settings.hideMix);
    }

    if (settings.hideNotificationsBtn) {
      toggleNotificationsBtn(settings.hideNotificationsBtn);
    }

    if(settings.hideExplore) {
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
