'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlatformConnectionsForm from './PlatformConnectionsForm';
import type { PlatformConnection } from '@/types/platforms';

interface Props {
  open: boolean;
  currentPlatforms: PlatformConnection[];
  onClose: () => void;
  onSave: (next: PlatformConnection[]) => void | Promise<void>;
}

/**
 * Modal wrapper around PlatformConnectionsForm.
 * Pattern (ESC / backdrop close / body-scroll lock / state seed on open)
 * is the same as `niche-picker/NichePicker.tsx`.
 */
export default function PlatformsEditModal({
  open,
  currentPlatforms,
  onClose,
  onSave,
}: Props) {
  const [working, setWorking] = useState<PlatformConnection[]>(currentPlatforms);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-seed when reopened (covers the case where a user closes + reopens
  // without editing, picking up the latest persisted state).
  useEffect(() => {
    if (open) {
      setWorking(currentPlatforms);
      setError(null);
    }
  }, [open, currentPlatforms]);

  // ESC key + body-scroll lock while open.
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
    const connected = working.filter((p) => p.connected && p.username.trim());
    if (connected.length === 0) {
      setError('Connect at least one platform — leave usernames blank to disconnect, but keep at least one.');
      return;
    }
    try {
      setSaving(true);
      await onSave(connected);
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
      aria-labelledby="platforms-modal-title"
    >
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl animate-scale-in">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h2 id="platforms-modal-title" className="text-2xl font-display font-bold">
              Connected Platforms
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Add, edit, or disconnect any of your platform handles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <PlatformConnectionsForm value={working} onChange={setWorking} />
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
            {saving ? 'Saving…' : 'Save platforms'}
          </Button>
        </div>
      </div>
    </div>
  );
}
