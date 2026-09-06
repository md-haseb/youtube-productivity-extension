

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
function filterInitialFeed() {
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

            videoItems.forEach(filterVideoItem);
        }
    );

    waitForInitialElements(
        () => [
            ...document.querySelectorAll("ytd-rich-section-renderer")
        ],
        (sections) => {
            console.log("Initial sections:", sections.length);

            sections.forEach(filterSection);
        }
    );

    startFeedObserver();
}
filterInitialFeed();

function startFeedObserver() {
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
}

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

function filterVideoItem(elm) {
    const link = elm.querySelector(
        '#content yt-lockup-view-model .ytLockupViewModelMetadata .ytLockupMetadataViewModelTextContainer .ytContentMetadataViewModelHost .ytAttributedStringHost a.ytAttributedStringLink'
    );

    // if (!link) {
    //     console.log("NO LINK:", elm);
    //     elm.style.display = "none";
    //     return;
    // }
    // if (!link) {
    //     console.log("NO LINK:", elm);
    //     console.log("TAG:", elm.tagName);
    //     console.log("CLASS:", elm.className);

    //     elm.style.display = "none";

    //     console.log("DISPLAY AFTER:", getComputedStyle(elm).display);

    //     return;
    // }
    // if (!link) {
    //     console.log("NO LINK:", elm);

    //     elm.style.display = "none";

    //     console.log(
    //         "DISPLAY AFTER:",
    //         getComputedStyle(elm).display
    //     );

    //     setTimeout(() => {
    //         console.log(
    //             "LATER DISPLAY:",
    //             getComputedStyle(elm).display
    //         );
    //     }, 1000);

    //     return;
    // }
    if (!link) {
        elm.style.display = "none";
        waitForVideoChannel(elm);
        return;
    }

    const href = link.getAttribute("href");

    if (allowlistedChannelHandles.has(href)) {
        console.log(allowlistedChannelHandles, href);
        elm.style.display = "";
    } else {
        elm.style.display = "none";
    }
}

function filterSection(section) {
    // section filtering logic
    section.style.display = "none";
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




function findVideoInfoFromMetadata(metadata) {
    let browseEndpoint = null;
    let watchEndpoint = null;

    function search(obj) {
        if (!obj || typeof obj !== "object") {
            return;
        }

        if (!browseEndpoint && obj.browseEndpoint?.browseId && obj.browseEndpoint?.canonicalBaseUrl) {
            browseEndpoint = obj.browseEndpoint;
        }

        if (!watchEndpoint && obj.watchEndpoint?.videoId) {
            watchEndpoint = obj.watchEndpoint;
        }

        if (browseEndpoint && watchEndpoint) {
            return;
        }

        for (const value of Object.values(obj)) {
            search(value);

            if (browseEndpoint && watchEndpoint) {
                return;
            }
        }
    }

    search(metadata);

    if (!browseEndpoint || !watchEndpoint) {
        return null;
    }

    return {
        browseId: browseEndpoint.browseId,
        channelHandle: browseEndpoint.canonicalBaseUrl,
        videoId: watchEndpoint.videoId
    };
}



function findVideoInfos(obj, videoInfos = []) {
    if (!obj || typeof obj !== "object") {
        return videoInfos;
    }

    if (obj.metadata) {
        const videoInfo = findVideoInfoFromMetadata(obj.metadata);

        if (videoInfo) {
            videoInfos.push(videoInfo);
        }
    }

    for (const value of Object.values(obj)) {
        findVideoInfos(value, videoInfos);
    }

    return videoInfos;
}

// const videoInfos = findVideoInfos(app.data.response);

// console.log(videoInfos);



// "metadata": {
//                                                         "lockupMetadataViewModel": {
//                                                             "title": {
//                                                                 "content": "অ্যাপলের প্রধান নির্বাহী কর্মকর্তার পদ থেকে বিদায় নিলেন টিম কুক | Tim Cook | Apple CEO | Somoy TV"
//                                                             },
//                                                             "image": {
//                                                                 "decoratedAvatarViewModel": {
//                                                                     "avatar": {
//                                                                         "avatarViewModel": {
//                                                                             "image": {
//                                                                                 "sources": [
//                                                                                     {
//                                                                                         "url": "https://yt3.ggpht.com/ClEODmtPFKIVyp0D_cWORBGKg-CmoRJCMOigdGgZQCMF-a8uKvXYE3HWHtCO9p32PkgirqBs=s68-c-k-c0x00ffffff-no-rj",
//                                                                                         "width": 68,
//                                                                                         "height": 68
//                                                                                     }
//                                                                                 ]
//                                                                             },
//                                                                             "avatarImageSize": "AVATAR_SIZE_M"
//                                                                         }
//                                                                     },
//                                                                     "a11yLabel": "Go to channel Somoy International",
//                                                                     "rendererContext": {
//                                                                         "commandContext": {
//                                                                             "onTap": {
//                                                                                 "innertubeCommand": {
//                                                                                     "clickTrackingParams": "CPEDENwwIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                     "commandMetadata": {
//                                                                                         "webCommandMetadata": {
//                                                                                             "url": "/@somoyinternational",
//                                                                                             "webPageType": "WEB_PAGE_TYPE_CHANNEL",
//                                                                                             "rootVe": 3611,
//                                                                                             "apiUrl": "/youtubei/v1/browse"
//                                                                                         }
//                                                                                     },
//                                                                                     "browseEndpoint": {
//                                                                                         "browseId": "UCIXugjH-g5bFUqLoYRgiSbg",
//                                                                                         "canonicalBaseUrl": "/@somoyinternational"
//                                                                                     }
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                     }
//                                                                 }
//                                                             },
//                                                             "metadata": {
//                                                                 "contentMetadataViewModel": {
//                                                                     "metadataRows": [
//                                                                         {
//                                                                             "metadataParts": [
//                                                                                 {
//                                                                                     "text": {
//                                                                                         "content": "Somoy International",
//                                                                                         "commandRuns": [
//                                                                                             {
//                                                                                                 "startIndex": 0,
//                                                                                                 "length": 19,
//                                                                                                 "onTap": {
//                                                                                                     "innertubeCommand": {
//                                                                                                         "clickTrackingParams": "CPEDENwwIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                         "commandMetadata": {
//                                                                                                             "webCommandMetadata": {
//                                                                                                                 "url": "/@somoyinternational",
//                                                                                                                 "webPageType": "WEB_PAGE_TYPE_CHANNEL",
//                                                                                                                 "rootVe": 3611,
//                                                                                                                 "apiUrl": "/youtubei/v1/browse"
//                                                                                                             }
//                                                                                                         },
//                                                                                                         "browseEndpoint": {
//                                                                                                             "browseId": "UCIXugjH-g5bFUqLoYRgiSbg",
//                                                                                                             "canonicalBaseUrl": "/@somoyinternational"
//                                                                                                         }
//                                                                                                     }
//                                                                                                 }
//                                                                                             }
//                                                                                         ],
//                                                                                         "styleRuns": [
//                                                                                             {
//                                                                                                 "startIndex": 0,
//                                                                                                 "length": 19,
//                                                                                                 "weightLabel": "FONT_WEIGHT_NORMAL"
//                                                                                             },
//                                                                                             {
//                                                                                                 "startIndex": 19,
//                                                                                                 "styleRunExtensions": {
//                                                                                                     "styleRunColorMapExtension": {
//                                                                                                         "colorMap": [
//                                                                                                             {
//                                                                                                                 "key": "USER_INTERFACE_THEME_DARK",
//                                                                                                                 "value": 4289374890
//                                                                                                             },
//                                                                                                             {
//                                                                                                                 "key": "USER_INTERFACE_THEME_LIGHT",
//                                                                                                                 "value": 4284506208
//                                                                                                             }
//                                                                                                         ]
//                                                                                                     }
//                                                                                                 }
//                                                                                             }
//                                                                                         ],
//                                                                                         "attachmentRuns": [
//                                                                                             {
//                                                                                                 "startIndex": 19,
//                                                                                                 "length": 0,
//                                                                                                 "element": {
//                                                                                                     "type": {
//                                                                                                         "imageType": {
//                                                                                                             "image": {
//                                                                                                                 "sources": [
//                                                                                                                     {
//                                                                                                                         "clientResource": {
//                                                                                                                             "imageName": "CHECK_CIRCLE_FILLED"
//                                                                                                                         },
//                                                                                                                         "width": 14,
//                                                                                                                         "height": 14
//                                                                                                                     }
//                                                                                                                 ]
//                                                                                                             }
//                                                                                                         }
//                                                                                                     },
//                                                                                                     "properties": {
//                                                                                                         "layoutProperties": {
//                                                                                                             "height": {
//                                                                                                                 "value": 14,
//                                                                                                                 "unit": "DIMENSION_UNIT_POINT"
//                                                                                                             },
//                                                                                                             "width": {
//                                                                                                                 "value": 14,
//                                                                                                                 "unit": "DIMENSION_UNIT_POINT"
//                                                                                                             },
//                                                                                                             "margin": {
//                                                                                                                 "left": {
//                                                                                                                     "value": 4,
//                                                                                                                     "unit": "DIMENSION_UNIT_POINT"
//                                                                                                                 }
//                                                                                                             }
//                                                                                                         }
//                                                                                                     }
//                                                                                                 },
//                                                                                                 "alignment": "ALIGNMENT_VERTICAL_CENTER"
//                                                                                             }
//                                                                                         ]
//                                                                                     }
//                                                                                 }
//                                                                             ]
//                                                                         },
//                                                                         {
//                                                                             "metadataParts": [
//                                                                                 {
//                                                                                     "text": {
//                                                                                         "content": "6.6K views"
//                                                                                     }
//                                                                                 },
//                                                                                 {
//                                                                                     "text": {
//                                                                                         "content": "1 day ago"
//                                                                                     },
//                                                                                     "accessibilityLabel": "1 day ago"
//                                                                                 }
//                                                                             ]
//                                                                         }
//                                                                     ],
//                                                                     "delimiter": " • "
//                                                                 }
//                                                             },
//                                                             "menuButton": {
//                                                                 "buttonViewModel": {
//                                                                     "iconName": "MORE_VERT",
//                                                                     "onTap": {
//                                                                         "innertubeCommand": {
//                                                                             "clickTrackingParams": "CPIDEPBbIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                             "showSheetCommand": {
//                                                                                 "panelLoadingStrategy": {
//                                                                                     "inlineContent": {
//                                                                                         "sheetViewModel": {
//                                                                                             "content": {
//                                                                                                 "listViewModel": {
//                                                                                                     "listItems": [
//                                                                                                         {
//                                                                                                             "listItemViewModel": {
//                                                                                                                 "title": {
//                                                                                                                     "content": "Add to queue"
//                                                                                                                 },
//                                                                                                                 "leadingImage": {
//                                                                                                                     "sources": [
//                                                                                                                         {
//                                                                                                                             "clientResource": {
//                                                                                                                                 "imageName": "ADD_TO_QUEUE_TAIL"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     ]
//                                                                                                                 },
//                                                                                                                 "rendererContext": {
//                                                                                                                     "loggingContext": {
//                                                                                                                         "loggingDirectives": {
//                                                                                                                             "trackingParams": "CP0DEP6YBBgAIhMIuaCzsK_TlgMVBUE4BR04HAzZ",
//                                                                                                                             "visibility": {
//                                                                                                                                 "types": "12"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     },
//                                                                                                                     "commandContext": {
//                                                                                                                         "onTap": {
//                                                                                                                             "innertubeCommand": {
//                                                                                                                                 "clickTrackingParams": "CP0DEP6YBBgAIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                 "commandMetadata": {
//                                                                                                                                     "webCommandMetadata": {
//                                                                                                                                         "sendPost": true
//                                                                                                                                     }
//                                                                                                                                 },
//                                                                                                                                 "signalServiceEndpoint": {
//                                                                                                                                     "signal": "CLIENT_SIGNAL",
//                                                                                                                                     "actions": [
//                                                                                                                                         {
//                                                                                                                                             "clickTrackingParams": "CP0DEP6YBBgAIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                             "addToPlaylistCommand": {
//                                                                                                                                                 "openMiniplayer": true,
//                                                                                                                                                 "videoId": "eWpHHU8a1OE",
//                                                                                                                                                 "listType": "PLAYLIST_EDIT_LIST_TYPE_QUEUE",
//                                                                                                                                                 "onCreateListCommand": {
//                                                                                                                                                     "clickTrackingParams": "CP0DEP6YBBgAIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                                     "commandMetadata": {
//                                                                                                                                                         "webCommandMetadata": {
//                                                                                                                                                             "sendPost": true,
//                                                                                                                                                             "apiUrl": "/youtubei/v1/playlist/create"
//                                                                                                                                                         }
//                                                                                                                                                     },
//                                                                                                                                                     "createPlaylistServiceEndpoint": {
//                                                                                                                                                         "videoIds": [
//                                                                                                                                                             "eWpHHU8a1OE"
//                                                                                                                                                         ],
//                                                                                                                                                         "params": "CAQ%3D"
//                                                                                                                                                     }
//                                                                                                                                                 },
//                                                                                                                                                 "videoIds": [
//                                                                                                                                                     "eWpHHU8a1OE"
//                                                                                                                                                 ],
//                                                                                                                                                 "videoCommand": {
//                                                                                                                                                     "clickTrackingParams": "CP0DEP6YBBgAIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                                     "commandMetadata": {
//                                                                                                                                                         "webCommandMetadata": {
//                                                                                                                                                             "url": "/watch?v=eWpHHU8a1OE",
//                                                                                                                                                             "webPageType": "WEB_PAGE_TYPE_WATCH",
//                                                                                                                                                             "rootVe": 3832
//                                                                                                                                                         }
//                                                                                                                                                     },
//                                                                                                                                                     "watchEndpoint": {
//                                                                                                                                                         "videoId": "eWpHHU8a1OE",
//                                                                                                                                                         "watchEndpointSupportedOnesieConfig": {
//                                                                                                                                                             "html5PlaybackOnesieConfig": {
//                                                                                                                                                                 "commonConfig": {
//                                                                                                                                                                     "url": "https://rr2---sn-nh5mi0c-q5jk.googlevideo.com/initplayback?source=youtube&oeis=1&c=WEB&oad=3200&ovd=3200&oaad=11000&oavd=11000&ocs=700&oewis=1&oputc=1&olis=1&ofpcc=1&siu=1&msp=1&odepv=1&id=796a471d4f1ad4e1&ip=103.144.43.90&initcwndbps=962500&mt=1788471167&oweuc="
//                                                                                                                                                                 }
//                                                                                                                                                             }
//                                                                                                                                                         }
//                                                                                                                                                     }
//                                                                                                                                                 }
//                                                                                                                                             }
//                                                                                                                                         }
//                                                                                                                                     ]
//                                                                                                                                 }
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     }
//                                                                                                                 }
//                                                                                                             }
//                                                                                                         },
//                                                                                                         {
//                                                                                                             "listItemViewModel": {
//                                                                                                                 "title": {
//                                                                                                                     "content": "Save to Watch later"
//                                                                                                                 },
//                                                                                                                 "leadingImage": {
//                                                                                                                     "sources": [
//                                                                                                                         {
//                                                                                                                             "clientResource": {
//                                                                                                                                 "imageName": "WATCH_LATER"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     ]
//                                                                                                                 },
//                                                                                                                 "rendererContext": {
//                                                                                                                     "commandContext": {
//                                                                                                                         "onTap": {
//                                                                                                                             "innertubeCommand": {
//                                                                                                                                 "clickTrackingParams": "CPIDEPBbIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                 "commandMetadata": {
//                                                                                                                                     "webCommandMetadata": {
//                                                                                                                                         "sendPost": true,
//                                                                                                                                         "apiUrl": "/youtubei/v1/browse/edit_playlist"
//                                                                                                                                     }
//                                                                                                                                 },
//                                                                                                                                 "playlistEditEndpoint": {
//                                                                                                                                     "playlistId": "WL",
//                                                                                                                                     "actions": [
//                                                                                                                                         {
//                                                                                                                                             "addedVideoId": "eWpHHU8a1OE",
//                                                                                                                                             "action": "ACTION_ADD_VIDEO"
//                                                                                                                                         }
//                                                                                                                                     ]
//                                                                                                                                 }
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     }
//                                                                                                                 }
//                                                                                                             }
//                                                                                                         },
//                                                                                                         {
//                                                                                                             "listItemViewModel": {
//                                                                                                                 "title": {
//                                                                                                                     "content": "Save to playlist"
//                                                                                                                 },
//                                                                                                                 "leadingImage": {
//                                                                                                                     "sources": [
//                                                                                                                         {
//                                                                                                                             "clientResource": {
//                                                                                                                                 "imageName": "BOOKMARK_BORDER"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     ]
//                                                                                                                 },
//                                                                                                                 "rendererContext": {
//                                                                                                                     "loggingContext": {
//                                                                                                                         "loggingDirectives": {
//                                                                                                                             "trackingParams": "CPwDEJSsCRgCIhMIuaCzsK_TlgMVBUE4BR04HAzZ",
//                                                                                                                             "visibility": {
//                                                                                                                                 "types": "12"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     },
//                                                                                                                     "commandContext": {
//                                                                                                                         "onTap": {
//                                                                                                                             "innertubeCommand": {
//                                                                                                                                 "clickTrackingParams": "CPwDEJSsCRgCIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                 "commandMetadata": {
//                                                                                                                                     "interactionLoggingCommandMetadata": {
//                                                                                                                                         "screenVisualElement": {
//                                                                                                                                             "uiType": 264491
//                                                                                                                                         }
//                                                                                                                                     }
//                                                                                                                                 },
//                                                                                                                                 "showSheetCommand": {
//                                                                                                                                     "panelLoadingStrategy": {
//                                                                                                                                         "requestTemplate": {
//                                                                                                                                             "panelId": "PAadd_to_playlist",
//                                                                                                                                             "params": "-gYNCgtlV3BISFU4YTFPRQ%3D%3D"
//                                                                                                                                         },
//                                                                                                                                         "screenVe": 264491
//                                                                                                                                     },
//                                                                                                                                     "contextualSheetPresentationConfig": {
//                                                                                                                                         "expandToFullWidth": true
//                                                                                                                                     }
//                                                                                                                                 }
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     }
//                                                                                                                 }
//                                                                                                             }
//                                                                                                         },
//                                                                                                         {
//                                                                                                             "downloadListItemViewModel": {
//                                                                                                                 "rendererContext": {
//                                                                                                                     "loggingContext": {
//                                                                                                                         "loggingDirectives": {
//                                                                                                                             "trackingParams": "CPsDENGqBRgDIhMIuaCzsK_TlgMVBUE4BR04HAzZ",
//                                                                                                                             "visibility": {
//                                                                                                                                 "types": "12"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     },
//                                                                                                                     "commandContext": {
//                                                                                                                         "onTap": {
//                                                                                                                             "innertubeCommand": {
//                                                                                                                                 "clickTrackingParams": "CPsDENGqBRgDIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                 "offlineVideoEndpoint": {
//                                                                                                                                     "videoId": "eWpHHU8a1OE",
//                                                                                                                                     "onAddCommand": {
//                                                                                                                                         "clickTrackingParams": "CPsDENGqBRgDIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                         "getDownloadActionCommand": {
//                                                                                                                                             "videoId": "eWpHHU8a1OE",
//                                                                                                                                             "params": "CAIQAA%3D%3D",
//                                                                                                                                             "isCrossDeviceDownload": false
//                                                                                                                                         }
//                                                                                                                                     }
//                                                                                                                                 }
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     }
//                                                                                                                 }
//                                                                                                             }
//                                                                                                         },
//                                                                                                         {
//                                                                                                             "listItemViewModel": {
//                                                                                                                 "title": {
//                                                                                                                     "content": "Share"
//                                                                                                                 },
//                                                                                                                 "leadingImage": {
//                                                                                                                     "sources": [
//                                                                                                                         {
//                                                                                                                             "clientResource": {
//                                                                                                                                 "imageName": "SHARE"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     ]
//                                                                                                                 },
//                                                                                                                 "rendererContext": {
//                                                                                                                     "commandContext": {
//                                                                                                                         "onTap": {
//                                                                                                                             "innertubeCommand": {
//                                                                                                                                 "clickTrackingParams": "CPIDEPBbIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                 "commandMetadata": {
//                                                                                                                                     "webCommandMetadata": {
//                                                                                                                                         "sendPost": true,
//                                                                                                                                         "apiUrl": "/youtubei/v1/share/get_share_panel"
//                                                                                                                                     }
//                                                                                                                                 },
//                                                                                                                                 "shareEntityServiceEndpoint": {
//                                                                                                                                     "serializedShareEntity": "CgtlV3BISFU4YTFPRQ%3D%3D",
//                                                                                                                                     "commands": [
//                                                                                                                                         {
//                                                                                                                                             "clickTrackingParams": "CPIDEPBbIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                             "openPopupAction": {
//                                                                                                                                                 "popup": {
//                                                                                                                                                     "unifiedSharePanelRenderer": {
//                                                                                                                                                         "trackingParams": "CPoDEI5iIhMIuaCzsK_TlgMVBUE4BR04HAzZ",
//                                                                                                                                                         "showLoadingSpinner": true
//                                                                                                                                                     }
//                                                                                                                                                 },
//                                                                                                                                                 "popupType": "DIALOG",
//                                                                                                                                                 "beReused": true
//                                                                                                                                             }
//                                                                                                                                         }
//                                                                                                                                     ]
//                                                                                                                                 }
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     }
//                                                                                                                 }
//                                                                                                             }
//                                                                                                         },
//                                                                                                         {
//                                                                                                             "listItemViewModel": {
//                                                                                                                 "title": {
//                                                                                                                     "content": "Not interested"
//                                                                                                                 },
//                                                                                                                 "leadingImage": {
//                                                                                                                     "sources": [
//                                                                                                                         {
//                                                                                                                             "clientResource": {
//                                                                                                                                 "imageName": "HIDE"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     ]
//                                                                                                                 },
//                                                                                                                 "rendererContext": {
//                                                                                                                     "commandContext": {
//                                                                                                                         "onTap": {
//                                                                                                                             "innertubeCommand": {
//                                                                                                                                 "clickTrackingParams": "CPIDEPBbIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                 "commandMetadata": {
//                                                                                                                                     "webCommandMetadata": {
//                                                                                                                                         "sendPost": true,
//                                                                                                                                         "apiUrl": "/youtubei/v1/feedback"
//                                                                                                                                     }
//                                                                                                                                 },
//                                                                                                                                 "feedbackEndpoint": {
//                                                                                                                                     "feedbackToken": "AB9zfpIyMZR1k-8DPclt7LBncksXbcgIXJgPPirs7IRk5JHErswnC00Dl2RALS0BDqmNvlP6LThHOgy_yd0zX3kRqqx0Y_5UD_z5YpW5DcGvHJxANDZPDvVw5AivQwuYlf2giovacL5-",
//                                                                                                                                     "uiActions": {
//                                                                                                                                         "hideEnclosingContainer": true
//                                                                                                                                     },
//                                                                                                                                     "actions": [
//                                                                                                                                         {
//                                                                                                                                             "clickTrackingParams": "CPIDEPBbIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                             "replaceEnclosingAction": {
//                                                                                                                                                 "item": {
//                                                                                                                                                     "notificationMultiActionRenderer": {
//                                                                                                                                                         "responseText": {
//                                                                                                                                                             "accessibility": {
//                                                                                                                                                                 "accessibilityData": {
//                                                                                                                                                                     "label": "Video removed: অ্যাপলের প্রধান নির্বাহী কর্মকর্তার পদ থেকে বিদায় নিলেন টিম কুক | Tim Cook | Apple CEO | Somoy TV."
//                                                                                                                                                                 }
//                                                                                                                                                             },
//                                                                                                                                                             "simpleText": "Video removed"
//                                                                                                                                                         },
//                                                                                                                                                         "buttons": [
//                                                                                                                                                             {
//                                                                                                                                                                 "buttonRenderer": {
//                                                                                                                                                                     "style": "STYLE_BLUE_TEXT",
//                                                                                                                                                                     "text": {
//                                                                                                                                                                         "simpleText": "Undo"
//                                                                                                                                                                     },
//                                                                                                                                                                     "serviceEndpoint": {
//                                                                                                                                                                         "clickTrackingParams": "CPkDEPBbGAAiEwi5oLOwr9OWAxUFQTgFHTgcDNnKAQRRh1u9",
//                                                                                                                                                                         "commandMetadata": {
//                                                                                                                                                                             "webCommandMetadata": {
//                                                                                                                                                                                 "sendPost": true,
//                                                                                                                                                                                 "apiUrl": "/youtubei/v1/feedback"
//                                                                                                                                                                             }
//                                                                                                                                                                         },
//                                                                                                                                                                         "undoFeedbackEndpoint": {
//                                                                                                                                                                             "undoToken": "AB9zfpJ69IQ8lS5CJ0mQ5uq5i4r5FnGacjOqOi9iFoYK9xAPPi-8x77rBfr08aHvOFF-wLEJDnA8N_h0syYj7WVvuw2NdxuHqVTxWVwQ6ThUzqvbcPunpAJ0bnTncb_zJM-yTd-Ywgkb",
//                                                                                                                                                                             "actions": [
//                                                                                                                                                                                 {
//                                                                                                                                                                                     "clickTrackingParams": "CPkDEPBbGAAiEwi5oLOwr9OWAxUFQTgFHTgcDNnKAQRRh1u9",
//                                                                                                                                                                                     "undoFeedbackAction": {
//                                                                                                                                                                                         "hack": true
//                                                                                                                                                                                     }
//                                                                                                                                                                                 }
//                                                                                                                                                                             ],
//                                                                                                                                                                             "contentId": "eWpHHU8a1OE"
//                                                                                                                                                                         }
//                                                                                                                                                                     },
//                                                                                                                                                                     "trackingParams": "CPkDEPBbGAAiEwi5oLOwr9OWAxUFQTgFHTgcDNk="
//                                                                                                                                                                 }
//                                                                                                                                                             },
//                                                                                                                                                             {
//                                                                                                                                                                 "buttonRenderer": {
//                                                                                                                                                                     "style": "STYLE_BLUE_TEXT",
//                                                                                                                                                                     "text": {
//                                                                                                                                                                         "runs": [
//                                                                                                                                                                             {
//                                                                                                                                                                                 "text": "Tell us why"
//                                                                                                                                                                             }
//                                                                                                                                                                         ]
//                                                                                                                                                                     },
//                                                                                                                                                                     "serviceEndpoint": {
//                                                                                                                                                                         "clickTrackingParams": "CPgDEPBbGAEiEwi5oLOwr9OWAxUFQTgFHTgcDNnKAQRRh1u9",
//                                                                                                                                                                         "commandMetadata": {
//                                                                                                                                                                             "webCommandMetadata": {
//                                                                                                                                                                                 "sendPost": true
//                                                                                                                                                                             }
//                                                                                                                                                                         },
//                                                                                                                                                                         "signalServiceEndpoint": {
//                                                                                                                                                                             "signal": "CLIENT_SIGNAL",
//                                                                                                                                                                             "actions": [
//                                                                                                                                                                                 {
//                                                                                                                                                                                     "clickTrackingParams": "CPgDEPBbGAEiEwi5oLOwr9OWAxUFQTgFHTgcDNnKAQRRh1u9",
//                                                                                                                                                                                     "signalAction": {
//                                                                                                                                                                                         "signal": "TELL_US_WHY",
//                                                                                                                                                                                         "targetId": "eWpHHU8a1OE"
//                                                                                                                                                                                     }
//                                                                                                                                                                                 }
//                                                                                                                                                                             ]
//                                                                                                                                                                         }
//                                                                                                                                                                     },
//                                                                                                                                                                     "trackingParams": "CPgDEPBbGAEiEwi5oLOwr9OWAxUFQTgFHTgcDNk="
//                                                                                                                                                                 }
//                                                                                                                                                             }
//                                                                                                                                                         ],
//                                                                                                                                                         "trackingParams": "CPcDEKW8ASITCLmgs7Cv05YDFQVBOAUdOBwM2Q==",
//                                                                                                                                                         "dismissalViewStyle": "DISMISSAL_VIEW_STYLE_COMPACT_TALL"
//                                                                                                                                                     }
//                                                                                                                                                 }
//                                                                                                                                             }
//                                                                                                                                         }
//                                                                                                                                     ],
//                                                                                                                                     "contentId": "eWpHHU8a1OE"
//                                                                                                                                 }
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     }
//                                                                                                                 }
//                                                                                                             }
//                                                                                                         },
//                                                                                                         {
//                                                                                                             "listItemViewModel": {
//                                                                                                                 "title": {
//                                                                                                                     "content": "Don't recommend channel"
//                                                                                                                 },
//                                                                                                                 "leadingImage": {
//                                                                                                                     "sources": [
//                                                                                                                         {
//                                                                                                                             "clientResource": {
//                                                                                                                                 "imageName": "REMOVE"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     ]
//                                                                                                                 },
//                                                                                                                 "rendererContext": {
//                                                                                                                     "loggingContext": {
//                                                                                                                         "loggingDirectives": {
//                                                                                                                             "trackingParams": "CPMDEPLPAxgGIhMIuaCzsK_TlgMVBUE4BR04HAzZ",
//                                                                                                                             "visibility": {
//                                                                                                                                 "types": "12"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     },
//                                                                                                                     "commandContext": {
//                                                                                                                         "onTap": {
//                                                                                                                             "innertubeCommand": {
//                                                                                                                                 "clickTrackingParams": "CPMDEPLPAxgGIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                 "commandMetadata": {
//                                                                                                                                     "webCommandMetadata": {
//                                                                                                                                         "sendPost": true,
//                                                                                                                                         "apiUrl": "/youtubei/v1/feedback"
//                                                                                                                                     }
//                                                                                                                                 },
//                                                                                                                                 "feedbackEndpoint": {
//                                                                                                                                     "feedbackToken": "AB9zfpKoTcHa1oWbU86zutM6L4LSwRiqi7Wnj331Q-vY6XhRGrF-GtI-rOLVZMdcPV5jmqKjQjdi5maqhVR60KT1fjdtxt3bR6G0xNxIQmzaOHrsTZBk5X_EeqjqxpE0LFRs4jb4-2XTLLTOgBMk8WwN41pUzufVG18mXMGsNORgOGHLOqUgrak",
//                                                                                                                                     "uiActions": {
//                                                                                                                                         "hideEnclosingContainer": true
//                                                                                                                                     },
//                                                                                                                                     "actions": [
//                                                                                                                                         {
//                                                                                                                                             "clickTrackingParams": "CPMDEPLPAxgGIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                             "replaceEnclosingAction": {
//                                                                                                                                                 "item": {
//                                                                                                                                                     "notificationMultiActionRenderer": {
//                                                                                                                                                         "responseText": {
//                                                                                                                                                             "runs": [
//                                                                                                                                                                 {
//                                                                                                                                                                     "text": "We won't recommend videos from this channel to you again"
//                                                                                                                                                                 }
//                                                                                                                                                             ],
//                                                                                                                                                             "accessibility": {
//                                                                                                                                                                 "accessibilityData": {
//                                                                                                                                                                     "label": "We won't recommend videos from this channel to you again"
//                                                                                                                                                                 }
//                                                                                                                                                             }
//                                                                                                                                                         },
//                                                                                                                                                         "buttons": [
//                                                                                                                                                             {
//                                                                                                                                                                 "buttonRenderer": {
//                                                                                                                                                                     "style": "STYLE_BLUE_TEXT",
//                                                                                                                                                                     "text": {
//                                                                                                                                                                         "simpleText": "Undo"
//                                                                                                                                                                     },
//                                                                                                                                                                     "serviceEndpoint": {
//                                                                                                                                                                         "clickTrackingParams": "CPYDEPBbGAAiEwi5oLOwr9OWAxUFQTgFHTgcDNnKAQRRh1u9",
//                                                                                                                                                                         "commandMetadata": {
//                                                                                                                                                                             "webCommandMetadata": {
//                                                                                                                                                                                 "sendPost": true,
//                                                                                                                                                                                 "apiUrl": "/youtubei/v1/feedback"
//                                                                                                                                                                             }
//                                                                                                                                                                         },
//                                                                                                                                                                         "undoFeedbackEndpoint": {
//                                                                                                                                                                             "undoToken": "AB9zfpKw4PBpVHCeXfKNU22SGxjwBay7JJOYHMXsrRx3UG6UkIv5BOsg0z1tvxGPJNRmbISF_o29pw3HfSKM67LlER3YKaAHELC6WGfZUIiuLuJCUWcPgssaR6vO2CkqIZa7ATavU_VlYUAC0ypNroTLpq6Vm5MCxL0mP0I-3yBfm_oF-pVgZno",
//                                                                                                                                                                             "actions": [
//                                                                                                                                                                                 {
//                                                                                                                                                                                     "clickTrackingParams": "CPYDEPBbGAAiEwi5oLOwr9OWAxUFQTgFHTgcDNnKAQRRh1u9",
//                                                                                                                                                                                     "undoFeedbackAction": {
//                                                                                                                                                                                         "hack": true
//                                                                                                                                                                                     }
//                                                                                                                                                                                 }
//                                                                                                                                                                             ],
//                                                                                                                                                                             "contentId": "eWpHHU8a1OE"
//                                                                                                                                                                         }
//                                                                                                                                                                     },
//                                                                                                                                                                     "trackingParams": "CPYDEPBbGAAiEwi5oLOwr9OWAxUFQTgFHTgcDNk="
//                                                                                                                                                                 }
//                                                                                                                                                             },
//                                                                                                                                                             {
//                                                                                                                                                                 "buttonRenderer": {
//                                                                                                                                                                     "style": "STYLE_BLUE_TEXT",
//                                                                                                                                                                     "text": {
//                                                                                                                                                                         "simpleText": "Learn more"
//                                                                                                                                                                     },
//                                                                                                                                                                     "trackingParams": "CPUDEPBbGAEiEwi5oLOwr9OWAxUFQTgFHTgcDNk=",
//                                                                                                                                                                     "command": {
//                                                                                                                                                                         "clickTrackingParams": "CPUDEPBbGAEiEwi5oLOwr9OWAxUFQTgFHTgcDNnKAQRRh1u9",
//                                                                                                                                                                         "commandMetadata": {
//                                                                                                                                                                             "webCommandMetadata": {
//                                                                                                                                                                                 "url": "//support.google.com/youtube/answer/6342839?hl=en",
//                                                                                                                                                                                 "webPageType": "WEB_PAGE_TYPE_UNKNOWN",
//                                                                                                                                                                                 "rootVe": 83769
//                                                                                                                                                                             }
//                                                                                                                                                                         },
//                                                                                                                                                                         "urlEndpoint": {
//                                                                                                                                                                             "url": "//support.google.com/youtube/answer/6342839?hl=en",
//                                                                                                                                                                             "target": "TARGET_NEW_WINDOW"
//                                                                                                                                                                         }
//                                                                                                                                                                     }
//                                                                                                                                                                 }
//                                                                                                                                                             }
//                                                                                                                                                         ],
//                                                                                                                                                         "trackingParams": "CPQDEKW8ASITCLmgs7Cv05YDFQVBOAUdOBwM2Q==",
//                                                                                                                                                         "dismissalViewStyle": "DISMISSAL_VIEW_STYLE_COMPACT_TALL"
//                                                                                                                                                     }
//                                                                                                                                                 }
//                                                                                                                                             }
//                                                                                                                                         }
//                                                                                                                                     ],
//                                                                                                                                     "contentId": "eWpHHU8a1OE"
//                                                                                                                                 }
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     }
//                                                                                                                 }
//                                                                                                             }
//                                                                                                         },
//                                                                                                         {
//                                                                                                             "listItemViewModel": {
//                                                                                                                 "title": {
//                                                                                                                     "content": "Report"
//                                                                                                                 },
//                                                                                                                 "leadingImage": {
//                                                                                                                     "sources": [
//                                                                                                                         {
//                                                                                                                             "clientResource": {
//                                                                                                                                 "imageName": "FLAG"
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     ]
//                                                                                                                 },
//                                                                                                                 "rendererContext": {
//                                                                                                                     "commandContext": {
//                                                                                                                         "onTap": {
//                                                                                                                             "innertubeCommand": {
//                                                                                                                                 "clickTrackingParams": "CPIDEPBbIhMIuaCzsK_TlgMVBUE4BR04HAzZygEEUYdbvQ==",
//                                                                                                                                 "commandMetadata": {
//                                                                                                                                     "webCommandMetadata": {
//                                                                                                                                         "sendPost": true,
//                                                                                                                                         "apiUrl": "/youtubei/v1/flag/get_form"
//                                                                                                                                     }
//                                                                                                                                 },
//                                                                                                                                 "getReportFormEndpoint": {
//                                                                                                                                     "params": "EgtlV3BISFU4YTFPRUABWABwAXgC2AEA6AEA"
//                                                                                                                                 }
//                                                                                                                             }
//                                                                                                                         }
//                                                                                                                     }
//                                                                                                                 }
//                                                                                                             }
//                                                                                                         }
//                                                                                                     ]
//                                                                                                 }
//                                                                                             }
//                                                                                         }
//                                                                                     }
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                     },
//                                                                     "accessibilityText": "More actions",
//                                                                     "style": "BUTTON_VIEW_MODEL_STYLE_MONO",
//                                                                     "trackingParams": "CPIDEPBbIhMIuaCzsK_TlgMVBUE4BR04HAzZ",
//                                                                     "type": "BUTTON_VIEW_MODEL_TYPE_TEXT",
//                                                                     "buttonSize": "BUTTON_VIEW_MODEL_SIZE_DEFAULT",
//                                                                     "state": "BUTTON_VIEW_MODEL_STATE_ACTIVE"
//                                                                 }
//                                                             }
//                                                         }
//                                                     },


