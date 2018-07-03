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
                { name: 'enterQuery', from: 'query', to: 'questionP' },
                { name: 'answerQuesP', from: 'questionP', to: 'answerP' },
                { name: 'goToWelcomeP', from: 'answerP', to: 'welcome' },
                { name: 'goToQues',  from: 'chooseCategory', to: 'question' },
                { name: 'answerQues', from: 'question', to: 'answer' },
                { name: 'anotherQues', from: 'answer', to: 'question' },
                { name: 'exitQues', from: 'answer', to: 'summary' },
                { name: 'goToWelcome', from: 'summary', to: 'welcome' },
                { name: 'goto', from: '*', to: function(s) { return s } }
            ]
        })
        // Then define child's properties
        this.id = params.id || undefined
        this.name = params.name || undefined
        this.score = params.score || 0
        this.categoryId =  params.categoryId || undefined
        this.quesNum = params.quesNum || undefined
        this.correctAnsNum = params.correctAnsNum || undefined
        this.quesLen = params.quesLen || 5
    }

    initGameData() {
        this.score = 0
        this.quesNum = 0
        this.correctAnsNum = 0
    }
}

// require nodejieba
const nodejieba = require('nodejieba')
nodejieba.load({dict: './dict.txt'})    // 使用繁體中文詞典進行初始化
// 測試parse結果
// let jiebaParsingResult = nodejieba.cut('電視廣告藥品好像很有效，直接買不用查證')
// console.log(jiebaParsingResult)



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


function textTp(text){
    return {
        "type": "text",
        "label": text,
        "text": text
    }
}

function messageTp(text){
    return {
        "type": "message",
        "label": text,
        "text": text
    }
}

function buttonTp(text, actions){
    let actionArr = []
    for(let i=0;i<actions.length;i++){
        actionArr.push(messageTp(actions[i]))
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

function confirmTp(text, actions){
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
let modes = []  // 用於歡迎畫面的按鈕

// 初始化一些變數，例如: button template的選項內容
function init(){
    // init categories
    for(let i=0;i<quesBank.length;i++){
        categories.push(quesBank[i].category)
    }
    // init modes
    modes = ['我要玩遊戲','我要問問題']
}

init()  // 執行初始化

function find(jiebaResult){
    let quesInfo = {
        cid: 0,
        qid: 0,
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
                quesInfo.cid = cat
                quesInfo.qid = quesNum
            }
        }
    }
    return quesInfo
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
    if( userMsg.toLowerCase() == 'h'){
        user.goto('welcome')
    }
    if( user.is('welcome') ){
        if(modes.includes(userMsg)){
            if(userMsg == "我要玩遊戲"){
                user.buttonMode()
                replyMsgs.push(buttonTp("請選擇一個問題類別", categories))
            } else if(userMsg == "我要問問題"){
                user.textMode()
                replyMsgs.push(textTp("請輸入你想知道哪方面的知識，系統會根據您的輸入丟出最匹配的問題~"))
            }
        } else {
            replyMsgs.push( buttonTp("哈囉，歡迎來到用藥常識大考驗^_^，請選擇你所想要使用的模式", modes) )
        }
    }
    else if( user.is('query') ){
        user.enterQuery()
        let jiebaParsingResult = nodejieba.cut(userMsg)
        let quesInfo = find(jiebaParsingResult)
        user.quesNum = quesInfo.qid
        user.categoryId = quesInfo.cid
        let ques = quesBank[quesInfo.cid].content[quesInfo.qid].question
        let opts = quesBank[quesInfo.cid].content[quesInfo.qid].option
        replyMsgs.push(buttonTp(ques, opts))
        console.log("HaHaHa")
    } else if (user.is('questionP')) {
        user.answerQuesP()
        // 判斷user的答案是否正確
        let catId = user.categoryId
        let quesNum = user.quesNum
        let ans = quesBank[catId].content[quesNum].answer
        let detailedExpText = quesBank[catId].content[quesNum].detailed_exp
        if(userMsg == ans) {
            // 答對了!
            // 顯示正確訊息
            replyMsgs.push(textTp("答對了!"))
        } else {
            // 答錯，顯示錯誤訊息
            replyMsgs.push(textTp("答錯了，正確答案為: \"" + ans +"\""))
        }
        replyMsgs.push(buttonTp(detailedExpText, ["我知道了"]))
        console.log("You cannot see me")
    } else if (user.is('answerP')){
        user.goToWelcomeP()
        replyMsgs.push( buttonTp("哈囉，歡迎來到用藥常識大考驗^_^，請選擇你所想要使用的模式", modes) )
    }
    else if( user.is('chooseCategory') ) {
        if(categories.includes(userMsg)){   // 如果user回覆的是categories中的其中一種
            // console.log("Categories: " + categories)
            user.categoryId = categories.indexOf(userMsg)
            user.goToQues()
            user.initGameData()
            console.log("開始出第一題")
            // 開始出第一題
            let catIndex = user.categoryId
            let quesNum = user.quesNum
            let opts = quesBank[catIndex].content[quesNum].option
            let ques = (quesNum+1)+". "+quesBank[catIndex].content[quesNum].question
            replyMsgs.push(buttonTp(ques, opts))
        } else {
            // 停留在這個state，再次回覆chooseCategory template
            replyMsgs.push(buttonTp("請選擇一個問題類別", categories))
        }
    }    
    else if ( user.is('question') ){
        user.answerQues()
        // console.log("我是頭")
        let catIndex = user.categoryId
        // 判斷user前一題的答案是否正確
        let ans = quesBank[catIndex].content[user.quesNum].answer
        let detailedExpText = quesBank[catIndex].content[user.quesNum].detailed_exp
        if(userMsg == ans) {
            // 答對了!
            user.correctAnsNum++   // 答對題數+1，
            // 顯示正確訊息
            replyMsgs.push(textTp("答對了!"))
        } else {
            // 答錯，顯示錯誤訊息
            replyMsgs.push(textTp("答錯了，正確答案為: \"" + ans +"\""))
        }

        user.quesNum++  // 答題數+1
        if(user.quesNum >= user.quesLen){   // 已答完所有題目
            // 顯示詳解
            replyMsgs.push(textTp(detailedExpText))
            replyMsgs.push(buttonTp("恭喜你完成題目咯~", ["查看成績"]))
        } else {
            // 顯示詳解
            replyMsgs.push(textTp(detailedExpText))
            replyMsgs.push(confirmTp("繼續進行下一題?", ["回主畫面","下一題"]))
        }
        // console.log("我是尾")
    } else if ( user.is('answer') ) {
        let catIndex = user.categoryId
        // 檢查是否題目已經出完
        if(user.quesNum >= user.quesLen){
            // 使用者已完成題目
            user.exitQues()
            // 計算分數
            user.score = Math.round( user.correctAnsNum.toFixed(2) / user.quesNum * 100)
            replyMsgs.push( textTp("恭喜您完成了本遊戲! 您的得分為" + user.score + "分") )
            replyMsgs.push( confirmTp("是否再玩一次呢?", ["是","好"]) )
        } else if (userMsg == "回主畫面") {
            user.goto('welcome')
            replyMsgs.push( buttonTp("哈囉，歡迎來到用藥常識大考驗^_^，請選擇你所想要使用的模式", modes) )
        } else {
            // 尚未完成，繼續顯示下一題的template供使用者回覆
            user.anotherQues()
            let ques = (user.quesNum+1)+". "+quesBank[catIndex].content[user.quesNum].question
            let opts = quesBank[catIndex].content[user.quesNum].option
            replyMsgs.push( buttonTp(ques, opts) )
        }
    } else if ( user.is('summary') ){
        user.goToWelcome()
        replyMsgs.push( buttonTp("哈囉，歡迎來到用藥常識大考驗^_^，請選擇你所想要使用的模式", modes) )
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