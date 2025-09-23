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
  const token = await watson.getAuthToken();
  const service_url = process.env.WO_SERVICE_URL;
  const agent_id = process.env.AGENT_ID;

  try {
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
        responseType: 'stream',
        timeout: 60000 // 60 second timeout
      }
    );

    let buffer = '';
    let chunkCount = 0;
    let lastProcessedIndex = 0;
    
    // Process the streaming response
    res.data.on('data', (chunk) => {
      chunkCount++;
      const chunkStr = chunk.toString('utf-8');
      buffer += chunkStr;
      
      // Process complete JSON objects from the buffer
      while (true) {
        const jsonStart = buffer.indexOf('{', lastProcessedIndex);
        if (jsonStart === -1) break;
        
        let braceCount = 0;
        let inString = false;
        let escaped = false;
        let jsonEnd = -1;
        
        for (let i = jsonStart; i < buffer.length; i++) {
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
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                jsonEnd = i;
                break;
              }
            }
          }
        }
        
        if (jsonEnd === -1) {
          // Incomplete JSON, wait for more data
          break;
        }
        
        const jsonStr = buffer.substring(jsonStart, jsonEnd + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          
          // Call the handler immediately for real-time streaming
          if (handler) {
            handler(parsed);
          }
          
        } catch (e) {
          console.error('Failed to parse JSON chunk:', e.message);
          console.error('Problematic JSON:', jsonStr);
        }
        
        lastProcessedIndex = jsonEnd + 1;
      }
      
      // Clean up processed parts of buffer periodically
      if (lastProcessedIndex > 1000) {
        buffer = buffer.substring(lastProcessedIndex);
        lastProcessedIndex = 0;
      }
    });

    res.data.on('end', () => {
      console.log(`Stream ended. Total chunks processed: ${chunkCount}`);
    });

    res.data.on('error', (error) => {
      console.error('Stream error:', error);
      throw error;
    });

    // Wait for the stream to complete
    await new Promise((resolve, reject) => {
      res.data.on('end', resolve);
      res.data.on('error', reject);
    });

    return res;

  } catch (error) {
    console.error('Watson streaming error:', error.message);
    throw error;
  }
};

module.exports = { watson };