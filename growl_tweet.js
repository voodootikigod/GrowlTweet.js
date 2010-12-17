var sys= require('sys'), 
    http = require('http'),
    growl = require('./lib/node-growl/lib/growl'),
    child_process = require('child_process');
var query = "beer OR jsconf";
var last_tweet_id = 0;
var connection = http.createClient(80, "search.twitter.com");
function notifyTweet(result) {
  var image_url = result.profile_image_url.split("/");
  var fn = image_url[image_url.length-1];
  cmd = "cd /tmp && curl -O "+result.profile_image_url;
  child_process.exec(cmd, function (){
    growl.notify(result.text, { title: "From " + result.from_user, image: "/tmp/"+fn }, (function () { child_process.exec("rm -f /tmp"+fn, function () {});}));
  })
}
function getTweets() {
    var request = connection.request('GET', "/search.json?q=" + encodeURIComponent(query) + "&since_id="+last_tweet_id, {"host": "search.twitter.com", "User-Agent": "TweetGrowler"});
    request.addListener("response", function(response) {
        var responseBody = "";
        response.setEncoding("utf8");
        response.addListener("data", function(chunk) { responseBody += chunk });
        response.addListener("end", function() {
            tweets = JSON.parse(responseBody);
            var results = tweets["results"], length = results.length;
            // reverse order to handle how twitter orders the data over time.
            for (var i = (length-1); i >= 0; i--) {
                if (results[i].id > last_tweet_id) {
                  last_tweet_id = results[i].id;
                }
                notifyTweet(results[i]);
            }
        });
    });
    request.end();
};
// prime the search
getTweets();
// repeat forever...
setInterval(getTweets, 10000);