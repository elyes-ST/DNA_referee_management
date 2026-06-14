import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let userModel: any;
  let adminToken: string;

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
    
    // Create admin user and get token
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
  });

  describe('/api/users (POST)', () => {
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          role: 'ARBITRE',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '12345678',
        })
        .expect(201);

      expect(response.body).toHaveProperty('email', 'newuser@example.com');
      expect(response.body).toHaveProperty('role', 'ARBITRE');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail with duplicate email', async () => {
      await userModel.create({
        email: 'existing@example.com',
        password: await bcrypt.hash('Password123!', 10),
        role: 'ARBITRE',
        firstName: 'Existing',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          role: 'ARBITRE',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(409);
    });

    it('should fail with invalid role', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          role: 'INVALID_ROLE',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          role: 'ARBITRE',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(401);
    });
  });

  describe('/api/users (GET)', () => {
    it('should get all users', async () => {
      await userModel.create({
        email: 'user1@example.com',
        password: await bcrypt.hash('Password123!', 10),
        role: 'ARBITRE',
        firstName: 'User',
        lastName: 'One',
      });

      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .expect(401);
    });
  });

  describe('/api/users/:id (PATCH)', () => {
    it('should update user', async () => {
      const user = await userModel.create({
        email: 'updateme@example.com',
        password: await bcrypt.hash('Password123!', 10),
        role: 'ARBITRE',
        firstName: 'Update',
        lastName: 'Me',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
        })
        .expect(200);

      expect(response.body.firstName).toBe('Updated');
    });
  });

  describe('/api/users/:id/toggle-status (PATCH)', () => {
    it('should toggle user status', async () => {
      const user = await userModel.create({
        email: 'toggle@example.com',
        password: await bcrypt.hash('Password123!', 10),
        role: 'ARBITRE',
        firstName: 'Toggle',
        lastName: 'User',
        isActive: true,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/users/${user._id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });
  });
});
