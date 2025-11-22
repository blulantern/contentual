export type AIProvider = 'console-api' | 'context-api';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enableCaching: boolean;
  cacheTTL: number;
}

export interface APIConnectionTest {
  success: boolean;
  message: string;
  latency?: number;
  model?: string;
}
