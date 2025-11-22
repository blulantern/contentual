import { AIConfig } from '@/types/config';

const STORAGE_KEY = 'contentual_ai_config';

const getEnvApiKey = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';
  }
  return '';
};

const DEFAULT_CONFIG: AIConfig = {
  provider: 'context-api',
  apiKey: '',
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  temperature: 1.0,
  enableCaching: true,
  cacheTTL: 300,
};

export class ConfigManager {
  private config: AIConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig(): AIConfig {
    if (typeof window === 'undefined') return { ...DEFAULT_CONFIG };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const envApiKey = getEnvApiKey();

      if (!stored) {
        // No stored config, use defaults with env API key if available
        return { ...DEFAULT_CONFIG, apiKey: envApiKey };
      }

      const parsedConfig = JSON.parse(stored);

      // If stored config has no API key but env has one, use env key
      if (!parsedConfig.apiKey && envApiKey) {
        parsedConfig.apiKey = envApiKey;
      }

      return { ...DEFAULT_CONFIG, ...parsedConfig };
    } catch {
      return { ...DEFAULT_CONFIG, apiKey: getEnvApiKey() };
    }
  }

  saveConfig(newConfig: Partial<AIConfig>): AIConfig {
    this.config = { ...this.config, ...newConfig };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    }

    return this.config;
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  reset(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.config = { ...DEFAULT_CONFIG };
  }
}

export const configManager = new ConfigManager();
