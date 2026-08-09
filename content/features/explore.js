
function toggleExplore(isHidden) {
  toggleExploreShelves(isHidden);
  toggleNavExploreSection(isHidden);
}



function toggleExploreShelves(isHidden) {
  const sections = document.querySelectorAll(
    "ytd-rich-section-renderer"
  );

  sections.forEach((section) => {
    const heading = section.querySelector("h2");

    if (heading?.textContent.trim() !== "Explore more topics") return;

    toggleVisibility(section, isHidden);
  });
}



function toggleNavExploreSection(isHidden) {
  const sections = document.querySelectorAll(
    "ytd-guide-section-renderer"
  );

  sections.forEach((section) => {
    const title = section.querySelector("#guide-section-title");

    if (title?.textContent.trim() !== "Explore") return;

    toggleVisibility(section, isHidden);
  });
}