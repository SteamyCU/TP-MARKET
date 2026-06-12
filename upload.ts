import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import config from './firebase-applet-config.json';

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const clients = JSON.parse(fs.readFileSync('./parsed_clients.json', 'utf-8'));

async function upload() {
  console.log(`Uploading ${clients.length} clients...`);
  let count = 0;
  for (const client of clients) {
    await addDoc(collection(db, 'clientes'), {
      nombre: client.nombre,
      documentoIdentidad: client.documentoIdentidad,
      telefonoEspana: client.telefonoEspana,
      email: client.email,
      direccion: client.direccion,
      agenteId: 'wondercuban@gmail.com', // Assigning to the agent
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    count++;
    if (count % 10 === 0) console.log(`Uploaded ${count}...`);
  }
  console.log('Done!');
  process.exit(0);
}

upload().catch(console.error);
