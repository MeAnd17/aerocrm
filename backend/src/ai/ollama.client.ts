import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);

  constructor(private http: HttpService, private config: ConfigService) {}

  get baseUrl() { return this.config.get('OLLAMA_URL', 'http://ollama:11434'); }
  get model() { return this.config.get('OLLAMA_MODEL', 'llama3'); }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/api/generate`, {
          model: this.model,
          prompt,
          stream: false,
          options: { temperature: 0.3, top_p: 0.9, num_predict: 1024 },
        }, { timeout: 60000 })
      );
      return response.data.response;
    } catch (err) {
      this.logger.error(`Ollama error: ${err.message}`);
      throw new ServiceUnavailableException('AI service is currently unavailable. Please try again later.');
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get(`${this.baseUrl}/api/tags`, { timeout: 5000 }));
      return true;
    } catch {
      return false;
    }
  }
}
