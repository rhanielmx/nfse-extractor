import { z } from 'zod'

export const itemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  purpose: z.number(),
  costCenter: z.number(),
  activity: z.number(),
  quantity: z.number(),
  unitPriceInCents: z.number(),
})

export const receiptSchema = z.object({
  id: z.string().uuid(),
  supplier: z.string(),
  customer: z.string(),
  number: z.number(),
  receiptValueInCents: z.number(),
  issValueInCents: z.number(),
  issueDate: z.string(),
  accrualDate: z.string(),
  documentType: z.number(),
  operationCode: z.number(),
  status: z.string(),
  items: z.array(itemSchema),
})

export type ReceiptItem = z.infer<typeof itemSchema>
export type Receipt = z.infer<typeof receiptSchema>

export type ReceiptAsMessage =
  Partial<Omit<Receipt, 'id' | 'status'>>
  & Pick<Receipt, 'id' | 'status'>
