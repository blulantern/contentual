'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NICHE_CATEGORIES } from '@/lib/data/niche-categories';
import type { NicheCategory, NicheMatch } from '@/types/profile';

const MAX_NICHES = 5;

interface NichePickerProps {
  currentNiches: NicheMatch[];
  open: boolean;
  onClose: () => void;
  onSave: (niches: NicheMatch[]) => void | Promise<void>;
}

export default function NichePicker({
  currentNiches,
  open,
  onClose,
  onSave,
}: NichePickerProps) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    currentNiches.map((n) => n.id)
  );
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Re-seed selection whenever the picker is reopened
  useEffect(() => {
    if (open) {
      setSelectedIds(currentNiches.map((n) => n.id));
      setQuery('');
      // Focus search after the overlay paints
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, currentNiches]);

  // ESC closes; lock body scroll while open
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

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filter = (n: NicheCategory) =>
      !q ||
      n.name.toLowerCase().includes(q) ||
      (n.category ?? '').toLowerCase().includes(q);
    const out = new Map<string, NicheCategory[]>();
    for (const niche of NICHE_CATEGORIES) {
      if (!filter(niche)) continue;
      const cat = niche.category ?? 'Other';
      if (!out.has(cat)) out.set(cat, []);
      out.get(cat)!.push(niche);
    }
    return Array.from(out.entries());
  }, [query]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const atCap = selectedIds.length >= MAX_NICHES;

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_NICHES) return prev;
      return [...prev, id];
    });
  };

  const remove = (id: number) =>
    setSelectedIds((prev) => prev.filter((x) => x !== id));

  const handleSave = async () => {
    const previousById = new Map(currentNiches.map((n) => [n.id, n]));
    const next: NicheMatch[] = selectedIds.map((id) => {
      const cat = NICHE_CATEGORIES.find((n) => n.id === id);
      const prior = previousById.get(id);
      if (prior) return prior; // preserve AI confidence + reasoning
      return {
        id,
        name: cat?.name ?? 'Unknown',
        category: cat?.category,
        confidence: 100,
        reasoning: 'Manually selected',
      };
    });
    try {
      setSaving(true);
      await onSave(next);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="niche-picker-title"
    >
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl animate-scale-in">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h2 id="niche-picker-title" className="text-2xl font-display font-bold">
              Choose Your Niches
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Pick up to {MAX_NICHES}. Selected{' '}
              <span className={atCap ? 'text-contentual-pink font-bold' : 'font-bold'}>
                {selectedIds.length}/{MAX_NICHES}
              </span>
              .
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

        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search niches or categories…"
              className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-base focus:border-contentual-pink focus:ring-4 focus:ring-contentual-pink/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="px-6 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Selected
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map((id) => {
                const cat = NICHE_CATEGORIES.find((n) => n.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => remove(id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-primary text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
                    title="Remove"
                  >
                    {cat?.name ?? `#${id}`}
                    <X className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 mt-2">
          {grouped.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No niches match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            grouped.map(([category, niches]) => (
              <div key={category} className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {niches.map((niche) => {
                    const checked = selectedSet.has(niche.id);
                    const disabled = !checked && atCap;
                    return (
                      <button
                        key={niche.id}
                        onClick={() => toggle(niche.id)}
                        disabled={disabled}
                        className={[
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                          checked
                            ? 'bg-contentual-pink text-white border-contentual-pink shadow-sm'
                            : disabled
                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-contentual-pink hover:bg-contentual-pink-50',
                        ].join(' ')}
                        title={
                          disabled
                            ? `Limit ${MAX_NICHES} reached — remove one first`
                            : niche.name
                        }
                      >
                        {checked && <Check className="w-3.5 h-3.5" />}
                        {niche.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || selectedIds.length === 0}>
            {saving ? 'Saving…' : 'Save niches'}
          </Button>
        </div>
      </div>
    </div>
  );
}
