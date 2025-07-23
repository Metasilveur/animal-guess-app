"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UploadArea from "@/components/upload-area"
import UploadHistory from "@/components/upload-history"
import GuessSection from "@/components/guess-section"
import GameComplete from "@/components/game-complete"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { usePolling } from "@/hooks/usePolling"

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

interface GameState {
  uploads: Upload[]
  guessesRemaining: 3
  gameComplete: boolean
  won: boolean
  mysteryAnimal: string
  mysteryImageUrl: string
}

export default function GamePage() {
  const [folderName, setFolderName] = useState("")
  const [gameState, setGameState] = useState<GameState>({
    uploads: [],
    guessesRemaining: 3,
    gameComplete: false,
    won: false,
    mysteryAnimal: "",
    mysteryImageUrl: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [hasProcessingUploads, setHasProcessingUploads] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedFolderName = localStorage.getItem("folderName")
    if (!storedFolderName) {
      router.push("/")
      return
    }

    setFolderName(storedFolderName)
    loadGameState(storedFolderName)
  }, [router])

  const loadGameState = async (folder: string) => {
    try {
      const response = await fetch(`/api/game-state?folderName=${folder}`)
      const data = await response.json()

      setGameState(data)
    } catch (error) {
      console.error("Failed to load game state:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour mettre à jour les uploads avec les prédictions
  const updateUploadsWithPredictions = (predictions: any[]) => {
    setGameState((prev) => ({
      ...prev,
      uploads: prev.uploads.map(upload => {
        // Chercher la prédiction correspondante par file_name
        const prediction = predictions.find(p => p.file_name === upload.fileName)
        if (prediction) {
          return {
            ...upload,
            similarity: prediction.inference, // Le score AI devient la similarité
            status: 'completed'
          }
        }
        return upload
      })
    }))
  }

  // Vérifier s'il y a des uploads en cours de traitement
  useEffect(() => {
    const processing = gameState.uploads.some(upload => upload.status === 'processing')
    setHasProcessingUploads(processing)
  }, [gameState.uploads])

  // Polling pour les prédictions
  const { isPolling } = usePolling({
    url: `/api/predictions?user=${folderName}&processingFiles=${gameState.uploads
      .filter(upload => upload.status === 'processing')
      .map(upload => upload.fileName)
      .join(',')}`,
    interval: 3000, // 3 secondes
    enabled: hasProcessingUploads && folderName !== "",
    onData: updateUploadsWithPredictions,
    onError: (error) => {
      console.error('Failed to fetch predictions:', error)
    }
  })

  const handleUploadComplete = (newUpload: Upload) => {
    setGameState((prev) => ({
      ...prev,
      uploads: [...prev.uploads, newUpload],
    }))
  }

  const handleGuessSubmit = async (guess: string) => {
    try {
      const response = await fetch("/api/submit-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, guess }),
      })

      const data = await response.json()

      setGameState((prev) => ({
        ...prev,
        guessesRemaining: data.guessesRemaining,
        gameComplete: data.gameComplete,
        won: data.won,
        mysteryAnimal: data.mysteryAnimal,
        mysteryImageUrl: data.mysteryImageUrl,
      }))
    } catch (error) {
      console.error("Failed to submit guess:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("folderName")
    router.push("/")
  }

  const handleRestart = async () => {
    try {
      await fetch("/api/restart-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName }),
      })

      loadGameState(folderName)
    } catch (error) {
      console.error("Failed to restart game:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    )
  }

  if (gameState.gameComplete) {
    return (
      <GameComplete
        won={gameState.won}
        mysteryAnimal={gameState.mysteryAnimal}
        mysteryImageUrl={gameState.mysteryImageUrl}
        uploads={gameState.uploads}
        onRestart={handleRestart}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {folderName}</h1>
            <p className="text-gray-400 mt-1">
              {gameState.uploads.length}/10 images uploaded
              {isPolling && (
                <span className="ml-2 text-muted-foreground inline-flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-sm">Analyse en cours</span>
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            {gameState.uploads.length < 10 ? (
              <UploadArea
                folderName={folderName}
                onUploadComplete={handleUploadComplete}
                disabled={gameState.uploads.length >= 10}
              />
            ) : (
              <GuessSection guessesRemaining={gameState.guessesRemaining} onGuessSubmit={handleGuessSubmit} />
            )}
          </div>

          {/* History Section */}
          <div>
            <UploadHistory uploads={gameState.uploads} folderName={folderName} />
          </div>
        </div>
      </main>
    </div>
  )
}
