const robotsParser = require("robots-txt-parser");

class Robots {
  constructor(data, url, userAgent) {
    this.data = data;
    this.url = url;
    this.userAgent = userAgent;
    this.parsed;

    this.parser = robotsParsed({
      allowOnNeutral: false,
      userAgent: this.userAgent
    });
  }

  parse() {
    if (typeof this.data !== "string" || typeof this.url !== "string") {
      // Exit early somehow
      return false;
    }

    this.parsed = this.parser.parseRobots(this.url, this.data);

    return this.parsed;
  }

  canCrawl(url) {
    return this.parser.canCrawlSync(url);
  }

}


module.exports = Robots;
