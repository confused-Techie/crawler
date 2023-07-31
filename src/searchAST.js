/**
 * This module is intended to take in an `html-to-ast` AST of HTML
 * And search along each node for various peices of data that we choose to care about
 */

let returnObj = {};
returnObj.og = {};
returnObj.lonelyLinks = [];
returnObj.textLinks = {};

function searchAST(ast) {

  if (Array.isArray(ast)) {
    for (let node of ast) {
      searchAST(node);
    }
  } else if (typeof ast === "object") {

    // Here we can search for any specific peice of data we want or care about on
    // a webpage, and add it to our return object. The way the data is added, must
    // be formalized at some point, but also flexible enough, so that the changing
    // can accurately be added and reflected.

    if (ast?.name === "title") {
      returnObj.pageTitle = ast?.children[0]?.content;
    } else if (typeof ast?.attrs === "object" && ast.attrs?.rel === "icon" && typeof ast.attrs?.href === "string") {
      returnObj.favicon = ast.attrs.href;
    } else if (ast?.name === "meta" && typeof ast?.attrs === "object" && ast.attrs?.property === "og:title" && typeof ast.attrs?.content === "string") {
      returnObj.og.title = ast.attrs.content;
    } else if (ast?.name === "meta" && typeof ast?.attrs === "object" && ast.attrs?.property === "og:url" && typeof ast.attrs?.content === "string") {
      returnObj.og.url = ast.attrs.content;
    } else if (ast?.name === "meta" && typeof ast?.attrs === "object" && ast.attrs?.property === "og:locale" && typeof ast.attrs?.content === "string") {
      returnObj.og.locale = ast.attrs.content;
    } else if (ast?.name === "meta" && typeof ast?.attrs === "object" && ast.attrs?.name === "description" && typeof ast.attrs?.content === "string") {
      returnObj.pageDescription = ast.attrs.content;
    } else if (ast?.name === "meta" && typeof ast?.attrs === "object" && ast.attrs?.property === "og:description" && typeof ast.attrs?.content === "string") {
      returnObj.og.description = ast.attrs.content;
    } else if (ast?.name === "meta" && typeof ast?.attrs === "object" && ast.attrs?.property === "og:image" && typeof ast.attrs?.content === "string") {
      returnObj.og.image = ast.attrs.content;
    } else if (ast?.type === "tag" && ast?.name === "a" && typeof ast?.attrs === "object" && typeof ast.attrs?.href === "string") {
      // We have encountered a link here. But we want to see if this link as any text defining it

      if (Array.isArray(ast?.children) && ast.children.length == 1 && ast.children[0]?.type === "text" && typeof ast.children[0]?.content === "string") {
        // There is text that comes along with this. Lets add the text and link, in case the text is helpful

        returnObj.textLinks[ast.children[0].content] = ast.attrs.href;
      } else {
        // We couldn't find text that we know is relevant, so we will just add the link

        returnObj.lonelyLinks.push(ast.attrs.href);
      }
    } else {
      // If we can't find anything to do for this node, lets descend down the children
      if (Array.isArray(ast?.children)) {
        for (let node of ast.children) {
          searchAST(node);
        }
      }
    }
  }

  return returnObj;
}

module.exports = searchAST;
