chrome.runtime.onMessage.addListener((message) => {
  console.log(message.type);
  console.log(message.enabled);

  // if (message.type !== "hideShorts") return;

  switch (message.type) {
    case "hideShorts":
      toggleShorts(message.enabled);
      break;

    case "hideComments": 
      toggleComments(message.enabled);
      break;

    case "hideRecommendations": 
      toggleRecommendations(message.enabled);
      break;

    case "hidePlaylist":
      togglePlaylist(message.enabled);
      break;

  }
});




