/**
 * This module is intended to take in an `html-to-ast` AST of HTML
 * And search along it until it is able to find the robots entry, where if not
 * found, will return false
 */

// TODO This should stop looking only for robots and be able to find everything of interest
// on any given page. Then aborting if the robots file says so

function searchAST(ast) {

  if (Array.isArray(ast)) {
    for (let node of ast) {
      let res = searchAST(node);

      if (typeof res !== "boolean") {
        return res;
      }
    }
  } else if (typeof ast === "object") {

    if (ast.hasOwnProperty("name") && ast.name === "body") {
      // We know the robots.txt will not show up within the body, so we exit early
      return false;
    } else if (ast.hasOwnProperty("type") && ast.type === "tag" && ast.hasOwnProperty("name") && ast.name === "meta") {

      // We are in a meta tag, likely in the header, search for relevant robots fields here
      if (ast?.attrs?.name === "robots") {
        return ast?.attrs?.content ?? false;
      }

    } else if (ast.hasOwnProperty("children") && Array.isArray(ast.children)) {
      for (let node of ast.children) {
        let res = searchAST(node);

        if (typeof res !== "boolean") {
          return res;
        }
      }
    } else {
      return false;
    }
  }

  // we have run through all options
  return false;
}

module.exports = searchAST;
