// import 'jieba-js/scripts/main.js'
// import 'jieba-js/scripts/data/dictionary.js'

let linebot = require('linebot')
let express = require('express')
let fs = require('fs')
let StateMachine = require('javascript-state-machine')

// These are for the visualization of the finite state machine
// const Viz = require('viz.js')
// const { Module, render } = require('viz.js/full.render.js')
// let viz = new Viz({ Module, render })

// viz.renderString('digraph { a -> b }')
//   .then(result => {
//     console.log(result);
//   })
//   .catch(error => {
//     // Create a new Viz instance (@see Caveats page for more info)
//     viz = new Viz({ Module, render });

//     // Possibly display the error
//     console.error(error);
//   })

// 初始化有限狀態機
// <待補上>

require('jiebajs/scripts/main.js');
 
_text = "這個布丁是在無聊的世界中找尋樂趣的一種不能吃的食物，喜愛動漫畫、遊戲、程式，以及跟世間脫節的生活步調。";
 
dict1 = require('jiebajs/scripts/data/dictionary.js');
dict2 = require('jiebajs/scripts/data/dict_custom.js');
 
node_jieba_parsing([dict1, dict2], _text, function (_result) {
    console.log(_result.join(" "));
    console.log("我在這裡!")
});




// 載入題庫
let quesBank = null
try {  
    let content = fs.readFileSync('ques_bank.json', 'utf8')
    quesBank = JSON.parse(content)
} catch(e) {
    console.log('Error:', e.stack)
}

// 儲存使用者變數
// 先用簡單一點的寫法，有時間再改成好一點的寫法(例如寫成一個Object)
let users = {}
let State = {
    welcome: "welcome",
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
        correctAnsNum: undefined,
        quesLen: 5
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

function getUserQuesLen(usrId){
    return users[usrId].quesLen
}

function setUserQuesLen(usrId, quesLen){
    users[usrId].quesLen = quesLen
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
    let replyMsgs = []  // 用來存一個或多個要送出的訊息
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
            replyMsgs.push(
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
            
            replyMsgs.push(
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
            replyMsgs.push(
                {
                    "type": "text",
                    // "label": "答對了!",
                    "text": "答對了!"
                }
            )
        } else {
            // 答錯，顯示錯誤訊息
            replyMsgs.push(
                {
                    "type": "text",
                    "label": "答錯了，正確答案為: \"" + answerText +"\"",
                    "text": "答錯了，正確答案為: \"" + answerText +"\""
                }
            )
        }
        // 顯示詳解
        replyMsgs.push(
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
        if(curQuesNum >= getUserQuesLen(curUserId)){
            // 顯示完成遊戲訊息
            // 計算分數
            // 將User狀態設回start
            setUserState(curUserId, State.start)
            let score = Math.round( (getUserCorrectAnsNum(curUserId) / getUserQuesNo(curUserId) ) * 100 )
            setUserScore(curUserId, score)
            replyMsgs.push(
                {
                    "type": "text",
                    "label": "恭喜您完成了本遊戲! 您的得分為" + getUserScore(curUserId) + "分",
                    "text":  "恭喜您完成了本遊戲! 您的得分為" + getUserScore(curUserId) + "分", 
                }
            )
            replyMsgs.push(
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

            replyMsgs.push(
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

    // 最後將一個或多個訊息送出
    event.reply(replyMsgs)
});


const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
let server = app.listen(process.env.PORT || 8080, function() {
    let port = server.address().port;
    console.log("App now running on port", port);
});