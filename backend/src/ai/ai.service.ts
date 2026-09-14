import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaClient } from './ollama.client';
import { PromptBuilderService } from './prompt-builder.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private analysisTimestamps = new Map<number, number>();

  constructor(
    private prisma: PrismaService,
    private ollama: OllamaClient,
    private promptBuilder: PromptBuilderService,
  ) {}

  async analyzeTicket(ticketId: number) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException(`Ticket #${ticketId} not found`);

    // Rate limiting: 30 seconds between analyses for same ticket
    const lastAnalysis = this.analysisTimestamps.get(ticketId);
    if (lastAnalysis && Date.now() - lastAnalysis < 30000) {
      const existing = await this.prisma.aIAnalysis.findFirst({
        where: { ticketId },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) return existing;
    }

    const { prompt, context } = await this.promptBuilder.buildTicketAnalysisPrompt(ticketId);

    let rawResponse: string;
    let parsed: any;

    try {
      rawResponse = await this.ollama.generate(prompt);
      // Extract JSON from response (handle cases where model adds extra text)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      this.logger.error(`Failed to parse Ollama response: ${err.message}`);
      // Fallback response when AI is unavailable or fails to parse
      parsed = {
        sentimentLabel: 'neutral',
        sentimentScore: 0.0,
        summary: 'AI analysis could not be completed at this time. Please review the ticket manually.',
        suggestedReply: 'Estimado/a pasajero/a, hemos recibido su consulta y un agente especializado la atenderá a la brevedad posible. Lamentamos los inconvenientes ocasionados.',
        crossSellRecommendations: [],
      };
    }

    // Validate sentiment score range
    const score = Math.max(-1.0, Math.min(1.0, Number(parsed.sentimentScore) || 0));

    const analysis = await this.prisma.aIAnalysis.create({
      data: {
        ticketId,
        sentimentLabel: parsed.sentimentLabel || 'neutral',
        sentimentScore: score,
        summary: parsed.summary || '',
        suggestedReply: parsed.suggestedReply || '',
        crossSellRecs: JSON.stringify(parsed.crossSellRecommendations || []),
        modelUsed: this.ollama.model,
        promptContext: JSON.stringify(context),
      },
    });

    // Update ticket sentiment
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { sentimentLabel: parsed.sentimentLabel, sentimentScore: score },
    });

    this.analysisTimestamps.set(ticketId, Date.now());
    return { ...analysis, crossSellRecs: JSON.parse(analysis.crossSellRecs) };
  }

  async getLatestAnalysis(ticketId: number) {
    const analysis = await this.prisma.aIAnalysis.findFirst({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    });
    if (!analysis) return null;
    return { ...analysis, crossSellRecs: JSON.parse(analysis.crossSellRecs) };
  }

  async checkHealth() {
    const available = await this.ollama.isAvailable();
    return { available, model: this.ollama.model, url: this.ollama.baseUrl };
  }
}
