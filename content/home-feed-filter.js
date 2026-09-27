
// ============================================================
// ALLOWLIST STATE
// ============================================================

// Listen for allowlist updates and store channel handles in a Set
// for efficient channel matching and filtering.
let allowlistedChannelHandles = new Set();

window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data?.type !== "ALLOWLIST_UPDATED") return;

    allowlistedChannelHandles = new Set(
        event.data.allowlistedChannels.map(channel => channel.channelHandle)
    );

});








// ============================================================
// INITIAL FEED
// ============================================================

// before processing, wait until the initial elements stop changing for 2 seconds in home page
function waitForInitialElements(getElements, callback) {
    let lastCount = 0;
    let stableSince = null;

    const check = () => {
        const elements = getElements();
        const currentCount = elements.length;

        if (currentCount === 0) {
            requestAnimationFrame(check);
            return;
        }

        if (currentCount !== lastCount) {
            lastCount = currentCount;
            stableSince = Date.now();
        }

        if (Date.now() - stableSince >= 2000) {
            console.log(currentCount);
            callback(elements);
            return;
        }

        requestAnimationFrame(check);
    };

    check();
}



// Process the initial homepage feed by filtering videos and sections,
// then start observing the feed for dynamically added content.

function filterInitialFeed() {
    let videosReady = false;
    let sectionsReady = false;

    const startObserverIfReady = () => {
        if (videosReady && sectionsReady) {
            startFeedObserver();
        }
    };

    waitForInitialElements(
        () =>
            [...document.querySelectorAll("ytd-rich-item-renderer")]
                .filter(item =>
                    !item.closest("ytd-rich-section-renderer")
                ),
        (videoItems) => {
            console.log("Initial videos:", videoItems.length);

            window.postMessage({
                type: "START_INFINITE_SCROLLING",
                isDisable: true
            }, "*");

            videoItems.forEach(video => {
                observeVideoItem(video);
                filterVideoItem(video);
            });

            videosReady = true;
            startObserverIfReady();
            console.log('end of filter initial feed videos');
        }
    );

    waitForInitialElements(
        () => [
            ...document.querySelectorAll("ytd-rich-section-renderer")
        ],
        (sections) => {
            console.log("Initial sections:", sections.length);

            sections.forEach(filterSection);

            sectionsReady = true;
            startObserverIfReady();
        }
    );
}








// ============================================================
// FEED OBSERVATION
// ============================================================

// Observe the homepage for dynamically added feed content and apply
// the appropriate filtering logic to new videos and sections.
function startFeedObserver() {
    console.log('from observer');
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;

                if (node.matches("ytd-rich-section-renderer")) {
                    filterSection(node);
                    continue;
                }

                if (node.matches("ytd-rich-item-renderer")) {
                    if (node.closest("ytd-rich-section-renderer")) {
                        continue;
                    }

                    observeVideoItem(node);
                    filterVideoItem(node);
                }

            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Catch anything that appeared before observer started.
    document
        .querySelectorAll("ytd-rich-item-renderer")
        .forEach(video => {
            if (!video.closest("ytd-rich-section-renderer")) {
                observeVideoItem(video);
                filterVideoItem(video);
            }
        });
}








// ============================================================
// VIDEO CHANNEL DETECTION
// ============================================================

// Wait for the channel link to become available before filtering the video,
// since YouTube may render the video content before its metadata.
const waitingForChannel = new WeakSet();

function waitForVideoChannel(elm) {
    if (waitingForChannel.has(elm)) {
        return;
    }

    const findChannelLink = () =>
        elm.querySelector(
            '#content yt-lockup-view-model .ytLockupViewModelMetadata .ytLockupMetadataViewModelTextContainer .ytContentMetadataViewModelHost .ytAttributedStringHost a.ytAttributedStringLink'
        );

    const existingLink = findChannelLink();

    if (existingLink) {
        filterVideoItem(elm);
        return;
    }

    waitingForChannel.add(elm);

    const observer = new MutationObserver(() => {
        const link = findChannelLink();

        if (!link) return;

        observer.disconnect();
        waitingForChannel.delete(elm);

        filterVideoItem(elm);
    });

    observer.observe(elm, {
        childList: true,
        subtree: true
    });
}








// ============================================================
// VIDEO FILTERING
// ============================================================

// Show or hide a video based on whether its channel is allowlisted.
// Wait for the channel link if YouTube has not rendered it yet.
// const hiddenVideos = new WeakSet();
const hiddenVideos = new Set();

function filterVideoItem(elm) {
    console.log("FILTER START", {
        elm,
        display: elm.style.display
    });

    const link = elm.querySelector(
        '#content yt-lockup-view-model .ytLockupViewModelMetadata .ytLockupMetadataViewModelTextContainer .ytContentMetadataViewModelHost .ytAttributedStringHost a.ytAttributedStringLink'
    );

    console.log("LINK:", link);

    if (!link) {
        console.log("NO LINK → HIDING");

        hiddenVideos.add(elm);
        observeVideoVisibility(elm);
        elm.style.display = "none";

        waitForVideoChannel(elm);
        return;
    }

    const href = link.getAttribute("href");
    const allowed = allowlistedChannelHandles.has(href);

    console.log("CHANNEL RESULT:", {
        href,
        allowed,
        beforeDisplay: elm.style.display,
        hidden: hiddenVideos.has(elm)
    });

    if (allowed) {
        hiddenVideos.delete(elm);
        elm.style.display = "";
    } else {
        hiddenVideos.add(elm);
        observeVideoVisibility(elm);
        elm.style.display = "none";
    }

    console.log("FILTER END:", {
        display: elm.style.display,
        hidden: hiddenVideos.has(elm)
    });
}



// Restores all hidden videos and clears the hidden video references.
function restoreHiddenVideos() {
    hiddenVideos.forEach((elm) => {
        elm.style.display = "";
    });

    hiddenVideos.clear();
}








// ============================================================
// VIDEO VISIBILITY
// ============================================================

const visibilityObservers = new Map();

function observeVideoVisibility(elm) {
    if (visibilityObservers.has(elm)) {
        return;
    }

    const observer = new MutationObserver(() => {
        if (hiddenVideos.has(elm) && elm.style.display !== "none") {
            elm.style.display = "none";
        }
    });

    observer.observe(elm, {
        attributes: true,
        attributeFilter: ["style"]
    });

    visibilityObservers.set(elm, observer);
}



// Stops all visibility observers and clears the observer references.
function stopVisibilityObservers() {
    visibilityObservers.forEach(observer => {
        observer.disconnect();
    });

    visibilityObservers.clear();
}








// ============================================================
// SECTION FILTERING
// ============================================================

// Hide the homepage section from the feed.
function filterSection(section) {
    // section filtering logic
    section.style.display = "none";
}








// ============================================================
// VIDEO MUTATION OBSERVATION
// ============================================================

// Re-filter the video item when YouTube dynamically updates its content.
const videoObservers = new Map();

function observeVideoItem(elm) {
    if (videoObservers.has(elm)) {
        return;
    }

    const observer = new MutationObserver(() => {
        filterVideoItem(elm);
    });

    observer.observe(elm, {
        childList: true,
        subtree: true
    });

    videoObservers.set(elm, observer);
}








// ============================================================
// CLEANUP
// ============================================================

// Stops all observers used for home feed filtering and restores hidden videos.
function stopHomeFeedFiltering() {
    videoObservers.forEach(observer => {
        observer.disconnect();
    });

    videoObservers.clear();

    stopVisibilityObservers();

    restoreHiddenVideos();
}









// ============================================================
// MESSAGE HANDLERS
// ============================================================

// Handles messages for starting and stopping home feed filtering.
window.addEventListener("message", (event) => {
    if (event.source !== window) {
        return;
    }

    if (event.data?.type === "START_FILTER_INITIAL_FEED") {
        filterInitialFeed();
    }

    if (event.data?.type === "STOP_FILTER_HOME_FEED") {
        stopHomeFeedFiltering();
    }
});
