
function toggleRecommendations(isHidden) {
  toggleWatchPageRightSidebar(isHidden);
}



function toggleWatchPageRightSidebar(isHidden) {
  const sidebar = document.querySelector("ytd-watch-flexy #secondary #related");

  toggleVisibility(sidebar, isHidden);
}

