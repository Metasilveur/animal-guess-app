import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { folderName } = await request.json()

    // TODO: Replace with actual Firestore reset logic
    // For demo purposes, we'll just return success

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to restart game" }, { status: 500 })
  }
}
