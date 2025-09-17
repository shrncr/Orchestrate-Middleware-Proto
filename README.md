# WA Middleware Translation Layer

This project serves as a middleware translation layer between Proto/Codebaby Avatars and Watson Assistant, facilitating communication between these two systems.

## API Reference

### 1. POST /api/generate (or /api/generate/:avatarName for compatibility)

#### Request:
- Expects `Authorization: Bearer xxxx` authentication
- `conversation` array: An array of objects, each representing a conversation step. Each object should have `role` and `content` properties.
- `session_id`: A unique identifier for the session.

#### Response:
- Returns a stream of messages from Watson Assistant

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/CerebralBlue/proto-wa-middleware.git
cd proto-wa-middleware
```

### 2. Configure Environment Variables
Required values for the .env file (or OCP/Docker env vars) are in the .env.example file

### 3. Build the Docker Image
Navigate to the project directory and build the Docker image:

docker build -t proto-wa-middleware .

### 4. Run the Docker Container
Once the Docker image is built, run it using the following command:

```bash
docker run -d -p 3000:3000 --name proto-wa-middleware-container proto-wa-middleware
```
