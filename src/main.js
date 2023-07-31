/**
 * This module will crawl the internet hoping to find links.
 * This module does nothing to actually save the properties of each link, only
 * emitting events once certain items are found with their related information.
 */

const EventEmitter = require("node:events");
const { URL } = require("node:url");
const { Buffer } = require("node:buffer");
const semver = require("semver");
const htmlAST = require("html-to-ast");
const { got } = require("got-cjs");
const Robots = require("./robots.js");
const searchAST = require("./searchAST.js");
const resolveLinks = require("./resolveLinks.js");
const URLQueue = require("./urlQueue.js");

module.exports =
class Crawler {
  constructor(opts = {}) {
    this.userAgent = opts.userAgent ?? `${process.os}/Crawler`;
    this.waitTime = opts.waitTime ?? 2000;
    this.failOpen = opts.failOpen ?? false;
    this.emitter = new EventEmitter();

    this.urlQueue = opts.urlQueue ?? new URLQueue();
    this.robotsCache = opts.robotsCache ?? new Map();
  }

  init(url) {
    // Used to set the initial URL prior to starting crawling
    this.urlQueue.add(url);
  }

  async crawl() {

    while(this.urlQueue.length() > 0) {

      let url = this.urlQueue.getFirst();

      try {
        let crawled = await this.crawlUrl(url);

        if (!crawled.ok) {
          // We have failed to crawl this URL
          this.emitter.emit("crawling:failed", crawled.content);
          continue;
        }

        // Crawling went okay.
        // So we can now emit that we have successfully crawled a page, providing
        // our details, then of course we want to add the links received to our url queue

        crawled.content.pageURL = url;
        
        this.emitter.emit("crawling:crawled", crawled.content);

        // Then ensure we add every new link to our queue
        for (let i = 0; i < crawled.content.lonelyLinks.length; i++) {
          this.urlQueue.add(crawled.content.lonelyLinks[i]);
        }

        for (let node in crawled.content.textLinks) {
          this.urlQueue.add(crawled.content.textLinks[node]);
        }

        // Now we can go ahead and break to start the next URL in the list
        // After a short wait to be nice to others servers
        await new Promise(r => setTimeout(r, this.waitTime));
        continue;

      } catch(err) {
        console.log(err);
        this.emitter.emit("crawling:error", err);
        continue;
      }

    }

    // Theres nothing more to crawl. Exit
    console.log("We have cralwed all of the things...");
    this.emitter.emit("crawling:done");

  }

  async crawlUrl(url) {

    let validUrl = semver.gte(process.versions.node, "v19.9.0") ? URL.canParse(url) : true;
    // Above that version we have a feature we want to use, but below it, we will
    // let any errors be caught as exceptions below during the actual parsing
    // of the url instead.

    if (!validUrl) {
      // Our URL is invalid
      return {
        ok: false,
        content: `URL is invalid: ${url}`
      };
    }

    // We can continue on our way to hitting this endpoint
    let robots = await this.getRobots(url);

    // Now with our robots file, lets ensure we can crawl this URL
    if (robots.canCrawl(url)) {

      let page = await this.preformRequest({
        url: url,
        method: "GET",
        headers: {
          "Accept": "*/*",
          "User-Agent": this.userAgent
        }
      });

      let details = await searchAST(htmlAST.parse(page.body));

      details = resolveLinks.handleLinks(details, url);

      return {
        ok: true,
        content: details
      };

    } else {
      this.emitter.emit("crawling:disallowed", url);
      return {
        ok: false,
        content: `Disallowed from crawling: ${url}`
      };
    }
  }

  async getRobots(url) {
    let urlParsed = new URL(url);

    if (this.robotsCache.has(urlParsed.origin)) {
      return this.robotsCache.get(urlParsed.origin);
    }

    urlParsed.pathname = "/robots.txt";

    try {
      let robotsFile = await this.preformRequest({
        url: urlParsed.toString(),
        method: "GET",
        headers: {
          "Accept": "*/*",
          "User-Agent": this.userAgent
        }
      });

      if (robotsFile.statusCode !== 200) {
        // Seems this website does not have a robots.txt
        // We could stop parsing, but for now, lets just assume it's fine
        return new Robots(`User-agent: *\n${this.failOpen ? "Allow" : "Disallow"}: /`, url, this.userAgent);
      }

      this.robotsCache.set(url, robotsFile.body);

      return new Robots(robotsFile.body, url, this.userAgent);
    } catch(err) {
      console.error(err);

      return new Robots(`User-agent: *\n${this.failOpen ? "Allow" : "Disallow"}: /`, url, this.userAgent);
    }

  }

  async preformRequest(opts) {
    return await got(opts);
  }

}
