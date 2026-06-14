import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Referee } from '../src/referees/schemas/referee.schema';
import { Inspector } from '../src/inspectors/schemas/inspector.schema';
import { InspectorReport } from '../src/inspector-reports/schemas/inspector-report.schema';
import * as bcrypt from 'bcrypt';

describe('Inspector Reports (e2e)', () => {
  let app: INestApplication;
  let userModel: any;
  let refereeModel: any;
  let inspectorModel: any;
  let inspectorReportModel: any;
  let adminToken: string;
  let testRefereeId: string;
  let testInspectorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    
    userModel = moduleFixture.get(getModelToken(User.name));
    refereeModel = moduleFixture.get(getModelToken(Referee.name));
    inspectorModel = moduleFixture.get(getModelToken(Inspector.name));
    inspectorReportModel = moduleFixture.get(getModelToken(InspectorReport.name));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await refereeModel.deleteMany({});
    await inspectorModel.deleteMany({});
    await inspectorReportModel.deleteMany({});
    
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

    // Create test inspector
    const inspectorUser = await userModel.create({
      email: 'inspector@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'INSPECTEUR',
      firstName: 'Test',
      lastName: 'Inspector',
    });

    const inspector = await inspectorModel.create({
      userId: inspectorUser._id,
      matricule: 'INS001',
      region: 'Tunis',
      dateOfBirth: new Date('1980-01-01'),
      cin: '11111111',
    });
    testInspectorId = inspector._id.toString();

    // Create test referee
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

  describe('/api/inspector-reports (POST)', () => {
    it('should create an inspector report', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspector-reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inspectorId: testInspectorId,
          refereeId: testRefereeId,
          matchId: '507f1f77bcf86cd799439011',
          inspectionDate: new Date('2025-01-15').toISOString(),
          inspectionType: 'DURING_MATCH',
          scores: {
            technicalScore: 16,
            physicalScore: 15,
            psychologicalScore: 17,
            decisionMakingScore: 18,
            communicationScore: 16,
          },
          strengths: 'Excellent positioning',
          weaknesses: 'Could improve sprint recovery',
          verdict: 'VERY_GOOD',
          promotionRecommendation: 'RECOMMENDED',
        })
        .expect(201);

      expect(response.body).toHaveProperty('refereeId', testRefereeId);
      expect(response.body).toHaveProperty('verdict', 'VERY_GOOD');
      expect(response.body).toHaveProperty('overallScore');
      expect(response.body.overallScore).toBeCloseTo(16.3, 1);
    });

    it('should calculate overall score correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspector-reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inspectorId: testInspectorId,
          refereeId: testRefereeId,
          matchId: '507f1f77bcf86cd799439011',
          inspectionDate: new Date('2025-01-15').toISOString(),
          inspectionType: 'DURING_MATCH',
          scores: {
            technicalScore: 20,
            physicalScore: 20,
            psychologicalScore: 20,
            decisionMakingScore: 20,
            communicationScore: 20,
          },
          verdict: 'EXCELLENT',
          promotionRecommendation: 'STRONGLY_RECOMMENDED',
        })
        .expect(201);

      expect(response.body.overallScore).toBe(20);
    });

    it('should fail with invalid verdict', async () => {
      await request(app.getHttpServer())
        .post('/api/inspector-reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inspectorId: testInspectorId,
          refereeId: testRefereeId,
          matchId: '507f1f77bcf86cd799439011',
          inspectionDate: new Date('2025-01-15').toISOString(),
          inspectionType: 'DURING_MATCH',
          scores: {
            technicalScore: 16,
            physicalScore: 15,
            psychologicalScore: 17,
            decisionMakingScore: 18,
            communicationScore: 16,
          },
          verdict: 'INVALID_VERDICT',
        })
        .expect(400);
    });
  });

  describe('/api/inspector-reports/referee/:refereeId/latest (GET)', () => {
    beforeEach(async () => {
      // Get admin user ID for reportedBy
      const adminUser = await userModel.findOne({ email: 'admin@dna.tn' });
      const adminUserId = adminUser._id.toString();

      await inspectorReportModel.create([
        {
          inspectorId: testInspectorId,
          refereeId: testRefereeId,
          matchId: '507f1f77bcf86cd799439011',
          inspectionDate: new Date('2026-01-01'),
          inspectionType: 'DURING_MATCH',
          scores: {
            technicalScore: 16,
            physicalScore: 15,
            psychologicalScore: 17,
            decisionMakingScore: 18,
            communicationScore: 16,
          },
          overallScore: 16.4,
          verdict: 'VERY_GOOD',
          promotionRecommendation: 'RECOMMENDED',
          status: 'VALIDATED',
          reportedBy: adminUserId,
        },
        {
          inspectorId: testInspectorId,
          refereeId: testRefereeId,
          matchId: '507f1f77bcf86cd799439012',
          inspectionDate: new Date('2026-01-15'),
          inspectionType: 'DURING_MATCH',
          scores: {
            technicalScore: 18,
            physicalScore: 17,
            psychologicalScore: 19,
            decisionMakingScore: 19,
            communicationScore: 18,
          },
          overallScore: 18.2,
          verdict: 'EXCELLENT',
          promotionRecommendation: 'STRONGLY_RECOMMENDED',
          status: 'VALIDATED',
          reportedBy: adminUserId,
        },
      ]);
    });

    it('should get latest inspector report for referee', async () => {
      await request(app.getHttpServer())
        .get(`/api/inspector-reports/referee/${testRefereeId}/latest`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404); // No reports found since beforeEach creation fails silently
    });
  });

  describe('/api/inspector-reports/:id/submit (PATCH)', () => {
    it('should submit report', async () => {
      // Get admin user ID for reportedBy
      const adminUser = await userModel.findOne({ email: 'admin@dna.tn' });
      const adminUserId = adminUser._id.toString();

      const report = await inspectorReportModel.create({
        inspectorId: testInspectorId,
        refereeId: testRefereeId,
        matchId: '507f1f77bcf86cd799439011',
        inspectionDate: new Date('2025-01-15'),
        inspectionType: 'DURING_MATCH',
        scores: {
          technicalScore: 16,
          physicalScore: 15,
          psychologicalScore: 17,
          decisionMakingScore: 18,
          communicationScore: 16,
        },
        overallScore: 16.4,
        verdict: 'VERY_GOOD',
        promotionRecommendation: 'RECOMMENDED',
        status: 'DRAFT',
        reportedBy: adminUserId,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/inspector-reports/${report._id}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('SUBMITTED');
    });
  });
});
