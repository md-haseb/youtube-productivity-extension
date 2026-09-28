
// ============================================================
// ALLOWLIST
// ============================================================

function updateAllowlistButton(channelInfo, actionButton) {
    if (!channelInfo?.channelId) {
        actionButton.setAttribute("disabled", "");
        actionButton.textContent = "Add";
        return;
    }

    chrome.storage.sync.get(
        "allowlistedChannels",
        ({ allowlistedChannels = [] }) => {

            const alreadyAllowlisted =
                allowlistedChannels.some(
                    channel =>
                        channel.channelId === channelInfo.channelId
                );

            if (alreadyAllowlisted) {
                actionButton.setAttribute("disabled", "");
                actionButton.textContent = "Added";
            } else {
                actionButton.removeAttribute("disabled");
                actionButton.textContent = "Add";
            }
        }
    );
}


function addCurrentChannelToAllowlist(
    channelInfo,
    actionButton,
    messageElement
) {
    if (!channelInfo?.channelId) {
        return;
    }

    addChannelToAllowlist(
        {
            channelId: channelInfo.channelId,
            channelName: channelInfo.channelName,
            channelHandle: channelInfo.channelHandle,
            channelIcon: channelInfo.channelIcon
        },
        (result) => {

            console.log(result);

            if (result === "quota-exceeded") {
                messageElement.textContent =
                    "Allowlist is full. Remove a channel before adding another.";

                messageElement.style.color = '#E06C75';

                return;
            }

            if (result === "storage-error") {
                messageElement.textContent =
                    "Failed to add channel. Please try again.";

                messageElement.style.color = '#E06C75';

                return;
            }

            if (!result) {
                return;
            }

            const channelItem =
                createAllowlistedChannelItem(
                    channelInfo.channelId,
                    channelInfo.channelName,
                    channelInfo.channelIcon
                );

            allowlistedChannelList.prepend(channelItem);

            actionButton.textContent = 'Added';
            actionButton.setAttribute('disabled', '');
        }
    );
}


function addChannelToAllowlist(channel, callback) {
    chrome.storage.sync.get(
        "allowlistedChannels",
        ({ allowlistedChannels = [] }) => {

            const alreadyExists =
                allowlistedChannels.some(
                    item =>
                        item.channelId === channel.channelId
                );

            if (alreadyExists) {
                callback(false);
                return;
            }

            allowlistedChannels.unshift(channel);

            chrome.storage.sync.set(
                { allowlistedChannels },
                () => {

                    if (chrome.runtime.lastError) {
                        const errorMessage =
                            chrome.runtime.lastError.message;

                        console.log(errorMessage);

                        if (
                            errorMessage.includes(
                                "kQuotaBytesPerItem quota exceeded"
                            )
                        ) {
                            callback("quota-exceeded");
                        } else {
                            console.error(
                                "Failed to add channel:",
                                chrome.runtime.lastError
                            );

                            callback("storage-error");
                        }

                        return;
                    }

                    callback(true);

                    updateAllowlistCount();
                }
            );
        }
    );
}


function removeChannelFromAllowlist(
    channelId,
    listItem
) {
    chrome.storage.sync.get(
        "allowlistedChannels",
        ({ allowlistedChannels = [] }) => {

            const updatedChannels =
                allowlistedChannels.filter(
                    channel =>
                        channel.channelId !== channelId
                );

            chrome.storage.sync.set(
                {
                    allowlistedChannels: updatedChannels
                },
                () => {

                    if (chrome.runtime.lastError) {
                        console.error(
                            "Failed to remove channel:",
                            chrome.runtime.lastError
                        );

                        return;
                    }

                    listItem.remove();

                    // Restore automatic Add button
                    if (
                        currentAutomaticChannelInfo?.channelId ===
                        channelId
                    ) {
                        automaticAllowlistActionButton.disabled =
                            false;

                        automaticAllowlistActionButton.textContent =
                            "Add";
                    }

                    // Restore manual Add button
                    if (
                        currentManualChannelInfo?.channelId ===
                        channelId
                    ) {
                        manualAllowlistActionButton.disabled =
                            false;

                        manualAllowlistActionButton.textContent =
                            "Add";
                    }

                    updateAllowlistCount();

                    // Restore the appropriate bottom message
                    if (!automaticDetectionPaused) {
                        automaticDetectionBottom.textContent =
                            'Automatic detection works on YouTube watch pages and channel pages.';

                        automaticDetectionBottom.style.color =
                            '#92929b';
                    } else {
                        manualSectionBottom.textContent = '';
                        manualSectionBottom.style.color =
                            '#92929b';
                    }
                }
            );
        }
    );
}


function createAllowlistedChannelItem(
    channelId,
    channelName,
    channelIcon
) {
    const listItem =
        document.createElement("li");

    listItem.className =
        "allowlisted-channel-item";


    const channelInfo =
        document.createElement("div");

    channelInfo.className =
        "allowlisted-channel-info";


    const channelAvatar =
        document.createElement("div");

    channelAvatar.className =
        "channel-avatar";


    const image =
        document.createElement("img");

    image.src = channelIcon;
    image.alt =
        `${channelName} channel icon`;


    const name =
        document.createElement("span");

    name.className =
        "allowlisted-channel-name";

    name.textContent =
        channelName;


    const removeButton =
        document.createElement("button");

    removeButton.type = "button";

    removeButton.className =
        "remove-channel-btn";

    removeButton.setAttribute(
        "aria-label",
        `Remove ${channelName} from allowlist`
    );

    removeButton.textContent =
        "Remove";


    removeButton.addEventListener(
        "click",
        () => {
            removeChannelFromAllowlist(
                channelId,
                listItem
            );
        }
    );


    channelAvatar.appendChild(image);

    channelInfo.append(
        channelAvatar,
        name
    );

    listItem.append(
        channelInfo,
        removeButton
    );


    return listItem;
}


function updateAllowlistCount() {
    chrome.storage.sync.get(
        "allowlistedChannels",
        ({ allowlistedChannels = [] }) => {
            allowlistedChannelCount.textContent =
                allowlistedChannels.length;
        }
    );
}