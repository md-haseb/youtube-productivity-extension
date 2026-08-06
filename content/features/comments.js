
function toggleComments(isHidden) {
  toggleWatchPageComments(isHidden);
  toggleShortsPageCommentsBtn(isHidden);
}



function toggleWatchPageComments(isHidden) {
  const comments = document.querySelector("ytd-comments[id='comments']");

  toggleVisibility(comments, isHidden);
}



function toggleShortsPageCommentsBtn(isHidden) {
  const btn = document.querySelector(
    'button[aria-label^="View"][aria-label*="comments"]'
  );

  if (!btn) return;

  const navButtonParent = btn.closest("label");

  toggleVisibility(navButtonParent, isHidden);
}