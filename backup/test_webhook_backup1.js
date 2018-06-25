'use strict'
const line = require('./index')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

// need raw buffer for signature validation
app.use(bodyParser.json({
  verify (req, res, buf) {
    req.rawBody = buf
  }
}))

// init with auth
line.init({
  accessToken: 'pbJnnx5h0DCxsAmvhpqhsXvj8wWPYm/PxHAXSYP3gVNxqyS3JNkOPuYuF1uKlSllEXxUr4LcMae89wbTKU/Y5fL8pKpzAwOuJDDK8l8ILgtBaHmvLT68lAIuM13T3kel1sgU35VbxLYDE5psUo5UlgdB04t89/1O/w1cDnyilFU=',
  // (Optional) for webhook signature validation
  channelSecret: '94f9d0d9a00c8d2111f69153d3f62a38'
})

/**
 * response example (https://devdocs.line.me/ja/#webhook):
 * {
 *   "events": [
 *     {
 *       "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
 *       "type": "message",
 *       "timestamp": 1462629479859,
 *       "source": {
 *         "type": "user",
 *         "userId": "u206d25c2ea6bd87c17655609a1c37cb8"
 *       },
 *       "message": {
 *         "id": "325708",
 *         "type": "text",
 *         "text": "Hello, world"
 *       }
 *     }
 *   ]
 * }
 */

// Button template
// {
//   "type": "template",
//   "altText": "this is a confirm template",
//   "template": {
//       "type": "confirm",
//       "text": "Are you sure?",
//       "actions": [
//           {
//             "type": "message",
//             "label": "Yes",
//             "text": "yes"
//           },
//           {
//             "type": "message",
//             "label": "No",
//             "text": "no"
//           }
//       ]
//   }
// }

app.post('/webhook/', line.validator.validateSignature(), (req, res, next) => {
  // get content from request body
  const promises = req.body.events.map(event => {
    // reply message
    return line.client
      .replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            "type":"text",
            "text": event.message.text
          },
          {
              "type":"text",
              "text":"May I help you?"
          }
          // {
          //   "type": "template",
          //   "altText": "This is a buttons template",
          //   "template": {
          //       "type": "buttons",
          //       "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
          //       "imageAspectRatio": "rectangle",
          //       "imageSize": "cover",
          //       "imageBackgroundColor": "#FFFFFF",
          //       "title": "Menu",
          //       "text": "Please select",
          //       "defaultAction": {
          //           "type": "uri",
          //           "label": "View detail",
          //           "uri": "http://example.com/page/123"
          //       },
          //       "actions": [
          //           {
          //             "type": "postback",
          //             "label": "Buy",
          //             "data": "action=buy&itemid=123"
          //           },
          //           {
          //             "type": "postback",
          //             "label": "Add to cart",
          //             "data": "action=add&itemid=123"
          //           },
          //           {
          //             "type": "uri",
          //             "label": "View detail",
          //             "uri": "http://example.com/page/123"
          //           }
          //       ]
          //   }
          // }
        ]
      })
  })
  Promise
    .all(promises)
    .then(() => res.json({success: true}))
})

app.listen(process.env.PORT || 3000, () => {
  console.log('Example app listening on port 3000!')
})
