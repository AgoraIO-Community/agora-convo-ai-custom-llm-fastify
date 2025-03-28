# Agora Convo AI Custom LLM Fastify

A Node.js based service layer that accepts incoming requests from the Agora Convo AI service and passes them to an AI model, allowing for RAG (Retrieval Augmented Generation) and tools integration.

## Description

This project implements a custom LLM-powered chat service using Fastify, OpenAI's API, to create a custom LLM for use in the Agora Convo AI Engine. It supports both streaming and non-streaming responses, function calling capabilities, and includes RAG (Retrieval Augmented Generation) functionality.

This project implements basic tools and a tool calling mechanism. The tools use Agora Signaling Service to send messages into a real-time messaging channel.

- Custom RAG (knowledge base)
- Function calling (tools)
- Streaming responses
- Support for both OpenAI's Chat Completions and Responses APIs

Built with Fastify for high performance and low overhead.

## Architecture

```mermaid
graph LR
    Client[Client] <--> |Voice/Text Stream| ConvoAI[Agora Convo AI]
    ConvoAI --> |ASR Text| Server[Fastify Server]
    Server --> |Auth| AuthMiddleware[Auth Middleware]
    AuthMiddleware --> ChatRouter[Chat Router]
    ChatRouter --> OpenAIService[OpenAI Service]
    OpenAIService[OpenAI Services<br/>#40;Responses &amp; Completions#41;] --> |Get Context| RagService[RAG Service]
    RagService --> |Return Context| OpenAIService
    OpenAIService --> |System Prompt + RAG + ASR Text| OpenAIAPI[OpenAI API]
    OpenAIAPI --> |Response| OpenAIService
    OpenAIService --> |Function Calls| Tools[Tools Service]
    Tools --> |Agora RTM API| Agora[Agora Signaling Service]
    OpenAIService --> |Response| Server
    Server --> |Response| ConvoAI
    ConvoAI --> |Audio + Text| Client

    subgraph Services
        OpenAIService
        RagService
        Tools
    end

    subgraph Config
        Utils[Utils/Config]
        ToolDefs[Tool Definitions]
    end

    Services --> Config
```

## Prerequisites

- Node.js v18 or later
- OpenAI API key
- Agora Convo AI account with app credentials

## Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/agora-convo-ai-custom-llm-fastify.git
cd agora-convo-ai-custom-llm-fastify
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp env.example .env
```

Then edit the `.env` file with your API keys and configuration:

```env
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=your_model
AGENT_ID=your_agent_id
PORT=3000
USE_RESPONSES_API=false
```

## Running the Service

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Build and Run with Docker

Use Docker to run this application:

```bash
# Build the Docker image
docker build -t agora-convo-ai-custom-llm-fastify .

# Run the container
docker run -p 3000:3000 --env-file .env agora-convo-ai-custom-llm-fastify
```

### Docker Compose

You can also use Docker Compose to run the application with all required services:

```bash
# Start the services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the services
docker-compose down
```

## OpenAI Chat Completions & Responses API's

This server supports two different OpenAI API implementations:

1. **Chat Completions API** - The standard OpenAI chat completions endpoint
2. **Responses API** - OpenAI's new Responses API

For a detailed comparison of the two APIs, see the Open AI's [Responses vs Chat Completions](https://platform.openai.com/docs/guides/responses-vs-chat-completions) page.

You can switch between these APIs using the `USE_RESPONSES_API` environment variable:

```env
# Use Responses API
USE_RESPONSES_API=true

# Use Chat Completions API
USE_RESPONSES_API=false
```

Both APIs provide similar functionality but the Responses API offers improved performance because it emits semantic events detailing precisely what changed (e.g., specific text additions), so you can write integrations targeted at specific emitted events (e.g., text changes). Whereas the Chat Completions API continuously appends to the content field as tokens are generated—requiring you to manually track differences between each state.

## API Endpoints

This microservice is meant to be used as a drop-in with the Agora Convo AI service. It acts as a middleware application that accepts ASR text and processes it before sending it to OpenAI's servers.

### GET `/ping`

Returns a simple "pong" message to check the server's health.

Request:

```bash
curl http://localhost:3000/ping
```

Response:

```json
{ "message": "pong" }
```

### POST `/v1/chat/completion`

Processes chat messages and returns AI-generated responses.

**Request body:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is Agora?"
    }
  ],
  "model": "gpt-4o",
  "stream": false,
  "appId": "your-agora-app-id",
  "userId": "user123",
  "channel": "channel456"
}
```

Example Request:

```bash
curl -X POST http://localhost:3000/v1/chat/completion \
  -H "Authorization: Bearer <your-llm-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
```

To test the llm locally we recommend using the `ngrok` tool to expose your local server to the internet:

```bash
ngrok http localhost:3000
```

This will expose your local server to the internet and you can then use the ngrok url to test the llm.

**Response:**

- Non-streaming:

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Agora is the best realtime engagement platform."
      },
      "finish_reason": "stop"
    }
  ]
}
```

- Streaming: Server-sent events (SSE) with completion chunks

## Sequence Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant CA as Agora Convo AI
    participant ASR as ASR Service
    participant S as Fastify Server
    participant A as Auth Middleware
    participant O as OpenAI Service
    participant R as RAG Service
    participant T as Tools Service
    participant AI as OpenAI API
    participant AG as Agora RTM

    C->>CA: Stream Audio
    CA->>ASR: Process Audio
    ASR->>CA: Return Text
    CA->>S: POST /chat/completion
    S->>A: Validate Token
    A->>S: Token Valid
    S->>O: Process Chat Completion
    O->>R: Request Context
    R-->>O: Return RAG Data
    O->>AI: Send System Prompt + RAG + ASR Text
    AI-->>O: Return Response
    alt Function Call Required
        O->>T: Execute Function
        T->>AG: Send RTM Message
        AG-->>T: Confirm Message
        T-->>O: Return Result
        O->>AI: Send Updated Context
        AI-->>O: Return Final Response
    end
    O->>S: Return Response
    S->>CA: Send Response
    CA->>C: Stream Audio + Text Response
```

## Available Tools

This service includes the following AI tools:

1. `order_sandwich` - Allows users to order a sandwich with a specified filling
2. `send_photo` - Sends a photo to the user

## Component Details

### 1. Server (`src/server.ts`)

- Main Fastify application entry point
- Configures middleware and plugins
- Mounts chat routes and health check endpoint

### 2. Chat Completion Router (`src/routes/chatCompletion.ts`)

- Handles POST requests to /v1/chat/completion
- Validates request parameters
- Manages both streaming and non-streaming responses

### 3. Authentication (`src/middleware/auth.ts`)

- Middleware for token-based authentication
- Validates Bearer tokens against configuration

### 4. OpenAI Service (`src/services/openaiService.ts`)

- Core chat completion processing
- Manages RAG integration
- Handles function calling
- Supports streaming and non-streaming modes

### 5. RAG Service (`src/services/ragService.ts`)

- Provides retrieval augmented generation data
- Maintains hardcoded knowledge base
- Formats data for system prompts

### 6. Tools Service (`src/libs/tools.ts`)

- Implements function calling capabilities
- Handles Agora RTM integration
- Provides utility functions (sendPhoto, orderSandwich)

### 7. Tool Definitions (`src/libs/toolDefinitions.ts`)

- Defines available functions for LLM
- Specifies function parameters and schemas

## Customization

### Adding New Tools

To add a new tool, update the following files:

- `src/libs/toolDefinitions.ts` - Define the tool interface
- `src/libs/tools.ts` - Implement the tool functionality

### Modifying RAG Data

Update the `src/services/ragService.ts` file to change the hardcoded knowledge base or connect to an external database.

## Data Models

```mermaid
classDiagram
    class Config {
        +port: number
        +agora: AgoraConfig
        +llm: LLMConfig
        +agentId: string
    }

    class AgoraConfig {
        +appId: string
        +appCertificate: string
        +authToken: string
    }

    class LLMConfig {
        +openaiApiKey: string
        +model: string
    }

    class ChatMessage {
        +role: string
        +content: string
        +name?: string
        +function_call?: FunctionCall
    }

    class FunctionDefinition {
        +name: string
        +description: string
        +parameters: FunctionParameter
    }

    class RagData {
        +doc1: string
        +doc2: string
        +doc3: string
        +doc4: string
    }

    Config -- AgoraConfig
    Config -- LLMConfig
```

## Environment Variables

- `PORT` - The port number (default: 3000)
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Default model to use (e.g., gpt-4o)
- `USE_RESPONSES_API` - Set to "true" to use OpenAI's Responses API instead of Chat Completions
- `AGORA_APP_ID` - Your Agora app ID
- `AGORA_APP_CERTIFICATE` - Your Agora app certificate
- `AGORA_CUSTOMER_ID` - Your Agora customer ID
- `AGORA_CUSTOMER_SECRET` - Your Agora customer secret
- `AGENT_ID` - Identifier for the AI agent

## Deployment

This project can be deployed to various platforms:

- Heroku
- Render
- Vercel
- Netlify
- Docker containers

See the corresponding configuration files in the repository for platform-specific setup.

## Quick Deploy

| Heroku                                                                                        | Netlify                                                                                                                                                                                       | Render                                                                                                                                                                              | Vercel                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy) | [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/AgoraIO-Community/agora-convo-ai-custom-llm-fastify) | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/AgoraIO-Community/agora-convo-ai-custom-llm-fastify) | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AgoraIO-Community/agora-convo-ai-custom-llm-fastify) |

Each platform requires the appropriate configuration:

- Heroku: Uses the [`app.json`](./heroku/app.json) file and [`Procfile`](./heroku/Procfile)
- Netlify: Uses the [`netlify.toml`](./netlify.toml) file and the Netlify function in [`netlify/functions/api.js`](./netlify/functions/api.js)
- Render: Uses the [`render.yaml`](./render.yaml) file
- Vercel: Uses the [`vercel.json`](./vercel.json) file

## License

MIT License
