import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContactDto) {
    /** Guarda el mensaje y devuelve una confirmación para el usuario. */
    await this.prisma.contactMessage.create({ data: dto });
    return { message: 'Tu consulta fue enviada correctamente. Te responderemos pronto.' };
  }

  async findMine(userEmail: string) {
    /** Devuelve todos los mensajes enviados por el correo del usuario autenticado. */
    return this.prisma.contactMessage.findMany({
      where: { email: userEmail },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(query: { status?: ContactStatus; page?: number; limit?: number }) {
    /** Devuelve todos los mensajes paginados con filtro opcional por estado; solo para administradores. */
    const { status, page = 1, limit = 20 } = query;
    const where = status ? { status } : {};

    const [messages, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return { messages, total, page, limit };
  }

  async markAttended(id: number, note?: string) {
    /** Marca una consulta como atendida y guarda la nota interna opcional. */
    const msg = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException('Consulta no encontrada');

    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        status: ContactStatus.ATENDIDA,
        attendedAt: new Date(),
        internalNote: note,
      },
    });
  }
}
