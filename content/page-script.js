
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

    console.log(channelIdLink);

    const href = channelIdLink?.getAttribute("href");

    const channelId = href
        ?.match(/^\/channel\/([^/?]+)/)?.[1];

    // const channelName = document
    //     .querySelector('yt-page-header-view-model #page-header-container h1')
    //     ?.textContent
    //     .trim();

    // console.log(channelIdLink);
    // console.log(channelId);

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




async function waitForChannelInfoOnChannelPage() {
    const handle = `/${await waitForYouTubeHandle()}`;

    console.log("Handle:", handle);

    return new Promise((resolve, reject) => {
        let timeout;

        const checkChannel = () => {
            const link = document.querySelector(
                'ytd-video-description-infocards-section-renderer a#header'
            );

            const domHandle = link?.getAttribute('href');

            console.log(handle, domHandle);

            if (domHandle === handle) {
                const channelInfo = detectChannelInfoFromChannelPage();

                if (channelInfo?.channelId) {
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
            attributeFilter: ['href']
        });

        timeout = setTimeout(() => {
            observer.disconnect();
            reject(
                new Error("Channel info not found from DOM")
            );
        }, 5000);
    });
}

// async function waitForChannelInfoOnChannelPage(callback) {
//     let handle = await waitForYouTubeHandle();

//     handle = `/${handle}`;

//     console.log("Handle:", handle);

//     let timeout;

//     const checkChannel = () => {
//         const link = document.querySelector(
//             'ytd-video-description-infocards-section-renderer a#header'
//         );

//         const domHandle = link?.getAttribute('href');
//         console.log(handle, domHandle);

//         // const canonicalUrl = document
//         //     .querySelector('link[rel="canonical"]')
//         //     ?.getAttribute("href");

//         // const domHandle2 = canonicalUrl
//         //     ? new URL(canonicalUrl).pathname
//         //     : null;

//         // console.log(domHandle2);
//         console.log(handle, domHandle);
//         console.log(typeof handle, typeof domHandle);

//         if (domHandle === handle) {
//             const channelInfo = detectChannelInfoFromChannelPage();
//             console.log('hello');

//             if (channelInfo?.channelId) {
//                 callback(channelInfo);
//                 return true;
//             }
//         }

//         return false;
//     };

//     // Check immediately
//     if (checkChannel()) return;

//     const observer = new MutationObserver((mutations) => {
//         console.log("Mutation detected:", mutations.length);

//         if (checkChannel()) {
//             observer.disconnect();
//             clearTimeout(timeout);
//         }
//     });

//     observer.observe(document.body, {
//         childList: true,
//         subtree: true,
//         attributes: true,
//         attributeFilter: ['href']
//     });

//     timeout = setTimeout(() => {
//         observer.disconnect();
//         console.log("Channel info not found");
//     }, 5000);
// }
// let channelPageInfoInterval = null;

// async function waitForChannelInfoOnChannelPage() {
//     let handle = await waitForYouTubeHandle();

//     handle = `/${handle}`;

//     console.log("Handle:", handle);

//     if (channelPageInfoInterval) {
//         clearInterval(channelPageInfoInterval);
//     }

//     let attempts = 0;
//     const maxAttempts = 50;

//     channelPageInfoInterval = setInterval(() => {
//         attempts++;

//         const link = document.querySelector('ytd-video-description-infocards-section-renderer a#header');
//         console.log(link);
//         const domHandle = link?.getAttribute('href');
//         console.log(domHandle);
//         console.log(handle);

//         if(handle === domHandle) {
//             const channelInfo = detectChannelInfoFromChannelPage();

//             if (channelInfo?.channelId) {
//                 console.log(attempts);
//                 console.log("Correct channel info found:", channelInfo);

//                 clearInterval(channelPageInfoInterval);
//                 channelPageInfoInterval = null;

//                 // Continue with icon detection...
//                 return;
//             }
//         }

//         if (attempts >= maxAttempts) {
//             console.log("Channel info not found");

//             clearInterval(channelPageInfoInterval);
//             channelPageInfoInterval = null;
//         }
//     }, 100);
// }





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
        waitForChannelInfo();

        // Channel detection will go here
    } 
    else if (isChannelPage(url)) {
        console.log("Channel Page Detected");

        try {
            // 1. Primary: ytd-app
            const channelInfo = await waitForCurrentChannel();

            console.log("Channel info from ytd-app:", channelInfo);

        } catch (error) {

            try {
                // 2. Fallback: ytInitialData
                const channelInfo = await detectChannelInfoFromInitialData();

                console.log("Channel info from ytInitialData:", channelInfo);

            } catch (error) {

                try {
                    // 3. Final fallback: DOM
                    const channelInfo = await waitForChannelInfoOnChannelPage();

                    console.log("Channel info from DOM:", channelInfo);

                } catch (error) {
                    console.log("All channel detection methods failed.");
                }
            }
        }

        // waitForChannelInfoOnChannelPage();
        // try {
        //     await detectChannelInfoFromInitialData();
        // } catch (error) {
        //     console.log("Using fallback...");
        //     // await waitForChannelInfoOnChannelPage();
        //     waitForChannelInfoOnChannelPage((channelInfo) => {
        //         console.log("Fallback channel info:", channelInfo);
        //     });
        // }
    } 
    else {
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





function waitForYtInitialData(handle) {
    // const handle = `/${extractYouTubeHandle()}`;
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const interval = setInterval(() => {
            attempts++;

            if (window.ytInitialData) {
                // console.log(typeof(window.ytInitialData));
                // console.log(window.ytInitialData);
                const ytObjectHandle = findBrowseEndpoint(window.ytInitialData, handle);
                console.log(ytObjectHandle, ytObjectHandle?.browseId, ytObjectHandle?.canonicalBaseUrl);

                if(ytObjectHandle) {
                    clearInterval(interval);

                    console.log(attempts);
                    console.log("Found:", ytObjectHandle);

                    resolve(ytObjectHandle);
                    return;
                }
            }

            if (attempts >= 10) {
                clearInterval(interval);

                reject(new Error("YouTube initial data or channel handle not found"));
            }
        }, 100);
    });
}





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


// function findBrowseEndpoint(obj, handle) {
//     if (!obj || typeof obj !== "object") {
//         // console.log(typeof(obj));
//         // console.log(obj);
//         return null;
//     }

//     if (
//         obj.browseEndpoint?.browseId &&
//         obj.browseEndpoint.canonicalBaseUrl === handle
//     ) {
//         return {
//             browseId: obj.browseEndpoint.browseId,
//             canonicalBaseUrl: obj.browseEndpoint.canonicalBaseUrl
//         };
//     }

//     for (const value of Object.values(obj)) {
//         const result = findBrowseEndpoint(value, handle);

//         if (result) {
//             return result;
//         }
//     }

//     return null;
// }
function findBrowseEndpoint(obj, handle) {
    if (!obj || typeof obj !== "object") {
        return null;
    }

    if (obj.browseEndpoint?.browseId) {
        // console.log(
        //     "Found browseEndpoint:",
        //     obj.browseEndpoint.canonicalBaseUrl,
        //     "| Searching:",
        //     handle
        // );

        if (obj.browseEndpoint.canonicalBaseUrl === handle) {
            return {
                browseId: obj.browseEndpoint.browseId,
                canonicalBaseUrl: obj.browseEndpoint.canonicalBaseUrl
            };
        }
    }

    for (const value of Object.values(obj)) {
        const result = findBrowseEndpoint(value, handle);

        if (result) {
            return result;
        }
    }

    return null;
}
// function findBrowseEndpoints(obj, handle, results = []) {
//     if (!obj || typeof obj !== "object") {
//         return results;
//     }

//     if (
//         obj.browseEndpoint?.browseId &&
//         obj.browseEndpoint.canonicalBaseUrl === handle
//     ) {
//         results.push({
//             browseId: obj.browseEndpoint.browseId,
//             canonicalBaseUrl:
//                 obj.browseEndpoint.canonicalBaseUrl
//         });
//     }

//     for (const value of Object.values(obj)) {
//         findBrowseEndpoints(value, handle, results);
//     }

//     return results;
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



// async function detectChannelInfoFromInitialData() {

//     try {
//         let handle = await waitForYouTubeHandle();
//         // let handle = extractYouTubeHandle();
//         handle = `/${handle}`;

//         console.log("Handle:", handle);

//         // const initialDataObj = await waitForYtInitialData(handle);

//         // const channelId = findChannelId(initialDataObj, handle);
//         // const channelId = findBrowseEndpoint(initialDataObj, handle).browseId;
//         const channelInfo = await waitForYtInitialData(handle);
//         const channelId = channelInfo.browseId;

//         console.log("Channel ID:", channelId);
//         // console.log("Channel handle:", handle);
//     } catch (error) {
//         console.log(error.message);
//     }
// }

// detectChannelInfoFromInitialData();


async function detectChannelInfoFromInitialData() {
    let handle = await waitForYouTubeHandle();

    handle = `/${handle}`;

    console.log("Handle:", handle);

    const channelInfo = await waitForYtInitialData(handle);
    const channelId = channelInfo.browseId;

    console.log("Channel ID:", channelId);
}











function getCurrentChannelFromApp() {
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

        const channelImageUrl = findChannelIconFromChannelPage(responseObj);

        return {
            channelId: browseId,
            channelName: channelName,
            channelHandle: canonicalBaseUrl,
            channelImageUrl: channelImageUrl
        };
    } catch {
        return null;
    }
}

// const channel = getCurrentChannelFromApp();

// console.log("Channel ID:", channel?.channelId);
// console.log("Handle:", channel?.channelHandle);




// async function waitForCurrentChannel(callback) {
//     let handle = await waitForYouTubeHandle();

//     handle = `/${handle}`;

//     console.log("Handle:", handle);

//     let attempts = 0;
//     const maxAttempts = 40;

//     const interval = setInterval(() => {
//         attempts++;

//         const channel = getCurrentChannelFromApp();
//         if(handle === channel?.channelHandle) {
//             if (channel?.channelId) {
//                 clearInterval(interval);
//                 callback(channel);
//                 return;
//             }
//         }

//         if (attempts >= maxAttempts) {
//             clearInterval(interval);
//             callback(null);
//         }
//     }, 250);
// }

async function waitForCurrentChannel() {
    let handle = await waitForYouTubeHandle();

    handle = `/${handle}`;

    console.log("Handle:", handle);

    let attempts = 0;
    const maxAttempts = 40;

    return new Promise((resolve) => {
        const interval = setInterval(() => {
            attempts++;

            const channel = getCurrentChannelFromApp();

            if (handle === channel?.channelHandle) {
                if (channel?.channelId) {
                    clearInterval(interval);
                    resolve(channel);
                    return;
                }
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error("Could not detect current channel from ytd-app"));
            }
        }, 250);
    });
}







function findChannelIconFromChannelPage(obj) {
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
        const result = findChannelIconFromChannelPage(value);

        if (result) {
            return result;
        }
    }

    return null;
}





