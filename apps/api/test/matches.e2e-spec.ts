import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Match } from '../src/matches/schemas/match.schema';
import * as bcrypt from 'bcrypt';

describe('Matches (e2e)', () => {
  let app: INestApplication;
  let userModel: any;
  let matchModel: any;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    
    userModel = moduleFixture.get(getModelToken(User.name));
    matchModel = moduleFixture.get(getModelToken(Match.name));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await matchModel.deleteMany({});
    
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = await userModel.create({
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
    adminUserId = adminUser._id.toString();
  });

  describe('/api/matches (POST)', () => {
    it('should create a new match', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchNumber: 'M001',
          journee: 15,
          saison: '2025-2026',
          homeTeam: 'Espérance ST',
          awayTeam: 'Club Africain',
          date: '2026-02-15T19:00:00Z',
          time: '19:00',
          stadium: 'Stade Olympique',
          competition: 'LIGUE1',
          category: 'A',
        })
        .expect(201);

      expect(response.body).toHaveProperty('homeTeam', 'Espérance ST');
      expect(response.body).toHaveProperty('awayTeam', 'Club Africain');
      expect(response.body).toHaveProperty('competition', 'LIGUE1');
    });

    it('should fail with invalid competition', async () => {
      await request(app.getHttpServer())
        .post('/api/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          date: '2026-02-15T19:00:00Z',
          venue: 'Stadium',
          competition: 'INVALID',
          category: 'A',
        })
        .expect(400);
    });
  });

  describe('/api/matches (GET)', () => {
    beforeEach(async () => {
      await matchModel.create([
        {
          matchNumber: 'M001',
          journee: 1,
          saison: '2025-2026',
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          date: new Date('2026-02-15'),
          time: '19:00',
          stadium: 'Stadium A',
          competition: 'LIGUE1',
          category: 'A',
          status: 'SCHEDULED',
          createdBy: adminUserId,
        },
        {
          matchNumber: 'M002',
          journee: 1,
          saison: '2025-2026',
          homeTeam: 'Team C',
          awayTeam: 'Team D',
          date: new Date('2026-03-15'),
          time: '19:00',
          stadium: 'Stadium B',
          competition: 'LIGUE2',
          category: 'B',
          status: 'SCHEDULED',
          createdBy: adminUserId,
        },
      ]);
    });

    it('should get all matches', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should filter by competition', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/matches?competition=LIGUE1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].competition).toBe('LIGUE1');
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/matches?category=A')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('/api/matches/:id (PATCH)', () => {
    it('should update match', async () => {
      const match = await matchModel.create({
        matchNumber: 'M001',
        journee: 1,
        saison: '2025-2026',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        date: new Date('2026-02-15'),
        time: '19:00',
        stadium: 'Stadium A',
        venue: 'Stadium A',
        competition: 'LIGUE1',
        category: 'A',
        createdBy: adminUserId,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/matches/${match._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stadium: 'New Stadium',
        })
        .expect(200);

      expect(response.body.stadium).toBe('New Stadium');
    });
  });
});
