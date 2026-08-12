const toggles = document.querySelectorAll('.feature-toggle');


toggles.forEach(toggle => {
 toggle.addEventListener('change', handleToggleChange);
});




function handleToggleChange(event) {
 const setting = event.target.dataset.setting;
 const enabled = event.target.checked;

 setChromeStorage(setting, enabled);
 sendMessage(setting, enabled);

}




function setChromeStorage(setting, enabled) {
  chrome.storage.sync.set({
    [setting]: enabled
  }
);
}




/**
 * Sends the updated setting to all open YouTube tabs so their content
 * scripts can apply the change.
 *
 * @param {string} type - The setting/message type.
 * @param {boolean} enabled - Whether the setting is enabled.
 */

function sendMessage(type, enabled) {
  chrome.tabs.query(
    {
      url: ["https://www.youtube.com/*"]
    },
    (tabs) => {
      if (tabs.length === 0) return;

      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type,
          enabled
        });
      });
    }
  );
}