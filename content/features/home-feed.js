
function toggleHomeFeed(isHidden) {
  console.log("toggleHomeFeed called:", isHidden);
  const homeFeed = document.querySelector(
    'ytd-browse[page-subtype="home"]'
  );

  toggleVisibility(homeFeed, isHidden);
}