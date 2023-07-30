const Crawler = require("./src/main.js");

const crawl = new Crawler("Just-A-Test");

crawl.init("https://developer.mozilla.org/en-US/docs/Web/HTTP/Status");

(async () => {
  await crawl.crawl();
})();
