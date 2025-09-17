const axios = require('axios');
const { createParser } = require('eventsource-parser');
require("dotenv").config({ path: "../.env" });

const watson = {};

// Step 1: Get JWT token from API key
watson.getAuthToken = async function () {
  const apikey = process.env.WO_APIKEY;

  const res = await axios.post(
    'https://iam.platform.saas.ibm.com/siusermgr/api/1.0/apikeys/token',
    { apikey },
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  return res.data.token;
};

// Step 2: Stream a message to the Orchestrate endpoint
watson.streamMessage = async function (sessionId, messageInput, handler) {
  // console.log('=== Starting streamMessage ===');
  // console.log('Session ID:', sessionId);
  // console.log('Message Input:', messageInput);
  
  const token = await watson.getAuthToken();
  const service_url = process.env.WO_SERVICE_URL
  const agent_id = process.env.AGENT_ID

  const res = await axios.post(
    `${service_url}/v1/orchestrate/runs/stream`,
    { 
      "agent_id": agent_id,
      "version": 1,
      "message": {
        "role": "user",
        "content": messageInput
      },
      "llm_params": {
        "max_tokens": 300,
        "temperature": 0.7,
        "top_p": 0.95
      },
      "context": {
        "department": "Finance",
        "language": "en"
      },
      "context_variables": {
        "wxo_email_id": "user@example.com",
        "wxo_user_name": "John Doe"
      },
      "additional_parameters": {
        "return_citations": true
      }
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    }
  );

  // console.log('=== Response received, starting to process stream ===');

  let buffer = '';
  let chunkCount = 0;
  
  for await (const chunk of res.data) {
    chunkCount++;
    const chunkStr = chunk.toString('utf-8');
    // console.log(`=== Raw Chunk ${chunkCount} ===`);
    // console.log(chunkStr);
    // console.log('=== End Raw Chunk ===');
    
    buffer += chunkStr;
    
    // Try to extract complete JSON objects from the buffer
    let startIndex = 0;
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            startIndex = i;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            // We found a complete JSON object
            const jsonStr = buffer.substring(startIndex, i + 1);
            try {
              const parsed = JSON.parse(jsonStr);
              // console.log('=== Parsed complete JSON ===');
              // console.log(JSON.stringify(parsed, null, 2));
              
              // Call the handler with the parsed data
              handler(parsed);
            } catch (e) {
              console.log('Failed to parse complete JSON:', e.message);
            }
            
            // Remove the processed part from buffer
            buffer = buffer.substring(i + 1);
            i = -1; // Reset loop since we modified the buffer
            startIndex = 0;
          }
        }
      }
    }
  }
  
  // console.log(`=== Stream processing complete. Total chunks: ${chunkCount} ===`);
  return res;
};

module.exports = { watson };