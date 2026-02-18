// C:\Users\WamaP\Desktop\Projects\Eli\scripts\init-data.ts
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const membersFile = path.join(dataDir, 'members.json');
const groupsFile = path.join(dataDir, 'groups.json');

console.log('📁 Initializing data directory...');

// Create data directory
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory');
}

// Create members.json if it doesn't exist
if (!fs.existsSync(membersFile)) {
  fs.writeFileSync(membersFile, JSON.stringify({}, null, 2));
  console.log('✅ Created members.json');
}

// Create groups.json if it doesn't exist
if (!fs.existsSync(groupsFile)) {
  fs.writeFileSync(groupsFile, JSON.stringify({ groups: [], lastId: 0 }, null, 2));
  console.log('✅ Created groups.json');
}

console.log('🎉 Initialization complete!');