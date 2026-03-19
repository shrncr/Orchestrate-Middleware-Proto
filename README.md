# WA Middleware Translation Layer

This project serves as a middleware translation layer between Proto/Codebaby Avatars and Watson Assistant, facilitating communication between these two systems.

## API Reference

### POST /stream-hello

Streams Watson Assistant responses for avatar service integration.

#### Request:
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>` (required - use the token from your .env file)
  - `Content-Type: application/json`
- **Body**:
  - `conversation` array: An array of objects, each representing a conversation step. Each object should have `role` and `content` properties.
  - `session_id`: A unique identifier for the session (required).

#### Example Request:
```bash
curl -X POST http://localhost:3000/stream-hello \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "unique-session-id",
    "conversation": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

#### Response:
- Returns a text stream (chunked transfer encoding) of Watson Assistant messages
- Content-Type: `text/plain; charset=utf-8`

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/CerebralBlue/proto-wa-middleware.git
cd proto-wa-middleware
```

### 2. Configure Environment Variables

Copy `sample.env` to `.env` and configure the following required variables:

```bash
cp sample.env .env
```

Required environment variables:
- `WO_APIKEY`: Your Watson Orchestrate API key (from orchestrate settings page)
- `WO_SERVICE_URL`: Your Watson Orchestrate service URL (without /api/v1/v1...)
- `AGENT_ID`: Your agent ID (from the URL in agent builder or through the ADK)
- `ACCESS_TOKEN`: A secure secret token for API authentication (generate a random string)

**Important**: The `ACCESS_TOKEN` is required for all API requests. Clients must include it in the Authorization header as `Bearer <your-token>`.

### 3. Build the Docker Image
Navigate to the project directory and build the Docker image:

docker build -t proto-wa-middleware .

### 4. Run the Docker Container
Once the Docker image is built, run it using the following command:

```bash
docker run -d -p 3000:3000 --name proto-wa-middleware-container proto-wa-middleware
```
