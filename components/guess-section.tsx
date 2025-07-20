"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Send } from "lucide-react"

interface GuessSectionProps {
  guessesRemaining: number
  onGuessSubmit: (guess: string) => void
}

export default function GuessSection({ guessesRemaining, onGuessSubmit }: GuessSectionProps) {
  const [guess, setGuess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guess.trim() || isSubmitting) return

    setIsSubmitting(true)
    await onGuessSubmit(guess.trim())
    setGuess("")
    setIsSubmitting(false)
  }

  return (
    <Card className="bg-gray-900 border-gray-800 p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Brain className="h-16 w-16 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Time to Guess!</h2>
        <p className="text-gray-400">You've uploaded all 10 images. What's the mystery animal?</p>
      </div>

      <div className="flex justify-center mb-6">
        <Badge variant="outline" className="border-gray-600 text-gray-300 px-4 py-2 text-lg">
          {guessesRemaining} {guessesRemaining === 1 ? "guess" : "guesses"} remaining
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-4">
          <Input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter your guess (e.g., lion, elephant, dog...)"
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white flex-1"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={!guess.trim() || isSubmitting}
            className="bg-white text-black hover:bg-gray-200 px-6"
          >
            {isSubmitting ? (
              "Checking..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Guess
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-800 rounded-xl">
        <p className="text-gray-300 text-sm text-center">
          💡 Think about the images with the highest similarity scores
        </p>
      </div>
    </Card>
  )
}
