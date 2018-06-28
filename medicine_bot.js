"use strict";

// require module
let linebot = require('linebot')
let express = require('express')
let fs = require('fs')
let StateMachine = require('javascript-state-machine')

// 嘗試看看ES6風格的class宣告
class User extends StateMachine {
    constructor(params){
        // Use super() to call parent's constructor first
        super({
            init: 'welcome',
            transitions: [
                { name: 'buttonMode',  from: 'welcome',  to: 'chooseCategory' },
                { name: 'textMode', from: 'welcome', to: 'query' },
                { name: 'enterQuery', from: 'query', to: 'question_p' },
                { name: 'answerQues_p', from: 'question_p', to: 'answer_p' },
                { name: 'goToWelcome_p', from: 'answer_p', to: 'welcome' },
                { name: 'goToQues',  from: 'chooseCategory', to: 'question' },
                { name: 'answerQues', from: 'question', to: 'answer' },
                { name: 'anotherQues', from: 'answer', to: 'question' },
                { name: 'exitQues', from: 'answer', to: 'summary' },
                { name: 'goToWelcome', from: 'summary', to: 'welcome' },
            ]
        })
        // Then define child's properties
        this.id = params.id || undefined
        this.name = params.name || undefined
        this.score = params.score || 0
        this.category =  params.category || undefined
        this.quesNum = params.quesNum || undefined
        this.correctAnsNum = params.correctAnsNum || undefined
        this.quesLen = params.quesLen || 5
    }

    run() {
        console.log(`${this.name} is running!`)
    }

    initGameData() {
        this.score = 0
        this.quesNum = 0
        this.correctAnsNum = 0
    }
}

let userTest = new User({name: "Frank"})
userTest.run()

// require nodejieba
const nodejieba = require('nodejieba')
nodejieba.load({dict: './dict.txt'})    // 使用繁體中文詞典進行初始化
// 測試parse結果
let jiebaParsingResult = nodejieba.cut('電視廣告藥品好像很有效，直接買不用查證')
console.log(jiebaParsingResult)



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

// 載入題庫
let quesBank = null
try {  
    let content = fs.readFileSync('ques_bank.json', 'utf8')
    quesBank = JSON.parse(content)
} catch(e) {
    console.log('Error:', e.stack)
}

// // 測試quesBank每個問題的斷詞結果
// let outputContent = []
// for ( let i=0;i<quesBank.length; i++ ){
//     let quesCategory = quesBank[i]
//     console.log("quesCategory: "+quesCategory.category)
//     for(let k=0; k<quesCategory.content.length; k++ ){
//         let ques = quesCategory.content[k]
//         console.log("question " + (k+1))
//         let result = nodejieba.cut(ques.question)
//         console.log(result)
//         outputContent.push(result)
//     }
// }
// // 將測試的parse結果寫到檔案
// fs.writeFile("testParsingResult.json", JSON.stringify(outputContent), function(err) {
//     if(err) {
//         return console.log(err);
//     }
//     console.log("File has been saved!");
// }); 

let userList = {}  // 先暫時用一個object當作list存users


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

function buttonTemplate(text, actions){
    let actionArr = []
    for(let i=0;i<actions.length;i++){
        actionArr.push({
            "type": "message",
            "label": actions[i],
            "text": actions[i]
        })
    }
    return {
        "type": "template",
        "altText": "This is a buttons template",
        "template": {
            "type": "buttons",
            // "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
            // "imageAspectRatio": "rectangle",
            // "imageSize": "cover",
            // "imageBackgroundColor": "#FFFFFF",
            // "title": "Menu",
            "text":  text,
            "actions": actionArr
        }
    }
}

function confirmTemplate(text, actions){
    let actionArr = []
    for(let i=0;i<actions.length;i++){
        actionArr.push({
            "type": "message",
            "label": actions[i],
            "text": actions[i]
        })
    }
    return {
        "type": "template",
        "altText": "this is a confirm template",
        "template": {
            "type": "confirm",
            "text": text,
            "actions": actionArr
        }
    }
}

// 初始化回覆使用者button template的時候所需用到的options
let categories = [] // 用於詢問使用者要使用哪一領域的問題
let categoryButtons = []
let welcomeButtons = []  // 用於歡迎畫面的按鈕

// 初始化一些變數，例如: button template的選項內容
function init(){
    // init categories
    for(let i=0;i<quesBank.length;i++){
        categories.push(quesBank[i].category)
    }
    // init categoryButtons
    for(let i=0;i<quesBank.length;i++){
        categoryButtons.push({
                "type": "message",
                "label": categories[i],
                "text": categories[i]
            }
        )
    }
    // init welcomeButtons
    welcomeButtons = ['我要玩遊戲','我要問問題']
    // welcomeButtons.push({
    //     "type": "message",
    //     "label": "我要玩遊戲",
    //     "text": "我要玩遊戲"
    // })
    // welcomeButtons.push({
    //     "type": "message",
    //     "label": "我要問問題",
    //     "text": "我要問問題"
    // })
}

init()  // 執行初始化

function find(jiebaResult){
    let infoToReturn = {
        quesNum: 0,
        quesCategory: 0,
    };
	var match = 0;
	var match_pref = 0;
    // traversal question category
    for(let cat = 0; cat < quesBank.length; cat++){
        // traversal question
        for(let quesNum = 0; quesNum < quesBank[cat].content.length; quesNum++){
            match = 0
            // traversal keywords
            for(let now = 0; now < jiebaResult.length; now++){
                if(quesBank[cat].content[quesNum].keyword.includes(jiebaResult[now]) == true){
                    match++
                }
            }
            if(match>match_pref){
                match_pref = match
                infoToReturn.quesNum = quesNum + 1
                infoToReturn.quesCategory = cat + 1
            }
        }
    }
    return infoToReturn
}

console.log(find(jiebaParsingResult))


let bot = linebot({
    channelId: "1582316615",
    channelSecret: "94f9d0d9a00c8d2111f69153d3f62a38",
    channelAccessToken: "pbJnnx5h0DCxsAmvhpqhsXvj8wWPYm/PxHAXSYP3gVNxqyS3JNkOPuYuF1uKlSllEXxUr4LcMae89wbTKU/Y5fL8pKpzAwOuJDDK8l8ILgtBaHmvLT68lAIuM13T3kel1sgU35VbxLYDE5psUo5UlgdB04t89/1O/w1cDnyilFU="
});

bot.on('message', function(event) {
    let curUserId = event.source.userId    // 從傳送來的訊息中擷取出userId以辨認是哪一個user所傳送的訊息
    console.log("User ID: " + curUserId)
    /***** 開始根據user id做出對應的動作 *****/
    // 如果user還沒有在清單中，創建User物件並將他加到userList當中
    if( userList[curUserId] == undefined ){
        userList[curUserId] = new User({id: curUserId})
        console.log("Add user (id: "+curUserId+")")
    }
    let user = userList[curUserId]
    let userMsg = event.message.text
    console.log(user)

    console.log("User message text: " + userMsg)
    // 根據user的state來做出對應的回覆
    let replyMsgs = []  // 用來存一個或多個要送出的訊息
    let optionButtons = [] // 用來儲存問題的選項

    if( user.is('welcome') ){
        replyMsgs.push(
            buttonTemplate("哈囉，歡迎來到用藥常識大考驗^_^，請選擇你所想要使用的模式", welcomeButtons)
            // {
            //     "type": "template",
            //     "altText": "This is a buttons template",
            //     "template": {
            //         "type": "buttons",
            //         // "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
            //         // "imageAspectRatio": "rectangle",
            //         // "imageSize": "cover",
            //         // "imageBackgroundColor": "#FFFFFF",
            //         // "title": "Menu",
            //         "text":  "哈囉，歡迎來到用藥常識大考驗^_^，請選擇你所想要使用的模式",
            //         "actions": welcomeButtons
            //     }
            // }
        )
    }
    else if( user.is('chooseCategory') ) {
        if(categories.includes(userMsg)){   // 如果user回覆的是categories中的其中一種
            // console.log("Categories: " + categories)
            user.category = userMsg
            user.gotoQues()
            user.initGameData()
            // 開始出第一題
            let cat = user.category
            let quesNum = user.quesNum
            let optsForQues = quesBank[cat].content[quesNum].option
            for(let opt in optsForQues){
                optionButtons.push({
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
                        "actions": optionButtons
                    }   
                }
            )

        } else {
            // 停留在這個state，再次回覆chooseCategory template
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
                        "actions": categoryButtons
                    }
                }
            )

        }
    }    
    else if ( user.is('question') ){
        user.answerQues()
        let cat = user.category
        let quesNum = user.quesNum
        // 判斷user前一題的答案是否正確
        let ans = quesBank[cat].content[quesNum].answer
        let ansText = quesBank[cat].content[quesNum].option[ans]
        let detailedExpText = quesBank[cat].content[quesNum].detailed_exp
        if(userMsg == ansText) {
            // 答對了!
            user.correctAnsNum++   // 答對題數+1，
            // 顯示正確訊息
            replyMsgs.push(
                {
                    "type": "text",
                    "label": "答對了!",
                    "text": "答對了!"
                }
            )
        } else {
            // 答錯，顯示錯誤訊息
            replyMsgs.push(
                {
                    "type": "text",
                    "label": "答錯了，正確答案為: \"" + ansText +"\"",
                    "text": "答錯了，正確答案為: \"" + ansText +"\""
                }
            )
        }

        // 顯示詳解，不論對錯都會顯示詳解
        replyMsgs.push(
            {
                "type": "text",
                "label": detailedExpText,
                "text": detailedExpText
            }
        )
        user.quesNum++  // 答題數+1





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