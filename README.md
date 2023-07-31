# Crawler

This crawler is built to crawl the internet, finding the most basic information about each page.
While not equipped or intended to be the full solution to web crawling, this modules intends to be only one part of a much larger solution to scan the web.

## How does it Work? (Birds Eye View)

All the crawler needs is a single URL. From there it's off to find every piece of content it can. Likely being able to run forever if you don't stop it at some point. After receiving a single URL, the crawler will first ensure it's allowed to scan this page via the `robots.txt` rules, and if so will scan the page for basic information such as page titles, descriptions, favicons, and og tags. But most importantly will scan the page for any and all links to additional pages.

Once it's received a collection of links, where if possible it will retain the text of any such link, it will the continue to scan every additional link it's retrieved. Repeating this process until it is unable to find additional links (Which knowing the internet, this can take some serious time).

## Implementation Details (Birds Eye View)

Of course any big operation cannot rely on a single crawler to serve their needs. This is why this crawler is intended to be used as a cluster of crawlers.

Where during initialization of each crawler you can provide a shared `URLQueue`, to ensure you only scan each URL a single time.

During the actual crawling, it's important to remember that this crawler is an amnesiac. Saving or retaining zero information, beyond it's own `RobotsCache`. This means if you want to do anything with the data retrieved during crawling, you'll need to listen to the events fired by the crawler:

* `crawling:failed` (Provides `data`): This occurs if something went wrong during the crawling, such as a bad URL, bad `robots.txt` file, a 404 request to a URL, or otherwise bad data.
* `crawling:error` (Provides `err`): This occurs if a software error occurred during the crawling.
* `crawling:done` (): Occurs once all URLs have been crawled. And there is nothing left to do.
* `crawling:crawled` (Provides `data`): This event is fired every time a URL has been successfully crawled.

The data returned by `crawling:crawled` has it's own special format that you should be mindful of during implementation:

```json
{
  "og": {
    "url": "",
    "title": "",
    ...
  },
  "lonelyLinks": [],
  "textLinks": {
    "text accompanying the link": "link text"
  },
  "favicon": "",
  "pageTitle": "",
  "pageDescription": ""
}
```

* `og`: This data consists of any valid [Open Graph Protocol](https://ogp.me/) data. Where it's key will be the key following `og:` in it's `property` name. Not all values will be present.
* `lonelyLinks`: This array of strings consists of the links found on the page, that had no text immediately related to them. The links have been resolved from their original form to be valid full links.
* `textLinks`: This object of links were able to find text related to them. With the key being the text itself, and the value being the normalized, resolved link.
* `favicon`: A possible value that may have been found on the page, resolving the URL to the favicon.
* `pageTitle`: A possible value that may have been found on the page, displaying it's title.
* `pageDescription`: A possible value that may have been found on the page, displaying the description.
