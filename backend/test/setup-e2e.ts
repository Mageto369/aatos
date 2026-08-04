import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

let app: INestApplication;
let dataSource: DataSource;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  dataSource = app.get(DataSource);

  (global as any).app = app;
  (global as any).request = request;
  (global as any).dataSource = dataSource;
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await dataSource.dropDatabase();
  await dataSource.synchronize();
});
