var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class MainWorld {
  constructor() {
    __publicField(this, "open");
    __publicField(this, "send");
    __publicField(this, "host", "https://mewe.com");
    this.open = XMLHttpRequest.prototype.open;
    this.send = XMLHttpRequest.prototype.send;
    this.init();
  }
  processStories(storytellersInOrder) {
    return storytellersInOrder.map((storyteller) => {
      const { storytellerId: postItemId, stories } = storyteller;
      return {
        postItemId,
        updatedMedias: stories.map((story) => {
          var _a;
          return {
            id: story.media.mediaId,
            type: story.media.mediaType,
            href: {
              mediaHref: story.media.mediaType === "Video" ? `${this.host}${story.media._links.media.href.replace(
                "{resolution}",
                "original"
              )}` : `${this.host}${story.media._links.media.href}`,
              thumbnailHref: `${this.host}${(_a = story.media._links.thumbnail) == null ? void 0 : _a.href}`
            }
          };
        })
      };
    });
  }
  processPosts(posts) {
    return posts.map((post) => {
      let { postItemId, refPost, refRemoved, medias } = post;
      if (refPost && !refRemoved) {
        medias = refPost.medias;
        postItemId = refPost.postItemId;
      }
      return {
        postItemId,
        updatedMedias: medias == null ? void 0 : medias.map((media) => ({
          id: media.video ? media.video.id : media.photo.id,
          type: media.video ? "Video" : "Photo",
          href: {
            mediaHref: media.video ? `${this.host}${media.video._links.linkTemplate.href.replace(
              "{resolution}",
              "original"
            )}` : `${this.host}${media.photo._links.img.href}`
          }
        }))
      };
    });
  }
  listenerFn(event) {
    try {
      const target = event.target;
      const responseText = target.responseText;
      const jsonResponse = JSON.parse(responseText);
      const splits = target.responseURL.split("?")[0].split("/");
      const lastSegment = splits[splits.length - 1];
      let posts = void 0;
      if ([
        "post",
        "feed",
        "allfeed",
        "postsfeed",
        "mediafeed",
        "wrapperfeed"
      ].includes(lastSegment) || splits[splits.length - 2] === "post") {
        const { feed, post } = jsonResponse;
        if (feed)
          posts = this.processPosts(feed);
        else if (post)
          posts = this.processPosts([post]);
        if (posts) {
          const e = new CustomEvent(`posts`, {
            detail: { posts }
          });
          document.dispatchEvent(e);
        }
      }
      if (jsonResponse.storytellersInOrder) {
        const stories = this.processStories(jsonResponse.storytellersInOrder);
        const e = new CustomEvent(`stories`, {
          detail: { stories }
        });
        document.dispatchEvent(e);
      }
    } catch (error) {
      console.warn("post_type !== media");
    }
  }
  init() {
    const self = this;
    const open = this.open;
    const send = this.send;
    XMLHttpRequest.prototype.open = function(method, url, async = true, username, password) {
      const strURL = url.toString();
      XMLHttpRequest.prototype.send = function(...args) {
        if (strURL && strURL.startsWith("/api")) {
          this.addEventListener("load", self.listenerFn.bind(self));
        }
        send.apply(this, args);
      };
      open.call(this, method, url, async, username, password);
    };
  }
}
new MainWorld();
