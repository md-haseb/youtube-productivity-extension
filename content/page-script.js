// function detectChannelInfo() {
//     const playerResponse = window.ytInitialPlayerResponse;
//     console.log(window.ytInitialPlayerResponse);

//     const channelId = playerResponse?.videoDetails?.channelId;
//     const channelName = playerResponse?.videoDetails?.author;

//     if (channelId && channelName) {
//         console.log(channelId, channelName);
//         window.postMessage(
//             {
//                 type: "YOUTUBE_CHANNEL_INFO",
//                 channelId,
//                 channelName
//             },
//             "*"
//         );

//         return true;
//     }

//     return false;
// }

// function detectChannelInfo() {
//     // =========================================================
//     // 1. DOM: YouTube player "current channel"
//     // =========================================================
//     const playerChannel = document.querySelector(
//         '.ytp-ce-channel-this a.ytp-ce-channel-title'
//     );
//     console.log(playerChannel);

//     if (playerChannel) {
//         const href = playerChannel.getAttribute('href');
//         console.log('hello');

//         const match = href?.match(
//             /\/channel\/([^/?]+)/
//         );

//         if (match) {
//             return {
//                 channelId: match[1],
//                 channelName: playerChannel.textContent.trim(),
//                 source: 'dom-player'
//             };
//         }
//     }


//     // =========================================================
//     // 2. ytInitialData: video's shortBylineText
//     // =========================================================
//     const initialData = window.ytInitialData;

//     const videoContents =
//         initialData
//             ?.contents
//             ?.twoColumnWatchNextResults
//             ?.results
//             ?.results
//             ?.contents;

//     const videoPrimaryInfo = videoContents?.find(
//         item => item.videoPrimaryInfoRenderer
//     )?.videoPrimaryInfoRenderer;

//     const shortByline =
//         videoPrimaryInfo
//             ?.shortBylineText
//             ?.runs?.[0];

//     const shortBylineEndpoint =
//         shortByline?.navigationEndpoint;

//     if (
//         shortBylineEndpoint &&
//         isChannelEndpoint(shortBylineEndpoint)
//     ) {
//         console.log('hello');
//         const channelId =
//             shortBylineEndpoint
//                 ?.browseEndpoint
//                 ?.browseId;

//         const channelName =
//             shortByline?.text?.trim();

//         if (channelId) {
//             return {
//                 channelId,
//                 channelName: channelName || null,
//                 source: 'ytInitialData-shortByline'
//             };
//         }
//     }


//     // =========================================================
//     // 3. ytInitialData: videoSecondaryInfoRenderer → owner
//     // =========================================================
//     const secondaryInfo =
//         videoContents?.find(
//             item => item.videoSecondaryInfoRenderer
//         )?.videoSecondaryInfoRenderer;

//     const owner =
//         secondaryInfo
//             ?.owner
//             ?.videoOwnerRenderer;

//     const ownerEndpoint =
//         owner?.navigationEndpoint;

//     if (
//         ownerEndpoint &&
//         isChannelEndpoint(ownerEndpoint)
//     ) {
//         console.log('hello');
//         const channelId =
//             ownerEndpoint
//                 ?.browseEndpoint
//                 ?.browseId;

//         const channelName =
//             owner?.title
//                 ?.simpleText ??
//             owner?.title
//                 ?.runs?.[0]?.text ??
//             null;

//         if (channelId) {
//             return {
//                 channelId,
//                 channelName,
//                 source: 'ytInitialData-owner'
//             };
//         }
//     }


//     // =========================================================
//     // Nothing found
//     // =========================================================
//     return null;
// }

function detectChannelInfo() {
    console.log("========== CHANNEL DETECTION ==========");

    // DOM
    const playerChannelNodes = document.querySelector(
        'ytd-watch-metadata a[href^="/channel/"]'
    );

    const playerChannel = playerChannelNodes[1];
    console.log(playerChannelNodes);

    console.log("DOM channel:", playerChannel);

    // ytInitialData
    const initialData = window.ytInitialData;

    console.log("ytInitialData exists:", !!initialData);

    const videoContents =
        initialData
            ?.contents
            ?.twoColumnWatchNextResults
            ?.results
            ?.results
            ?.contents;

    console.log("videoContents:", videoContents);

    const videoPrimaryInfo = videoContents?.find(
        item => item.videoPrimaryInfoRenderer
    )?.videoPrimaryInfoRenderer;

    console.log("videoPrimaryInfo:", videoPrimaryInfo);

    const shortByline =
        videoPrimaryInfo?.shortBylineText?.runs?.[0];

    console.log("shortByline:", shortByline);

    // Secondary
    const secondaryInfo =
        videoContents?.find(
            item => item.videoSecondaryInfoRenderer
        )?.videoSecondaryInfoRenderer;

    console.log("secondaryInfo:", secondaryInfo);

    const owner =
        secondaryInfo?.owner?.videoOwnerRenderer;

    console.log("owner:", owner);

    return null;
}


// =============================================================
// Validate that an endpoint actually represents a channel
// =============================================================
function isChannelEndpoint(endpoint) {
    return (
        endpoint
            ?.commandMetadata
            ?.webCommandMetadata
            ?.webPageType === 'WEB_PAGE_TYPE_CHANNEL'
    );
}


function waitForChannelInfo() {
    let attempts = 0;

    const interval = setInterval(() => {
        attempts++;

        if (detectChannelInfo() || attempts >= 1) {
            console.log(detectChannelInfo());
            clearInterval(interval);
        }
    }, 100);
}




let currentUrl = null;

function isWatchPage(url) {
    return (
        url.pathname === "/watch" &&
        url.searchParams.has("v")
    );
}

function handleNavigation() {
    const newUrl = location.href;

    if (newUrl === currentUrl) {
        return;
    }

    currentUrl = newUrl;

    console.log("Navigation detected:", newUrl);

    const url = new URL(newUrl);

    if (isWatchPage(url)) {
        console.log("Watch page detected");
        waitForChannelInfo();

        // Channel detection will go here
    } else {
        console.log("Not a watch page");
    }
}

handleNavigation();
setInterval(handleNavigation, 500);






// function checkInitialPage() {
//     const url = new URL(location.href);

//     if (isWatchPage(url)) {
//         console.log("Initial watch page detected");

//         // Channel detection will go here
//     } else {
//         console.log("Initial page is not a watch page");
//     }
// }






// Detect YouTube SPA navigation
// const originalPushState = history.pushState;
// const originalReplaceState = history.replaceState;

// history.pushState = function (...args) {
//     console.log('hello');
//     originalPushState.apply(this, args);
//     handleNavigation();
// };

// history.replaceState = function (...args) {
//   console.log('hello');
//     originalReplaceState.apply(this, args);
//     handleNavigation();
// };

// window.addEventListener("popstate", handleNavigation);







// Check the page when the script initially loads
// checkInitialPage();