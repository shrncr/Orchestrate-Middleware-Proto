const axios = require('axios');
const fs = require('fs');
const { randomUUID } = require('crypto');
require("dotenv").config({ path: "./.env" });

const messages = [
  "Hi, how are you?",
  "Thank you!"
];

var conversation = [];

function streamResponse(m) {
  return new Promise(async (resolve, reject) => {
    try {
      conversation.push({
        role: "user",
        content: m
      })
      const response = await axios({
        method: 'post',
        url: `${process.env.SERVER_URL}/api/generate`,
        responseType: 'stream',
        data: {
          conversation,
          session_id: randomUUID()
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
        }
      });

      let message = "";
      response.data.on('data', (chunk) => {
        const msg = chunk.toString();
        console.log('Received chunk:', msg);
        message += msg;
      });

      response.data.on('end', () => {
        //console.log('Stream ended');
        conversation.push({
          role: "assistant",
          content: message
        });
        resolve();
      });
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}

async function main() {
  for (let msg of messages) {
    try {
      await streamResponse(msg);
      console.log("Full message: ", conversation.at(-1).content);
    } catch (f) {
      console.log(f.message ?? f.status ?? f);
    }
  }
}
main();