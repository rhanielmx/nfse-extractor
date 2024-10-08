import React, { useEffect, useState, type ChangeEvent } from 'react'
import axios from 'axios'

import { Input } from './ui/input'
import { Button } from './ui/button'
import { UploadIcon } from '@radix-ui/react-icons'
import type { ReceiptAsMessage } from '@/data/receipts'

interface ReceiptsUploaderProps {
  onReceiptsChange: React.Dispatch<React.SetStateAction<ReceiptAsMessage[]>>
  setTableSize: React.Dispatch<React.SetStateAction<number>>
}

interface HandleStateChangeUpload {
  kind: 'UPLOAD'
  data: ReceiptAsMessage[]
}

interface HandleStateChangeProcess {
  kind: 'PROCESS'
  data: ReceiptAsMessage
}

type HandleStateChangeProps = HandleStateChangeUpload | HandleStateChangeProcess

export function ReceiptsUploader({
  onReceiptsChange,
  setTableSize,
} : ReceiptsUploaderProps) {
  const [pdfFiles, setPdfFiles] = useState<File[] | null>(null)
  useEffect(() => {
    const socket = new WebSocket(`ws://${import.meta.env.VITE_BASE_URL}/websocket`)
    socket.onopen = () => {
      console.log('Connected')
      socket.onmessage = (event) => {
        const { kind, data } = JSON.parse(event.data)
        handleStateChange({ data, kind })
      }
    }
  }, [pdfFiles])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return
    }

    const files = Array.from(event.target.files)
      .filter(file => file.type === 'application/pdf')

    if (files) {
      setPdfFiles(files)
    } else {
      alert('Please select a valid PDF file.')
    }
  }

  const handleStateChange = ({ data, kind }: HandleStateChangeProps) => {
    switch (kind) {
      case 'UPLOAD':
        data.forEach((d) => {
          onReceiptsChange((previousReceipts) => {
            const existingReceiptIndex =
              previousReceipts.findIndex(receipt => {
                return receipt.id === d.id
              })
            if (existingReceiptIndex !== -1) {
              const updatedState = [...previousReceipts]
              updatedState[existingReceiptIndex] = d
              return updatedState
            } else {
              return [...previousReceipts, d]
            }
          })
        })
        break
      case 'PROCESS':
        console.log('[Processed Data]', data)
        onReceiptsChange((previousReceipts) => {
          const existingReceiptIndex =
          previousReceipts.findIndex(receipt => {
            return receipt.id === data.id
          })
          if (existingReceiptIndex !== -1) {
            const updatedState = [...previousReceipts]
            updatedState[existingReceiptIndex] = data
            return updatedState
          } else {
            return [...previousReceipts, data]
          }
        })
        break
    }
  }

  const handleUpload = () => {
    if (pdfFiles) {
      setTableSize(pdfFiles.length)
      axios({
        baseURL: `http://${import.meta.env.VITE_BASE_URL}/upload`,
        method: 'post',
        data: pdfFiles,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }).then(() => {
      }).catch(err => console.log(err))
    }
  }

  return (
    <div>
      <Input
        type="file"
        className="h-8 w-[150px] lg:w-[250px]"
        onChange={handleFileChange}
        accept="application/pdf"
        name="files"
        multiple
      />
      <Button
        variant="outline"
        className="h-8 w-[150px] lg:w-[250px]"
        onClick={handleUpload}
        disabled={!pdfFiles}
      >
        <UploadIcon className="mr-2 w-4 h-4" />
        Importar Notas
      </Button>
    </div>
  )
}
