import { type NextRequest, NextResponse } from "next/server"
import { Firestore } from '@google-cloud/firestore'

const firestore = new Firestore()

export async function POST(request: NextRequest) {
  try {
    const { folderName } = await request.json()

    if (!folderName || typeof folderName !== 'string') {
      return NextResponse.json({ error: "Invalid folder name" }, { status: 400 })
    }

    console.log('🔍 === DÉBUT VÉRIFICATION PROFIL ===')
    console.log('📋 Folder name reçu:', folderName)
    console.log('🔑 Credentials path:', process.env.GOOGLE_APPLICATION_CREDENTIALS)
    console.log('📁 Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID)

    const userId = folderName.toLowerCase().trim()
    console.log('👤 User ID normalisé:', userId)

    // Lister toutes les collections pour debug
    console.log('📚 Test - Lister les collections...')
    try {
      const collections = await firestore.listCollections()
      console.log('✅ Collections trouvées:', collections.length)
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.id}`)
      })
    } catch (colError) {
      console.log('❌ Erreur lors du listing des collections:', colError)
    }

    // Vérifier si le document utilisateur existe
    console.log('🔍 Recherche du document:', `users/${userId}`)
    const userRef = firestore.collection('users').doc(userId)
    const userSnap = await userRef.get()

    const exists = userSnap.exists
    console.log(' Document existe:', exists)

    if (exists) {
      console.log('📋 Données du document:', userSnap.data())
    } else {
      console.log('⚠️ Document non trouvé dans la collection users')
      
      // Lister quelques documents de la collection users pour debug
      try {
        console.log('🔍 Test - Lister les documents de la collection users...')
        const usersSnapshot = await firestore.collection('users').limit(5).get()
        console.log('📋 Documents dans users:', usersSnapshot.size)
        usersSnapshot.docs.forEach((doc, index) => {
          console.log(`   ${index + 1}. ID: ${doc.id}, Data:`, doc.data())
        })
      } catch (listError) {
        console.log('❌ Erreur lors du listing des documents:', listError)
      }
    }

    console.log('✅ === FIN VÉRIFICATION PROFIL ===')

    return NextResponse.json({ exists })
  } catch (error) {
    console.error('❌ === ERREUR VÉRIFICATION PROFIL ===')
    console.error('Erreur lors de la vérification du profil:', error)
    console.error('Code erreur:', (error as any)?.code)
    console.error('Message erreur:', (error as any)?.message)
    console.error('Détails erreur:', (error as any)?.details)
    
    return NextResponse.json({ 
      error: "Failed to check profile",
      details: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code || "unknown"
    }, { status: 500 })
  }
}
