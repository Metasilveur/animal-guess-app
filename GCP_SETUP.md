# Configuration Google Cloud Platform

## Variables d'environnement nécessaires

Ajoutez ces variables à votre fichier `.env.local` :

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=dev-moula
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@dev-moula.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----"
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
```

## Structure Firestore

### Collection principale : `users`

Chaque utilisateur a un document avec cette structure :

```typescript
users/{userId}/
{
  // Données utilisateur
  folderName: string,
  
  // État du jeu
  guessesRemaining: number,     // Nombre de tentatives restantes (défaut: 3)
  gameComplete: boolean,        // Jeu terminé ou non
  won: boolean,                // Victoire ou défaite
  mysteryAnimal: string,        // Animal mystère à deviner
  mysteryImageUrl: string,      // URL de l'image mystère
  
  // Historique des tentatives
  lastGuess: string,           // Dernière devinette
  lastGuessTimestamp: Date,    // Timestamp de la dernière devinette
  gameRestartedAt: Date,       // Timestamp du dernier restart
  
  // Métadonnées
  createdAt: Date,
  updatedAt: Date
}
```

### Sous-collection : `predictions`

Chaque prédiction est stockée dans une sous-collection :

```typescript
users/{userId}/predictions/{predictionId}/
{
  file_name: string,     // Nom du fichier (utilisé comme ID du document)
  gcp_uri: string,       // URI Google Cloud Storage (gs://bucket/path)
  inference: number,     // Score du modèle AI (0-100)
  Timestamp: Date,       // Timestamp de l'analyse
  user: string          // Nom du dossier/utilisateur (redondant mais utile)
}
```

## Architecture du système

1. **Upload** : L'utilisateur upload une image → GCS
2. **Trigger** : Cloud Function déclenchée par l'upload GCS
3. **Analyse** : Cloud Function analyse avec Gemini AI
4. **Sauvegarde** : Résultat sauvé dans `users/{userId}/predictions/{fileName}`
5. **Polling** : Frontend poll l'API `/api/predictions?user={userId}` toutes les 3 secondes
6. **Mise à jour** : Interface mise à jour quand prédictions disponibles

## APIs disponibles

### GET `/api/game-state?folderName={userId}`
- Récupère l'état du jeu et toutes les prédictions
- Retourne : état du jeu + liste des uploads avec scores

### GET `/api/predictions?user={userId}`
- Récupère uniquement les prédictions
- Utilisé pour le polling en temps réel

### POST `/api/submit-guess`
- Soumet une devinette
- Met à jour l'état du jeu dans Firestore
- Body: `{ folderName, guess }`

### POST `/api/restart-game`
- Remet à zéro l'état du jeu
- Supprime toutes les prédictions
- Body: `{ folderName }`

### POST `/api/check-profile`
- Vérifie si un utilisateur existe
- Body: `{ folderName }`

### POST `/api/upload-image`
- Upload une image vers GCS
- Retourne les métadonnées de base
- Body: FormData avec `file` et `folderName`

## Règles Firestore recommandées

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collection users
    match /users/{userId} {
      allow read: if true; // Permettre la lecture pour vérifier l'existence
      allow write: if true; // Permettre les mises à jour du jeu
      
      // Sous-collection predictions
      match /predictions/{predictionId} {
        allow read: if true; // Permettre la lecture des prédictions
        allow write: if true; // Permettre l'écriture par Cloud Functions et APIs
      }
    }
  }
}
```

## Configuration de votre Cloud Function

Votre Cloud Function doit maintenant insérer dans cette structure :

```typescript
// Dans votre Cloud Function
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Exemple d'insertion d'une prédiction
const userDocRef = db.collection('users').doc(userId.toLowerCase().trim());
const predictionRef = userDocRef.collection('predictions').doc(fileName);

await predictionRef.set({
  file_name: fileName,
  gcp_uri: gcpUri,
  inference: score, // Score de 0 à 100
  Timestamp: new Date(),
  user: userId
});
``` 