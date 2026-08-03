chrome.runtime.onMessage.addListener((message) => {
  console.log(message.type);
  console.log(message.enabled);

  if (message.type !== "hideShorts") return;

  const homePageShortsElements = document.querySelectorAll(
    'ytd-rich-shelf-renderer[is-shorts]'
  );

  const searchPageShortsElements = document.querySelectorAll(
    'ytm-shorts-lockup-view-model-v2'
  );

  const homePageLeftSideButtons = document.querySelectorAll(
    'ytd-mini-guide-entry-renderer'
  ); 

  const homePageInnerToggleButtons = document.querySelectorAll(
    'ytd-guide-entry-renderer')
  ;

  const historyPageVideos = document.querySelectorAll(
    'ytd-video-renderer'
  );

  if(homePageShortsElements) {
    homePageShortsElements.forEach((item) => {
      const sectionParent = item.closest("ytd-rich-section-renderer");

      if (sectionParent) {
        sectionParent.style.display = message.enabled ? "none" : "";
      }
    });
  }

  if(searchPageShortsElements) {
    searchPageShortsElements.forEach((item) => {
      const sectionParent = item.closest("grid-shelf-view-model");

      if (sectionParent) {
        sectionParent.style.display = message.enabled ? "none" : "";
      }
    });
  }

  if(homePageLeftSideButtons) {
    homePageLeftSideButtons.forEach((item) => {
      const link = item.querySelector('a');

      if (link?.getAttribute("title") === "Shorts") {
        item.style.display = message.enabled ? "none" : "";
      }
    });
  }

  if(homePageInnerToggleButtons) {
    homePageInnerToggleButtons.forEach((item) => {
      const link = item.querySelector('a');

      if (link?.getAttribute("title") === "Shorts") {
        item.style.display = message.enabled ? "none" : "";
      }
    });
  }

  if(historyPageVideos) {
    historyPageVideos.forEach((video) => {
      if (video.querySelector('a[href^="/shorts/"]')) {
        video.style.display = message.enabled ? "none" : "";
      }
    });
  }
});




