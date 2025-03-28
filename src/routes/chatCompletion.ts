import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { processChatCompletion } from '../services/openaiCompletionsService'
import { processResponses } from '../services/openaiResponsesService'
import { validateRequest } from '../middleware/auth'
import { config } from '../libs/utils'

interface ChatCompletionBody {
  messages: any[]
  model?: string
  stream?: boolean
  channel?: string
  userId?: string
  appId?: string
}

export const chatCompletionRoutes = async (fastify: FastifyInstance) => {
  // Hook to validate API token
  fastify.addHook('preHandler', validateRequest)

  // Chat completion endpoint
  fastify.post<{ Body: ChatCompletionBody }>(
    '/completion',
    async (req: FastifyRequest<{ Body: ChatCompletionBody }>, reply: FastifyReply) => {
      try {
        const {
          messages,
          model = 'gpt-4o-mini',
          stream = false,
          channel = 'ccc',
          userId = '111',
          appId = '20b7c51ff4c644ab80cf5a4e646b0537',
        } = req.body

        if (!messages) {
          return reply.code(400).send({ error: 'Missing "messages" in request body' })
        }

        if (!appId) {
          return reply.code(400).send({ error: 'Missing "appId" in request body' })
        }

        // This server supports both the Chat Completions API and the Responses API
        // Use either processChatCompletion or processResponses based on config
        const processHandler = config.llm.useResponsesApi ? processResponses : processChatCompletion

        console.log(
          `Using ${config.llm.useResponsesApi ? 'OpenAI Responses API' : 'OpenAI Chat Completions API'} for request`,
        )

        const result = await processHandler(messages, {
          model,
          stream,
          channel,
          userId,
          appId,
        })

        if (stream) {
          // Set SSE headers
          reply.raw.setHeader('Content-Type', 'text/event-stream')
          reply.raw.setHeader('Cache-Control', 'no-cache')
          reply.raw.setHeader('Connection', 'keep-alive')

          if (result instanceof ReadableStream) {
            // Handle Web ReadableStream
            const reader = result.getReader()

            // Process stream chunks
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                break
              }

              // Write chunks to response
              reply.raw.write(value)
            }

            // End the response
            reply.raw.end()
          } else {
            // Fallback for non-streaming response
            return result
          }
        } else {
          return result
        }
      } catch (err: any) {
        console.error('Chat Completions Error:', err)
        return reply.code(500).send({ error: err.message })
      }
    },
  )
}
