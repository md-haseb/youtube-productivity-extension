chrome.runtime.onMessage.addListener((message) => {
  console.log(message.type);
  console.log(message.enabled);
});