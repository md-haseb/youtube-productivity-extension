
function detectChannelInfo() {
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





function detectChannelInfoFromChannelPage() {
    const channelIdLink = document.querySelector(
        'ytd-video-description-infocards-section-renderer ytd-button-renderer yt-button-shape a[href^="/channel/"][href$="/about"]'
    );

    const href = channelIdLink?.getAttribute("href");

    const channelId = href
        ?.match(/^\/channel\/([^/?]+)/)?.[1];

    // const channelName = document
    //     .querySelector('yt-page-header-view-model #page-header-container h1')
    //     ?.textContent
    //     .trim();

    console.log(channelIdLink);
    console.log(channelId);

    return {
        channelId,
    };
}





let channelInfoInterval = null;

function waitForChannelInfo() {
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
            const channelInfo = detectChannelInfo();

            if (
                channelInfo?.channelId &&
                channelInfo?.channelName
            ) {
                console.log(attempts);
                console.log("Correct channel info found:", channelInfo);

                clearInterval(channelInfoInterval);
                channelInfoInterval = null;

                waitForChannelIcon((src) => {
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






let channelPageInfoInterval = null;

function waitForChannelInfoOnChannelPage() {
    if (channelPageInfoInterval) {
        clearInterval(channelPageInfoInterval);
    }

    let attempts = 0;
    const maxAttempts = 50;

    channelPageInfoInterval = setInterval(() => {
        attempts++;

        const channelInfo = detectChannelInfoFromChannelPage();

        if (channelInfo?.channelId) {
            console.log(attempts);
            console.log("Correct channel info found:", channelInfo);

            clearInterval(channelPageInfoInterval);
            channelPageInfoInterval = null;

            // Continue with icon detection...
            return;
        }

        if (attempts >= maxAttempts) {
            console.log("Channel info not found");

            clearInterval(channelPageInfoInterval);
            channelPageInfoInterval = null;
        }
    }, 100);
}





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

function handleNavigation() {
    const newUrl = location.href;

    if (newUrl === prevUrl) {
        return;
    }

    prevUrl = newUrl;

    console.log("Navigation detected:", newUrl);

    const url = new URL(newUrl);

    if (isWatchPage(url)) {
        console.log("Watch page detected");
        waitForChannelInfo();

        // Channel detection will go here
    } else if (isChannelPage(url)) {
        console.log("Channel Page Detected");
        waitForChannelInfoOnChannelPage();
    } else {
        console.log("Not a watch page");
        sendDefaultChannelInfo();
    }
}

handleNavigation();
setInterval(handleNavigation, 500);






function waitForChannelIcon(callback) {
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







// function extractChannelIdFromChannelPage() {
//     const link = document.querySelector(
//     'ytd-video-description-infocards-section-renderer ytd-button-renderer yt-button-shape a[href^="/channel/"][href$="/about"]'
//     )

//     console.log(link);

//     const channelId = link?.href.match(/\/channel\/([^/]+)/)?.[1];

//     console.log(channelId);
// }
// extractChannelIdFromChannelPage();







// function extractYouTubeHandle() {
//     try {
//         const pathname = location.pathname;
//         const match = pathname.match(/^\/(@[^/]+)/);

//         return match ? match[1] : null;
//     } catch {
//         return null;
//     }
// }
// function extractYouTubeHandle() {
//     try {
//         const pathname = location.pathname;
//         console.log("pathname:", pathname);

//         const match = pathname.match(/^\/(@[^/]+)/);
//         console.log("match:", match);

//         return match ? match[1] : null;
//     } catch (error) {
//         console.log("Handle extraction error:", error);
//         return null;
//     }
// }
// function waitForYouTubeHandle() {
//     return new Promise((resolve, reject) => {
//         let attempts = 0;

//         const interval = setInterval(() => {
//             attempts++;

//             const pathname = location.pathname;
//             const match = pathname.match(/^\/(@[^/]+)/);

//             if (match) {
//                 clearInterval(interval);
//                 resolve(match[1]);
//                 return;
//             }

//             if (attempts >= 100) {
//                 clearInterval(interval);
//                 reject(new Error("YouTube handle not found"));
//             }
//         }, 100);
//     });
// }





// function waitForYtInitialData() {
//     return new Promise((resolve, reject) => {
//         let attempts = 0;

//         const interval = setInterval(() => {
//             attempts++;

//             if (window.ytInitialData) {
//                 clearInterval(interval);

//                 console.log(attempts);
//                 console.log("Found:", window.ytInitialData);

//                 resolve(window.ytInitialData);
//                 return;
//             }

//             if (attempts >= 100) {
//                 clearInterval(interval);

//                 reject(new Error("ytInitialData not found"));
//             }
//         }, 100);
//     });
// }





// function findChannelId(data, handle) {

//     if (!data || typeof data !== "object") {
//         return null;
//     }

//     const endpoint = data.browseEndpoint;
//     const command = data.commandMetadata?.webCommandMetadata;

//     if (
//         endpoint?.browseId?.startsWith("UC") &&
//         endpoint?.canonicalBaseUrl === handle &&
//         command?.url === handle &&
//         command?.webPageType === "WEB_PAGE_TYPE_CHANNEL"
//     ) {
//         return endpoint.browseId;
//     }

//     for (const value of Object.values(data)) {
//         const result = findChannelId(value, handle);

//         if (result) return result;
//     }

//     return null;
// }




// function findAllBrowseIds(obj, results = []) {
//     if (!obj || typeof obj !== "object") {
//         return results;
//     }

//     if (obj.browseId) {
//         results.push({
//             browseId: obj.browseId,
//             canonicalBaseUrl: obj.canonicalBaseUrl
//         });
//     }

//     for (const value of Object.values(obj)) {
//         findAllBrowseIds(value, results);
//     }

//     return results;
// }

// const results1 = findAllBrowseIds(window.ytInitialData);
// console.log(results1);
// const results2 = setTimeout(() => {
//     const res = findAllBrowseIds(window.ytInitialData);
//     console.log(res);
// }, 5000);

// console.log(results);
// function check() {
//     const results = findAllBrowseIds(window.ytInitialData);

//     console.log(
//         new Date().toLocaleTimeString(),
//         results.length
//     );
// }

// check();

// setTimeout(check, 1000);
// setTimeout(check, 3000);
// setTimeout(check, 5000);
// setTimeout(check, 10000);



// async function main() {

//     try {
//         const handle = await waitForYouTubeHandle();

//         console.log("Handle:", handle);

//         const initialDataObj = await waitForYtInitialData();

//         // const channelId = findChannelId(initialDataObj, handle);

//         // console.log("Channel ID:", channelId);
//     } catch (error) {
//         console.log(error.message);
//     }
// }

// main();


