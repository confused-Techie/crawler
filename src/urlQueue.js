
module.exports =
class URLQueue {
  constructor() {
    this.queue = [];
    this.crawledUrls = [];
  }

  add(url) {
    if (!this.crawledUrls.includes(url) && !this.queue.includes(url)) {
      this.queue.push(url);
    }
  }

  remove(url) {
    let idx = this.queue.indexOf(url);
    if (idx > -1) {
      this.queue.splice(idx, 1);
      this.crawledUrls.push(url);
    }

    return url;
  }

  getFirst() {
    if (this.queue.length > 0) {
      let url = this.queue.shift();
      this.crawledUrls.push(url);
      return url;
    } else {
      return "";
    }

  }

  length() {
    return this.queue.length;
  }

  empty() {
    // Likely shouldn't be kept around or used in production, simply a way to ensure
    // we can quickly exit at any point
    this.queue = [];
  }
}
