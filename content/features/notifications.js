
function toggleNotificationsBtn(isHidden) {
  const container = document.querySelector(
    'ytd-notification-topbar-button-renderer'
  );

  toggleVisibility(container, isHidden);
}