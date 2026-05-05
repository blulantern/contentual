'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import { SUPPORTED_PLATFORMS } from '@/lib/data/platforms';
import type { PlatformConnection, SocialPlatform } from '@/types/platforms';

interface Props {
  value: PlatformConnection[];
  onChange: (next: PlatformConnection[]) => void;
}

/**
 * Controlled form for the four supported platform handles.
 * Always renders all four inputs even if the parent only has a subset
 * connected — this is what lets users add a NEW platform post-setup.
 *
 * `connected` flips automatically based on whether `username` has a
 * non-empty trimmed value. The parent decides whether to filter out
 * disconnected entries before persisting.
 */
export default function PlatformConnectionsForm({ value, onChange }: Props) {
  const byPlatform = new Map<SocialPlatform, PlatformConnection>(
    value.map((p) => [p.platform, p])
  );
  const display: PlatformConnection[] = SUPPORTED_PLATFORMS.map(
    (p): PlatformConnection =>
      byPlatform.get(p) ?? { platform: p, username: '', connected: false }
  );

  const handleChange = (platform: SocialPlatform, username: string) => {
    const next: PlatformConnection[] = display.map((p) =>
      p.platform === platform
        ? { ...p, username, connected: username.trim().length > 0 }
        : p
    );
    onChange(next);
  };

  return (
    <div className="space-y-6">
      {display.map((p) => (
        <div key={p.platform} className="space-y-2">
          <Label className="capitalize text-base">{p.platform} username</Label>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                size="lg"
                placeholder={`@your${p.platform}username`}
                value={p.username}
                onChange={(e) => handleChange(p.platform, e.target.value)}
                className="text-base"
              />
            </div>
            {p.connected && (
              <div
                className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-colored animate-scale-in"
                aria-label="Connected"
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
