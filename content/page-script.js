const playerResponse = window.ytInitialPlayerResponse;

const channelId = playerResponse?.videoDetails?.channelId;
const channelName = playerResponse?.videoDetails?.author;

if (channelId && channelName) {
    window.postMessage(
        {
            type: "YOUTUBE_CHANNEL_INFO",
            channelId,
            channelName
        },
        "*"
    );
} else {
  console.log('User is not in watch page');
}






let currentUrl = location.href;

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

        // Channel detection will go here
    } else {
        console.log("Not a watch page");
    }
}

setInterval(handleNavigation, 500);

function checkInitialPage() {
    const url = new URL(location.href);

    if (isWatchPage(url)) {
        console.log("Initial watch page detected");

        // Channel detection will go here
    } else {
        console.log("Initial page is not a watch page");
    }
}

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
checkInitialPage();