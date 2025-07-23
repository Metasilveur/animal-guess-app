import { type NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'

// Initialisation de Google Cloud Storage avec les credentials base64
const initStorage = () => {
  const base64Credentials = process.env.GCP_SERVICE_ACCOUNT_BASE64
  
  if (!base64Credentials) {
    throw new Error('GCP_SERVICE_ACCOUNT_BASE64 environment variable is required')
  }
  
  try {
    // Décoder le base64 et parser le JSON
    const credentialsJson = JSON.parse(Buffer.from(base64Credentials, 'base64').toString('utf-8'))
    
    return new Storage({
      credentials: credentialsJson,
      projectId: credentialsJson.project_id
    })
  } catch (error) {
    throw new Error(`Failed to parse credentials: ${error}`)
  }
}

const storage = initStorage()

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