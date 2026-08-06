
function toggleShorts(isHidden) {
  toggleHomeShortsShelves(isHidden);
  toggleSearchShortsShelves(isHidden);
  toggleLeftSidebarShortsButtons(isHidden);
  toggleHistoryShortsShelves(isHidden);
  toggleHistoryShortsVideos(isHidden);
  toggleChannelPageShortsTab(isHidden);
}



function toggleHomeShortsShelves(isHidden) {
  const homeShortsShevles = document.querySelectorAll(
    'ytd-rich-shelf-renderer[is-shorts]'
  );

  homeShortsShevles.forEach((shelf) => {
    const sectionParent = shelf.closest("ytd-rich-section-renderer");

    toggleVisibility(sectionParent, isHidden);
  });
}



function toggleSearchShortsShelves(isHidden) {
  const searchShortsShevles = document.querySelectorAll(
    "ytm-shorts-lockup-view-model-v2"
  );

  searchShortsShevles.forEach((shelf) => {
    const sectionParent = shelf.closest("grid-shelf-view-model");

    toggleVisibility(sectionParent, isHidden);
  });
}



function toggleLeftSidebarShortsButtons(isHidden) {
  toggleSidebarShortsBySelector("ytd-mini-guide-entry-renderer", isHidden);
  toggleSidebarShortsBySelector("ytd-guide-entry-renderer", isHidden);
}



function toggleSidebarShortsBySelector(selector, isHidden) {
  const items = document.querySelectorAll(selector);

  items.forEach((item) => {
    const link = item.querySelector("a");

    if (link?.getAttribute("title") === "Shorts") {
      toggleVisibility(item, isHidden);
    }
  });
}



function toggleHistoryShortsShelves(isHidden) {
  const historyShortsShelves = document.querySelectorAll("ytd-reel-shelf-renderer");

  historyShortsShelves.forEach((shelf) => {
    const title = shelf.querySelector("#title");

    if (title?.textContent.trim() === "Shorts") {
      toggleVisibility(shelf, isHidden);
    }
  });
}



function toggleHistoryShortsVideos(isHidden) {
  const videos = document.querySelectorAll("ytd-video-renderer");

  videos.forEach((video) => {
    if (video.querySelector('a[href^="/shorts/"]')) {
      toggleVisibility(video, isHidden);
    }
  }); 
}



function toggleChannelPageShortsTab(isHidden) {
  const tabs = document.querySelectorAll("yt-tab-shape");

  tabs.forEach((tab) => {
    if (tab.textContent.trim() === "Shorts") {
      toggleVisibility(tab, isHidden);
    }
  });
}



