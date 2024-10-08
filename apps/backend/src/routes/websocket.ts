import type { FastifyInstance } from "fastify"
import z from 'zod'

const fileSchema = z.object({
  filename: z.string(),
  data: z.array(z.string())
})

const messageSchema = z.object({
  type: z.string(),
  files: z.array(z.string())
})

export async function websocketRoutes(app: FastifyInstance){
  app.get('/websocket', { websocket: true }, async (connection) => {
    console.log('WebSocket client connected')

    connection.on('message', async (message: string) => {
      console.log('[Message]: ', message.toString())
    })

    connection.on('close', () => {
      console.log('WebSocket client disconnected')
    })
  })
}