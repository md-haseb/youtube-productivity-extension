
/**
 * Waits until the initial YouTube feed remains unchanged for a short period,
 * then passes the initial feed elements to the callback.
 *
 * @param {Function} callback - Called with the initial feed elements.
 */

function waitForInitialFeed(callback) {
  let lastCount = 0;
  let stableSince = null;

  const checkFeed = () => {
    const items = document.querySelectorAll(
      "ytd-rich-item-renderer, ytd-rich-section-renderer"
    );

    const currentCount = items.length;

    if (currentCount === 0) {
      requestAnimationFrame(checkFeed);
      return;
    }

    if (currentCount !== lastCount) {
      lastCount = currentCount;
      stableSince = Date.now();
    }

    // YouTube does not expose a reliable signal indicating that the
    // initial feed has finished loading, so use a 2-second stability
    // period as a practical Version1 trade-off.
    if (Date.now() - stableSince >= 2000) {
      callback(items);
      return;
    }

    requestAnimationFrame(checkFeed);
  };

  checkFeed();
}




/**
 * Observes the YouTube page for newly loaded feed content and hides it
 * when infinite scrolling is disabled.
 *
 * @param {boolean} isDisable - Whether infinite scrolling should be disabled.
 */

function startInfiniteScrollingObserver(isDisable) {
  waitForInitialFeed((initialFeed) => {
    const initialItems = new Set(initialFeed);

    toggleContinuation(isDisable);

    const observer = new MutationObserver(() => {

      toggleContinuation(isDisable);

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




/**
 * Helper function to Hide or show the YouTube feed continuation/loading element. 
 *
 * @param {boolean} isDisable - Whether the continuation element should be hidden.
 */

function toggleContinuation(isDisable) {
  const continuation = document.querySelector(
    "ytd-continuation-item-renderer"
  );

  if (continuation) {
    toggleVisibility(continuation, isDisable);
  }
}

