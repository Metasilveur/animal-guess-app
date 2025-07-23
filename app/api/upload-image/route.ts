import { type NextRequest, NextResponse } from "next/server"
import { Storage } from '@google-cloud/storage'

const storage = new Storage()
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET!

export async function POST(request: NextRequest) {
  try {
    console.log('📤 === DÉBUT UPLOAD IMAGE ===')
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folderName = formData.get("folderName") as string

    console.log('📋 Paramètres upload:')
    console.log('   - Nom fichier original:', file?.name)
    console.log('   - Taille fichier:', file?.size)
    console.log('   - Type fichier:', file?.type)
    console.log('   - Folder name:', folderName)

    if (!file || !folderName) {
      console.log('❌ Erreur: Fichier ou folder name manquant')
      return NextResponse.json({ error: "Missing file or folder name" }, { status: 400 })
    }

    // Upload vers Google Cloud Storage
    const bucket = storage.bucket(bucketName)
    const fileName = `${Date.now()}_${file.name}`
    console.log('🏷️ Nom fichier généré pour GCS:', fileName)
    
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    console.log('📦 Buffer créé, taille:', fileBuffer.length)
    
    console.log('☁️ Upload vers GCS en cours...')
    await bucket.file(fileName).save(fileBuffer, {
      metadata: {
        contentType: file.type,
      }
    })
    console.log('✅ Upload GCS terminé')

    // Retourner immédiatement avec les métadonnées de base
    const uploadResult = {
      id: Date.now().toString(),
      name: file.name, // Nom original pour l'affichage
      fileName: fileName, // ⚠️ IMPORTANT: Utiliser le fileName avec timestamp, comme dans GCS
      gcpUri: `gs://${bucketName}/${fileName}`,
      timestamp: new Date(),
      status: 'processing', // En attente de l'analyse par la Cloud Function
      imageUrl: `https://storage.googleapis.com/${bucketName}/${fileName}`,
    }

    console.log('📋 Résultat upload à retourner:')
    console.log('   - ID:', uploadResult.id)
    console.log('   - Name (affichage):', uploadResult.name)
    console.log('   - FileName (pour Firestore):', uploadResult.fileName)
    console.log('   - GCP URI:', uploadResult.gcpUri)
    console.log('✅ === FIN UPLOAD IMAGE ===')

    return NextResponse.json(uploadResult)
  } catch (error) {
    console.error('❌ === ERREUR UPLOAD IMAGE ===')
    console.error("Upload error:", error)
    console.error('Type d\'erreur:', error?.constructor?.name)
    console.error('Message:', error instanceof Error ? error.message : String(error))
    console.error('❌ === FIN ERREUR ===')
    
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
