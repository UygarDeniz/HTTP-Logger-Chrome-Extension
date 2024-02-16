let requestBodies = {};
let requests = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start") {
    chrome.storage.local.set({ listening: true });
  } else if (message.action === "stop") {
    chrome.storage.local.set({ listening: false });
  } else if (message.action === "clearRequests") {
    requests = [];
    chrome.storage.local.set({ requests: requests });
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  async function (details) {
    let result = await chrome.storage.local.get(["listening"]);
    let listening = result.listening;

    if (!listening) return;
    if (
      details.type === "xmlhttprequest" &&
      (details.method === "POST" || details.method === "PUT")
    ) {
      requestBodies[details.requestId] = details.requestBody;
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  async function (details) {
    let result = await chrome.storage.local.get(["listening"]);
    let listening = result.listening;

    if (!listening) return;
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        let tab = tabs[0];
        if (tab && tab.url) {
          let tabUrl = new URL(tab.url);
          let requestUrl = new URL(details.url);

          if (
            details.type === "xmlhttprequest" &&
            tabUrl.hostname === requestUrl.hostname
          ) {
            let log = {
              label: details.url,
              url: details.url,
              method: details.method,
              request_type: "ajax",
              timestamp: new Date().toISOString(),
              transaction_key: 0,
              headers: details.requestHeaders,
            };

            if (details.method === "POST" || details.method === "PUT") {
              let body = requestBodies[details.requestId];
              if (body && body.raw && body.raw[0] && body.raw[0].bytes) {
                let decoder = new TextDecoder();
                body = decoder.decode(body.raw[0].bytes);
                log.body = [body];
              }
            }

            requests.push(log);
            console.log("requests", requests);
            await chrome.storage.local.set({ requests: requests });
          }
        }
      }
    );
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);


