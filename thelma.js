var sys = require("sys"),
    fs  = require("fs");
    
var dom = require("jsdom/lib/jsdom/level1/core").dom.level1.core;
var window = require("jsdom/lib/jsdom/browser").windowAugmentation(dom).window;
var Script = process.binding('evals').Script;

var html = fs.readFileSync(__dirname + "/test.html");
window.document.innerHTML = html;

// these two functions don't seem to be present in DOM level 1, but implementing them as below doesn't seem to break anything - their effects are purely visual
window.document.styleSheets = function() { return []; };
window.scrollTo = function(x, y) { return true; };

fs.readFile(__dirname + "/readability.js", function(err, data) {
    Script.runInNewContext(data.toString(), {
      window: window, 
      location: window.location, 
      navigator: window.navigator, 
      document:window.document,
      // these three variables are set from the bookmarklet, so we have to define them
      readStyle: 'style-newspaper', 
      readSize: 'size-medium', 
      readMargin: 'margin-wide'
    });
    sys.log(window.document.innerHTML);
});