import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContactDto) {
    await this.prisma.contactMessage.create({ data: dto });
    return { message: 'Tu consulta fue enviada correctamente. Te responderemos pronto.' };
  }
}
