
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
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
