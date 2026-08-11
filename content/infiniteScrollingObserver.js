
// function waitForInitialFeed(callback) {
//   const checkFeed = () => {
//     const items = document.querySelectorAll(
//       "ytd-rich-item-renderer, ytd-rich-section-renderer"
//     );

//     if (!items.length) {
//       requestAnimationFrame(checkFeed);
//       return;
//     }

//     callback(items);
//   };

//   checkFeed();
// }





function waitForInitialFeed(callback) {
  let lastCount = 0;
  let stableFrames = 0;

  const checkFeed = () => {
    const items = document.querySelectorAll(
      "ytd-rich-item-renderer, ytd-rich-section-renderer"
    );

    if (items.length === 0) {
      requestAnimationFrame(checkFeed);
      return;
    }

    if (items.length === lastCount) {
      stableFrames++;
    } else {
      stableFrames = 0;
      lastCount = items.length;
    }

    if (stableFrames >= 10) {
      callback(items);
      return;
    }

    requestAnimationFrame(checkFeed);
  };

  checkFeed();
}




function startInfiniteScrollingObserver(isDisable) {
  waitForInitialFeed((initialFeed) => {
    const initialItems = new Set(initialFeed);

    const continuation = document.querySelector(
      "ytd-continuation-item-renderer"
    );

    if (continuation) {
      toggleVisibility(continuation, isDisable);
    }

    const observer = new MutationObserver(() => {
      const currentItems = document.querySelectorAll(
        "ytd-rich-item-renderer, ytd-rich-section-renderer"
      );

      currentItems.forEach((item) => {
        if (initialItems.has(item)) return;

        toggleVisibility(item, isDisable);
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}




// function startInfiniteScrollingObserver(isDisable) {
//   const initialItems = new Set(
//     document.querySelectorAll(
//       "ytd-rich-item-renderer, ytd-rich-section-renderer"
//     )
//   );

//   const continuation = document.querySelector(
//     "ytd-continuation-item-renderer"
//   );

//   if (continuation) {
//     toggleVisibility(continuation, isDisable);
//   }

//   const observer = new MutationObserver(() => {
//     const currentItems = document.querySelectorAll(
//       "ytd-rich-item-renderer, ytd-rich-section-renderer"
//     );

//     currentItems.forEach((item) => {
//       if (initialItems.has(item)) return;

//       // item.style.display = "none";
//       toggleVisibility(item, isDisable);
//     });
//   });

//   observer.observe(document.body, {
//     childList: true,
//     subtree: true,
//   });
// }