import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderName = searchParams.get("folderName")

    // TODO: Replace with actual Firestore query
    // For demo purposes, we'll return mock data
    const mockGameState = {
      uploads: [
        {
          id: "1",
          name: "cat1.jpg",
          similarity: 85,
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          imageUrl: "/placeholder.svg?height=200&width=200",
        },
        {
          id: "2",
          name: "dog.jpg",
          similarity: 45,
          timestamp: new Date(Date.now() - 1000 * 60 * 3),
          imageUrl: "/placeholder.svg?height=200&width=200",
        },
      ],
      guessesRemaining: 3,
      gameComplete: false,
      won: false,
      mysteryAnimal: "lion",
      mysteryImageUrl: "/placeholder.svg?height=400&width=400",
    }

    return NextResponse.json(mockGameState)
  } catch (error) {
    return NextResponse.json({ error: "Failed to load game state" }, { status: 500 })
  }
}
