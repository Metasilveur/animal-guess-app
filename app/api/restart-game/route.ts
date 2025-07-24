import { type NextRequest, NextResponse } from "next/server"
import { Firestore } from '@google-cloud/firestore'

// Initialisation de Firestore avec les credentials base64
const initFirestore = () => {
  const base64Credentials = process.env.GCP_SERVICE_ACCOUNT_BASE64
  
  if (!base64Credentials) {
    throw new Error('GCP_SERVICE_ACCOUNT_BASE64 environment variable is required')
  }
  
  try {
    // Décoder le base64 et parser le JSON
    const credentialsJson = JSON.parse(Buffer.from(base64Credentials, 'base64').toString('utf-8'))
    
    return new Firestore({
      credentials: credentialsJson,
      projectId: credentialsJson.project_id,
      databaseId: "buir-smart-retail-tp"
    })
  } catch (error) {
    throw new Error(`Failed to parse credentials: ${error}`)
  }
}

const firestore = initFirestore()

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
