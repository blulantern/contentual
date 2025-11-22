import Anthropic from '@anthropic-ai/sdk';
import { AIConfig } from '@/types/config';
import { AIRequestOptions } from './ai-service';

export class ConsoleAPIClient {
  private client: Anthropic;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true, // Only for development - in production, use server-side API routes
    });
  }

  async sendRequest(
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<{ content: string; usage?: any }> {
    try {
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        system: options.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      return {
        content: textContent.text,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    } catch (error: any) {
      console.error('API Error:', error);
      throw new Error(
        error.message || 'Failed to communicate with Claude API'
      );
    }
  }
}
