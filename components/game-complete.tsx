"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, RotateCcw, LogOut, Target } from "lucide-react"

interface Upload {
  id: string
  name: string
  fileName: string
  gcpUri: string
  similarity: number | null
  timestamp: Date
  imageUrl: string
  status: 'processing' | 'completed'
}

interface GameCompleteProps {
  won: boolean
  mysteryAnimal: string
  mysteryImageUrl: string
  uploads: Upload[]
  onRestart: () => void
  onLogout: () => void
}

export default function GameComplete({
  won,
  mysteryAnimal,
  mysteryImageUrl,
  uploads,
  onRestart,
  onLogout,
}: GameCompleteProps) {
  const averageScore =
    uploads.length > 0 ? Math.round(uploads.reduce((sum, upload) => sum + (upload.similarity || 0), 0) / uploads.length) : 0

  const bestScore = uploads.length > 0 ? Math.max(...uploads.map((upload) => upload.similarity || 0)) : 0

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Result Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            {won ? <Trophy className="h-20 w-20 text-white" /> : <Target className="h-20 w-20 text-gray-400" />}
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">{won ? "Congratulations!" : "Game Over"}</h1>

          <p className="text-xl text-gray-300 mb-2">The mystery animal was:</p>

          <h2 className="text-3xl font-bold text-white capitalize mb-6">{mysteryAnimal}</h2>
        </div>

        {/* Mystery Image */}
        <Card className="bg-gray-900 border-gray-800 p-6 mb-8">
          <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden mb-4">
            <img
              src={mysteryImageUrl || "/placeholder.svg?height=300&width=400&query=mystery animal"}
              alt={mysteryAnimal}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-center text-gray-400">This was the mystery animal you were trying to match!</p>
        </Card>

        {/* Score Summary */}
        <Card className="bg-gray-900 border-gray-800 p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">Your Performance</h3>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{uploads.length}</p>
              <p className="text-gray-400 text-sm">Images Uploaded</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{bestScore}%</p>
              <p className="text-gray-400 text-sm">Best Match</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{averageScore}%</p>
              <p className="text-gray-400 text-sm">Average Score</p>
            </div>
          </div>
        </Card>

        {/* Top Matches */}
        <Card className="bg-gray-900 border-gray-800 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Best Matches</h3>

          <div className="space-y-3">
            {uploads
              .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
              .slice(0, 3)
              .map((upload, index) => (
                <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      #{index + 1}
                    </Badge>
                    <span className="text-white truncate">{upload.name}</span>
                  </div>
                  <Badge className="bg-gray-200 text-black">{upload.similarity || 0}%</Badge>
                </div>
              ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onRestart}
            className="flex-1 bg-white text-black hover:bg-gray-200 h-12 text-lg font-medium"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Play Again
          </Button>
          <Button
            onClick={onLogout}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-12 text-lg font-medium"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
