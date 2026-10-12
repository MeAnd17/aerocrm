import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  const prisma = { $queryRaw: jest.fn() };
  let controller: AppController;

  beforeEach(async () => {
    prisma.$queryRaw.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = moduleRef.get(AppController);
  });

  it('responde ok cuando la base responde', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    await expect(controller.health()).resolves.toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('responde 503 cuando la base no responde', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('conexión rechazada'));
    await expect(controller.health()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
