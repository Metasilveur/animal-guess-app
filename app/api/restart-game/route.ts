import { type NextRequest, NextResponse } from "next/server"
import { Firestore } from '@google-cloud/firestore'

const firestore = new Firestore()

export async function POST(request: NextRequest) {
  try {
    const { folderName } = await request.json()

    if (!folderName) {
      return NextResponse.json({ error: "Missing folder name" }, { status: 400 })
    }

    const userId = folderName.toLowerCase().trim()
    const userRef = firestore.collection('users').doc(userId)

    // Vérifier que l'utilisateur existe
    const userDoc = await userRef.get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Réinitialiser l'état du jeu
    await userRef.update({
      guessesRemaining: 3,
      gameComplete: false,
      won: false,
      lastGuess: null,
      lastGuessTimestamp: null,
      gameRestartedAt: new Date()
    })

    // Supprimer toutes les prédictions de la sous-collection
    const predictionsRef = userRef.collection('predictions')
    const predictionsSnapshot = await predictionsRef.get()

    // Supprimer tous les documents de prédictions
    const batch = firestore.batch()
    predictionsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    return NextResponse.json({ 
      success: true,
      message: "Game restarted successfully" 
    })
  } catch (error) {
    console.error("Failed to restart game:", error)
    return NextResponse.json({ 
      error: "Failed to restart game",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
