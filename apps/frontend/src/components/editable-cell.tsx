import { useReceipts } from '@/contexts/useReceipts'
import type { ReceiptAsMessage, ReceiptItem } from '@/data/receipts'
import type { Cell, Row } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { useState, type KeyboardEvent } from 'react'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

interface EditableProps {
  row: Row<ReceiptAsMessage>
  type: 'text' | 'cnpj' | 'currency' | 'date'
  valueName: string
  className?: string
}

interface EditableCellProps extends EditableProps {
  cell: Cell<ReceiptAsMessage, unknown>
}

interface EditableItemProps extends EditableProps {
  item: ReceiptItem
  valueName: 'id' | 'code' | 'name' | 'purpose' | 'costCenter' |
              'activity' | 'quantity' | 'unitPriceInCents'
}

function formatCNPJ(cnpj:string) {
  // Remove all non-digit characters
  if (!cnpj) {
    return '00.000.000/0000-00'
  }
  const cleanedCNPJ = cnpj.replace(/\D/g, '')

  // Check if the cleaned CNPJ has the correct length
  if (cleanedCNPJ.length !== 14) {
    throw new Error('CNPJ must contain 14 digits.')
  }

  // Format the CNPJ
  const formattedCNPJ = cleanedCNPJ.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5',
  )

  return formattedCNPJ
}

interface Format {
  text: (value: string) => string
  cnpj: (value: string) => string
  currency: (value: number) => string
  date: (value: string) => string
}

const format: Format = {
  text: (value: string) => value,
  cnpj: (value: string) => formatCNPJ(value),
  currency: (value: number) => ((value ?? 0) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }),
  date: (value: string) => dayjs(value).format('DD/MM/YYYY'),
}

function formatValue(
  type: 'text' | 'cnpj' | 'currency' | 'date',
  value: string | number,
) {
  switch (type) {
    case 'text':
      return value as string
    case 'cnpj':
      return format.cnpj(value as string)
    case 'currency':
      return format.currency(value as number)
    case 'date':
      return format.date(value as string)
    default:
      throw new Error('Invalid type')
  }
}

export function EditableCell(
  { cell, row, type = 'text', valueName, className }:EditableCellProps,
) {
  const { receipts, setReceipts } = useReceipts()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] =
    useState<string | number>(cell.getValue<string | number>())

  const handleSave = (receiptId:string) => {
    const indexOfFocusedReceipt = receipts
      .findIndex((receipt) => receipt.id === receiptId)

    const existingReceipts = [...receipts]
    existingReceipts[indexOfFocusedReceipt] = {
      ...receipts[indexOfFocusedReceipt],
      [valueName]: value,
    }
    setReceipts(existingReceipts)
    setIsEditing(false)
  }

  const handleKeyDown =
  (event: KeyboardEvent<HTMLInputElement>, rowId: string) => {
    if (event.key === 'Enter') {
      handleSave(rowId)
    }
  }

  return (
    isEditing
      ? (
        <Input
          className={cn('text-sm p-1 h-6', className)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlurCapture={() => handleSave(row.original.id)}
          onKeyDown={(event) => handleKeyDown(event, row.original.id)}
          autoFocus
        />
        )
      : (
        <div className="flex space-x-2" onClick={() => setIsEditing(true)}>
          <span className="max-w-[500px] truncate font-medium">
            {formatValue(type, row.getValue(valueName))}
          </span>
        </div>
        )
  )
}

export function EditableItemCell(
  { row, item, type = 'text', valueName, className }:EditableItemProps,
) {
  const { receipts, setReceipts } = useReceipts()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] =
    useState<string | number>(item[valueName])

  const handleSave = (receiptId:string, itemId: string) => {
    const indexOfFocusedReceipt = receipts
      .findIndex((receipt) => receipt.id === receiptId)

    const indexOfFocusedItem = receipts[indexOfFocusedReceipt].items!
      .findIndex((item) => item.id === itemId)

    const existingReceipts = [...receipts]
    const existingItems = receipts[indexOfFocusedReceipt].items

    existingItems![indexOfFocusedItem] = {
      ...existingItems![indexOfFocusedItem],
      [valueName]: value,
    }

    existingReceipts[indexOfFocusedReceipt] = {
      ...receipts[indexOfFocusedReceipt],
      items: existingItems,
    }
    setReceipts(existingReceipts)
    setIsEditing(false)
  }

  const handleKeyDown =
  (event: KeyboardEvent<HTMLInputElement>, rowId: string, itemId: string) => {
    if (event.key === 'Enter') {
      handleSave(rowId, itemId)
    }
  }

  return (
    isEditing
      ? (
        <Input
          className={cn('text-sm p-1 h-6', className)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlurCapture={() => handleSave(row.original.id, item.id)}
          onKeyDown={(event) => handleKeyDown(event, row.original.id, item.id)}
          autoFocus
        />
        )
      : (
        <div className="flex space-x-2" onClick={() => setIsEditing(true)}>
          <span className="max-w-[500px] truncate font-medium">
            {formatValue(type, value)}
          </span>
        </div>
        )
  )
}
