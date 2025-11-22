'use client';

import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/store/config-store';
import { CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { config, updateConfig, testConnection, resetConfig, isTesting, testResult } =
    useConfigStore();
  const [apiKey, setApiKey] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setApiKey(config.apiKey);
  }, [config.apiKey]);

  const handleSave = () => {
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      setSaveMessage('Please enter a valid API key starting with sk-ant-');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    updateConfig({ apiKey });
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleTest = () => {
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      setSaveMessage('Please enter a valid API key first');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    // Save first, then test
    updateConfig({ apiKey });
    testConnection();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings?')) {
      resetConfig();
      setApiKey('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-12 lg:py-20">
        <div className="mb-12 animate-fade-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
            <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl leading-relaxed max-w-2xl">
            Configure your AI integration
          </p>
        </div>

        <div className="space-y-8">
          {/* API Configuration */}
          <Card variant="elevated" className="animate-fade-up animation-delay-200">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">AI Configuration</CardTitle>
              <CardDescription className="text-base">Connect to Claude AI API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* API Key */}
              <div className="space-y-3">
                <Label className="text-base">Anthropic API Key</Label>
                <Input
                  size="lg"
                  type="password"
                  placeholder="sk-ant-api..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="text-base font-mono"
                />
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  Get your API key from{' '}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-contentual-pink hover:underline font-semibold"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>

              {/* Provider Selection */}
              <div className="space-y-4">
                <Label className="text-base">API Provider</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => updateConfig({ provider: 'console-api' })}
                    className={`group p-6 rounded-2xl border-2 transition-all duration-300 ${
                      config.provider === 'console-api'
                        ? 'border-contentual-pink bg-gradient-to-br from-contentual-pink-50 to-white shadow-soft'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        config.provider === 'console-api'
                          ? 'bg-gradient-primary shadow-colored'
                          : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <span className={config.provider === 'console-api' ? 'text-white text-lg' : 'text-gray-600 text-lg'}>🔌</span>
                      </div>
                      {config.provider === 'console-api' && (
                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-lg mb-1 text-gray-800">Console API</div>
                    <div className="text-sm text-gray-600">Standard API endpoint</div>
                  </button>

                  <button
                    onClick={() => updateConfig({ provider: 'context-api' })}
                    className={`group p-6 rounded-2xl border-2 transition-all duration-300 ${
                      config.provider === 'context-api'
                        ? 'border-contentual-pink bg-gradient-to-br from-contentual-pink-50 to-white shadow-soft'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        config.provider === 'context-api'
                          ? 'bg-gradient-primary shadow-colored'
                          : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <span className={config.provider === 'context-api' ? 'text-white text-lg' : 'text-gray-600 text-lg'}>⚡</span>
                      </div>
                      {config.provider === 'context-api' && (
                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-lg mb-1 text-gray-800 flex items-center gap-2">
                      Context API
                      <Badge variant="accent" size="sm" className="text-[10px]">
                        Recommended
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">With prompt caching</div>
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-4">
                <Label className="text-base">Claude Model</Label>
                <select
                  value={config.model}
                  onChange={(e) => updateConfig({ model: e.target.value as any })}
                  className="w-full h-14 rounded-2xl border-2 border-gray-200 px-5 text-base font-medium bg-white focus:border-contentual-pink focus:ring-4 focus:ring-contentual-pink/20 outline-none transition-all cursor-pointer hover:border-gray-300"
                >
                  <option value="claude-sonnet-4-5-20250929">
                    Claude Sonnet 4.5 (Recommended)
                  </option>
                  <option value="claude-opus-4-20250514">Claude Opus 4 (Most Capable)</option>
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Faster)</option>
                </select>
              </div>

              {/* Test Result */}
              {testResult && (
                <div
                  className={`p-6 rounded-2xl border-2 animate-fade-in ${
                    testResult.success
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                      : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      testResult.success
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-colored'
                        : 'bg-gradient-to-br from-red-400 to-rose-500 shadow-colored'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle2 className="text-white w-6 h-6" />
                      ) : (
                        <XCircle className="text-white w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`font-bold text-base ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {testResult.message}
                      </span>
                      {testResult.latency && (
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                          <span className="text-lg">⚡</span>
                          Response time: <span className="font-semibold">{testResult.latency}ms</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Message */}
              {saveMessage && (
                <div
                  className={`p-6 rounded-2xl border-2 animate-fade-in ${
                    saveMessage.includes('success')
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                      : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      saveMessage.includes('success')
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-colored'
                        : 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-colored'
                    }`}>
                      <CheckCircle2 className="text-white w-6 h-6" />
                    </div>
                    <span className={`font-bold text-base ${
                      saveMessage.includes('success') ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {saveMessage}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={handleSave} size="xl" className="shadow-colored-lg">
                  Save Changes
                </Button>
                <Button onClick={handleTest} disabled={!apiKey || isTesting} variant="secondary" size="xl">
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button onClick={handleReset} variant="ghost" size="xl" className="sm:ml-auto text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="mr-2 h-5 w-5" />
                  Reset All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card variant="elevated" className="animate-fade-up animation-delay-400">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Advanced Settings</CardTitle>
              <CardDescription className="text-base">Fine-tune AI behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-base">Max Tokens</Label>
                  <Input
                    size="lg"
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
                    min="100"
                    max="8192"
                    className="text-base"
                  />
                  <p className="text-xs text-gray-600">Maximum response length (100-8192)</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-base">Temperature</Label>
                  <Input
                    size="lg"
                    type="number"
                    value={config.temperature}
                    onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                    min="0"
                    max="1"
                    step="0.1"
                    className="text-base"
                  />
                  <p className="text-xs text-gray-600">Creativity level (0.0 = focused, 1.0 = creative)</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-contentual-pink rounded-xl flex items-center justify-center shadow-colored">
                    <span className="text-white text-xl">💾</span>
                  </div>
                  <div>
                    <p className="font-bold text-base text-gray-800">Enable Prompt Caching</p>
                    <p className="text-sm text-gray-600">Reduce costs with Context API</p>
                  </div>
                </div>
                <button
                  onClick={() => updateConfig({ enableCaching: !config.enableCaching })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                    config.enableCaching ? 'bg-gradient-primary shadow-colored' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      config.enableCaching ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
