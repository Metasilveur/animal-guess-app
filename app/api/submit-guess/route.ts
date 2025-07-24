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
    console.log('🎯 === DÉBUT SUBMIT GUESS ===')
    
    const { folderName, guess } = await request.json()
    
    console.log('📋 Paramètres reçus:')
    console.log('   - folderName:', folderName)
    console.log('   - guess:', guess)

    if (!folderName || !guess) {
      console.log('❌ Erreur: folderName ou guess manquant')
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = folderName.toLowerCase().trim()
    const userRef = firestore.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      console.log('❌ Erreur: Utilisateur non trouvé:', userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    console.log('📊 Données utilisateur:', {
      mysteryAnimal: userData?.mysteryAnimal,
      guessesRemaining: userData?.guessesRemaining,
      gameComplete: userData?.gameComplete
    })
    
    const mysteryAnimal = userData?.mysteryAnimal || "capybara" // Valeur par défaut
    const currentGuesses = userData?.guessesRemaining || 3

    // ⚠️ CORRECTION: Améliorer la logique de vérification
    console.log('🔍 Vérification de la devinette:')
    console.log('   - mysteryAnimal:', `"${mysteryAnimal}"`)
    console.log('   - guess:', `"${guess}"`)
    
    // Vérification plus robuste
    let isCorrect = false
    if (mysteryAnimal && mysteryAnimal.trim() !== "") {
      const normalizedGuess = guess.toLowerCase().trim()
      const normalizedAnimal = mysteryAnimal.toLowerCase().trim()
      
      // Vérifier si la devinette contient l'animal mystère ou vice versa
      isCorrect = (normalizedGuess.includes(normalizedAnimal) || normalizedAnimal.includes(normalizedGuess))
      
      console.log('   - normalizedGuess:', `"${normalizedGuess}"`)
      console.log('   - normalizedAnimal:', `"${normalizedAnimal}"`)
      console.log('   - isCorrect:', isCorrect)
    } else {
      console.log('   - ⚠️ mysteryAnimal est vide ou non défini, impossible de valider')
      isCorrect = false
    }
    
    const newGuessesRemaining = isCorrect ? 0 : Math.max(0, currentGuesses - 1)
    const gameComplete = isCorrect || newGuessesRemaining === 0

    console.log('📊 Résultats:')
    console.log('   - isCorrect:', isCorrect)
    console.log('   - newGuessesRemaining:', newGuessesRemaining)
    console.log('   - gameComplete:', gameComplete)

    // Mettre à jour l'état du jeu dans Firestore
    const updateData = {
      guessesRemaining: newGuessesRemaining,
      gameComplete,
      won: isCorrect,
      lastGuess: guess,
      lastGuessTimestamp: new Date()
    }
    
    console.log('📝 Mise à jour Firestore:', updateData)
    await userRef.update(updateData)

    const response = {
      guessesRemaining: newGuessesRemaining,
      gameComplete,
      won: isCorrect,
      mysteryAnimal,
      mysteryImageUrl: userData?.mysteryImageUrl || "https://upload.wikimedia.org/wikipedia/commons/8/85/Capybara_portrait.jpg",
    }
    
    console.log('📤 Réponse à envoyer:', response)
    console.log('✅ === FIN SUBMIT GUESS ===')

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ === ERREUR SUBMIT GUESS ===')
    console.error("Failed to submit guess:", error)
    console.error('Type d\'erreur:', error?.constructor?.name)
    console.error('Message:', error instanceof Error ? error.message : String(error))
    console.error('❌ === FIN ERREUR ===')
    
    return NextResponse.json({ 
      error: "Failed to submit guess",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
