import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromptBuilderService {
  constructor(private prisma: PrismaService) {}

  async buildTicketAnalysisPrompt(ticketId: number): Promise<{ prompt: string; context: any }> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        passenger: {
          include: {
            reservations: {
              where: { status: { notIn: ['CANCELLED'] } },
              include: {
                flight: { include: { route: { include: { origin: true, destination: true } } } },
                ancillaries: { where: { status: 'ACTIVE' } },
              },
              take: 3,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        messages: { orderBy: { createdAt: 'asc' }, take: 10 },
      },
    });

    if (!ticket) throw new Error(`Ticket #${ticketId} not found`);

    const passenger = ticket.passenger;
    const messages = ticket.messages.filter(m => !m.isInternal);
    const latestMessage = messages[messages.length - 1]?.content || '';
    const conversation = messages.map(m => `[${m.authorType.toUpperCase()}]: ${m.content}`).join('\n');

    const ancillaries = passenger?.reservations.flatMap(r => r.ancillaries).map(a => a.type).join(', ') || 'None';
    const latestFlight = passenger?.reservations[0]?.flight;
    const flightInfo = latestFlight
      ? `${(latestFlight as any).flightNumber} (${(latestFlight.route as any)?.origin?.iataCode} → ${(latestFlight.route as any)?.destination?.iataCode}) - Status: ${latestFlight.status}`
      : 'No active flight';

    const tierDescriptions: Record<string, string> = {
      STANDARD: 'Standard member — basic benefits',
      SILVER: 'Silver member — priority check-in, extra baggage allowance',
      GOLD: 'Gold member — lounge access, upgrade priority, dedicated support line',
      PLATINUM: 'Platinum member — all benefits, personal concierge, guaranteed upgrades',
    };

    const context = {
      ticketId,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      channel: ticket.channel,
      priority: ticket.priority,
      passenger: passenger ? {
        name: `${passenger.firstName} ${passenger.lastName}`,
        tier: passenger.tier,
        nationality: passenger.nationality,
        totalReservations: passenger.reservations.length,
        activeAncillaries: ancillaries,
      } : null,
      flightInfo,
      messageCount: messages.length,
    };

    const prompt = `You are an expert customer support AI assistant for AeroCRM, a premium international airline.
Respond ONLY with a valid JSON object. No additional text before or after.

PASSENGER CONTEXT:
- Name: ${passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Unknown'}
- Tier: ${passenger?.tier || 'STANDARD'} (${tierDescriptions[passenger?.tier || 'STANDARD']})
- Active flight: ${flightInfo}
- Contracted services: ${ancillaries}

SUPPORT TICKET:
- Number: ${ticket.ticketNumber}
- Channel: ${ticket.channel}
- Priority: ${ticket.priority}
- Subject: ${ticket.subject}
- Conversation:
${conversation}

TASK: Analyze this support ticket and respond with exactly this JSON structure:
{
  "sentimentLabel": "positive|neutral|negative|urgent",
  "sentimentScore": <number between -1.0 and 1.0>,
  "summary": "<2-3 sentence summary of the issue and passenger situation>",
  "suggestedReply": "<professional, empathetic reply in the same language as the passenger message, 3-5 sentences>",
  "crossSellRecommendations": [
    {"type": "<ANCILLARY_TYPE>", "reason": "<brief reason why relevant>"}
  ]
}

Available ancillary types: EXTRA_BAGGAGE, PREFERRED_SEAT, LOUNGE_ACCESS, TRAVEL_INSURANCE, GOURMET_PACKAGE, PRIORITY_BOARDING, CAR_RENTAL, HOTEL_PACKAGE
Include 1-3 relevant cross-sell recommendations only if contextually appropriate. Empty array if not relevant.`;

    return { prompt, context };
  }
}
