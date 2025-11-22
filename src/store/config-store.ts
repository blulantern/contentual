import { create } from 'zustand';
import { AIConfig, APIConnectionTest } from '@/types/config';
import { configManager } from '@/lib/config/config-manager';
import { AIService } from '@/lib/ai/ai-service';

interface ConfigState {
  config: AIConfig;
  isConfigured: boolean;
  isTesting: boolean;
  testResult: APIConnectionTest | null;
  updateConfig: (newConfig: Partial<AIConfig>) => void;
  testConnection: () => Promise<void>;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: configManager.getConfig(),
  isConfigured: configManager.isConfigured(),
  isTesting: false,
  testResult: null,

  updateConfig: (newConfig) => {
    const updated = configManager.saveConfig(newConfig);
    set({
      config: updated,
      isConfigured: configManager.isConfigured(),
    });
  },

  testConnection: async () => {
    set({ isTesting: true, testResult: null });

    try {
      const { config } = get();
      const aiService = new AIService(config);
      const result = await aiService.testConnection();
      set({ testResult: result, isTesting: false });
    } catch (error) {
      set({
        testResult: { success: false, message: 'Connection failed' },
        isTesting: false,
      });
    }
  },

  resetConfig: () => {
    configManager.reset();
    set({
      config: configManager.getConfig(),
      isConfigured: false,
      testResult: null,
    });
  },
}));
