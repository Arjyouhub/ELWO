require('dotenv').config();
const { connectDB } = require('../config/db');
const Track = require('../models/Track');

const titles = [
  'Kaattuchembakam',
  'The War Cry',
  'Asalayavale',
  'Ada Bommale',
  'Koodappirannor',
  'KALYANI',
  'Flesh & Blood',
  'ZILL',
  'Sulthaan',
  'CHEMBARATHI',
  'Kinginichar',
  'Thooki',
  'Puthu Mazha',
  'Vellarathaaram',
  'Aakashappanthalaay',
];

async function run() {
  await connectDB();
  const now = Date.now();
  console.log('\n--- VERIFYING & ORDERING 15 REQUESTED SONGS ---');
  for (let i = 0; i < titles.length; i++) {
    const t = titles[i];
    const track = await Track.findOne({
      title: new RegExp(t.replace('&', '.*'), 'i'),
      language: 'Malayalam',
    });
    if (track) {
      track.addedAt = new Date(now - i * 60000);
      track.playCount = 350000 - i * 8000;
      track.isPublished = true;
      track.releaseDate = '2025-12-15';
      await track.save();
      console.log(`  [${i + 1}] ✅ ${track.title} — ${track.artistName} (Artwork: ${track.artworkUrl ? 'Yes' : 'No'})`);
    } else {
      console.log(`  [${i + 1}] ❌ Missing: ${t}`);
    }
  }
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
