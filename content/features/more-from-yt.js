
function toggleMoreFromYouTube(isHidden) {
  const sections = document.querySelectorAll(
    "ytd-guide-section-renderer"
  );

  sections.forEach((section) => {
    const heading = section.querySelector("#guide-section-title");

    if (heading?.textContent.trim() !== "More from YouTube") return;

    toggleVisibility(section, isHidden);
  });
}