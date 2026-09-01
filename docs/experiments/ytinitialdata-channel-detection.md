# Experiment

## ytInitialData Channel Info Fallback

### Status
Not currently used.

### Why I created this

YouTube's SPA navigation sometimes keeps stale information in the DOM.
I investigated `ytInitialData` as another possible source for the current
channel's information.

The `ytd-app` data approach is currently working reliably, so this fallback
is not needed at the moment.

The channel-page DOM fallback is also working.

### Current channel-info detection order

1. `ytd-app` data — primary
2. Channel page DOM — fallback
3. `ytInitialData` — possible future fallback

### Existing functions / logic

The following functions were created while investigating the
`ytInitialData` approach:

- `detectChannelInfoFromInitialData()`
- `findBrowseEndpoint()`
- `waitForYtInitialData()`

Some of these functions may be incomplete.

### Why it may be needed in the future

If YouTube changes the `ytd-app` data structure or the current approach
stops working, `ytInitialData` may be useful as another fallback.

### Things to investigate when implementing

- Find the current channel's `browseId`
- Verify the channel handle matches the current URL
- Make sure the data belongs to the current navigation
- Handle cases where `ytInitialData` is stale
- Determine whether polling/waiting is necessary


## Existing Experimental Code 

<!-- Recursively searches the object for a browseEndpoint whose canonicalBaseUrl
matches the current channel handle. Returns the matching channel's browseId
and canonicalBaseUrl, or null if no match is found. -->

```js
function findBrowseEndpoint(obj, handle) {
    if (!obj || typeof obj !== "object") {
        return null;
    }

    if (obj.browseEndpoint?.browseId) {

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
```



<!-- Polls for ytInitialData and searches for a browseEndpoint whose canonicalBaseUrl matches the given channel handle. Resolves with the matching browseEndpoint, or rejects after 100 attempts if the data or channel handle is not found. -->

```js
function waitForYtInitialData(handle) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const interval = setInterval(() => {
            attempts++;

            if (window.ytInitialData) {
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

            if (attempts >= 100) {
                clearInterval(interval);

                reject(new Error("YouTube initial data or channel handle not found"));
            }
        }, 100);
    });
}
```


<!--
Extracts the current channel ID from the ytInitialData object using the channel handle.
Currently, only the channel ID is extracted. The channel name and icon are not yet extracted from ytInitialData.
-->

```js
async function detectChannelInfoFromInitialData() {
    let handle = await waitForYouTubeHandle();

    handle = `/${handle}`;

    console.log("Handle:", handle);

    const channelInfo = await waitForYtInitialData(handle);
    const channelId = channelInfo.browseId;

    console.log("Channel ID:", channelId);
}
```