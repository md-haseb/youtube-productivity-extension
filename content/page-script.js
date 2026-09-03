

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

    const href = channelIdLink?.getAttribute("href");

    const channelId = href
        ?.match(/^\/channel\/([^/?]+)/)?.[1];

    const channelName = channelNameLink?.textContent.trim();
    console.log(channelIdLink, channelNameLink);
    console.log(channelId, channelName);
        
    return {
        channelId,
        channelName
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
                channelInfo?.channelName
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