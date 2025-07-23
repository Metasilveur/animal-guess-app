import { type NextRequest, NextResponse } from "next/server"
import { Firestore } from '@google-cloud/firestore'

const firestore = new Firestore()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderName = searchParams.get("folderName")

    if (!folderName) {
      return NextResponse.json({ error: "Missing folder name" }, { status: 400 })
    }

    const userId = folderName.toLowerCase().trim()

    // Récupérer les données utilisateur
    const userRef = firestore.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()

    // Récupérer les prédictions depuis la sous-collection
    const predictionsRef = userRef.collection('predictions')
    const predictionsSnapshot = await predictionsRef
      .orderBy('Timestamp', 'asc')
      .get()

    const uploads = predictionsSnapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.file_name,
        fileName: data.file_name,
        gcpUri: data.gcp_uri,
        similarity: data.inference || null,
        timestamp: data.Timestamp.toDate(),
        imageUrl: data.gcp_uri ? data.gcp_uri.replace('gs://', 'https://storage.googleapis.com/') : '',
        status: 'completed'
      }
    })

    // Données du jeu (à adapter selon votre structure)
    const gameState = {
      uploads,
      guessesRemaining: userData?.guessesRemaining || 3,
      gameComplete: userData?.gameComplete || false,
      won: userData?.won || false,
      mysteryAnimal: userData?.mysteryAnimal || "",
      mysteryImageUrl: userData?.mysteryImageUrl || "",
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Failed to load game state:", error)
    return NextResponse.json({ 
      error: "Failed to load game state",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
