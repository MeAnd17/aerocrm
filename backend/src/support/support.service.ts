import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SupportChannel, TicketPriority, TicketStatus } from '@prisma/client';

const SIMULATED_SCENARIOS = [
  { subject: 'Equipaje perdido - vuelo AE-1010', channel: SupportChannel.EMAIL, priority: TicketPriority.URGENT, msg: 'Mi maleta no llegó con el vuelo AE-1010. Contiene medicamentos esenciales y documentos importantes. Necesito localización urgente.' },
  { subject: 'Solicitud upgrade Business Class', channel: SupportChannel.WEB, priority: TicketPriority.LOW, msg: 'Soy cliente Gold y me gustaría saber el costo de upgrade para mi próximo vuelo a Dubai. ¿Hay disponibilidad?' },
  { subject: 'Retraso vuelo AE-1002 - compensación EU261', channel: SupportChannel.TWITTER, priority: TicketPriority.HIGH, msg: 'El vuelo AE-1002 lleva 3 horas de retraso. Exijo compensación según normativa EC 261/2004. Tengo conexión que perdí.' },
  { subject: 'Error en menú especial no entregado', channel: SupportChannel.EMAIL, priority: TicketPriority.MEDIUM, msg: 'Pedí menú vegetariano con anticipación y no me lo sirvieron en el vuelo. Es inaceptable. Solicito compensación.' },
  { subject: 'Cobro incorrecto en mi tarjeta', channel: SupportChannel.PHONE, priority: TicketPriority.URGENT, msg: 'Me cobraron dos veces la misma reserva. El importe duplicado es de $1,850. Necesito reembolso inmediato.' },
  { subject: 'Asistencia especial para adulto mayor', channel: SupportChannel.WEB, priority: TicketPriority.HIGH, msg: 'Mi padre de 82 años viaja solo el próximo lunes. Necesito confirmar que habrá asistencia en silla de ruedas en ambos aeropuertos.' },
  { subject: 'Nombre mal escrito en billete', channel: SupportChannel.EMAIL, priority: TicketPriority.URGENT, msg: 'Mi nombre aparece como "GARCIA" cuando el correcto es "GARCÍA". El vuelo es mañana. ¿Pueden corregirlo urgentemente?' },
  { subject: 'Wifi no funcionó durante todo el vuelo', channel: SupportChannel.WEB, priority: TicketPriority.LOW, msg: 'Pagué $29 por wifi a bordo y no funcionó en ningún momento del vuelo. Solicito reembolso completo.' },
  { subject: 'Vuelo cancelado sin aviso previo', channel: SupportChannel.TWITTER, priority: TicketPriority.URGENT, msg: 'Me acabo de enterar que mi vuelo AE-1006 fue cancelado. Nadie me notificó. ¿Qué alternativas tienen? ¡Tengo reunión importante!' },
  { subject: 'Solicitud factura para empresa', channel: SupportChannel.EMAIL, priority: TicketPriority.MEDIUM, msg: 'Necesito factura con datos fiscales para el viaje del 15 de julio. NIF: B98765432. Por favor envíen a finanzas@empresa.com' },
  { subject: 'Mascotas en cabina - información', channel: SupportChannel.WEB, priority: TicketPriority.LOW, msg: 'Tengo un beagle de 8kg. ¿Puedo llevarlo en cabina o debe ir en bodega? ¿Qué documentación necesito?' },
  { subject: 'Niño viajando solo - menores no acompañados', channel: SupportChannel.PHONE, priority: TicketPriority.HIGH, msg: 'Mi hija de 10 años va a volar sola por primera vez. ¿Qué protocolo siguen? ¿Hay servicio de acompañante?' },
  { subject: 'Puntos de millas no acreditados', channel: SupportChannel.WEB, priority: TicketPriority.MEDIUM, msg: 'Viajé hace 3 semanas y aún no veo mis millas acreditadas. Número de vuelo AE-1014. Soy miembro Gold desde hace 5 años.' },
  { subject: 'Problema al hacer check-in online', channel: SupportChannel.EMAIL, priority: TicketPriority.HIGH, msg: 'No puedo completar el check-in online. Me dice "datos no válidos" aunque todo es correcto. El vuelo es en 20 horas.' },
  { subject: 'Experiencia excelente en vuelo', channel: SupportChannel.WEB, priority: TicketPriority.LOW, msg: 'Quiero felicitar al equipo del vuelo AE-1007. La tripulación fue excepcional, especialmente la atención personalizada en Business Class.' },
];

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 20, status, priority, channel, assignedToId, search } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (channel) where.channel = channel;
    if (assignedToId) where.assignedToId = Number(assignedToId);
    if (search) where.OR = [{ subject: { contains: search } }, { ticketNumber: { contains: search } }];

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where, skip, take: Number(limit),
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          passenger: { select: { id: true, firstName: true, lastName: true, email: true, tier: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: number) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        passenger: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' }, include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!ticket) throw new NotFoundException(`Ticket #${id} not found`);
    return ticket;
  }

  async getStats() {
    const [open, inProgress, urgent, byChannel, byStatus] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { priority: TicketPriority.URGENT, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.supportTicket.groupBy({ by: ['channel'], _count: { id: true } }),
      this.prisma.supportTicket.groupBy({ by: ['status'], _count: { id: true } }),
    ]);
    return { open, inProgress, urgent, byChannel, byStatus };
  }

  async create(dto: CreateTicketDto) {
    const num = `TKT-${Date.now().toString().slice(-5)}`;
    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber: num,
        passengerId: dto.passengerId,
        subject: dto.subject,
        channel: dto.channel,
        priority: dto.priority || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
      },
    });

    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorType: 'passenger',
        authorName: 'Passenger',
        content: dto.initialMessage,
        channel: dto.channel,
        isInternal: false,
      },
    });

    return this.findOne(ticket.id);
  }

  async updateStatus(id: number, status: TicketStatus) {
    await this.findOne(id);
    const data: any = { status };
    if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) data.resolvedAt = new Date();
    return this.prisma.supportTicket.update({ where: { id }, data });
  }

  async updatePriority(id: number, priority: TicketPriority) {
    await this.findOne(id);
    return this.prisma.supportTicket.update({ where: { id }, data: { priority } });
  }

  async assign(id: number, userId: number) {
    await this.findOne(id);
    return this.prisma.supportTicket.update({
      where: { id },
      data: { assignedToId: userId, status: TicketStatus.IN_PROGRESS },
    });
  }

  async sendMessage(ticketId: number, dto: SendMessageDto, userId: number) {
    await this.findOne(ticketId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    return this.prisma.ticketMessage.create({
      data: {
        ticketId,
        userId,
        authorType: 'operator',
        authorName: user ? `${user.firstName} ${user.lastName}` : 'Operator',
        content: dto.content,
        isInternal: dto.isInternal || false,
      },
    });
  }

  async simulate() {
    const scenario = SIMULATED_SCENARIOS[Math.floor(Math.random() * SIMULATED_SCENARIOS.length)];
    const passengers = await this.prisma.passenger.findMany({ take: 20 });
    const passenger = passengers[Math.floor(Math.random() * passengers.length)];

    const num = `TKT-${Date.now().toString().slice(-5)}`;
    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber: num,
        passengerId: passenger?.id,
        subject: scenario.subject,
        channel: scenario.channel,
        priority: scenario.priority,
        status: TicketStatus.OPEN,
        sentimentLabel: scenario.priority === TicketPriority.URGENT ? 'urgent' : scenario.priority === TicketPriority.HIGH ? 'negative' : 'neutral',
        sentimentScore: scenario.priority === TicketPriority.URGENT ? -0.9 : scenario.priority === TicketPriority.HIGH ? -0.6 : 0.1,
      },
    });

    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorType: 'passenger',
        authorName: passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Anonymous',
        content: scenario.msg,
        channel: scenario.channel,
        isInternal: false,
      },
    });

    return this.findOne(ticket.id);
  }
}
