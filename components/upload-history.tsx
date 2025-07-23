"use client"

import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ImageIcon, Loader2, Clock, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

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

interface UploadHistoryProps {
  uploads: Upload[]
}

export default function UploadHistory({ uploads }: UploadHistoryProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  // Fonction pour obtenir une URL signée
  const getSignedUrl = async (fileName: string) => {
    if (signedUrls[fileName]) return signedUrls[fileName]

    try {
      const response = await fetch('/api/get-signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      })

      if (response.ok) {
        const { signedUrl } = await response.json()
        setSignedUrls(prev => ({ ...prev, [fileName]: signedUrl }))
        return signedUrl
      }
    } catch (error) {
      console.error('Erreur génération URL signée:', error)
    }
    return null
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 80) return "bg-green-500"
    if (similarity >= 60) return "bg-blue-500"
    if (similarity >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 80) return "Excellente correspondance"
    if (similarity >= 60) return "Bonne correspondance"
    if (similarity >= 40) return "Correspondance moyenne"
    return "Faible correspondance"
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Historique des uploads</h2>
        <Badge variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
          {uploads.length}/10
        </Badge>
      </div>

      {uploads.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">Aucune image uploadée</p>
          <p className="text-gray-500 text-sm mt-2">
            Uploadez votre première image pour commencer le jeu
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {uploads.map((upload, index) => (
            <Card 
              key={upload.id} 
              className="bg-gray-800 border-gray-700 p-0 overflow-hidden hover:bg-gray-800/80 transition-all duration-200"
            >
              <div className="flex">
                {/* Image section avec overlay de statut */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  <ImageThumbnail 
                    fileName={upload.fileName}
                    fallbackName={upload.name}
                    getSignedUrl={getSignedUrl}
                  />
                  
                  {/* Numéro d'ordre */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>

                  {/* Indicateur de statut */}
                  <div className="absolute bottom-2 right-2">
                    {upload.status === 'processing' ? (
                      <div className="bg-yellow-500 rounded-full p-1">
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      </div>
                    ) : (
                      <div className="bg-green-500 rounded-full p-1">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenu principal */}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-white truncate text-sm">
                        {upload.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(upload.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression ou score */}
                  {upload.status === 'processing' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-yellow-400 font-medium">
                          Analyse en cours...
                        </span>
                        <span className="text-xs text-gray-500">65%</span>
                      </div>
                      <Progress value={65} className="h-1.5 bg-gray-700" />
                      <p className="text-xs text-gray-500">
                        Gemini AI traite votre image
                      </p>
                    </div>
                  ) : upload.similarity !== null ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {getSimilarityLabel(upload.similarity)}
                        </span>
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-2 h-2 rounded-full ${getSimilarityColor(upload.similarity)}`}
                          />
                          <span className="text-sm font-bold text-white">
                            {upload.similarity}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${getSimilarityColor(upload.similarity)}`}
                          style={{ width: `${upload.similarity}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                      <span className="text-xs text-gray-500">En attente d'analyse</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {uploads.length === 10 && (
        <div className="mt-6 p-4 bg-green-900/20 rounded-xl border border-green-700/30">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300 font-medium text-center">
              Toutes les images uploadées ! Il est temps de deviner l'animal mystère.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant séparé pour gérer l'affichage des images avec URLs signées
function ImageThumbnail({ 
  fileName, 
  fallbackName, 
  getSignedUrl 
}: { 
  fileName: string
  fallbackName: string
  getSignedUrl: (fileName: string) => Promise<string | null>
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true)
      setHasError(false)
      
      try {
        const signedUrl = await getSignedUrl(fileName)
        if (signedUrl) {
          setImageUrl(signedUrl)
        } else {
          setHasError(true)
        }
      } catch (error) {
        console.error('Erreur chargement image:', error)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadImage()
  }, [fileName, getSignedUrl])

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    )
  }

  if (hasError || !imageUrl) {
    return (
      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-500" />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={fallbackName}
      fill
      className="object-cover"
      sizes="80px"
      onError={() => setHasError(true)}
    />
  )
}
