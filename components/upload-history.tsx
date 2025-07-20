"use client"

import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon } from "lucide-react"

interface Upload {
  id: string
  name: string
  similarity: number
  timestamp: Date
  imageUrl: string
}

interface UploadHistoryProps {
  uploads: Upload[]
}

export default function UploadHistory({ uploads }: UploadHistoryProps) {
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 80) return "bg-gray-200 text-black"
    if (similarity >= 60) return "bg-gray-400 text-white"
    if (similarity >= 40) return "bg-gray-600 text-white"
    return "bg-gray-800 text-gray-300"
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Upload History</h2>
        <Badge variant="outline" className="border-gray-600 text-gray-300">
          {uploads.length}/10
        </Badge>
      </div>

      {uploads.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No images uploaded yet</p>
          <p className="text-gray-500 text-sm mt-2">Upload your first image to start the game</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {uploads.map((upload, index) => (
            <Card key={upload.id} className="bg-gray-800 border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-white font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium truncate max-w-32">{upload.name}</p>
                    <p className="text-gray-400 text-sm">
                      {formatDistanceToNow(new Date(upload.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <Badge className={getSimilarityColor(upload.similarity)}>{upload.similarity}% match</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {uploads.length === 10 && (
        <div className="mt-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <p className="text-white font-medium text-center">
            🎯 All images uploaded! Time to guess the mystery animal.
          </p>
        </div>
      )}
    </div>
  )
}
