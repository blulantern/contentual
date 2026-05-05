'use client';

import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/store/config-store';
import { useProfileStore } from '@/store/profile-store';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Database,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AIService } from '@/lib/ai/ai-service';
import {
  SeedingService,
  type FixtureInventory,
  type SeedResult,
} from '@/lib/services/seeding-service';

export default function SettingsPage() {
  const router = useRouter();
  const { config, updateConfig, testConnection, resetConfig, isTesting, testResult } =
    useConfigStore();
  const { loadProfile } = useProfileStore();
  const [apiKey, setApiKey] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Fixture seeding state
  const [inventory, setInventory] = useState<FixtureInventory | null>(null);
  const [seedingState, setSeedingState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    setApiKey(config.apiKey);
  }, [config.apiKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const svc = new SeedingService(new AIService(config));
        const inv = await svc.inventory();
        if (!cancelled) setInventory(inv);
      } catch (err) {
        console.warn('[settings] inventory failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // re-inventory when AI config changes (rare, but harmless)
  }, [config]);

  const handleSeed = async () => {
    if (!inventory || inventory.profileGen === 0) return;
    if (
      !confirm(
        'This will overwrite your current profile and append fixture trends to your dictionary. Continue?'
      )
    ) {
      return;
    }
    setSeedingState('running');
    setSeedError(null);
    try {
      const svc = new SeedingService(new AIService(config));
      const result = await svc.seed();
      setSeedResult(result);
      setSeedingState('done');
      // Pull the freshly-seeded profile into the Zustand store so any other
      // tab/component picks it up without a hard reload.
      await loadProfile();
    } catch (err) {
      setSeedError((err as Error).message);
      setSeedingState('error');
    }
  };

  const goToDashboard = () => router.push('/dashboard');

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

          {/* Seed from local fixtures */}
          <Card variant="elevated" className="animate-fade-up animation-delay-[600ms]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-12 h-12 bg-gradient-secondary rounded-2xl flex items-center justify-center shadow-colored">
                  <Database className="w-6 h-6 text-white" />
                </div>
                Seed from local fixtures
              </CardTitle>
              <CardDescription className="text-base">
                Skip the setup survey. Pulls profile, trends, and content ideas from
                recorded AI fixtures and writes them through to Supabase + the local
                cache.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-4 gap-3">
                <FixtureCount label="Profile" value={inventory?.profileGen ?? 0} />
                <FixtureCount
                  label="Niche creators"
                  value={inventory?.nicheCreators ?? 0}
                />
                <FixtureCount label="Trends" value={inventory?.trendAnalysis ?? 0} />
                <FixtureCount label="Ideas" value={inventory?.contentIdeas ?? 0} />
              </div>

              {inventory && inventory.profileGen === 0 && (
                <div className="p-4 rounded-xl border-2 border-yellow-200 bg-yellow-50 flex items-start gap-3 text-sm text-yellow-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    No profile-generation fixture found. Record one first:
                    set <code className="font-mono">NEXT_PUBLIC_AI_FIXTURE_MODE=record</code>
                    , run setup once, then come back here.
                  </p>
                </div>
              )}

              {seedResult && seedingState === 'done' && (
                <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50 space-y-2 text-sm text-green-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    Seed complete.
                  </div>
                  <ul className="ml-7 list-disc space-y-0.5 text-green-900/90">
                    <li>
                      Profile imported:{' '}
                      <span className="font-semibold">
                        {seedResult.profileImported ? 'yes' : 'no'}
                      </span>
                    </li>
                    <li>
                      Niche-creator groups merged:{' '}
                      <span className="font-semibold">
                        {seedResult.nicheCreatorGroupsImported}
                      </span>
                    </li>
                    <li>
                      Trends merged:{' '}
                      <span className="font-semibold">
                        {Object.values(seedResult.trendsImportedByNiche).reduce(
                          (a, b) => a + b,
                          0
                        )}
                      </span>{' '}
                      across {Object.keys(seedResult.trendsImportedByNiche).length}{' '}
                      niches
                    </li>
                    <li>
                      Content-ideas cache rows written:{' '}
                      <span className="font-semibold">
                        {seedResult.ideasCacheRowsWritten}
                      </span>
                    </li>
                  </ul>
                  {seedResult.warnings.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold text-yellow-700">
                        {seedResult.warnings.length} warning(s)
                      </summary>
                      <ul className="ml-4 mt-1 list-disc text-xs text-yellow-700">
                        {seedResult.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              {seedingState === 'error' && seedError && (
                <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50 flex items-start gap-3 text-sm text-red-700">
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    <span className="font-semibold">Seed failed:</span> {seedError}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSeed}
                  disabled={
                    !inventory ||
                    inventory.profileGen === 0 ||
                    seedingState === 'running'
                  }
                  size="xl"
                  className="shadow-colored-lg"
                >
                  {seedingState === 'running' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Seeding…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Seed from fixtures
                    </>
                  )}
                </Button>
                {seedingState === 'done' && (
                  <Button
                    onClick={goToDashboard}
                    variant="secondary"
                    size="xl"
                    className="sm:ml-auto"
                  >
                    Open dashboard →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function FixtureCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 rounded-xl border-2 border-gray-100 bg-white">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
