"use client"

import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ImageIcon, Loader2, Clock, CheckCircle, Sparkles } from "lucide-react"
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
  folderName: string
}

export default function UploadHistory({ uploads, folderName }: UploadHistoryProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  // Fonction pour obtenir une URL signée
  const getSignedUrl = async (fileName: string) => {
    if (signedUrls[fileName]) return signedUrls[fileName]

    try {
      // Utiliser le folderName comme bucket name (normalisé)
      const bucketName = folderName.toLowerCase().trim()
      
      const response = await fetch('/api/get-signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, bucketName })
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
    if (similarity >= 80) return "bg-emerald-500"
    if (similarity >= 60) return "bg-blue-500"
    if (similarity >= 40) return "bg-amber-500"
    return "bg-red-500"
  }

  const getSimilarityGradient = (similarity: number) => {
    if (similarity >= 80) return "from-emerald-500/20 to-emerald-600/10"
    if (similarity >= 60) return "from-blue-500/20 to-blue-600/10"
    if (similarity >= 40) return "from-amber-500/20 to-amber-600/10"
    return "from-red-500/20 to-red-600/10"
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
              className={`p-0 overflow-hidden transition-all duration-300 ${
                upload.status === 'processing' 
                  ? 'bg-gray-800/50 border-gray-700/50' 
                  : `bg-gradient-to-r ${getSimilarityGradient(upload.similarity || 0)} border-gray-700/70 hover:shadow-xl hover:border-gray-600/70`
              }`}
            >
              {upload.status === 'processing' ? (
                // Animation sobre de chargement
                <div className="p-6 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    {/* Animation de cercles concentriques */}
                    <div className="w-12 h-12 relative">
                      <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
                      <div className="absolute inset-1 border-2 border-blue-500/50 rounded-full animate-spin border-t-blue-400"></div>
                      <div className="absolute inset-3 border border-blue-400/30 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <p className="text-sm text-gray-300 font-medium">Analyse en cours...</p>
                    <p className="text-xs text-gray-500">Image #{index + 1} • {upload.name}</p>
                  </div>
                </div>
              ) : (
                // Carte complète une fois l'analyse terminée
                <div className="flex">
                  {/* Image section */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <ImageThumbnail 
                      fileName={upload.fileName}
                      fallbackName={upload.name}
                      getSignedUrl={getSignedUrl}
                      isProcessing={false}
                    />
                    
                    {/* Numéro d'ordre */}
                    <div className="absolute top-2 left-2 rounded-full w-6 h-6 flex items-center justify-center bg-gradient-to-br from-blue-500/90 to-purple-500/90 backdrop-blur-sm shadow-lg">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>

                    {/* Indicateur de statut */}
                    <div className="absolute bottom-2 right-2">
                      <div className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-full p-1.5 shadow-lg">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate text-sm text-white">
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

                    {/* Résultat de l'analyse */}
                    {upload.similarity !== null && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-300 font-medium">
                            {getSimilarityLabel(upload.similarity)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-3 h-3 rounded-full ${getSimilarityColor(upload.similarity)} shadow-lg`}
                            />
                            <span className="text-sm font-bold text-white bg-gray-800/50 px-2 py-1 rounded-md">
                              {upload.similarity}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Barre de progression */}
                        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden shadow-inner">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ease-out ${getSimilarityColor(upload.similarity)} shadow-sm`}
                            style={{ width: `${upload.similarity}%` }}
                          />
                        </div>
                        
                        {upload.similarity >= 70 && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-emerald-300 font-medium">
                              Très prometteuse !
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {uploads.length === 10 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-900/30 to-green-900/20 rounded-xl border border-emerald-700/40 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <p className="text-emerald-300 font-medium text-center">
              Toutes les images uploadées ! Il est temps de deviner l'animal mystère.
            </p>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

// Composant séparé pour gérer l'affichage des images avec URLs signées
function ImageThumbnail({ 
  fileName, 
  fallbackName, 
  getSignedUrl,
  isProcessing = false
}: { 
  fileName: string
  fallbackName: string
  getSignedUrl: (fileName: string) => Promise<string | null>
  isProcessing?: boolean
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
      <div className={`w-full h-full flex items-center justify-center ${
        isProcessing 
          ? 'bg-gradient-to-br from-gray-700 to-gray-600 animate-pulse' 
          : 'bg-gray-700'
      }`}>
        <Loader2 className={`w-6 h-6 animate-spin ${
          isProcessing ? 'text-amber-400' : 'text-gray-500'
        }`} />
      </div>
    )
  }

  if (hasError || !imageUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${
        isProcessing 
          ? 'bg-gradient-to-br from-gray-700 to-gray-600' 
          : 'bg-gray-700'
      }`}>
        <ImageIcon className="w-8 h-8 text-gray-500" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={imageUrl}
        alt={fallbackName}
        fill
        className={`object-cover transition-all duration-300 ${
          isProcessing 
            ? 'filter brightness-75 contrast-90 saturate-50' 
            : 'filter brightness-100 contrast-100 saturate-100'
        }`}
        sizes="80px"
        onError={() => setHasError(true)}
      />
      {isProcessing && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-shimmer" />
      )}
    </div>
  )
}
