import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir les fichiers statiques (uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Cookie parser for HttpOnly refresh tokens
  app.use(cookieParser());

  // Enable CORS with credentials for cookies
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.PRODUCTION_URL,
  ].filter(Boolean); // Remove undefined values

 app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });


  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('DNA Referee Management API')
    .setDescription(
      'Comprehensive API for managing referees, matches, payments, designations, notifications, and more. Includes real-time notifications via WebSocket and WhatsApp integration.',
    )
    .setVersion('2.1')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and password management')
    .addTag('Users', 'User management endpoints')
    .addTag('Referees', 'Referee management and statistics')
    .addTag('Inspectors', 'Inspector management')
    .addTag('CRA Presidents', 'CRA President management')
    .addTag('Matches', 'Match management and calendar')
    .addTag('Convocations', 'Convocation management and notifications')
    .addTag('Payments', 'Payment generation, validation, and tracking')
    .addTag('Payment Rates', 'Payment rate configuration')
    .addTag('Match Payments', 'Individual match payment records')
    .addTag('Designations', 'Referee designation and assignment')
    .addTag('Availability', 'Referee availability management')
    .addTag('Commissioner Reports', 'Performance reports and evaluations')
    .addTag(
      'Training Resources',
      'Video and document resources for referee training',
    )
    .addTag(
      'Statistics',
      'Advanced analytics, rankings, and performance metrics',
    )
    .addTag(
      'Inspector Reports',
      'Inspector evaluation reports separate from commissioner reports',
    )
    .addTag(
      'Notifications',
      'Real-time notifications via WebSocket and WhatsApp (GREEN-API)',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3300;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
void bootstrap();
