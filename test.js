const fs = require("fs");
const Crawler = require("./src/main.js");

const CRAWL_LIMIT = 5;
let current_crawl_amount = 0;

const crawl = new Crawler({
  userAgent: "Just-A-Test",
  failOpen: true
});

crawl.init("https://developer.mozilla.org/en-US/docs/Web/HTTP/Status");

crawl.emitter.on("crawling:failed", (data) => {
  console.error("Crawling has failed!");
  console.error(data);
});

crawl.emitter.on("crawling:error", (err) => {
  console.error("Crawling has had an error!");
  console.error(err);
});

crawl.emitter.on("crawling:done", () => {
  console.log("We have completed crawling!");
});

crawl.emitter.on("crawling:crawled", (data) => {
  current_crawl_amount++;
  console.log("We have successfully crawled a URL!");
  //console.log(data);
  fs.writeFileSync(`${current_crawl_amount}.json`, JSON.stringify(data, null, 2), { encoding: "utf8" });

  if (current_crawl_amount === CRAWL_LIMIT || current_crawl_amount > CRAWL_LIMIT) {
    // empty the URL queue to register an end
    crawl.urlQueue.empty();
    // empty doesn't seem to work. Will have to figure that out, but for now
    process.exit(0);
  }
});


(async () => {
  await crawl.crawl();
})();
