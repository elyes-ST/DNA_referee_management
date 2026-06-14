/**
 * Script de test pour les notifications
 * 
 * Usage: npx ts-node test/notification-test.script.ts
 * 
 * Prérequis:
 * 1. API démarrée (npm run start:dev)
 * 2. MongoDB connectée
 * 3. Données de seed existantes
 */

const API_URL = 'http://localhost:3000/api';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const data: LoginResponse = await response.json();
  return data.access_token;
}

async function testNotifications(token: string) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  console.log('\n📋 === TEST DES NOTIFICATIONS ===\n');

  // Test 1: Get my notifications
  console.log('1️⃣ GET /notifications/my');
  let response = await fetch(`${API_URL}/notifications/my`, { headers });
  let data = await response.json();
  console.log(`   ✅ ${data.total || 0} notifications, ${data.unreadCount || 0} non-lues\n`);

  // Test 2: Get unread count
  console.log('2️⃣ GET /notifications/unread-count');
  response = await fetch(`${API_URL}/notifications/unread-count`, { headers });
  data = await response.json();
  console.log(`   ✅ ${data.count || data} notifications non-lues\n`);

  // Test 3: Get preferences
  console.log('3️⃣ GET /notifications/preferences');
  response = await fetch(`${API_URL}/notifications/preferences`, { headers });
  data = await response.json();
  console.log(`   ✅ Préférences:`, JSON.stringify(data.channels || data, null, 2), '\n');

  // Test 4: Update preferences
  console.log('4️⃣ PUT /notifications/preferences');
  response = await fetch(`${API_URL}/notifications/preferences`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      inApp: true,
      whatsapp: true,
      quietHoursEnabled: false,
    }),
  });
  data = await response.json();
  console.log(`   ✅ Préférences mises à jour\n`);

  // Test 5: WhatsApp status (Admin only)
  console.log('5️⃣ GET /notifications/whatsapp/status');
  response = await fetch(`${API_URL}/notifications/whatsapp/status`, { headers });
  data = await response.json();
  console.log(`   ✅ WhatsApp enabled: ${data.enabled}, authorized: ${data.authorized || 'N/A'}\n`);

  console.log('✅ === TOUS LES TESTS PASSÉS ===\n');
}

async function testDesignationFlow(token: string) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  console.log('\n⚽ === TEST FLUX DÉSIGNATION ===\n');
  
  // Get a match
  console.log('1️⃣ Récupérer un match...');
  let response = await fetch(`${API_URL}/matches?limit=1`, { headers });
  let matches = await response.json();
  
  if (!matches.length) {
    console.log('   ⚠️ Aucun match trouvé. Créez des données de test d\'abord.\n');
    return;
  }
  
  const matchId = matches[0]._id;
  console.log(`   ✅ Match trouvé: ${matches[0].homeTeam} vs ${matches[0].awayTeam}\n`);

  // Get a referee
  console.log('2️⃣ Récupérer un arbitre...');
  response = await fetch(`${API_URL}/referees?limit=1`, { headers });
  let referees = await response.json();
  
  if (!referees.length) {
    console.log('   ⚠️ Aucun arbitre trouvé.\n');
    return;
  }
  
  const refereeId = referees[0]._id;
  console.log(`   ✅ Arbitre trouvé: ${referees[0].matricule}\n`);

  // Create designation
  console.log('3️⃣ Créer une désignation...');
  response = await fetch(`${API_URL}/designations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      matchId,
      referees: [{ refereeId, role: 'ARBITRE_CENTRAL' }],
      category: 'A',
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.log(`   ⚠️ Erreur: ${error.message || JSON.stringify(error)}\n`);
    return;
  }
  
  const designation = await response.json();
  console.log(`   ✅ Désignation créée: ${designation._id}\n`);

  // Submit designation
  console.log('4️⃣ Soumettre la désignation...');
  response = await fetch(`${API_URL}/designations/${designation._id}/submit`, {
    method: 'PATCH',
    headers,
  });
  console.log(`   ✅ Désignation soumise\n`);

  // Validate designation (triggers notification!)
  console.log('5️⃣ Valider la désignation (déclenche notification)...');
  response = await fetch(`${API_URL}/designations/${designation._id}/validate`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ notes: 'Test validation' }),
  });
  
  if (response.ok) {
    console.log(`   ✅ Désignation validée - NOTIFICATION ENVOYÉE!\n`);
  } else {
    const error = await response.json();
    console.log(`   ⚠️ Erreur: ${error.message}\n`);
  }

  // Check notifications
  console.log('6️⃣ Vérifier les notifications créées...');
  response = await fetch(`${API_URL}/notifications/my`, { headers });
  const notifs = await response.json();
  console.log(`   ✅ ${notifs.total || 0} notifications trouvées\n`);
  
  if (notifs.data?.length) {
    console.log('   Dernière notification:', notifs.data[0].title);
  }

  console.log('✅ === TEST FLUX DÉSIGNATION TERMINÉ ===\n');
}

// Main
async function main() {
  try {
    console.log('🔐 Connexion en tant qu\'admin...');
    const token = await login('admin@dna.tn', 'Admin123!');
    console.log('✅ Connecté!\n');

    await testNotifications(token);
    
    // Uncomment to test full designation flow:
    // await testDesignationFlow(token);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

main();
