

let prevUrl = null;

function isWatchPage(url) {
    return (
        url.pathname === "/watch" &&
        url.searchParams.has("v")
    );
}


function isChannelPage(url) {
    return (
        /^\/@[^/]+(?:\/.*)?$/.test(url.pathname) ||
        /^\/channel\/UC[^/]+(?:\/.*)?$/.test(url.pathname)
    );
}


// Handles YouTube SPA navigation and triggers the appropriate channel detection method.
async function handleNavigation() {
    const newUrl = location.href;

    if (newUrl === prevUrl) {
        return;
    }

    prevUrl = newUrl;

    console.log("Navigation detected:", newUrl);

    const url = new URL(newUrl);

    if (url.pathname === '/') {
        initializeHomeFeedFiltering();
    }

    if (isWatchPage(url)) {
        console.log("Watch page detected");
        waitForChannelInfoFromWatchPageDOM();

        // Channel detection will go here
    } 
    else if (isChannelPage(url)) {
        console.log("Channel Page Detected");

        try {
            // 1. Primary: ytd-app
            const channelInfo = await waitForChannelInfoFromAppData();

            console.log("Channel info from ytd-app:", channelInfo);

        } catch (error) {

            try {
                // 2. fallback: DOM
                const channelInfo = await waitForChannelInfoFromChannelPageDOM();

                console.log("Channel info from DOM:", channelInfo);

            } catch (error) {
                console.log("All channel detection methods failed.");
            }
        }
    } 
    else {
        console.log("Not a watch page");
        sendDefaultChannelInfo();
    }
}

// Continuously checks for URL changes because YouTube uses SPA navigation.
handleNavigation();
setInterval(handleNavigation, 500);










// Sends the default channel information when no channel is detected.
function sendDefaultChannelInfo() {
    window.postMessage({
        type: "CHANNEL_INFO",
        channelInfo: {
            channelId: null,
            channelName: "—",
            channelIcon: null,
            channelDetectionStatus: "No channel detected"
        }
    }, "*");
}







// Helper functions for detecting the current YouTube channel handle.


// Extracts the YouTube channel handle from the current URL path.
function extractYouTubeHandle() {
    try {
        const pathname = location.pathname;
        console.log("Current pathname:", pathname);
        const match = pathname.match(/^\/(@[^/]+)/);

        return match ? match[1] : null;
    } catch {
        return null;
    }
}


// Waits for the YouTube channel handle to become available in the current URL.
function waitForYouTubeHandle() {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const interval = setInterval(() => {
            attempts++;

            const handle = extractYouTubeHandle();

            if (handle) {
                clearInterval(interval);
                resolve(handle);
                return;
            }

            if (attempts >= 100) {
                clearInterval(interval);
                reject(new Error("YouTube handle not found"));
            }
        }, 100);
    });
}








// Channel info extraction methods using the watch page DOM.


// Extracts channel ID and name from the watch page DOM.
function extractChannelInfoFromWatchPageDOM() {
    // 1. Try DOM
    const channelIdLink = document.querySelector(
        'ytd-watch-metadata a[href^="/channel/"]'
    );

    const channelNameLink = document.querySelector(
        'ytd-watch-metadata #owner ytd-channel-name a'
    );

    const channelHandleElement = document.querySelector(
        'ytd-video-owner-renderer #upload-info ytd-channel-name .ytd-channel-name a.yt-formatted-string'
    );

    const href = channelIdLink?.getAttribute("href");

    const channelId = href
        ?.match(/^\/channel\/([^/?]+)/)?.[1];

    const channelName = channelNameLink?.textContent.trim();

    const channelHandle = channelHandleElement?.getAttribute('href');

    console.log(channelIdLink, channelNameLink, channelHandleElement);
    console.log(channelId, channelName, channelHandle);
        
    return {
        channelId,
        channelName, 
        channelHandle
    };

}


// Waits for the channel icon to become available in the watch page DOM.
function waitForChannelIconFromWatchPageDOM(callback) {
    let timeout;

    const checkIcon = () => {
        const img = document.querySelector(
            'ytd-watch-metadata ytd-video-owner-renderer img'
        );

        const src = img?.getAttribute('src');

        if (src) {
            console.log(src);
            callback(src);
            return true;
        }

        return false;
    };

    // Check immediately
    if (checkIcon()) return;

    const observer = new MutationObserver(() => {
        if (checkIcon()) {
            observer.disconnect();
            clearTimeout(timeout);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src']
    });

    timeout = setTimeout(() => {
        observer.disconnect();
        console.log("Channel icon not found");
    }, 5000);
}


// Waits for the current channel info to become available in the watch page DOM.
let channelInfoInterval = null;

function waitForChannelInfoFromWatchPageDOM() {
    if (channelInfoInterval) {
        clearInterval(channelInfoInterval);
    }

    const urlVideoId = new URL(location.href)
        .searchParams
        .get("v");

    let attempts = 0;
    const maxAttempts = 50;

    channelInfoInterval = setInterval(() => {
        attempts++;

        const metadataVideoId = document
        .querySelector('ytd-watch-metadata[video-id]')
        ?.getAttribute('video-id');

        if (urlVideoId === metadataVideoId) {
            const channelInfo = extractChannelInfoFromWatchPageDOM();

            if (
                channelInfo?.channelId &&
                channelInfo?.channelName && 
                channelInfo?.channelHandle
            ) {
                console.log(attempts);
                console.log("Correct channel info found:", channelInfo);

                clearInterval(channelInfoInterval);
                channelInfoInterval = null;

                waitForChannelIconFromWatchPageDOM((src) => {
                    console.log("Channel icon found:", src);

                    window.postMessage({
                        type: "CHANNEL_INFO",
                        channelInfo: {
                            ...channelInfo,
                            channelIcon: src,
                            channelDetectionStatus: 'Channel Detected'
                        }
                    }, "*");
                });

                return;
            }
        }

        if (attempts >= maxAttempts) {
            console.log("Channel info not found");
            clearInterval(channelInfoInterval);
            channelInfoInterval = null;
        }
    }, 100);
}








// Primary channel info extraction methods using the ytd-app app data.


// Waits for the current channel information to become available in the ytd-app app data.
async function waitForChannelInfoFromAppData() {
    let handle = await waitForYouTubeHandle();

    if (!handle) {
        throw new Error("Could not detect YouTube handle");
    }

    handle = `/${handle}`;

    console.log("Handle:", handle);

    let attempts = 0;
    const maxAttempts = 40;

    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            attempts++;

            const channelInfo = extractChannelInfoFromAppData();

            if (handle === channelInfo?.channelHandle && channelInfo?.channelId) {
                clearInterval(interval);

                window.postMessage({
                    type: "CHANNEL_INFO",
                    channelInfo: {
                        ...channelInfo,
                        channelDetectionStatus: "Channel Detected"
                    }
                }, "*");

                resolve(channelInfo);
                return;
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error("Could not detect channel info from app data"));
            }
        }, 250);
    });
}


// Extracts the current channel ID, name, handle, and icon from ytd-app app data.
function extractChannelInfoFromAppData() {
    try {
        const app = document.querySelector("ytd-app");

        const browseEndpoint =
            app?.data?.endpoint?.browseEndpoint;

        if (!browseEndpoint) {
            return null;
        }

        const { browseId, canonicalBaseUrl } = browseEndpoint;

        if (!browseId || !canonicalBaseUrl) {
            return null;
        }

        const metadata = app?.data?.response?.metadata;

        if(!metadata) {
            return null;
        }

        const channelName = metadata.channelMetadataRenderer?.title;

        const responseObj = app.data.response;

        const channelIcon = findChannelIconInAppData(responseObj);

        return {
            channelId: browseId,
            channelName: channelName,
            channelHandle: canonicalBaseUrl,
            channelIcon: channelIcon
        };
    } catch {
        return null;
    }
}


// Recursively searches the app data for the channel icon URL.
function findChannelIconInAppData(obj) {
    if (!obj || typeof obj !== "object") {
        return null;
    }

    if (obj.pageHeaderRenderer) {
        const channelIconImageLink =
            obj.pageHeaderRenderer
                ?.content
                ?.pageHeaderViewModel
                ?.image
                ?.decoratedAvatarViewModel
                ?.avatar
                ?.avatarViewModel
                ?.image
                ?.sources?.[0]
                ?.url;

        return channelIconImageLink || null;
    }

    for (const value of Object.values(obj)) {
        const result = findChannelIconInAppData(value);

        if (result) {
            return result;
        }
    }

    return null;
}







// Fallback channel info extraction method using the channel page DOM.


// Fallback method for extracting channel info from the channel page DOM.
function extractChannelInfoFromChannelPageDOM() {
    const channelIdLink = document.querySelector(
        'ytd-video-description-infocards-section-renderer ytd-button-renderer yt-button-shape a[href^="/channel/"][href$="/about"]'
    );

    const href = channelIdLink?.getAttribute("href");

    const channelId = href
        ?.match(/^\/channel\/([^/?]+)/)?.[1];

    const channelNameElement = document.querySelector('tp-yt-app-header yt-page-header-renderer .ytPageHeaderViewModelTitle span');
    const channelName = channelNameElement?.textContent?.trim() || null;

    const channelIconElement = document.querySelector('tp-yt-app-header yt-page-header-renderer .ytPageHeaderViewModelHeadlineImage img');
    const channelIcon = channelIconElement?.getAttribute('src') || null;

    return {
        channelId,
        channelName,
        channelIcon
    };
}


// Waits for the current channel info to become available in the channel page DOM.
async function waitForChannelInfoFromChannelPageDOM() {
    const youtubeHandle = await waitForYouTubeHandle();

    if(!youtubeHandle) {
        throw new Error("Could not detect YouTube handle");
    }

    const handle = `/${youtubeHandle}`;

    return new Promise((resolve, reject) => {
        let timeout;

        const checkChannel = () => {
            const link = document.querySelector(
                'ytd-video-description-infocards-section-renderer a#header'
            );

            const domHandle = link?.getAttribute('href');

            const appHeaderElement = document.querySelector(
                'tp-yt-app-header yt-page-header-renderer yt-content-metadata-view-model .ytAttributedStringHost span'
            );

            const handleText = appHeaderElement?.textContent?.trim();

            const handleFromAppHeader =
                handleText?.startsWith('@')
                    ? `/${handleText}`
                    : null;

            if (domHandle === handle && handleFromAppHeader === handle) {
                const channelInfo = extractChannelInfoFromChannelPageDOM();

                if (
                    channelInfo?.channelId &&
                    channelInfo?.channelName &&
                    channelInfo?.channelHandle &&
                    channelInfo?.channelIcon
                ) {
                    window.postMessage({
                        type: "CHANNEL_INFO",
                        channelInfo: {
                            ...channelInfo,
                            channelDetectionStatus: "Channel Detected"
                        }
                    }, "*");

                    resolve(channelInfo);
                    return true;
                }
            }

            return false;
        };

        // Check immediately
        if (checkChannel()) {
            return;
        }

        const observer = new MutationObserver(() => {
            if (checkChannel()) {
                observer.disconnect();
                clearTimeout(timeout);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['href', 'src']
        });

        timeout = setTimeout(() => {
            observer.disconnect();
            reject(
                new Error("Channel info not found from DOM")
            );
        }, 5000);
    });
}







// Listen for allowlist updates and store channel handles in a Set
// for efficient channel matching and filtering.
let allowlistedChannelHandles = new Set();

window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data?.type !== "ALLOWLIST_UPDATED") return;

    // allowlistedChannelIds = new Set(
    //     event.data.allowlistedChannels.map(channel => channel.channelId)
    // );

    // console.log(allowlistedChannelIds);

    allowlistedChannelHandles = new Set(
        event.data.allowlistedChannels.map(channel => channel.channelHandle)
    );

    console.log(allowlistedChannelHandles);

    // filterRecommendedVideos();
});








// function waitForInitialFeed(callback) {
//   let lastCount = 0;
//   let stableSince = null;

//   const checkFeed = () => {
//     const items = document.querySelectorAll(
//       "ytd-rich-item-renderer, ytd-rich-section-renderer"
//     );

//     const currentCount = items.length;

//     if (currentCount === 0) {
//       requestAnimationFrame(checkFeed);
//       return;
//     }

//     if (currentCount !== lastCount) {
//       lastCount = currentCount;
//       stableSince = Date.now();
//     }

//     // YouTube does not expose a reliable signal indicating that the
//     // initial feed has finished loading, so use a 2-second stability
//     // period as a practical Version1 trade-off.
//     if (Date.now() - stableSince >= 2000) {
//       callback(items);
//       return;
//     }

//     requestAnimationFrame(checkFeed);
//   };

//   checkFeed();
// }


// function waitForInitialFeed(callback) {
//     let lastCount = 0;
//     let stableSince = null;

//     const checkFeed = () => {
//         // const videoItems = document.querySelectorAll(
//         //     "ytd-rich-item-renderer"
//         // );
//         const videoItems = [
//             ...document.querySelectorAll("ytd-rich-item-renderer")
//         ].filter(
//             item => !item.closest("ytd-rich-section-renderer")
//         );

//         // const sections = document.querySelectorAll(
//         //     "ytd-rich-section-renderer"
//         // );

//         const currentCount = videoItems.length;

//         if (currentCount === 0) {
//             requestAnimationFrame(checkFeed);
//             return;
//         }

//         if (currentCount !== lastCount) {
//             lastCount = currentCount;
//             stableSince = Date.now();
//         }

//         // YouTube does not expose a reliable signal indicating that the
//         // initial feed has finished loading, so use a 2-second stability
//         // period as a practical Version1 trade-off.
//         if (Date.now() - stableSince >= 2000) {
//             // callback({
//             //     videoItems,
//             //     sections
//             // });
//             callback(videoItems);
//             return;
//         }

//         requestAnimationFrame(checkFeed);
//     };

//     checkFeed();
// }

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






// async function initializeHomeFeedFiltering() {
//     let attempts = 0;
//     const maxAttempts = 40;

//     return new Promise((resolve, reject) => {
//         const interval = setInterval(() => {
//             attempts++;

//             const app = document.querySelector('ytd-app');

//             if (app?.data?.response) {

//                 clearInterval(interval);

//                 const videoInfos = findVideoInfos(app.data.response);

//                 console.log(videoInfos);

//                 const videos = videoInfos
//                     .filter(content => content.browseId && content.channelHandle && content.videoId)
//                     .map(content => ({
//                         browseId: content.browseId,
//                         channelHandle: content.channelHandle,
//                         videoId: content.videoId
//                     }));

//                 console.log(videos);

//                 // const allowlistedVideoIds = new Set(
//                 //     videos
//                 //         .filter(video => allowlistedChannelIds.has(video.browseId))
//                 //         .map(video => video.videoId)
//                 // );

//                 const allowlistedHandles = new Set(
//                     videos
//                         .filter(video => allowlistedChannelHandles.has(video.channelHandle))
//                         .map(video => video.channelHandle)
//                 );

//                 console.log(allowlistedHandles);

//                 window.postMessage({
//                     type: "START_INFINITE_SCROLLING",
//                     isDisable: true
//                 }, "*");

//                 filterInitialFeed(allowlistedHandles);

//                 resolve(app);
//                 return;
//             }

//             if (attempts >= maxAttempts) {
//                 clearInterval(interval);
//                 reject(new Error("Could not detect ytd-app response"));
//             }
//         }, 250);
//     });
// }

// initializeHomeFeedFiltering();



// function filterInitialFeed(allowlistedChannelHandles) {
//     waitForInitialFeed((initialFeed) => {
//         initialFeed.forEach(elm => {
//             const link = elm.querySelector(
//                 '#content yt-lockup-view-model .ytLockupViewModelMetadata .ytLockupMetadataViewModelTextContainer .ytContentMetadataViewModelHost .ytAttributedStringHost a.ytAttributedStringLink'
//             );

//             // Hide feed items that don't contain the expected regular-video link.
//             // This prevents unsupported content types (e.g. Shorts/Playables sections) from
//             // bypassing the allowlist filter.
//             if(!link) {
//                 console.log('NO LINK:', elm);
//                 elm.style.display = 'none';
//                 return;
//             }

//             const href = link?.getAttribute('href');
//             console.log('DOM LINK:', href);

//             if (!href) {
//                 return;
//             }

//             // const params = new URLSearchParams(href.split('?')[1]);
//             // const videoId = params.get('v');

//             // console.log('DOM VIDEO ID:', videoId);
//             // console.log('IS ALLOWED:', allowlistedHandles.has(videoId));

//             // if (!videoId) {
//             //     // console.log(videoId);
//             //     return;
//             // }

//             if (allowlistedChannelHandles.has(href)) {
//                 // console.log(elm, videoId);
//                 elm.style.display = '';
//             } else {
//                 // console.log(elm, videoId);
//                 elm.style.display = 'none';
//             }

//             // if (!allowlistedVideoIds.has(videoId)) {
//             //     elm.style.display = 'none';
//             // }
//         });
//     });

//     window.postMessage({
//         type: "START_INFINITE_SCROLLING",
//         isDisable: true
//     }, "*");
// }
// function filterInitialFeed() {
//     waitForInitialElements(
//         () =>
//             [...document.querySelectorAll("ytd-rich-item-renderer")]
//                 .filter(item =>
//                     !item.closest("ytd-rich-section-renderer")
//                 ),
//         (videoItems) => {
//             console.log("Initial videos:", videoItems.length);

//             window.postMessage({
//                 type: "START_INFINITE_SCROLLING",
//                 isDisable: true
//             }, "*");

//             videoItems.forEach(filterVideoItem);
//         }
//     );

//     waitForInitialElements(
//         () => [
//             ...document.querySelectorAll("ytd-rich-section-renderer")
//         ],
//         (sections) => {
//             console.log("Initial sections:", sections.length);

//             sections.forEach(filterSection);
//         }
//     );

//     startFeedObserver();
// }

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

            // videoItems.forEach(filterVideoItem);
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
filterInitialFeed();


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
                filterVideoItem(video);
            }
        });
}


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


// Show or hide a video based on whether its channel is allowlisted.
// Wait for the channel link if YouTube has not rendered it yet.
const hiddenVideos = new WeakSet();

// function filterVideoItem(elm) {
//     const link = elm.querySelector(
//         '#content yt-lockup-view-model .ytLockupViewModelMetadata .ytLockupMetadataViewModelTextContainer .ytContentMetadataViewModelHost .ytAttributedStringHost a.ytAttributedStringLink'
//     );

//     if (!link) {
//         hiddenVideos.add(elm);
//         observeVideoVisibility(elm);
//         elm.style.display = "none";
//         console.log('hello');
//         waitForVideoChannel(elm);
//         return;
//     }

//     const href = link.getAttribute("href");
//     const allowed = allowlistedChannelHandles.has(href);

//     if (allowed) {
//         hiddenVideos.delete(elm);
//         elm.style.display = "";
//     } else {
//         hiddenVideos.add(elm);
//         observeVideoVisibility(elm);
//         elm.style.display = "none";
//     }

//     // if (allowed) {
//     //     elm.style.display = "";
//     // } else {
//     //     observeVideoVisibility(elm);
//     //     elm.style.display = "none";

//     //     // setTimeout(() => {
//     //     //     console.log(
//     //     //         "1 second later:",
//     //     //         elm.style.display,
//     //     //         getComputedStyle(elm).display,
//     //     //         elm
//     //     //     );
//     //     // }, 1000);
//     // }

//     console.log({
//         href,
//         allowed,
//         display: elm.style.display,
//         element: elm
//     });
// }

// const ownDisplayChanges = new WeakMap();

// function setVideoDisplay(elm, display) {
//     ownDisplayChanges.set(elm, display);
//     elm.style.display = display;
// }
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

const observingVisibility = new WeakSet();

function observeVideoVisibility(elm) {
    if (observingVisibility.has(elm)) {
        return;
    }

    observingVisibility.add(elm);

    const observer = new MutationObserver(() => {
        if (hiddenVideos.has(elm) && elm.style.display !== "none") {
            elm.style.display = "none";
        }

        // if (elm.style.display !== "none") {
        //     elm.style.display = "none";
        // }
    });

    observer.observe(elm, {
        attributes: true,
        attributeFilter: ["style"]
    });
}


// Hide the homepage section from the feed.
function filterSection(section) {
    // section filtering logic
    section.style.display = "none";
}


const observedVideoItems = new WeakSet();

function observeVideoItem(elm) {
    if (observedVideoItems.has(elm)) {
        return;
    }

    observedVideoItems.add(elm);

    const observer = new MutationObserver(() => {
        filterVideoItem(elm);
    });

    observer.observe(elm, {
        childList: true,
        subtree: true
    });
}
// function filterInitialFeed() {
//     waitForInitialElements(
//         () =>
//             [...document.querySelectorAll("ytd-rich-item-renderer")]
//                 .filter(item => !item.closest("ytd-rich-section-renderer")),
//         (videoItems) => {
//         console.log(videoItems.length);
//         window.postMessage({
//             type: "START_INFINITE_SCROLLING",
//             isDisable: true
//         }, "*");
//         console.log(videoItems.length);
//         // sections.forEach(section => {
//         //     section.style.display = 'none';
//         // });

//         videoItems.forEach(elm => {
//             const link = elm.querySelector(
//                 '#content yt-lockup-view-model .ytLockupViewModelMetadata .ytLockupMetadataViewModelTextContainer .ytContentMetadataViewModelHost .ytAttributedStringHost a.ytAttributedStringLink'
//             );

//             if(!link) {
//                 console.log('NO LINK:', elm);
//                 elm.style.display = 'none';
//                 return;
//             }

//             const href = link.getAttribute('href');

//             console.log(allowlistedChannelHandles, href);
//             if (allowlistedChannelHandles.has(href)) {
//                 console.log('hello1');
//                 elm.style.display = '';
//             } else {
//                 console.log('hello2');
//                 elm.style.display = 'none';
//             }
//         });

//     });
//     // waitForInitialElements(
//     //     () => [...document.querySelectorAll("ytd-rich-section-renderer")],
//     //     sections => {
//     //         // process sections
//     //         console.log(sections);
//     //         sections.forEach(section => {
//     //             console.log('hello3');
//     //             section.style.display = 'none';
//     //         });
//     //     }
//     // );
// }
// filterInitialFeed();
// function filterInitialFeed(allowlistedHandles) {
//     waitForInitialFeed((initialFeed) => {
//         initialFeed.forEach(elm => {
//             const link = elm.querySelector(
//                 '#content yt-lockup-view-model a.ytLockupViewModelContentImage'
//             );

//             // Hide feed items that don't contain the expected regular-video link.
//             // This prevents unsupported content types (e.g. Shorts/Playables sections) from
//             // bypassing the allowlist filter.
//             if(!link) {
//                 console.log('NO LINK:', elm);
//                 elm.style.display = 'none';
//                 return;
//             }

//             const href = link?.getAttribute('href');
//             console.log('DOM LINK:', href);

//             if (!href) {
//                 return;
//             }

//             const params = new URLSearchParams(href.split('?')[1]);
//             const videoId = params.get('v');

//             console.log('DOM VIDEO ID:', videoId);
//             console.log('IS ALLOWED:', allowlistedHandles.has(videoId));

//             if (!videoId) {
//                 // console.log(videoId);
//                 return;
//             }

//             if (allowlistedVideoIds.has(videoId)) {
//                 // console.log(elm, videoId);
//                 elm.style.display = '';
//             } else {
//                 // console.log(elm, videoId);
//                 elm.style.display = 'none';
//             }

//             // if (!allowlistedVideoIds.has(videoId)) {
//             //     elm.style.display = 'none';
//             // }
//         });
//     });
// }




// async function initializeHomeFeedFiltering() {

//     let attempts = 0;
//     const maxAttempts = 40;

//     return new Promise((resolve, reject) => {
//         const interval = setInterval(() => {
//             attempts++;

//             const app = document.querySelector('ytd-app');
//             // const allElements = document.querySelectorAll('ytd-rich-item-renderer');


//             if (app.data.response) {
//                 clearInterval(interval);

//                 const videoInfos = findVideoInfos(app.data.response);

//                 const map = videoInfos
//                     .filter(content => content.browseId && content.videoId)
//                     .map(content => ({
//                         browseId: content.browseId,
//                         videoId: content.videoId
//                     }));

//                 console.log(videoInfos);
//                 console.log(map);

//                 const setOfMatch = new Set();

//                 map.forEach(c => {
//                     if(allowlistedChannelIds.has(c.browseId)) {
//                         console.log('has');
//                         setOfMatch.add(c);
//                     } else {
//                         console.log('none');
//                     }
//                 }); 

//                 console.log(setOfMatch);

//                 // const allElements = document.querySelectorAll('ytd-rich-item-renderer');

//                 waitForInitialFeed((initialFeed) => {
//                     const initialItems = new Set(initialFeed);
//                     console.log(initialItems);

//                     initialItems.forEach(elm => {
//                     const domVideoId = elm.querySelector('#content yt-lockup-view-model a.ytLockupViewModelContentImage');
//                     // console.log(domVideoId);

//                     const href = domVideoId?.getAttribute("href");
//                     const params = new URLSearchParams(href?.split("?")[1]);

//                     const videoId = params.get("v");

//                     console.log(videoId);

//                     const videoIdMap = new Set([...setOfMatch].map(v => v.videoId));
//                     console.log(videoIdMap);

//                     if(!videoIdMap.has(videoId)) {
//                         elm.style.display = 'none';
//                     }
//                 })
//                 });
                

//                 // const { browseIds, url } =
//                 //     findBrowseEndpoints(app.data.response);

//                 // console.log(browseIds);
//                 // console.log(url);

//                 // const hasAllowlistedChannel =
//                 //     [...browseIds].some(id => allowlistedChannelIds.has(id));

//                 // console.log(hasAllowlistedChannel);

//                 resolve(app);
//                 return;
//             }
//             if (attempts >= maxAttempts) {
//                 clearInterval(interval);
//                 reject(new Error("Could not detect channel info from app data"));
//             }
//         }, 250);
//     });
// }
// initializeHomeFeedFiltering();




// function findVideoInfoFromMetadata(metadata) {
//     let browseEndpoint = null;
//     let watchEndpoint = null;

//     function search(obj) {
//         if (!obj || typeof obj !== "object") {
//             return;
//         }

//         if (!browseEndpoint && obj.browseEndpoint?.browseId && obj.browseEndpoint?.canonicalBaseUrl) {
//             browseEndpoint = obj.browseEndpoint;
//         }

//         if (!watchEndpoint && obj.watchEndpoint?.videoId) {
//             watchEndpoint = obj.watchEndpoint;
//         }

//         if (browseEndpoint && watchEndpoint) {
//             return;
//         }

//         for (const value of Object.values(obj)) {
//             search(value);

//             if (browseEndpoint && watchEndpoint) {
//                 return;
//             }
//         }
//     }

//     search(metadata);

//     if (!browseEndpoint || !watchEndpoint) {
//         return null;
//     }

//     return {
//         browseId: browseEndpoint.browseId,
//         channelHandle: browseEndpoint.canonicalBaseUrl,
//         videoId: watchEndpoint.videoId
//     };
// }



// function findVideoInfos(obj, videoInfos = []) {
//     if (!obj || typeof obj !== "object") {
//         return videoInfos;
//     }

//     if (obj.metadata) {
//         const videoInfo = findVideoInfoFromMetadata(obj.metadata);

//         if (videoInfo) {
//             videoInfos.push(videoInfo);
//         }
//     }

//     for (const value of Object.values(obj)) {
//         findVideoInfos(value, videoInfos);
//     }

//     return videoInfos;
// }

// const videoInfos = findVideoInfos(app.data.response);

// console.log(videoInfos);

