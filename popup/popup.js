const toggles = document.querySelectorAll('.feature-toggle');


toggles.forEach(toggle => {
 toggle.addEventListener('change', handleToggleChange);
});


function handleToggleChange(event) {
 const setting = event.target.dataset.setting;
 const enabled = event.target.checked;

 setChromeStorage(setting, enabled);
 sendMessage(setting, enabled);


//  chrome.storage.sync.get(null, (result) => {
//     console.log(result);
//   });

 // return { 'setting': setting, 'enabled': enabled};
 // console.log(setting, enabled);
}


function setChromeStorage(setting, enabled) {
  chrome.storage.sync.set({
    [setting]: enabled
  }
  // () => {
  //   chrome.storage.sync.get(null, (result) => {
  //     console.log(result);
  //   });
  // }
);
}


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