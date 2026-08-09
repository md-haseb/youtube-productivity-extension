

function togglePlayables(isHidden) {
  togglePlayablesShelves(isHidden);
  toggleNavExplorePlayablesBtn(isHidden);
  toggleNavYouTabPlayablesBtn(isHidden);
}




function togglePlayablesShelves(isHidden) {
  const shelves = document.querySelectorAll('ytd-rich-section-renderer');

  shelves.forEach((shelf) => {
    const playablesShelf = shelf.querySelector(
      'ytd-rich-item-renderer[is-mini-game-card-shelf]'
    );

    if (!playablesShelf) return;

    toggleVisibility(shelf, isHidden);
  });
}



function toggleNavExplorePlayablesBtn(isHidden) {
  const playablesBtn = document.querySelector(
    'ytd-guide-entry-renderer a[href="/playables"]'
  );

  if (!playablesBtn) return;

  const container = playablesBtn.closest('ytd-guide-entry-renderer');

  toggleVisibility(container, isHidden);
}



function toggleNavYouTabPlayablesBtn(isHidden) {
  const playablesBtn = document.querySelector(
    'ytd-guide-entry-renderer a[href="/playables/saved"]'
  );

  if (!playablesBtn) return;

  const container = playablesBtn.closest('ytd-guide-entry-renderer');

  toggleVisibility(container, isHidden);
}