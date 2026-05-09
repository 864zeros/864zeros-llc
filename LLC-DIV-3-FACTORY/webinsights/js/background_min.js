// minimal SW to confirm registration
console.log("[WebInsight] SW boot OK");
chrome.runtime.onInstalled.addListener(() => {
  console.log("[WebInsight] onInstalled");
});
