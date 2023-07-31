/**
 * This module intends to receive a returned object form searchAST
 * which contains many different links within, and resolve them to full links,
 * as well as prune those that aren't relevent (maybe).
 * This can hopefully be done by simply inspecting the first character of each link
 */
const { URL } = require("node:url");

function handleLinks(obj, url) {
  // Given an object directly from searchAST, it will split each section of links
  // out and handle them individually

  for (let i = 0; i < obj.lonelyLinks.length; i++) {
    obj.lonelyLinks[i] = resolveLink(obj.lonelyLinks[i], url);
  }

  for (let node in obj.textLinks) {
    obj.textLinks[node] = resolveLink(obj.textLinks[node], url);
  }

  if (typeof obj?.favicon === "string") {
    obj.favicon = resolveLink(obj.favicon, url);
  }

  if (typeof obj.og?.image === "string") {
    obj.og.image = resolveLink(obj.og.image, url);
  }

  if (typeof obj.og?.audio === "string") {
    obj.og.audio = resolveLink(obj.og.audio, url);
  }

  if (typeof obj.og?.video === "string") {
    obj.og.video = resolveLink(obj.og.video, url);
  }

  return obj;
}

function resolveLink(link, url) {

  let urlParsed = new URL(url);

  if (link.startsWith("/")) {
    urlParsed.pathname = link;
    return urlParsed.toString();
  } else if (link.startsWith("#")) {
    // This is an anchor link on the same page.
    // In the future we should likely prune this to avoid hitting the same page
    // again, but for now we will resolve it
    return `${url}${link}`;
  } else if (link.startsWith(".")) {
    return `${urlParsed.toString()}${link.replace(".", "")}`;
  } else {
    // Should be a fully qualified link
    return link;
  }
}

module.exports = {
  handleLinks,
  resolveLink
};
