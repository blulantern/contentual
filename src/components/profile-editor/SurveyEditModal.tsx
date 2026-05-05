'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreatorSurveyForm from './CreatorSurveyForm';
import type { CreatorSurvey } from '@/types/profile';

interface Props {
  open: boolean;
  currentSurvey: CreatorSurvey;
  onClose: () => void;
  onSave: (next: CreatorSurvey) => void | Promise<void>;
}

/**
 * Modal wrapper around CreatorSurveyForm. Same overlay pattern as
 * NichePicker / PlatformsEditModal. Survey save runs through profile
 * store.updateSurvey which recomputes niche compatibility scores —
 * the AI is NOT re-invoked.
 */
export default function SurveyEditModal({
  open,
  currentSurvey,
  onClose,
  onSave,
}: Props) {
  const [working, setWorking] = useState<CreatorSurvey>(currentSurvey);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Bump on each open so CreatorSurveyForm remounts and re-seeds its
  // internal raw-text state from the freshly-passed value.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open) {
      setWorking(currentSurvey);
      setError(null);
      setFormKey((k) => k + 1);
    }
  }, [open, currentSurvey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (!working.contentTopics.trim()) {
      setError('Please describe what your content is about — this drives niche accuracy.');
      return;
    }
    const cleaned: CreatorSurvey = {
      ...working,
      audience: working.audience?.trim() || undefined,
    };
    try {
      setSaving(true);
      await onSave(cleaned);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-modal-title"
    >
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl animate-scale-in">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h2 id="survey-modal-title" className="text-2xl font-display font-bold">
              Edit Survey
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Updating your content topics or recent posts will refresh your niche match scores.
              Profile summary and similar creators stay as-is until you regenerate them.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <CreatorSurveyForm key={formKey} value={working} onChange={setWorking} />
          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save survey'}
          </Button>
        </div>
      </div>
    </div>
  );
}
