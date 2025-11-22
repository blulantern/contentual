import { AIConfig } from '@/types/config';
import { ConsoleAPIClient } from './console-api';
import { ContextAPIClient } from './context-api';

export interface AIRequestOptions {
  cacheKey?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AIService {
  private client: ConsoleAPIClient | ContextAPIClient;

  constructor(private config: AIConfig) {
    this.client =
      config.provider === 'context-api'
        ? new ContextAPIClient(config)
        : new ConsoleAPIClient(config);
  }

  async generateCompletion(
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<{ content: string; usage?: any }> {
    return await this.client.sendRequest(prompt, options);
  }

  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();

    try {
      const response = await this.generateCompletion('Say "Hello" if you can read this.', {
        maxTokens: 100,
      });

      const latency = Date.now() - startTime;

      return {
        success: true,
        message: 'Connection successful!',
        latency,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed',
      };
    }
  }
}
