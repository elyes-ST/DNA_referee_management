import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Referee } from '../src/referees/schemas/referee.schema';
import * as bcrypt from 'bcrypt';

describe('Referees (e2e)', () => {
  let app: INestApplication;
  let userModel: any;
  let refereeModel: any;
  let adminToken: string;
  let testUserId: string;

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
    
    // Create admin user
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

    // Create test user for referee
    const testUser = await userModel.create({
      email: 'referee@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'ARBITRE',
      firstName: 'Test',
      lastName: 'Referee',
    });
    testUserId = testUser._id.toString();
  });

  describe('/api/referees (POST)', () => {
    it('should create a new referee profile with auto-created user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/referees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newreferee@example.com',
          password: 'Referee123!',
          firstName: 'New',
          lastName: 'Referee',
          phoneNumber: '12345678',
          matricule: 'REF2024001',
          category: 'A',
          league: 'Ligue 1',
          region: 'Tunis',
          dateOfBirth: '1990-01-01',
          cin: '12345678',
          address: '123 Test Street',
          emergencyContact: {
            name: 'Emergency Contact',
            phone: '87654321',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('matricule', 'REF2024001');
      expect(response.body).toHaveProperty('category', 'A');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.userId).toHaveProperty('email', 'newreferee@example.com');
      expect(response.body.userId).toHaveProperty('role', 'ARBITRE');
      expect(response.body.userId).not.toHaveProperty('password');
    });

    it('should fail with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/referees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'referee@example.com', // Exists from beforeEach
          password: 'Referee123!',
          firstName: 'Duplicate',
          lastName: 'Email',
          matricule: 'REF2024099',
          category: 'A',
          region: 'Tunis',
          dateOfBirth: '1990-01-01',
          cin: '99999999',
        })
        .expect(409);
    });

    it('should fail with duplicate matricule', async () => {
      await refereeModel.create({
        userId: testUserId,
        matricule: 'REF2024001',
        category: 'A',
        region: 'Tunis',
        dateOfBirth: new Date('1990-01-01'),
        cin: '12345678',
      });

      await request(app.getHttpServer())
        .post('/api/referees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'another@example.com',
          password: 'Referee123!',
          firstName: 'Another',
          lastName: 'Referee',
          matricule: 'REF2024001',
          category: 'A',
          region: 'Tunis',
          dateOfBirth: '1990-01-01',
          cin: '87654321',
        })
        .expect(409);
    });

    it('should fail with invalid category', async () => {
      await request(app.getHttpServer())
        .post('/api/referees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid@example.com',
          password: 'Referee123!',
          firstName: 'Invalid',
          lastName: 'Category',
          matricule: 'REF2024002',
          category: 'INVALID',
          region: 'Tunis',
          dateOfBirth: '1990-01-01',
          cin: '12345678',
        })
        .expect(400);
    });
  });

  describe('/api/referees (GET)', () => {
    beforeEach(async () => {
      await refereeModel.create([
        {
          userId: testUserId,
          matricule: 'REF001',
          category: 'A',
          region: 'Tunis',
          dateOfBirth: new Date('1990-01-01'),
          cin: '11111111',
        },
        {
          userId: testUserId,
          matricule: 'REF002',
          category: 'B',
          region: 'Sfax',
          dateOfBirth: new Date('1991-01-01'),
          cin: '22222222',
        },
      ]);
    });

    it('should get all referees', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/referees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/referees?category=A')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].category).toBe('A');
    });

    it('should filter by region', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/referees?region=Tunis')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].region).toBe('Tunis');
    });
  });

  describe('/api/referees/category/:category (GET)', () => {
    beforeEach(async () => {
      await refereeModel.create([
        {
          userId: testUserId,
          matricule: 'REF001',
          category: 'A',
          region: 'Tunis',
          dateOfBirth: new Date('1990-01-01'),
          cin: '11111111',
        },
        {
          userId: testUserId,
          matricule: 'REF002',
          category: 'A',
          region: 'Sfax',
          dateOfBirth: new Date('1991-01-01'),
          cin: '22222222',
        },
      ]);
    });

    it('should get referees by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/referees/category/A')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body.every((r: any) => r.category === 'A')).toBe(true);
    });
  });

  describe('/api/referees/:id (PATCH)', () => {
    it('should update referee', async () => {
      const referee = await refereeModel.create({
        userId: testUserId,
        matricule: 'REF001',
        category: 'A',
        region: 'Tunis',
        dateOfBirth: new Date('1990-01-01'),
        cin: '12345678',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/referees/${referee._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          region: 'Sfax',
        })
        .expect(200);

      expect(response.body.region).toBe('Sfax');
    });
  });
});
