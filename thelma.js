var sys     = require("sys"),
    fs      = require("fs"),
    url     = require("url"),
    http    = require("http"),
    exec    = require('child_process').exec;
    
var dom = require("jsdom/lib/jsdom/level1/core").dom.level1.core;
var window = require("jsdom/lib/jsdom/browser").windowAugmentation(dom).window;
var Script = process.binding('evals').Script;

var readabilityScript = fs.readFileSync(__dirname + "/readability.js", 'utf8');

// var html = fs.readFileSync(__dirname + "/test.html");
// window.document.innerHTML = html;

// these two functions don't seem to be present in jsdom - dom level 1 - but implementing them as below doesn't seem to break anything - their effects are purely visual
window.document.styleSheets = function() { return []; };
window.scrollTo = function(x, y) { return true; };

var server = http.createServer(function(request, response) {
  
  var inboundUrl = url.parse(request.url, true);
  sys.log(sys.inspect(inboundUrl));
  
  if (inboundUrl.pathname == '/go') {
    
    if (inboundUrl.query.url) {
      var outboundUrl = url.parse(inboundUrl.query.url);
      var outboundUrlString = url.format(outboundUrl);
      
      // we limit file size to 5MB - anything more is probably not a web page
      // we limit time to 60 seconds
      // we don't care about secure connections
      var curlCmd = 'curl -A "thelma 0.1" --insecure --max-time 60 --max-filesize 5242880 --compressed --location --url ' + outboundUrlString;
      
      var curl = exec(curlCmd, function(error, stdout, stderr) {
        
        var htmlString = stdout;
        sys.log(htmlString);
        
        sys.log("Fetched");
        
        if (error) {
          sys.log(sys.inspect(error));
        } else {
          
          //stdout.replace();
          
          window.document.innerHTML = htmlString;
          window.document.location = outboundUrlString;

          sys.log("Running Readability");

          Script.runInNewContext(readabilityScript, {
            window: window, 
            location: window.location, 
            navigator: window.navigator, 
            document:window.document,
            // these three variables are set externally from the bookmarklet, so we have to define them here
            readStyle: 'style-newspaper', 
            readSize: 'size-medium', 
            readMargin: 'margin-wide'
          });
          
          sys.log("Done running Readability");

          // now we pick out the two things we care about
          var contentElement = window.document.getElementById("readability-content");
          var contentString = contentElement.innerHTML;

          var headingElement = window.document.getElementsByTagName("h1")[0];
          var headingString = headingElement.innerHTML;

          var responseObject = {
            content : contentString,
            title : headingString
          }

          var responseString = JSON.stringify(responseObject);

          response.writeHead(200, {
            'Content-Length': responseString.length,
            'Content-Type': 'text/json'
          });

          response.write(responseString, 'utf8');
        }
        
      });
      
    }
  } else if (inboundUrl.pathname = '/') {
    // show root html
  } else {
    response.writeHead(404, {
      'Content-Length': 0,
      'Content-Type': 'text/plain'
    });
  }
  
});

server.listen(8080);

// fs.readFile(__dirname + "/readability.js", function(err, data) {
//     Script.runInNewContext(data.toString(), {
//       window: window, 
//       location: window.location, 
//       navigator: window.navigator, 
//       document:window.document,
//       // these three variables are set from the bookmarklet, so we have to define them
//       readStyle: 'style-newspaper', 
//       readSize: 'size-medium', 
//       readMargin: 'margin-wide'
//     });
//     sys.log(window.document.innerHTML);
// });