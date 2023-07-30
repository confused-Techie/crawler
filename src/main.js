/**
 * This module will crawl the internet hoping to find links.
 * This module does nothing to actually save the properties of each link, only
 * emitting events once certain items are found with their related information.
 */

const EventEmitter = require("node:events");
const http = require("node:http");
const https = require("node:https");
const { URL } = require("node:url");
const semver = require("semver");
const htmlAST = require("html-to-ast");
const Robots = require("./robots.js");
const searchAST = require("./searchAST.js");

class Crawler {
  constructor(userAgent) {
    this.userAgent = userAgent;
    this.emitter = new EventEmitter();

    this.urlQueue = [];
    this.robotsCache = new Map();
  }

  init(url) {
    // Used to set the initial URL prior to starting crawling
    this.urlQueue.push(url);
  }

  async crawl() {

    while(this.urlQueue.length > 0) {

      let url = this.urlQueue.shift();

      try {
        let crawled = await this.crawlUrl(url);

        if (!crawled.ok) {
          // We have failed to crawl this URL
          this.emitter.emit("crawling:failed", crawled.content);
          break;
        }

      } catch(err) {
        console.log(err);
        this.emitter.emit("crawling:error", err);
        break;
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

      let urlParsed = new URL(url);

      let page = await this.preformRequest({
        hostname: urlParsed.hostname,
        path: urlParsed.path,
        method: "GET",
        port: urlParsed.port,
        protocol: urlParsed.protocol,
        headers: {
          "Accept": "*",
          "User-Agent": this.userAgent
        }
      });

      let details = await searchAST(page.body);

      // TODO: Do something with these details
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

    let robotsFile = await this.preformRequest({
      hostname: urlParsed.hostname,
      path: "/robots.txt",
      method: "GET",
      port: urlParsed.port,
      protocol: urlParsed.protocol,
      headers: {
        "Accept": "*",
        "User-Agent": this.userAgent
      }
    });

    if (robotsFile.statusCode !== 200) {
      // Seems this website does not have a robots.txt
      // We could stop parsing, but for now, lets just assume it's fine
      return new Robots("User-agent: *\nAllow: /", url, this.userAgent);
    }

    this.robotsCache.set(url, robotsFile.body);

    return new Robots(robotsFile.body, url, this.userAgent);
  }

  async preformRequest(opts) {
    let data = "";
    return new Promise((resolve, reject) => {
      https.get(opts, (res) => {

        res.on("data", (d) => {
          data += d;
        });

        res.on("end", () => {
          res.body = data;
          resolve(res);
        });
        //resolve(res);
      }).on("error", (err) => {
        reject(err);
      });
    });
  }

}

module.exports = Crawler;
