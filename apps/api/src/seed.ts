import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { Role, RefereeCategory, RefereeRole, Competition } from './common/enums';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './users/schemas/user.schema';
import { Referee } from './referees/schemas/referee.schema';
import { Team } from './teams/schemas/team.schema';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const userModel = app.get(getModelToken(User.name));
  const refereeModel = app.get(getModelToken(Referee.name));
  const teamModel = app.get(getModelToken(Team.name));

  const createUser = async (userData: any) => {
    try {
      await usersService.create(userData);
      console.log(`Created user: ${userData.email}`);
    } catch (e: any) {
      if (e.message && e.message.includes('Cet email existe')) {
        console.log(`User already exists: ${userData.email}`);
      } else {
        throw e;
      }
    }
  };

  try {
    // Admin users
    await createUser({ email: 'admin@dna.tn', password: 'Password123!', role: Role.ADMIN_DNA, firstName: 'Admin', lastName: 'DNA', phoneNumber: '+216 12 345 678' });
    await createUser({ email: 'finance@dna.tn', password: 'Finance123!', role: Role.FINANCE_DNA, firstName: 'Finance', lastName: 'DNA', phoneNumber: '+216 12 345 679' });
    await createUser({ email: 'designation@dna.tn', password: 'Designation123!', role: Role.DESIGNATION_DNA, firstName: 'Designation', lastName: 'DNA', phoneNumber: '+216 12 345 680' });
    await createUser({ email: 'caa@dna.tn', password: 'Password123!', role: Role.CAA, firstName: 'Commission', lastName: 'Amateur', phoneNumber: '+216 22 111 111' });
    await createUser({ email: 'caj@dna.tn', password: 'Password123!', role: Role.CAJ, firstName: 'Commission', lastName: 'Jeunes', phoneNumber: '+216 22 222 222' });
    await createUser({ email: 'caf@dna.tn', password: 'Password123!', role: Role.CAF, firstName: 'Commission', lastName: 'Feminine', phoneNumber: '+216 22 333 333' });
    await createUser({ email: 'cra.tunis@dna.tn', password: 'Password123!', role: Role.CRA, firstName: 'President', lastName: 'CRA Tunis', phoneNumber: '+216 22 444 444' });

    console.log('Generating referees...');
    const firstNamesMale = ['Mohamed', 'Ahmed', 'Ali', 'Youssef', 'Amine', 'Mehdi', 'Omar', 'Karim', 'Walid', 'Tarek', 'Sami', 'Hassan', 'Bilel', 'Aymen', 'Wassim', 'Rami', 'Seif', 'Nidhal', 'Hamza', 'Khaled'];
    const firstNamesFemale = ['Fatma', 'Meryem', 'Nour', 'Asma', 'Hiba', 'Sarra', 'Emna', 'Ines', 'Yasmine', 'Salma', 'Mariem', 'Rania', 'Chaima', 'Marwa'];
    const lastNames = ['Trabelsi', 'Ben Ali', 'Gharbi', 'Hammami', 'Ben Ammar', 'Mathlouthi', 'Jaziri', 'Bouazizi', 'Mabrouk', 'Ayari', 'Mansour', 'Khemiri', 'Driss', 'Cherif', 'Toumi', 'Sassi', 'Mzali', 'Dhaouadi'];
    const regions = ['Tunis', 'Sfax', 'Sousse', 'Gabes', 'Bizerte', 'Nabeul', 'Kairouan', 'Gafsa', 'Monastir', 'Mahdia'];
    
    const categories = Object.values(RefereeCategory);
    const roles = Object.values(RefereeRole);

    const generateRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const generateRandomPhone = () => `+216 ${Math.floor(20000000 + Math.random() * 79999999)}`;
    const generateRandomMatricule = () => `REF${Math.floor(1000 + Math.random() * 9000)}`;

    const refereesToCreate = 50;
    const defaultPassword = await bcrypt.hash('Password123!', 10);

    for (let i = 0; i < refereesToCreate; i++) {
      const isFemale = Math.random() > 0.85; // 15% chance for female
      const firstName = isFemale ? generateRandomItem(firstNamesFemale) : generateRandomItem(firstNamesMale);
      const lastName = generateRandomItem(lastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@dna.tn`;
      
      const existingUser = await userModel.findOne({ email });
      if (!existingUser) {
        const user = await userModel.create({
          email,
          password: defaultPassword,
          role: Role.ARBITRE,
          firstName,
          lastName,
          phoneNumber: generateRandomPhone(),
          isActive: true
        });

        // Determine category & roles
        const category = isFemale ? RefereeCategory.FEMININE : generateRandomItem(categories.filter(c => c !== RefereeCategory.FEMININE));
        const numRoles = Math.floor(Math.random() * 3) + 1;
        const allowedRoles = Array.from(new Set(Array.from({ length: numRoles }, () => generateRandomItem(roles))));

        await refereeModel.create({
          userId: user._id,
          matricule: generateRandomMatricule(),
          category,
          league: `Ligue de ${generateRandomItem(regions)}`,
          region: generateRandomItem(regions),
          dateOfBirth: new Date(1980 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
          cin: Math.floor(10000000 + Math.random() * 89999999).toString(),
          isVARCertified: Math.random() > 0.8, // 20% VAR certified
          isAvailable: true,
        });
      }
    }

    console.log('Generating teams...');
    const tunisianTeams = [
      { name: 'Espérance Sportive de Tunis', shortName: 'EST', city: 'Tunis', region: 'Tunis', league: Competition.LIGUE1, stadium: 'Stade Hammadi Agrebi' },
      { name: 'Club Africain', shortName: 'CA', city: 'Tunis', region: 'Tunis', league: Competition.LIGUE1, stadium: 'Stade Hammadi Agrebi' },
      { name: 'Étoile Sportive du Sahel', shortName: 'ESS', city: 'Sousse', region: 'Sousse', league: Competition.LIGUE1, stadium: 'Stade Olympique de Sousse' },
      { name: 'Club Sportif Sfaxien', shortName: 'CSS', city: 'Sfax', region: 'Sfax', league: Competition.LIGUE1, stadium: 'Stade Taïeb Mhiri' },
      { name: 'Union Sportive Monastirienne', shortName: 'USMo', city: 'Monastir', region: 'Monastir', league: Competition.LIGUE1, stadium: 'Stade Mustapha Ben Jannet' },
      { name: 'Stade Tunisien', shortName: 'ST', city: 'Le Bardo', region: 'Tunis', league: Competition.LIGUE1, stadium: 'Stade Hédi Enneifer' },
      { name: 'Club Athlétique Bizertin', shortName: 'CAB', city: 'Bizerte', region: 'Bizerte', league: Competition.LIGUE1, stadium: 'Stade du 15-Octobre' },
      { name: 'Union Sportive de Ben Guerdane', shortName: 'USBG', city: 'Ben Guerdane', region: 'Medenine', league: Competition.LIGUE1, stadium: 'Stade du 7 Mars' },
      { name: 'Olympique de Béja', shortName: 'OB', city: 'Béja', region: 'Béja', league: Competition.LIGUE1, stadium: 'Stade Boujemaa Kmiti' },
      { name: 'Avenir Sportif de La Marsa', shortName: 'ASM', city: 'La Marsa', region: 'Tunis', league: Competition.LIGUE2, stadium: 'Stade Abdelaziz Chtioui' },
      { name: 'Club Sportif de Hammam-Lif', shortName: 'CSHL', city: 'Hammam-Lif', region: 'Ben Arous', league: Competition.LIGUE2, stadium: 'Stade Bou Kornine' },
      { name: 'El Gawafel Sportives de Gafsa', shortName: 'EGSG', city: 'Gafsa', region: 'Gafsa', league: Competition.LIGUE1, stadium: 'Stade Olympique de Gafsa' },
      { name: 'Union Sportive de Tataouine', shortName: 'UST', city: 'Tataouine', region: 'Tataouine', league: Competition.LIGUE1, stadium: 'Stade Néjib Khattab' },
      { name: 'Avenir Sportif de Soliman', shortName: 'ASS', city: 'Soliman', region: 'Nabeul', league: Competition.LIGUE1, stadium: 'Stade Municipal de Soliman' },
      { name: 'Étoile Sportive de Métlaoui', shortName: 'ESM', city: 'Métlaoui', region: 'Gafsa', league: Competition.LIGUE1, stadium: 'Stade Municipal de Métlaoui' },
      { name: 'Espoir Sportif de Hammam Sousse', shortName: 'ESHS', city: 'Hammam Sousse', region: 'Sousse', league: Competition.LIGUE2, stadium: 'Stade Bou Ali Lahouar' },
      { name: 'Jeunesse Sportive Kairouanaise', shortName: 'JSK', city: 'Kairouan', region: 'Kairouan', league: Competition.LIGUE2, stadium: 'Stade Hamda Laouani' },
      { name: 'Olympique de Médenine', shortName: 'COM', city: 'Médenine', region: 'Medenine', league: Competition.LIGUE2, stadium: 'Stade Olympique de Médenine' },
      { name: 'Stade Gabésien', shortName: 'SG', city: 'Gabès', region: 'Gabès', league: Competition.LIGUE2, stadium: 'Stade de Gabès' },
      { name: 'Avenir Sportif de Gabès', shortName: 'ASG', city: 'Gabès', region: 'Gabès', league: Competition.LIGUE2, stadium: 'Stade de Gabès' },
      { name: 'Croissant Sportif Chebbien', shortName: 'CSC', city: 'Chebba', region: 'Mahdia', league: Competition.LIGUE2, stadium: 'Stade de Chebba' },
      { name: 'Jendouba Sport', shortName: 'JS', city: 'Jendouba', region: 'Jendouba', league: Competition.LIGUE2, stadium: 'Stade Municipal de Jendouba' },
      { name: 'Espérance Sportive de Zarzis', shortName: 'ESZ', city: 'Zarzis', region: 'Medenine', league: Competition.LIGUE2, stadium: 'Stade Jlidi' },
      { name: 'Avenir Sportif de Kasserine', shortName: 'ASK', city: 'Kasserine', region: 'Kasserine', league: Competition.LIGUE2, stadium: 'Stade de Kasserine' },
      { name: 'Sporting Club de Ben Arous', shortName: 'SCBA', city: 'Ben Arous', region: 'Ben Arous', league: Competition.LIGUE2, stadium: 'Stade Municipal de Ben Arous' },
      { name: 'El Makarem de Mahdia', shortName: 'EMM', city: 'Mahdia', region: 'Mahdia', league: Competition.LIGUE2, stadium: 'Stade Rached Khouja' },
      { name: 'Étoile Olympique de Sidi Bouzid', shortName: 'EOSB', city: 'Sidi Bouzid', region: 'Sidi Bouzid', league: Competition.LIGUE2, stadium: 'Stade du 17 Décembre' },
      { name: 'Océano Club de Kerkennah', shortName: 'OCK', city: 'Kerkennah', region: 'Sfax', league: Competition.LIGUE2, stadium: 'Stade Farhat Hached' },
      { name: 'Sfax Railway Sports', shortName: 'SRS', city: 'Sfax', region: 'Sfax', league: Competition.LIGUE2, stadium: 'Stade Ameur El Gargouri' },
    ];

    for (const teamData of tunisianTeams) {
      const existingTeam = await teamModel.findOne({ name: teamData.name });
      if (!existingTeam) {
        await teamModel.create({
          ...teamData,
          isActive: true
        });
        console.log(`Created team: ${teamData.name} (${teamData.shortName})`);
      } else {
        console.log(`Team already exists: ${teamData.name}`);
      }
    }

    console.log('Seed completed successfully!');
  } catch (error: any) {
    console.error('Seed failed:', error.message);
  } finally {
    await app.close();
  }
}

void seed();
