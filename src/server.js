const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "./.env" });

const { watson } = require('./watson');

var SESSION_ID_MAPPING = {};

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb", extended: true }));

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.post("/api/generate/:avatarName", authenticateBearerToken, async (req, res) => {
  console.log("/api/generate/:avatarName")
  await generate(req, res);
});

app.post("/api/generate", authenticateBearerToken, async (req, res) => {
  console.log("/api/generate")
  await generate(req, res);
});

function authenticateBearerToken(req, res, next) {
  // const authHeader = req.headers['authorization'];
  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  // }

  // const token = authHeader.split(' ')[1];
  // if (token !== process.env.ACCESS_TOKEN) {
  //   return res.status(403).json({ error: 'Forbidden' });
  // }

  next();
}

async function generate(req, res) {
  const avatarName = req.params?.avatarName ?? "";
  const conversation = req.body.conversation ?? [];
  const base64Image = req.body.base64Image ?? "";
  var session_id = req.body.session_id ?? "";

  try {
    if (!session_id) {
      res.status(400).json({ error: "Session ID cannot be blank" });
      return;
    }

    const msg = conversation.at(-1);
    if (!msg) {
      res.status(400).json({ error: "Could not read last message in the conversation" });
      return;
    }
    if (msg.role != "user") {
      res.status(400).json({ error: "Last message in the conversation must be from the user" });
      return;
    }
    const message = msg.content;
    if (!message) {
      res.status(400).json({ error: "Last message in the conversation must not be blank" });
      return;
    }

    res.setHeader("Content-Type", "text/plain");

    let response = "";
    
    // Pass session_id as the first parameter, message as second
    await watson.streamMessage(session_id, message, function (data) {
      // console.log('=== Handler called with data ===');
      // console.log('Event:', data.event);
      
      // Handle message.delta events (streaming chunks)
      if (data.event === 'message.delta') {
        //console.log('Processing message.delta event');
        if (data.data?.delta?.content) {
          const deltaContent = data.data.delta.content;
          if (Array.isArray(deltaContent)) {
            for (const item of deltaContent) {
              if (item.response_type === 'text' && item.text) {
                //console.log('Writing delta text:', item.text);
                res.write(item.text);
                response += item.text;
              }
            }
          }
        }
      }
      
      // Handle message.created events (complete messages)
      else if (data.event === 'message.created') {
        //console.log('Processing message.created event');
        if (data.data?.message?.content) {
          const messageContent = data.data.message.content;
          if (Array.isArray(messageContent)) {
            for (const item of messageContent) {
              if (item.response_type === 'text' && item.text) {
                //console.log('Found complete message text:', item.text);
                // Only write if this is different from what we've already streamed
                if (item.text !== response) {
                  //console.log('Writing complete message (different from streamed):', item.text);
                  if (response) {
                    res.write('\n');
                  }
                  res.write(item.text);
                  response = item.text;
                } else {
                  console.log('Skipping duplicate message');
                }
              }
            }
          }
        }
      }
      
      //console.log('=== End handler ===');
    });

    res.end();
  } catch (error) {
    console.error(error, error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});