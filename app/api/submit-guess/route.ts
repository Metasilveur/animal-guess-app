import { type NextRequest, NextResponse } from "next/server"
import { Firestore } from '@google-cloud/firestore'

const firestore = new Firestore()

export async function POST(request: NextRequest) {
  try {
    const { folderName, guess } = await request.json()

    if (!folderName || !guess) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = folderName.toLowerCase().trim()
    const userRef = firestore.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const mysteryAnimal = userData?.mysteryAnimal || "imapala" // Valeur par défaut
    const currentGuesses = userData?.guessesRemaining || 3

    // Vérifier si la devinette est correcte
    const isCorrect = guess.toLowerCase().trim().includes(mysteryAnimal.toLowerCase())
    const newGuessesRemaining = isCorrect ? 0 : Math.max(0, currentGuesses - 1)
    const gameComplete = isCorrect || newGuessesRemaining === 0

    // Mettre à jour l'état du jeu dans Firestore
    await userRef.update({
      guessesRemaining: newGuessesRemaining,
      gameComplete,
      won: isCorrect,
      lastGuess: guess,
      lastGuessTimestamp: new Date()
    })

    return NextResponse.json({
      guessesRemaining: newGuessesRemaining,
      gameComplete,
      won: isCorrect,
      mysteryAnimal,
      mysteryImageUrl: userData?.mysteryImageUrl || "/placeholder.svg?height=400&width=400",
    })
  } catch (error) {
    console.error("Failed to submit guess:", error)
    return NextResponse.json({ 
      error: "Failed to submit guess",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
