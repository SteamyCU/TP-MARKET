import fs from 'fs';

const namesData = fs.readFileSync('raw_names.txt', 'utf8').split('\n').filter(l => l.trim());
const emailsData = fs.readFileSync('raw_emails.txt', 'utf8').split('\n').filter(l => l.trim());

const clients = [];

for (let i = 0; i < namesData.length; i++) {
  const nameLine = namesData[i].trim();
  const emailLine = emailsData[i] ? emailsData[i].trim() : '';

  // Parse name line: ID Document Name
  const parts = nameLine.split(' ');
  const id = parts[0];
  const doc = parts[1];
  const name = parts.slice(2).join(' ');

  // Parse email line: Email Phone
  // Phone might have spaces, email is usually first
  const emailParts = emailLine.split(' ');
  let email = '';
  let phone = '';
  
  if (emailParts.length > 0) {
    email = emailParts[0];
    phone = emailParts.slice(1).join(' ');
  }

  clients.push({
    oldId: id,
    documentoIdentidad: doc,
    nombre: name,
    email: email,
    telefonoEspana: phone,
    direccion: 'No especificada', // Required field
    createdAt: new Date().toISOString()
  });
}

fs.writeFileSync('parsed_clients.json', JSON.stringify(clients, null, 2));
console.log(`Parsed ${clients.length} clients.`);
