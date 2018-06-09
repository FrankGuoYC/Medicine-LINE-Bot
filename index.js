var linebot = require('linebot');
var express = require('express');

var bot = linebot({
    channelId: "1582316615",
    channelSecret: "94f9d0d9a00c8d2111f69153d3f62a38",
    channelAccessToken: "pbJnnx5h0DCxsAmvhpqhsXvj8wWPYm/PxHAXSYP3gVNxqyS3JNkOPuYuF1uKlSllEXxUr4LcMae89wbTKU/Y5fL8pKpzAwOuJDDK8l8ILgtBaHmvLT68lAIuM13T3kel1sgU35VbxLYDE5psUo5UlgdB04t89/1O/w1cDnyilFU="
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