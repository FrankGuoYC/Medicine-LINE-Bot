/** ----- Sample Code for chatbot on Heroku ----- */
var linebot = require('linebot');
var express = require('express');

var bot = linebot({
  channelId: Channel_Id, // Fill in channel id here
  channelSecret: "",    // Fill in channel Secret here
  channelAccessToken: "Channel_Access_Token" // Fill in channel access token here
});

bot.on('message', function(event) {
    if (event.message.type = 'text') {
      var msg = event.message.text;
      event.reply(msg).then(function(data) {
        // success 
        console.log(msg);
      }).catch(function(error) {
        // error 
        console.log('error');
      });
    }
});

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});