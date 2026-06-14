import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let userModel: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    
    userModel = moduleFixture.get(getModelToken(User.name));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  describe('/api/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        role: 'ADMIN_DNA',
        firstName: 'Test',
        lastName: 'User',
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(typeof response.body.refresh_token).toBe('string');
    });

    it('should fail with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrong',
        })
        .expect(400);
    });

    it('should fail with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);
    });
  });

  describe('/api/auth/forgot-password (POST)', () => {
    it('should accept valid email for password reset', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        role: 'ADMIN_DNA',
        firstName: 'Test',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com',
        })
        .expect(200);
    });

    it('should return success even with non-existent email (security)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // Create test user and login
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        role: 'ADMIN_DNA',
        firstName: 'Test',
        lastName: 'User',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const refreshToken = loginResponse.body.refresh_token;

      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      // Tokens should be valid JWTs
      expect(response.body.access_token).toMatch(/^eyJ/);
      expect(response.body.refresh_token).toMatch(/^eyJ/);
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refresh_token: 'invalid-token',
        })
        .expect(401);
    });
  });

  describe('/api/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      // Create test user and login
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        role: 'ADMIN_DNA',
        firstName: 'Test',
        lastName: 'User',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const accessToken = loginResponse.body.access_token;
      const refreshToken = loginResponse.body.refresh_token;

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('/api/auth/logout-all (POST)', () => {
    it('should logout from all devices successfully', async () => {
      // Create test user and login
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        role: 'ADMIN_DNA',
        firstName: 'Test',
        lastName: 'User',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const accessToken = loginResponse.body.access_token;

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out from all devices successfully');
    });
  });
});
