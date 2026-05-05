import { AIConfig } from '@/types/config';
import { ConsoleAPIClient } from './console-api';
import { ContextAPIClient } from './context-api';
import { getFixtureMode, hashRequest } from './fixture-mode';
import { getFixture, saveFixture } from './fixture-store';

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
    const mode = getFixtureMode();

    if (mode === 'off') {
      return await this.client.sendRequest(prompt, options);
    }

    const hash = await hashRequest(
      prompt,
      options.systemPrompt,
      options.cacheKey,
      this.config.model
    );
    const label = options.cacheKey ?? 'unkeyed';

    if (mode === 'replay') {
      const fixture = await getFixture(hash);
      if (fixture) {
        console.log(`[fixture] replay hit: ${label} (${hash})`);
        return fixture.response;
      }
      throw new Error(
        `[fixture] No fixture for ${label} (hash: ${hash}). ` +
          `Set NEXT_PUBLIC_AI_FIXTURE_MODE=record and re-run to capture it.`
      );
    }

    // record mode: hit the real API and persist the response
    const response = await this.client.sendRequest(prompt, options);
    await saveFixture(hash, {
      cacheKey: options.cacheKey,
      prompt,
      response,
      recordedAt: new Date().toISOString(),
    });
    console.log(`[fixture] recorded: ${label} (${hash})`);
    return response;
  }

  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();

    try {
      // Always hit the real API — fixture mode would defeat the purpose.
      const response = await this.client.sendRequest('Say "Hello" if you can read this.', {
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
