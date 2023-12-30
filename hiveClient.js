const { Client } = require("@hiveio/dhive");
const { DefaultRenderer } = require("@hiveio/content-renderer");

// Initialize Hive blockchain client with extended fallback APIs
const client = new Client([
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://hived.privex.io",
  "https://hive-api.arcange.eu",
  "https://anyx.io",
  "https://api.hive-engine.com",
]);

const renderer = new DefaultRenderer({
  baseUrl: "https://hive.blog/",
  breaks: true,
  skipSanitization: false,
  allowInsecureScriptTags: false,
  addNofollowToLinks: true,
  doNotShowImages: false,
  ipfsPrefix: "",
  assetsWidth: 640,
  assetsHeight: 480,
  imageProxyFn: (url) => url,
  usertagUrlFn: (account) => "/@" + account,
  hashtagUrlFn: (hashtag) => "/trending/" + hashtag,
  isLinkSafeFn: (url) => true,
});

module.exports = { client, renderer };