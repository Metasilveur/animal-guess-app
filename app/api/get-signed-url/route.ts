import { type NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'

const storage = new Storage()

export async function POST(request: NextRequest) {
  try {
    const { fileName, bucketName } = await request.json()

    if (!fileName || !bucketName) {
      return NextResponse.json({ error: "Missing fileName or bucketName parameter" }, { status: 400 })
    }

    console.log('🔗 Génération URL signée pour:')
    console.log('   - Fichier:', fileName)
    console.log('   - Bucket:', bucketName)

    const bucket = storage.bucket(bucketName)
    const file = bucket.file(fileName)

    // Générer une URL signée valide pour 1 heure
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 heure
    })

    console.log('✅ URL signée générée:', signedUrl.substring(0, 50) + '...')

    return NextResponse.json({ signedUrl })
  } catch (error) {
    console.error('❌ Erreur génération URL signée:', error)
    return NextResponse.json({ 
      error: "Failed to generate signed URL",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 