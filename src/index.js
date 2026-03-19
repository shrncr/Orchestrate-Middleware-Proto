require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { watson } = require('./watson');
 
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb", extended: true }));

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Stream endpoint for avatar service
app.post("/stream-hello", authenticateBearerToken, async (req, res) => {
  console.log("/stream-hello endpoint called");
  await streamResponse(req, res);
});

function authenticateBearerToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.ACCESS_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}

// Stream response function for avatar service
async function streamResponse(req, res) {
  const conversation = req.body.conversation ?? [];
  const session_id = req.body.session_id ?? "";

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

    // Set headers for streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let hasStreamedContent = false;
    
    // Stream the Watson response
    await watson.streamMessage(session_id, message, function (data) {
      // Handle message.delta events (streaming chunks)
      if (data.event === 'message.delta') {
        if (data.data?.delta?.content) {
          const deltaContent = data.data.delta.content;
          if (Array.isArray(deltaContent)) {
            for (const item of deltaContent) {
              if (item.response_type === 'text' && item.text) {
                res.write(item.text);
                hasStreamedContent = true;
              }
            }
          }
        }
      }
      
      // Handle message.created events (complete messages) - fallback if no streaming
      else if (data.event === 'message.created' && !hasStreamedContent) {
        if (data.data?.message?.content) {
          const messageContent = data.data.message.content;
          if (Array.isArray(messageContent)) {
            for (const item of messageContent) {
              if (item.response_type === 'text' && item.text) {
                res.write(item.text);
              }
            }
          }
        }
      }
    });

    res.end();

  } catch (error) {
    console.error("Stream error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.end();
    }
  }
}

// Export for Vercel serverless
module.exports = app;

<<<<<<< HEAD
// Start server locally (not used in Vercel)
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
  });
}
=======
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
    
    await watson.streamMessage(session_id, message, function (data) {
      // Handle message.delta events (streaming chunks)
      if (data.event === 'message.delta') {
        if (data.data?.delta?.content) {
          const deltaContent = data.data.delta.content;
          if (Array.isArray(deltaContent)) {
            for (const item of deltaContent) {
              if (item.response_type === 'text' && item.text) {
                res.write(item.text);
                response += item.text;
              }
            }
          }
        }
      }
      
      // Handle message.created events (complete messages)
      else if (data.event === 'message.created') {
        if (data.data?.message?.content) {
          const messageContent = data.data.message.content;
          if (Array.isArray(messageContent)) {
            for (const item of messageContent) {
              if (item.response_type === 'text' && item.text) {
                // Only write if this is different from what we've already streamed
                if (item.text !== response) {
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
>>>>>>> parent of a73be48 (update - fix - rolled back version)
