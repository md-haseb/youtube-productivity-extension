chrome.runtime.onMessage.addListener((message) => {
  console.log(message.type);
  console.log(message.enabled);

  if (message.type !== "hideShorts") return;

  const elements = document.querySelectorAll(
    "ytd-rich-shelf-renderer[is-shorts]"
  );

  elements.forEach((element) => {
    const sectionParent = element.closest("ytd-rich-section-renderer");

    if (sectionParent) {
      sectionParent.style.display = message.enabled ? "none" : "";
    } else {
      const gridParent = element.closest("grid-shelf-view-model");
      const host = gridParent?.querySelector(".ytGridShelfViewModelHost");

      if (host) {
        host.style.display = message.enabled ? "none" : "";
      }
    }

    // const parentElm =
    //   element.closest("ytd-rich-section-renderer") ||
    //   element.closest("grid-shelf-view-model");

    // if (!parentElm) return;

    // parentElm.style.display = message.enabled ? "none" : "";
  });
  
});




