import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Referee } from '../src/referees/schemas/referee.schema';
import { Match } from '../src/matches/schemas/match.schema';
import { Designation } from '../src/designations/schemas/designation.schema';
import * as bcrypt from 'bcrypt';

describe('Designations (e2e)', () => {
  let app: INestApplication;
  let userModel: any;
  let refereeModel: any;
  let matchModel: any;
  let designationModel: any;
  let adminToken: string;
  let testMatchId: string;
  let testRefereeIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    
    userModel = moduleFixture.get(getModelToken(User.name));
    refereeModel = moduleFixture.get(getModelToken(Referee.name));
    matchModel = moduleFixture.get(getModelToken(Match.name));
    designationModel = moduleFixture.get(getModelToken(Designation.name));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await refereeModel.deleteMany({});
    await matchModel.deleteMany({});
    await designationModel.deleteMany({});
    
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    await userModel.create({
      email: 'admin@dna.tn',
      password: hashedPassword,
      role: 'ADMIN_DNA',
      firstName: 'Admin',
      lastName: 'DNA',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@dna.tn',
        password: 'Admin123!',
      });

    adminToken = loginResponse.body.access_token;

    // Get admin user ID
    const adminUser = await userModel.findOne({ email: 'admin@dna.tn' });
    const adminUserId = adminUser._id.toString();

    // Create test match
    const match = await matchModel.create({
      matchNumber: 'M001',
      journee: 1,
      saison: '2025-2026',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      date: new Date('2026-03-15'),
      time: '19:00',
      stadium: 'Stadium',
      venue: 'Stadium',
      competition: 'LIGUE1',
      category: 'A',
      createdBy: adminUserId,
    });
    testMatchId = match._id.toString();

    // Create test users and referees (4 required for mandatory roles)
    testRefereeIds = [];
    for (let i = 1; i <= 4; i++) {
      const user = await userModel.create({
        email: `referee${i}@example.com`,
        password: await bcrypt.hash('Password123!', 10),
        role: 'ARBITRE',
        firstName: `Test${i}`,
        lastName: `Referee${i}`,
      });

      const referee = await refereeModel.create({
        userId: user._id,
        matricule: `REF00${i}`,
        category: 'A',
        region: 'Tunis',
        dateOfBirth: new Date('1990-01-01'),
        cin: `1234567${i}`,
      });
      testRefereeIds.push(referee._id.toString());
    }
  });

  describe('/api/designations (POST)', () => {
    it('should create a designation with all 4 required roles', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/designations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: testMatchId,
          category: 'A',
          referees: [
            { refereeId: testRefereeIds[0], role: 'ARBITRE_CENTRAL' },
            { refereeId: testRefereeIds[1], role: 'ASSISTANT_1' },
            { refereeId: testRefereeIds[2], role: 'ASSISTANT_2' },
            { refereeId: testRefereeIds[3], role: 'QUATRIEME_ARBITRE' },
          ],
        })
        .expect(201);

      expect(response.body.matchId).toBe(testMatchId);
      expect(response.body.referees).toBeInstanceOf(Array);
      expect(response.body.referees.length).toBe(4);
      expect(response.body.referees[0].role).toBe('ARBITRE_CENTRAL');
    });

    it('should fail without all required roles', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/designations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: testMatchId,
          category: 'A',
          referees: [
            { refereeId: testRefereeIds[0], role: 'ARBITRE_CENTRAL' },
          ],
        })
        .expect(400);

      expect(response.body.message).toContain('au minimum 4 arbitres');
    });

    it('should fail with invalid match ID', async () => {
      await request(app.getHttpServer())
        .post('/api/designations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: '507f1f77bcf86cd799439011',
          category: 'A',
          referees: [
            { refereeId: testRefereeIds[0], role: 'ARBITRE_CENTRAL' },
            { refereeId: testRefereeIds[1], role: 'ASSISTANT_1' },
            { refereeId: testRefereeIds[2], role: 'ASSISTANT_2' },
            { refereeId: testRefereeIds[3], role: 'QUATRIEME_ARBITRE' },
          ],
        })
        .expect(404);
    });
  });

  describe('/api/designations/suggestions/:matchId (GET)', () => {
    it('should get referee suggestions for match', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/designations/suggestions/${testMatchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('/api/designations/:id/override (POST)', () => {
    it('should override designation', async () => {
      // Get admin user ID
      const adminUser = await userModel.findOne({ email: 'admin@dna.tn' });
      const adminUserId = adminUser._id.toString();

      const designation = await designationModel.create({
        matchId: testMatchId,
        category: 'A',
        designatedBy: adminUserId,
        referees: [
          { refereeId: testRefereeIds[0], role: 'ARBITRE_CENTRAL', status: 'PROPOSED' },
          { refereeId: testRefereeIds[1], role: 'ASSISTANT_1', status: 'PROPOSED' },
          { refereeId: testRefereeIds[2], role: 'ASSISTANT_2', status: 'PROPOSED' },
          { refereeId: testRefereeIds[3], role: 'QUATRIEME_ARBITRE', status: 'PROPOSED' },
        ],
        status: 'DRAFT',
      });

      const response = await request(app.getHttpServer())
        .post(`/api/designations/${designation._id}/override`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newReferees: [
            { refereeId: testRefereeIds[0], role: 'ARBITRE_CENTRAL' },
            { refereeId: testRefereeIds[1], role: 'ASSISTANT_1' },
            { refereeId: testRefereeIds[2], role: 'ASSISTANT_2' },
            { refereeId: testRefereeIds[3], role: 'QUATRIEME_ARBITRE' },
          ],
          reason: 'Manual override for testing',
        })
        .expect(201);

      expect(response.body.overrideHistory).toBeInstanceOf(Array);
      expect(response.body.overrideHistory.length).toBeGreaterThan(0);
    });
  });

  describe('/api/designations/:id/override-history (GET)', () => {
    it('should get override history', async () => {
      // Get admin user ID
      const adminUser = await userModel.findOne({ email: 'admin@dna.tn' });
      const adminUserId = adminUser._id.toString();

      const designation = await designationModel.create({
        matchId: testMatchId,
        category: 'A',
        designatedBy: adminUserId,
        referees: [
          { refereeId: testRefereeIds[0], role: 'ARBITRE_CENTRAL', status: 'PROPOSED' },
          { refereeId: testRefereeIds[1], role: 'ASSISTANT_1', status: 'PROPOSED' },
          { refereeId: testRefereeIds[2], role: 'ASSISTANT_2', status: 'PROPOSED' },
          { refereeId: testRefereeIds[3], role: 'QUATRIEME_ARBITRE', status: 'PROPOSED' },
        ],
        status: 'DRAFT',
        overrideHistory: [
          {
            timestamp: new Date(),
            performedBy: 'admin123',
            action: 'OVERRIDE',
            reason: 'Test override',
            previousState: {},
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/designations/${designation._id}/override-history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
