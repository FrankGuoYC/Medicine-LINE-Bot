let linebot = require('linebot');
let express = require('express');
let fs = require('fs')

// 載入題庫
let quesBank = null
try {  
    let content = fs.readFileSync('ques_bank.json', 'utf8')
    quesBank = JSON.parse(content)
} catch(e) {
    console.log('Error:', e.stack)
}

// 先用簡單一點的寫法，之後再看要不要用專業一點的寫法
let users = {}
let State = {
    start: "start",
    chooseCategory: "chooseCategory",
    question: "question"
}

function addUser(usrId){
    // Create and initiate a user and store it into object 'users'
    users[usrId] = {
        state: State.start,
        score: undefined,
        category: undefined,
        quesNo: undefined,
        correctAnsNum: undefined
    }
}

function getUser(usrId){
    return users[usrId]
}

function getUserState(usrId){
    return users[usrId].state
}

function setUserState(usrId, stat){
    users[usrId].state = stat
}

function getUserCategory(usrId){
    return users[usrId].category
}

function setUserCategory(usrId, cat){
    users[usrId].category = cat
}


function getUserScore(usrId){
    return users[usrId].score
}

function setUserScore(usrId, score){
    users[usrId].score = score
}

function getUserQuesNo(usrId){
    return users[usrId].quesNo
}

function setUserQuesNo(usrId, qno){
    users[usrId].quesNo = qno
}

function incrementUserQuesNo(usrId){
    users[usrId].quesNo++
}

function getUserCorrectAnsNum(usrId){
    return users[usrId].correctAnsNum
}

function setUserCorrectAnsNum(usrId, cno){
    users[usrId].correctAnsNum = cno
}

function incrementUserCorrectAnsNum(usrId){
    users[usrId].correctAnsNum++
}

function initUserGameData(usrId){
    setUserScore(usrId, 0)
    setUserQuesNo(usrId, 0)
    setUserCorrectAnsNum(usrId, 0)
}

function isUserJoined(usrId){
    if(usrId in users) return true
    else return false
}
function removeUser(usrId){
    delete users[usrId]
}



let bot = linebot({
    channelId: "1582316615",
    channelSecret: "94f9d0d9a00c8d2111f69153d3f62a38",
    channelAccessToken: "pbJnnx5h0DCxsAmvhpqhsXvj8wWPYm/PxHAXSYP3gVNxqyS3JNkOPuYuF1uKlSllEXxUr4LcMae89wbTKU/Y5fL8pKpzAwOuJDDK8l8ILgtBaHmvLT68lAIuM13T3kel1sgU35VbxLYDE5psUo5UlgdB04t89/1O/w1cDnyilFU="
});

bot.on('message', function(event) {
    let curUserId = event.source.userId    // 從傳送來的訊息中擷取出userId以辨認是哪一個user所傳送的訊息
    console.log("User ID: " + curUserId)
    /***** 開始根據user id做出對應的動作 *****/
    // 如果user還沒有在清單中，將他加到清單當中
    if( !isUserJoined(curUserId) ){
        addUser(curUserId)
        console.log("Add user (id: "+curUserId+")")
        console.log(users)
    }
    // let usr = getUser(curUserId)

    console.log("event")
    console.log(event)
    console.log("event message text: " + event.message.text)
    // 根據user的state來做出對應的回覆
    // --- Declaration ---
    let replyMsg = {
        replyToken: event.replyToken,
        messages: []
    }
    let options = []
    let optionsForQuestion = []
    let optionsActions = []

    // --- Initialize ---
    for(let i=0;i<quesBank.length;i++){
        options.push(quesBank[i].category)
    }

    if( getUserState(curUserId) == State.start ) {
        if(options.includes(event.message.text)){   // 如果user回覆的是四種題型的其中一種
            setUserCategory(curUserId, options.indexOf(event.message.text))
            setUserState(curUserId, State.question)
            // 初始化
            initUserGameData(curUserId)
            // 開始出第一題
            let curQuesNum = getUserQuesNo(curUserId)
            let curUserCategory = getUserCategory(curUserId)
            let optsForQues = quesBank[curUserCategory].content[curQuesNum].option
            for(let opt in optsForQues){
                optionsForQuestion.push({
                        "type": "message",
                        "label": optsForQues[opt],
                        "text": optsForQues[opt]
                    }
                )
            }
            replyMsg.messages.push(
                {
                    "type": "template",
                    "altText": "This is a buttons template",
                    "template": {
                        "type": "buttons",
                        "text":  (curQuesNum+1)+". "+quesBank[curUserCategory].content[curQuesNum].question,
                        "actions": optionsForQuestion
                    }   
                }
            )

        } else {
            for(let i=0;i<quesBank.length;i++){
                optionsActions.push({
                        "type": "message",
                        "label": options[i],
                        "text": options[i]
                    }
                )
            }
            
            replyMsg.messages.push(
                {
                    "type": "template",
                    "altText": "This is a buttons template",
                    "template": {
                        "type": "buttons",
                        // "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
                        // "imageAspectRatio": "rectangle",
                        // "imageSize": "cover",
                        // "imageBackgroundColor": "#FFFFFF",
                        // "title": "Menu",
                        "text":  "哈囉，歡迎來到用藥常識大考驗^_^，請選擇一個問題類別",
                        "actions": optionsActions
                    }
                }
            )

        }
    }    
    else if (getUserState(curUserId) == State.question){
        let curQuesNum = getUserQuesNo(curUserId)
        let curUserCategory = getUserCategory(curUserId)
        // 判斷user前一題的答案是否正確
        let answer = quesBank[curUserCategory].content[curQuesNum].answer
        let answerText = quesBank[curUserCategory].content[curQuesNum].option[answer]
        let detailedExpText = quesBank[curUserCategory].content[curQuesNum].detailed_exp
        if(event.message.text == answerText) {
            incrementUserCorrectAnsNum(curUserId)   // 答對題數+1，
            // 答對，顯示正確訊息
            replyMsg.messages.push(
                {
                    "type": "text",
                    // "label": "答對了!",
                    "text": "答對了!"
                }
            )
        } else {
            // 答錯，顯示錯誤訊息
            replyMsg.messages.push(
                {
                    "type": "text",
                    "label": "答錯了，正確答案為: \"" + answerText +"\"",
                    "text": "答錯了，正確答案為: \"" + answerText +"\""
                }
            )
        }
        // 顯示詳解
        replyMsg.messages.push(
            {
                "type": "text",
                "label": detailedExpText,
                "text": detailedExpText
            }
        )

        // 下一題
        curQuesNum++
        console.log(curQuesNum)
        console.log(quesBank[curUserCategory].content.length)
        incrementUserQuesNo(curUserId, curQuesNum)
        // 檢查是否題目已經出完
        if(curQuesNum >= quesBank[curUserCategory].content.length){
            // 顯示完成遊戲訊息
            // 計算分數
            // 將User狀態設回start
            setUserState(curUserId, State.start)
            let score = Math.round( (getUserCorrectAnsNum(curUserId) / getUserQuesNo(curUserId) ) * 100 )
            setUserScore(curUserId, score)
            replyMsg.messages.push(
                {
                    "type": "text",
                    "label": "恭喜您完成了本遊戲! 您的得分為" + getUserScore(curUserId) + "分",
                    "text":  "恭喜您完成了本遊戲! 您的得分為" + getUserScore(curUserId) + "分", 
                }
            )
            replyMsg.messages.push(
                {
                    "type": "template",
                    "altText": "this is a confirm template",
                    "template": {
                        "type": "confirm",
                        "text": "是否再玩一次呢?",
                        "actions": [
                            {
                                "type": "message",
                                "label": "是",
                                "text": "是"
                            },
                            {
                                "type": "message",
                                "label": "好",
                                "text": "好"
                            }
                        ]
                    }
                }
            )
        } else {
            // 顯示下一題的內容
            let optsForQues = quesBank[curUserCategory].content[curQuesNum].option
            for(let opt in optsForQues){
                optionsForQuestion.push({
                        "type": "message",
                        "label": optsForQues[opt],
                        "text": optsForQues[opt]
                    }
                )
            }

            replyMsg.messages.push(
                {
                    "type": "template",
                    "altText": "This is a buttons template",
                    "template": {
                        "type": "buttons",
                        "text":  (curQuesNum+1)+". "+quesBank[curUserCategory].content[curQuesNum].question,
                        "actions": optionsForQuestion
                    }   
                }
            )
        }


    }

    event.reply(replyMsg)
    // if (event.message.type = 'text') {
    //     var msg = event.message.text;
    //     event.reply(msg).then(function(data) {
    //     // success 
    //         console.log(msg);
    //     }).catch(function(error) {
    //         // error 
    //         console.log('error');
    //     });
    // }
});


const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
let server = app.listen(process.env.PORT || 8080, function() {
    let port = server.address().port;
    console.log("App now running on port", port);
});