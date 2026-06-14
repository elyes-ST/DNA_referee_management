import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Referee } from '../src/referees/schemas/referee.schema';
import * as bcrypt from 'bcrypt';

describe('Statistics (e2e)', () => {
  let app: INestApplication;
  let userModel: any;
  let refereeModel: any;
  let adminToken: string;
  let testRefereeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    
    userModel = moduleFixture.get(getModelToken(User.name));
    refereeModel = moduleFixture.get(getModelToken(Referee.name));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await refereeModel.deleteMany({});
    
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

    const user = await userModel.create({
      email: 'referee@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'ARBITRE',
      firstName: 'Test',
      lastName: 'Referee',
    });

    const referee = await refereeModel.create({
      userId: user._id,
      matricule: 'REF001',
      category: 'A',
      region: 'Tunis',
      dateOfBirth: new Date('1990-01-01'),
      cin: '12345678',
    });
    testRefereeId = referee._id.toString();
  });

  describe('/api/statistics/rankings (GET)', () => {
    it('should get rankings for category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/statistics/rankings?category=A')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should fail without category parameter', async () => {
      await request(app.getHttpServer())
        .get('/api/statistics/rankings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('/api/statistics/referee/:id/speed-chart (GET)', () => {
    it('should get speed chart data', async () => {
      await request(app.getHttpServer())
        .get(`/api/statistics/referee/${testRefereeId}/speed-chart`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/api/statistics/referee/:id/comparative-analysis (GET)', () => {
    it('should get comparative analysis', async () => {
      await request(app.getHttpServer())
        .get(`/api/statistics/referee/${testRefereeId}/comparative-analysis`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/api/statistics/referee/:id/progression (GET)', () => {
    it('should get progression data', async () => {
      await request(app.getHttpServer())
        .get(`/api/statistics/referee/${testRefereeId}/progression`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
