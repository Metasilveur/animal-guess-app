import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { folderName } = await request.json()

    // TODO: Replace with actual Firestore check
    // For demo purposes, we'll simulate checking against Firestore
    const validProfiles = ["student1", "student2", "demo", "test"]
    const exists = validProfiles.includes(folderName.toLowerCase())

    return NextResponse.json({ exists })
  } catch (error) {
    return NextResponse.json({ error: "Failed to check profile" }, { status: 500 })
  }
}
