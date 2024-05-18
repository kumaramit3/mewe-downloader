const main_world = "/assets/main-world.ts-CizLRepB.js";
class BackgroundProcess {
  constructor() {
    this.init();
  }
  init() {
    chrome.tabs.onActivated.addListener((activeInfo) => {
      const { tabId } = activeInfo;
      chrome.tabs.get(tabId, (tab) => {
        var _a;
        if ((_a = tab.url) == null ? void 0 : _a.includes("mewe.com")) {
          chrome.action.setPopup({ popup: "index.html", tabId });
        } else
          chrome.action.setPopup({ popup: "", tabId });
      });
    });
    chrome.tabs.onUpdated.addListener((tabId, changedInfo, tab) => {
      var _a;
      if ((_a = tab.url) == null ? void 0 : _a.includes("mewe.com")) {
        chrome.action.setPopup({ popup: "index.html", tabId });
      } else
        chrome.action.setPopup({ popup: "", tabId });
    });
    chrome.scripting.getRegisteredContentScripts({
      ids: ["hook"]
    }).then((registered) => {
      if (!registered.length)
        chrome.scripting.registerContentScripts([
          {
            id: "hook",
            matches: ["https://mewe.com/*"],
            js: [main_world],
            runAt: "document_start",
            world: "MAIN"
          }
        ]).then(() => {
        }).catch((err) => console.log(err));
    }).catch((err) => console.log(err));
    chrome.downloads.onDeterminingFilename.addListener(
      (downloadItem, suggest) => {
        const { url } = downloadItem;
        if (url.startsWith("https://mewe.com/api/v2/proxy/video")) {
          const filename = `${url.split("/")[8]}.mp4`;
          suggest({ filename });
        } else if (url.startsWith("https://mewe.com/api/v2/photo")) {
          const filename = `${downloadItem.fileSize.toString()}.png`;
          suggest({ filename });
        }
      }
    );
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }
  async handleMessage(message) {
    const { type, data } = message;
    if (type === "download") {
      await chrome.downloads.download({
        url: data,
        saveAs: false
      });
    } else if (type === "story") {
      const result = await chrome.storage.local.get(["stories"]);
      const oldStories = result["stories"];
      const cnt = this.findDiff(data, oldStories);
      await chrome.storage.local.set({ stories: data });
      await chrome.action.setBadgeText({ text: cnt.toString() });
    } else if (type === "updateBadgeText") {
      await chrome.action.setBadgeText({ text: data.toString() });
    }
  }
  findDiff(newStories, oldStories) {
    const oldMedias = /* @__PURE__ */ new Set();
    oldStories == null ? void 0 : oldStories.forEach(
      (story) => {
        var _a;
        return (_a = story.updatedMedias) == null ? void 0 : _a.forEach((media) => oldMedias.add(media.id));
      }
    );
    let cnt = 0;
    newStories.forEach(
      (story) => {
        var _a;
        return (_a = story.updatedMedias) == null ? void 0 : _a.forEach((media) => {
          if (!oldMedias.has(media.id))
            cnt++;
        });
      }
    );
    return cnt > 0 ? cnt.toString() : "";
  }
}
new BackgroundProcess();
