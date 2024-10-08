import { env } from '@/env'
import { prisma } from '@/lib/prisma'
import type { TextractResponse } from '@/lib/utils'
import amqp, { Channel, Connection } from 'amqplib'
import type { FastifyInstance } from "fastify"
let channel: Channel

interface DataProps extends TextractResponse {
  id: string
}

async function connectToRabbitMQ(queueName: string, exchangeName:string, keys:string[]) {
  const connection: Connection = await amqp.connect(env.RABBITMQ_URL)
  channel = await connection.createChannel()
  await channel.assertQueue(queueName, { durable: false })
  await channel.assertExchange(exchangeName, 'topic', { durable: false })
  keys.forEach(async (routingKey) => await channel.bindQueue(queueName, exchangeName, routingKey) )
}

async function consumeMessages(app: FastifyInstance, queueName:string, exchangeName:string) {
  await connectToRabbitMQ(queueName, exchangeName, ['upload','process'])

  channel.consume(queueName, async (message) => {
    if (message) { 
      const data = JSON.parse(message.content.toString()) as DataProps
      const routingKey = message.fields.routingKey
      
      switch(routingKey) {
        case 'upload':
          const response = await app.inject({
            url: '/receipts',
            method: 'POST',
            payload: data,
            headers: {
                'Content-Type': 'application/json'
              }
          })
          const { receipts } = JSON.parse(response.payload)

          app.websocketServer.clients.forEach((client) => {
              if(client.readyState === client.OPEN) {
                client.send(JSON.stringify({kind:'UPLOAD',data:receipts}))
              }
            })
          break
        case 'process':
          await new Promise((resolve)=>setTimeout(resolve, 2000))
          const receipt = await prisma.receipt.findUnique({
            where: {
              id: data.id
            }
          })
          if (receipt) {
            const updatedReceipt = await prisma.receipt.update({
              data: {
                issueDate: new Date(data.receipt.issueDate),
                accrualDate: new Date(data.receipt.accrualDate),
                customer: data.receipt.customer,
                supplier: data.receipt.supplier,
                receiptValueInCents: data.receipt.receiptValueInCents,
                issValueInCents: data.receipt.issValueInCents,
                receiptNumber: data.receipt.receiptNumber,
                documentType: data.receipt.documentType,  
                items: {
                  create: data.items.map(item => ({
                    code: item.code,
                    name: item.name,
                    purpose: item.purpose,
                    costCenter: item.costCenter,
                    activity: item.activity,
                    quantity: item.quantity,
                    unitPriceInCents: item.unitPriceInCents
                  }))
                },
                status: 'done',
              },
              include: {
                items: true
              },
              where: {
                id: data.id
              }
            })

            app.websocketServer.clients.forEach((client) => {
              if(client.readyState === client.OPEN) {
                client.send(JSON.stringify({kind:'PROCESS', data: updatedReceipt}))
              }
            })
          }
          
          break
        default:
          console.log(`Key ${routingKey} not found.`)
      }
      channel.ack(message)
    }
  }, { noAck: false })
}

export { consumeMessages }