
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "CHANNEL_INFO") {
        chrome.storage.session.set({
            currentChannelInfo: message.channelInfo
        });
    }
});