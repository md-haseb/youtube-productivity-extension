
function toggleHomeFeed(isHidden) {
  const homeFeed = document.querySelector(
    'ytd-browse[page-subtype="home"]'
  );

  toggleVisibility(homeFeed, isHidden);
}