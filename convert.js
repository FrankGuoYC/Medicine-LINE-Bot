fs = require('fs')

// let quesBank = null;
// fs.readFile('ques_bank.json', 'utf8', function (err,data) {
//   if (err) {
//     return console.log(err);
//   }
//   console.log(data)
//   quesBank = JSON.parse(data)
// });

let quesBank = null
try {  
    let content = fs.readFileSync('old/v2_ques_bank.json', 'utf8')
    quesBank = JSON.parse(content)
} catch(e) {
    console.log('Error:', e.stack)
}

// console.log(quesBank)

let newOpt = []
for(let i=0;i<quesBank.length;i++){
  quesBank[i].cid--
  let qContent = quesBank[i].content
  for(let j=0;j<qContent.length;j++){
    qContent[j].qid--
  }
}

// 如果直接用JSON.stringify(quesBank)，所輸出的json檔會沒有排版(minified)很難讀，
// 所以我改用JSON.stringify(quesBank, null, 4)，這樣子輸出的json檔就會有縮排，且縮排大小是4個空格
fs.writeFile("ques_bank.json", JSON.stringify(quesBank, null, 4), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("File has been saved!");
}); 