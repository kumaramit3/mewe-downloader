var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class MediaDownloader {
  constructor() {
    __publicField(this, "observer", null);
    __publicField(this, "flag", false);
    __publicField(this, "postMediasById", /* @__PURE__ */ new Map());
    this.init();
  }
  init() {
    document.addEventListener("posts", this.handlePosts.bind(this));
    document.addEventListener("stories", (event) => {
      const {
        detail: { stories }
      } = event;
      chrome.runtime.sendMessage({
        type: "story",
        data: stories
      });
    });
  }
  addDownloadAnchor(postDiv, medias) {
    try {
      postDiv.setAttribute(
        "data-download-id",
        Math.random().toString(36).substring(2, 9)
      );
      medias.forEach((media) => {
        const {
          type,
          href: { mediaHref }
        } = media;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = "#";
        downloadAnchor.style.cursor = "pointer";
        const downloadImage = document.createElement("img");
        downloadImage.src = chrome.runtime.getURL("src/images/save_16x16.png");
        downloadImage.alt = "save-media";
        if (type === "Photo") {
          downloadAnchor.addEventListener("click", () => {
            chrome.runtime.sendMessage({
              type: "download",
              data: mediaHref
            });
          });
        } else {
          downloadAnchor.addEventListener(
            "click",
            () => window.location.href = mediaHref
          );
        }
        downloadAnchor.appendChild(downloadImage);
        const post_header = postDiv.querySelector(".post_header_user-info");
        if (post_header)
          post_header.appendChild(downloadAnchor);
      });
    } catch (error) {
      console.log(postDiv);
    }
  }
  handlePosts(e) {
    try {
      const customEvent = e;
      const {
        detail: { posts }
      } = customEvent;
      if (!this.flag) {
        this.watchDOMChanges();
        this.flag = true;
      }
      posts.forEach((post) => {
        let { postItemId, updatedMedias } = post;
        if (!this.postMediasById.has(postItemId) && updatedMedias) {
          this.postMediasById.set(postItemId, updatedMedias);
        }
        const postDivs = document.querySelectorAll(
          `div[data-postid="${postItemId}"]`
        );
        const postDivsLength = postDivs.length;
        if (postDivsLength) {
          postDivs.forEach((postDiv) => {
            const postItemdId = postDiv.getAttribute("data-postid");
            const isDone = postDiv.getAttribute("data-download-id");
            if (postItemdId && !isDone) {
              const updatedMedias2 = this.postMediasById.get(postItemdId);
              if (updatedMedias2)
                this.addDownloadAnchor(postDiv, updatedMedias2);
            }
          });
        }
      });
    } catch (error) {
      console.warn(error);
    }
  }
  watchDOMChanges() {
    try {
      const mutationCallback = (mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            const addedNodes = Array.from(mutation.addedNodes).filter(
              (node) => node instanceof Element
            );
            addedNodes.forEach((node) => {
              const postDiv = node;
              const postItemId = postDiv.getAttribute("data-postid");
              const isDone = postDiv.getAttribute("data-download-id");
              if (postItemId && !isDone) {
                const updatedMedias = this.postMediasById.get(postItemId);
                if (updatedMedias)
                  this.addDownloadAnchor(postDiv, updatedMedias);
              }
            });
          }
        });
      };
      this.observer = new MutationObserver(mutationCallback.bind(this));
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (error) {
      if (error instanceof Error)
        console.log(error.message);
    }
  }
}
new MediaDownloader();
