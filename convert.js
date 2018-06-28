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
    let content = fs.readFileSync('ques_bank.json', 'utf8')
    quesBank = JSON.parse(content)
} catch(e) {
    console.log('Error:', e.stack)
}

// console.log(quesBank)

let newOpt = []
for(let i=0;i<quesBank.length;i++){
  let qContent = quesBank[i].content
  for(let j=0;j<qContent.length;j++){
    let opt = qContent[j].option

    let ans = qContent[j].answer
    if(ans == "A" || ans == "B" || ans == "C"){
      qContent[j].answer = opt[ans] 
    }

    newOpt = []
    if(!Array.isArray(opt)){
      let ascii = "A".charCodeAt(0)
      for(let k = ascii; k < ascii + Object.keys(opt).length; k++){
        newOpt.push(opt[String.fromCharCode(k)])
        console.log(newOpt)
      }
      qContent[j].option = newOpt.slice()
    }


    
  }
}

fs.writeFile("NEW_ques_bank.json", JSON.stringify(quesBank, null, 4), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("File has been saved!");
}); 