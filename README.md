# Agora Convo AI Custom LLM Fastify

A Node.js based service layer that accepts incoming requests from the Agora Convo AI service and passes them to an AI model, allowing for RAG (Retrieval Augmented Generation) and tools integration.

## Description

This project provides a middleware for Agora's Convo AI service to connect with OpenAI's API, implementing:

- Custom RAG (knowledge base)
- Function calling (tools)
- Streaming responses
- Support for both OpenAI's Chat Completions and Responses APIs

Built with Fastify for high performance and low overhead.

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

Then edit the `.env` file with your API keys and configuration.

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

## API Endpoints

### POST /v1/chat/completion

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

**Response:**

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

## Available Tools

This service includes the following AI tools:

1. `order_sandwich` - Allows users to order a sandwich with a specified filling
2. `send_photo` - Sends a photo to the user

## Customization

### Adding New Tools

To add a new tool, update the following files:

- `src/libs/toolDefinitions.ts` - Define the tool interface
- `src/libs/tools.ts` - Implement the tool functionality

### Modifying RAG Data

Update the `src/services/ragService.ts` file to change the hardcoded knowledge base or connect to an external database.

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

## License

MIT License
