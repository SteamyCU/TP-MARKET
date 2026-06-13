import { initializeApp } from 'firebase/app';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// La autenticación (login/registro/logout) vive en Supabase Auth (ver src/supabase.ts).
// Firebase/Firestore se mantiene como almacén de datos mientras se completa la
// migración (Fase 13: Migración a Supabase).
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();
