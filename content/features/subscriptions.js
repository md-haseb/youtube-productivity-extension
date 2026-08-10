
function toggleSidebarSubscriptionsButtons(isHidden) {
  toggleSidebarSubscriptionsBySelector("ytd-mini-guide-entry-renderer", isHidden);
  toggleSidebarSubscriptionsBySelector("ytd-guide-entry-renderer", isHidden);
}




function toggleSidebarSubscriptionsBySelector(selector, isHidden) {
  const items = document.querySelectorAll(selector);

  items.forEach((item) => {
    const link = item.querySelector("a");

    if (link?.getAttribute("title") === "Subscriptions") {
      toggleVisibility(item, isHidden);
    }
  });
}