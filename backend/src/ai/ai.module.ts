import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OllamaClient } from './ollama.client';
import { PromptBuilderService } from './prompt-builder.service';

@Module({
  imports: [HttpModule],
  controllers: [AiController],
  providers: [AiService, OllamaClient, PromptBuilderService],
  exports: [AiService],
})
export class AiModule {}
