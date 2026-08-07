
// function toggleEndScreen(isHidden) {
//   toggleEndScreenFeed(isHidden);
//   toggleEndScreenCards(isHidden);
// }



function toggleEndScreenFeed(isHidden) {
  const feed = document.querySelector(
    ".ytp-fullscreen-grid-stills-container"
  );

  toggleVisibility(feed, isHidden);
}



function toggleEndScreenCards(isHidden) {
  const cards = document.querySelectorAll('.ytp-ce-element');

  cards.forEach(card => {
    toggleVisibility(card, isHidden);
  });
}