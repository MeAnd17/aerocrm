import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcryptjs from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { configureApp } from '../src/app.setup';

// Las pruebas e2e nunca tocan la base compartida: PrismaService se reemplaza por un doble.
const prismaFalso = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
  user: {
    findUnique: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  },
};

describe('API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-solo-para-pruebas';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaFalso)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health responde 200', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('responde los errores de validación en español', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'no-es-correo', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toEqual(expect.arrayContaining(['Ingresa un correo electrónico válido', 'Ingresa tu contraseña']));
  });

  it('rechaza campos no permitidos con mensaje en español', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'a@b.pe', password: 'x', rol: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('El campo rol no está permitido');
  });

  it('responde en español a una ruta que no existe y a una sesión ausente', async () => {
    const notFound = await request(app.getHttpServer()).get('/api/no-existe');
    expect(notFound.status).toBe(404);
    expect(notFound.body.message).toBe('No encontramos lo que buscas');

    const noSession = await request(app.getHttpServer()).get('/api/loyalty/status');
    expect(noSession.status).toBe(401);
    expect(noSession.body.message).toBe('Tu sesión no es válida o expiró. Inicia sesión de nuevo');
  });

  it('POST /api/bookings/quote rechaza la petición si falta el vuelo de regreso', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/bookings/quote')
      .send({ flightId: 1, passengers: 2 });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/auth/change-password responde 400 con contraseña actual incorrecta', async () => {
    const hashCorrecto = await bcryptjs.hash('Correcta1', 10);
    const usuarioFalso = { id: 99, email: 'usuario@test.pe', password: hashCorrecto, isActive: true, role: 'CLIENT', client: null };
    // JwtStrategy.validate llama findUnique primero; luego AuthService.changePassword lo llama una segunda vez.
    prismaFalso.user.findUnique
      .mockResolvedValueOnce(usuarioFalso)
      .mockResolvedValueOnce(usuarioFalso);
    const token = jwtService.sign({ sub: 99, email: 'usuario@test.pe', clientId: null, role: 'CLIENT' });

    const res = await request(app.getHttpServer())
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Incorrecta1', newPassword: 'NuevaContraseña2' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('La contraseña actual no es correcta');
  });

  it('PATCH /api/auth/change-password responde 200 con credenciales correctas', async () => {
    const hashCorrecto = await bcryptjs.hash('Correcta1', 10);
    const usuarioFalso = { id: 99, email: 'usuario@test.pe', password: hashCorrecto, isActive: true, role: 'CLIENT', client: null };
    // JwtStrategy.validate llama findUnique primero; luego AuthService.changePassword lo llama una segunda vez.
    prismaFalso.user.findUnique
      .mockResolvedValueOnce(usuarioFalso)
      .mockResolvedValueOnce(usuarioFalso);
    const token = jwtService.sign({ sub: 99, email: 'usuario@test.pe', clientId: null, role: 'CLIENT' });

    const res = await request(app.getHttpServer())
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Correcta1', newPassword: 'NuevaContraseña2' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Contraseña actualizada');
  });
});
