'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreatorSurvey } from '@/types/profile';

interface Props {
  value: CreatorSurvey;
  onChange: (next: CreatorSurvey) => void;
}

const splitCsv = (s: string): string[] =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * Controlled survey form. Comma-separated list fields use internal raw-text
 * state so partial input ("a, , b") stays editable; arrays are parsed and
 * emitted to the parent on every change.
 *
 * Field order matches setup-page priority: contentTopics first (highest
 * niche-matching signal), then concrete-content questions, then constraints.
 *
 * Initial raw values are seeded from `value` once on mount. Caller is
 * responsible for remounting (e.g. via `key` prop or open/close gating)
 * when the underlying value should fully reset.
 */
export default function CreatorSurveyForm({ value, onChange }: Props) {
  const [recentPostsRaw, setRecentPostsRaw] = useState(
    () => value.recentPostTitles.join(', ')
  );
  const [challengesRaw, setChallengesRaw] = useState(
    () => value.challenges.join(', ')
  );
  const [formatsRaw, setFormatsRaw] = useState(
    () => value.preferredFormats.join(', ')
  );
  const [equipmentRaw, setEquipmentRaw] = useState(
    () => value.equipment.join(', ')
  );

  const emit = (patch: Partial<CreatorSurvey>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Label className="text-base">
          What is your content actually about?{' '}
          <span className="text-contentual-pink">*</span>
        </Label>
        <textarea
          className="flex min-h-[100px] w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-base transition-all focus:border-contentual-pink focus:ring-4 focus:ring-contentual-pink/20 focus:outline-none resize-none leading-relaxed"
          placeholder="e.g., Mom of three sharing parenting hacks, family vlogs, and dating advice for single parents"
          value={value.contentTopics}
          onChange={(e) => emit({ contentTopics: e.target.value })}
        />
        <p className="text-sm text-gray-500">
          Be specific — this is the strongest signal we have for matching your niche.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-base">3 Recent Post or Video Titles</Label>
        <Input
          size="lg"
          placeholder="e.g., Morning routine with toddlers, Date night ideas for busy moms, How I packed lunch in 5 min"
          value={recentPostsRaw}
          onChange={(e) => {
            setRecentPostsRaw(e.target.value);
            emit({ recentPostTitles: splitCsv(e.target.value) });
          }}
          className="text-base"
        />
        <p className="text-sm text-gray-500">
          Comma-separated. Concrete titles produce better matches than abstract descriptions.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-base">Who is your audience? (optional)</Label>
        <Input
          size="lg"
          placeholder="e.g., Working moms in their 30s"
          value={value.audience || ''}
          onChange={(e) => emit({ audience: e.target.value })}
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">What are your content creation goals?</Label>
        <textarea
          className="flex min-h-[100px] w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-base transition-all focus:border-contentual-pink focus:ring-4 focus:ring-contentual-pink/20 focus:outline-none resize-none leading-relaxed"
          placeholder="I want to grow my audience, build a personal brand, share my expertise..."
          value={value.goals}
          onChange={(e) => emit({ goals: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">Time commitment (hours per week)</Label>
        <Input
          size="lg"
          type="number"
          min="1"
          max="80"
          value={value.timeCommitment}
          onChange={(e) =>
            emit({ timeCommitment: parseInt(e.target.value, 10) || 0 })
          }
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">Main challenges (comma-separated)</Label>
        <Input
          size="lg"
          placeholder="e.g., Finding ideas, Editing, Consistency, Growing audience"
          value={challengesRaw}
          onChange={(e) => {
            setChallengesRaw(e.target.value);
            emit({ challenges: splitCsv(e.target.value) });
          }}
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">Preferred content formats (comma-separated)</Label>
        <Input
          size="lg"
          placeholder="e.g., Short videos, Long-form, Stories, Reels, Blogs"
          value={formatsRaw}
          onChange={(e) => {
            setFormatsRaw(e.target.value);
            emit({ preferredFormats: splitCsv(e.target.value) });
          }}
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">Equipment you have (comma-separated)</Label>
        <Input
          size="lg"
          placeholder="e.g., Smartphone, Camera, Microphone, Lighting, Editing software"
          value={equipmentRaw}
          onChange={(e) => {
            setEquipmentRaw(e.target.value);
            emit({ equipment: splitCsv(e.target.value) });
          }}
          className="text-base"
        />
      </div>
    </div>
  );
}
