const XLSX = require('xlsx');
const path = require('path');

// Données des matchs - Noms EXACTS du seed teams.service.ts
// Champs nécessaires basés sur le Match schema
const matchesData = [
  {
    matchNumber: 'M001',
    journee: 1,
    saison: '2025-2026',
    date: '2026-02-15',
    time: '20:00',
    homeTeam: 'Espérance Sportive de Tunis',
    awayTeam: 'Club Africain',
    stadium: 'Stade Olympique de Radès',
    competition: 'LIGUE1',
    category: 'A',
    status: 'SCHEDULED',
    hasVAR: false
  },
  {
    matchNumber: 'M002',
    journee: 1,
    saison: '2025-2026',
    date: '2026-02-15',
    time: '17:00',
    homeTeam: 'Étoile Sportive du Sahel',
    awayTeam: 'Club Sportif Sfaxien',
    stadium: 'Stade Olympique de Sousse',
    competition: 'LIGUE1',
    category: 'A',
    status: 'SCHEDULED',
    hasVAR: false
  },
  {
    matchNumber: 'M003',
    journee: 1,
    saison: '2025-2026',
    date: '2026-02-16',
    time: '15:00',
    homeTeam: 'US Monastir',
    awayTeam: 'CA Bizertin',
    stadium: 'Stade Mustapha Ben Jannet',
    competition: 'LIGUE1',
    category: 'A',
    status: 'SCHEDULED',
    hasVAR: false
  },
  {
    matchNumber: 'M004',
    journee: 2,
    saison: '2025-2026',
    date: '2026-02-22',
    time: '20:00',
    homeTeam: 'Club Africain',
    awayTeam: 'Étoile Sportive du Sahel',
    stadium: 'Stade Olympique de Radès',
    competition: 'LIGUE1',
    category: 'A',
    status: 'SCHEDULED',
    hasVAR: true
  },
  {
    matchNumber: 'M005',
    journee: 2,
    saison: '2025-2026',
    date: '2026-02-22',
    time: '17:00',
    homeTeam: 'Club Sportif Sfaxien',
    awayTeam: 'Espérance Sportive de Tunis',
    stadium: 'Stade Taïeb Mhiri',
    competition: 'LIGUE1',
    category: 'A',
    status: 'SCHEDULED',
    hasVAR: true
  },
  {
    matchNumber: 'M006',
    journee: 2,
    saison: '2025-2026',
    date: '2026-02-23',
    time: '15:00',
    homeTeam: 'CA Bizertin',
    awayTeam: 'US Monastir',
    stadium: 'Stade 15 Octobre 1963',
    competition: 'LIGUE1',
    category: 'A',
    status: 'SCHEDULED',
    hasVAR: false
  },
  {
    matchNumber: 'M007',
    journee: 3,
    saison: '2025-2026',
    date: '2026-03-01',
    time: '20:00',
    homeTeam: 'Espérance Sportive de Tunis',
    awayTeam: 'US Monastir',
    stadium: 'Stade Olympique de Radès',
    competition: 'LIGUE1',
    category: 'A',
    status: 'SCHEDULED',
    hasVAR: true
  },
  {
    matchNumber: 'M008',
    journee: 3,
    saison: '2025-2026',
    date: '2026-03-01',
    time: '17:00',
    homeTeam: 'Étoile Sportive du Sahel',
    awayTeam: 'CA Bizertin',
    stadium: 'Stade Olympique de Sousse',
    competition: 'LIGUE1',
    category: 'A',
    status: 'SCHEDULED',
    hasVAR: false
  },
  {
    matchNumber: 'M009',
    journee: 3,
    saison: '2025-2026',
    date: '2026-03-02',
    time: '15:00',
    homeTeam: 'Club Sportif Sfaxien',
    awayTeam: 'Club Africain',
    stadium: 'Stade Taïeb Mhiri',
    competition: 'LIGUE1',
    category: 'A',
    status: 'SCHEDULED',
    hasVAR: false
  }
];

// Créer un nouveau workbook
const workbook = XLSX.utils.book_new();

// Convertir les données en worksheet
const worksheet = XLSX.utils.json_to_sheet(matchesData);

// Définir la largeur des colonnes
worksheet['!cols'] = [
  { wch: 12 }, // matchNumber
  { wch: 10 }, // journee
  { wch: 12 }, // saison
  { wch: 12 }, // date
  { wch: 8 },  // time
  { wch: 20 }, // homeTeam
  { wch: 20 }, // awayTeam
  { wch: 30 }, // stadium
  { wch: 12 }, // competition
  { wch: 10 }  // category
];

// Ajouter le worksheet au workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Matches');

// Chemin du fichier de sortie
const outputPath = path.join(__dirname, 'matches-import-template.xlsx');

// Écrire le fichier Excel
XLSX.writeFile(workbook, outputPath);

console.log('✅ Fichier Excel créé avec succès:');
console.log('   📁', outputPath);
console.log('\n📊 Contenu:');
console.log(`   - ${matchesData.length} matchs`);
console.log('   - Journées 1, 2, 3');
console.log('   - Saison 2025-2026');
console.log('   - Competition: LIGUE1 (corrigé)');
console.log('\n⚠️  IMPORTANT: Créer les équipes d\'abord!');
console.log('   Exécutez: node seed-teams.js');
console.log('\n🚀 Ensuite import via POST /matches/import');
