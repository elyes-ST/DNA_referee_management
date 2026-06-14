import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { TrainingResource } from '../src/training-resources/schemas/training-resource.schema';
import * as bcrypt from 'bcrypt';

describe('Training Resources (e2e)', () => {
  let app: INestApplication;
  let userModel: any;
  let trainingResourceModel: any;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    
    userModel = moduleFixture.get(getModelToken(User.name));
    trainingResourceModel = moduleFixture.get(getModelToken(TrainingResource.name));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await trainingResourceModel.deleteMany({});
    
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

  describe('/api/training-resources (POST)', () => {
    it('should create a training resource', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/training-resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Introduction aux Lois du Jeu',
          description: 'Vidéo sur les règles de base',
          type: 'VIDEO',
          categories: ['RULES'],
          url: 'https://example.com/video.mp4',
          duration: 45,
        })
        .expect(201);

      expect(response.body).toHaveProperty('title', 'Introduction aux Lois du Jeu');
      expect(response.body).toHaveProperty('type', 'VIDEO');
      expect(response.body.categories).toContain('RULES');
    });

    it('should fail with invalid type', async () => {
      await request(app.getHttpServer())
        .post('/api/training-resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Resource',
          description: 'Test description',
          type: 'INVALID_TYPE',
          categories: ['RULES'],
          url: 'https://example.com/video.mp4',
        })
        .expect(400);
    });
  });

  describe('/api/training-resources (GET)', () => {
    beforeEach(async () => {
      await trainingResourceModel.create([
        {
          title: 'Video 1',
          description: 'Description 1',
          type: 'VIDEO',
          categories: ['RULES'],
          url: 'https://example.com/video1.mp4',
        },
        {
          title: 'Document 1',
          description: 'Description 2',
          type: 'DOCUMENT',
          categories: ['POSITIONING'],
          url: 'https://example.com/doc1.pdf',
        },
      ]);
    });

    it('should get all training resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/training-resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/training-resources?type=VIDEO')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].type).toBe('VIDEO');
    });
  });

  describe('/api/training-resources/:id/view (POST)', () => {
    it('should track video view', async () => {
      const resource = await trainingResourceModel.create({
        title: 'Test Video',
        description: 'Test',
        type: 'VIDEO',
        categories: ['RULES'],
        url: 'https://example.com/video.mp4',
        viewsCount: 0,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/training-resources/${resource._id}/view`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.viewsCount).toBe(1);
    });
  });

  describe('/api/training-resources/:id/rate (POST)', () => {
    it('should rate a resource', async () => {
      const resource = await trainingResourceModel.create({
        title: 'Test Video',
        description: 'Test',
        type: 'VIDEO',
        categories: ['RULES'],
        url: 'https://example.com/video.mp4',
      });

      const response = await request(app.getHttpServer())
        .post(`/api/training-resources/${resource._id}/rate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rating: 5,
        })
        .expect(201);

      expect(response.body.ratings).toBeInstanceOf(Array);
    });

    it('should fail with invalid rating', async () => {
      const resource = await trainingResourceModel.create({
        title: 'Test Video',
        description: 'Test',
        type: 'VIDEO',
        categories: ['RULES'],
        url: 'https://example.com/video.mp4',
      });

      await request(app.getHttpServer())
        .post(`/api/training-resources/${resource._id}/rate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rating: 10, // Invalid (max is 5)
        })
        .expect(400);
    });
  });
});
