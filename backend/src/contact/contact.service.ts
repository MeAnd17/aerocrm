import { Injectable } from '@nestjs/common';
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

  async findAll(query: { page?: number; limit?: number }) {
    /** Devuelve todos los mensajes paginados; solo accesible para administradores. */
    const { page = 1, limit = 20 } = query;
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
