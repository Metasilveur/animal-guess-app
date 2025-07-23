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
      projectId: credentialsJson.project_id
    })
  } catch (error) {
    throw new Error(`Failed to parse credentials: ${error}`)
  }
}

const firestore = initFirestore()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 === DÉBUT RÉCUPÉRATION PRÉDICTIONS ===')
    
    const { searchParams } = new URL(request.url)
    const user = searchParams.get("user")
    const processingFiles = searchParams.get("processingFiles")

    console.log('📋 Paramètres reçus:')
    console.log('   - user:', user)
    console.log('   - processingFiles:', processingFiles)

    if (!user) {
      console.log('❌ Erreur: Paramètre user manquant')
      return NextResponse.json({ error: "Missing user parameter" }, { status: 400 })
    }

    const userId = user.toLowerCase().trim()
    console.log('👤 User ID normalisé:', userId)

    const predictionsRef = firestore
      .collection('users')
      .doc(userId)
      .collection('predictions')
    
    console.log('📁 Référence collection:', `users/${userId}/predictions`)

    // 🔍 DIAGNOSTIC: Lister tous les documents pour voir les file_name réels
    console.log('🔬 === DIAGNOSTIC - LISTE DE TOUS LES DOCUMENTS ===')
    try {
      const allDocsSnapshot = await predictionsRef.get()
      console.log('📊 Total documents dans la collection:', allDocsSnapshot.docs.length)
      allDocsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`   ${index + 1}. Doc ID: ${doc.id}`)
        console.log(`      - file_name: "${data.file_name}"`)
        console.log(`      - inference: ${data.inference}`)
        console.log(`      - user: ${data.user}`)
      })
    } catch (diagError) {
      console.log('❌ Erreur diagnostic:', diagError)
    }
    console.log('🔬 === FIN DIAGNOSTIC ===')

    let snapshot
    if (processingFiles && processingFiles.trim() !== "") {
      console.log('🔄 Mode filtré - fichiers en traitement détectés')
      const fileList = processingFiles.split(',').map(f => f.trim()).filter(f => f !== "")
      console.log('📝 Liste des fichiers à filtrer:', fileList)
      
      if (fileList.length > 0) {
        console.log('🔍 Exécution requête Firestore avec filtre WHERE IN (sans orderBy)')
        snapshot = await predictionsRef
          .where('file_name', 'in', fileList)
          .get() // ⚠️ SUPPRESSION de .orderBy() pour éviter l'erreur Firestore
        console.log('✅ Requête filtrée terminée, documents trouvés:', snapshot.docs.length)
      } else {
        console.log('⚠️ Liste de fichiers vide après filtrage, retour liste vide')
        snapshot = { docs: [] }
      }
    } else {
      console.log('📊 Mode complet - récupération de toutes les prédictions')
      snapshot = await predictionsRef
        .orderBy('timestamp', 'desc') // ⚠️ CORRECTION: timestamp en minuscules
        .get()
      console.log('✅ Requête complète terminée, documents trouvés:', snapshot.docs?.length || 0)
    }

    console.log('🔄 Transformation des documents...')
    const predictions = snapshot.docs?.map((doc: any, index: number) => {
      const data = doc.data()
      console.log(`   ${index + 1}. Document ID: ${doc.id}`)
      console.log(`      - file_name: ${data.file_name}`)
      console.log(`      - inference: ${data.inference}`)
      console.log(`      - timestamp: ${data.timestamp}`) // ⚠️ CORRECTION: timestamp en minuscules
      console.log(`      - timestamp type: ${typeof data.timestamp}`)
      
      // ⚠️ SÉCURITÉ: Vérifier que timestamp existe avant d'appeler toDate()
      let timestamp
      try {
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          timestamp = data.timestamp.toDate()
        } else if (data.timestamp) {
          // Si c'est déjà une Date ou un string
          timestamp = new Date(data.timestamp)
        } else {
          // Fallback: utiliser la date actuelle
          console.log(`      ⚠️ timestamp manquant pour ${doc.id}, utilisation date actuelle`)
          timestamp = new Date()
        }
      } catch (timestampError) {
        console.log(`      ❌ Erreur conversion timestamp pour ${doc.id}:`, timestampError)
        timestamp = new Date()
      }
      
      return {
        id: doc.id,
        file_name: data.file_name,
        gcp_uri: data.gcs_uri, // ⚠️ CORRECTION: gcs_uri au lieu de gcp_uri
        inference: data.inference,
        timestamp: timestamp,
        user: data.user
      }
    }) || []

    // Tri côté client par timestamp décroissant (plus récent en premier)
    predictions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    console.log('📤 Nombre total de prédictions à retourner (après tri):', predictions.length)
    console.log('✅ === FIN RÉCUPÉRATION PRÉDICTIONS ===')

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('❌ === ERREUR RÉCUPÉRATION PRÉDICTIONS ===')
    console.error('Type d\'erreur:', error?.constructor?.name)
    console.error('Message d\'erreur:', error instanceof Error ? error.message : String(error))
    console.error('Code d\'erreur:', (error as any)?.code)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    console.error('❌ === FIN ERREUR ===')
    
    return NextResponse.json({ 
      error: "Failed to fetch predictions",
      details: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code || "unknown"
    }, { status: 500 })
  }
} 