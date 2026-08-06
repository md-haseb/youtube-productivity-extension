
function togglePlaylist(isHidden) {
  toggleWatchPagePlaylist(isHidden);
}



function toggleWatchPagePlaylist(isHidden) {
  const playlist = document.querySelector(
    "ytd-watch-flexy ytd-playlist-panel-renderer#playlist"
  );

  toggleVisibility(playlist, isHidden);
}