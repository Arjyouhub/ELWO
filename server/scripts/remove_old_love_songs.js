require('dotenv').config();
const { connectDB } = require('../config/db');
const Track = require('../models/Track');

const oldSongTitles = [
  'Oru Kaathilola',
  'Karuthappenne',
  'Akale',
  'Anuraaga Vilochananaayi',
  'Kaarmukilil',
  'Chemboove Poove',
  'Aaro Nenjil',
  'Perilla Raajyathe',
  'Oru Kinnaragaanam',
  'Etho Saayaana',
  'Aaraadhike',
  'Njan Jackson Allada',
  'Minnalvala',
  'Kalapakkaara',
  'Jaalakaari',
  'Kanmanipoove',
  'Tony\'s Mayhem',
  'Varaha Roopam',
  'Pemari',
];

async function run() {
  await connectDB();
  console.log('\n--- REMOVING OLD / UNWANTED SONGS ---');
  let deletedCount = 0;
  for (const t of oldSongTitles) {
    const res = await Track.deleteMany({ title: new RegExp(t, 'i') });
    if (res.deletedCount > 0) {
      deletedCount += res.deletedCount;
      console.log(`  🗑️ Deleted: "${t}" (${res.deletedCount} removed)`);
    }
  }

  // Remove duplicates
  const dups = ['Cha Cha Chi Chi Choo', 'Illey Illa', 'Maanthrikam', 'Indrajaalam', 'KALYANI'];
  for (const d of dups) {
    const items = await Track.find({ title: new RegExp(d, 'i') }).sort({ _id: -1 });
    if (items.length > 1) {
      for (let i = 1; i < items.length; i++) {
        await Track.findByIdAndDelete(items[i]._id);
        deletedCount++;
        console.log(`  🗑️ Removed duplicate of "${d}": ${items[i]._id}`);
      }
    }
  }

  console.log(`\n✅ Completed: Removed ${deletedCount} tracks.`);
  const remaining = await Track.find({ language: 'Malayalam' }).select('title artistName addedAt');
  console.log(`\nRemaining Malayalam tracks (${remaining.length}):`);
  remaining.forEach((r, i) => console.log(`  ${i + 1}. ${r.title} — ${r.artistName}`));
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
