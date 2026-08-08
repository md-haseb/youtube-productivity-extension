
function toggleMixes(isHidden) {
  const badges = document.querySelectorAll(".ytBadgeShapeText");

  badges.forEach((badge) => {

    if(badge.textContent.trim() === "Mix") {
      const mixCard = badge.closest("ytd-rich-item-renderer"); 
      toggleVisibility(mixCard, isHidden);
    }
  });
}