import Anthropic from '@anthropic-ai/sdk';
import { AIConfig } from '@/types/config';
import { AIRequestOptions } from './ai-service';
import { getCachedContext, CacheKey } from './prompts';

export class ContextAPIClient {
  private client: Anthropic;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true, // Only for development - in production, use server-side API routes
      defaultHeaders: this.config.enableCaching
        ? { 'anthropic-beta': 'prompt-caching-2024-07-31' }
        : {},
    });
  }

  async sendRequest(
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<{ content: string; usage?: any }> {
    try {
      const systemContent: Anthropic.Messages.TextBlockParam[] = [];

      if (options.systemPrompt) {
        systemContent.push({
          type: 'text',
          text: options.systemPrompt,
          cache_control: this.config.enableCaching ? { type: 'ephemeral' } : undefined,
        } as Anthropic.Messages.TextBlockParam);
      }

      const userContent: Anthropic.Messages.ContentBlock[] = [];

      if (options.cacheKey && this.config.enableCaching) {
        const cachedContext = getCachedContext(options.cacheKey as CacheKey);
        if (cachedContext) {
          userContent.push({
            type: 'text',
            text: cachedContext,
            cache_control: { type: 'ephemeral' },
          } as any);
        }
      }

      userContent.push({
        type: 'text',
        text: prompt,
      });

      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        system: systemContent.length > 0 ? (systemContent as any) : undefined,
        messages: [
          {
            role: 'user',
            content: userContent as any,
          },
        ],
      });

      if (this.config.enableCaching && message.usage) {
        console.log('Cache Stats:', {
          inputTokens: message.usage.input_tokens,
          cacheCreation: (message.usage as any).cache_creation_input_tokens || 0,
          cacheRead: (message.usage as any).cache_read_input_tokens || 0,
        });
      }

      const textContent = message.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      return {
        content: textContent.text,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          cacheCreationTokens: (message.usage as any).cache_creation_input_tokens,
          cacheReadTokens: (message.usage as any).cache_read_input_tokens,
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
