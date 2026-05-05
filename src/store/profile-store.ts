import { create } from 'zustand';
import {
  CreatorProfile,
  NicheMatch,
  SimilarCreator,
  TopInfluencer,
} from '@/types/profile';
import { getProfile, saveProfile } from '@/lib/storage/db';

interface ProfileState {
  profile: CreatorProfile | null;
  isLoading: boolean;
  setProfile: (profile: CreatorProfile) => void;
  loadProfile: () => Promise<void>;
  updateNiches: (niches: NicheMatch[]) => Promise<void>;
  /** Replace the entire similarCreators array. */
  setSimilarCreators: (creators: SimilarCreator[]) => Promise<void>;
  /** Add (or replace by niche name) one TopInfluencer group. */
  upsertInfluencerGroup: (group: TopInfluencer) => Promise<void>;
  /** Append several similar creators (de-duped by name + platform). */
  appendSimilarCreators: (creators: SimilarCreator[]) => Promise<void>;
}

const persist = async (
  next: CreatorProfile,
  set: (s: Partial<ProfileState>) => void
): Promise<void> => {
  set({ profile: next });
  await saveProfile(next);
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,

  setProfile: (profile) => {
    set({ profile });
  },

  loadProfile: async () => {
    set({ isLoading: true });
    const profile = await getProfile();
    set({ profile, isLoading: false });
  },

  updateNiches: async (niches) => {
    const { profile } = get();
    if (!profile) return;
    const updated: CreatorProfile = {
      ...profile,
      topNiches: niches,
      lastUpdated: new Date(),
    };
    await persist(updated, set);
  },

  setSimilarCreators: async (creators) => {
    const { profile } = get();
    if (!profile) return;
    const updated: CreatorProfile = {
      ...profile,
      similarCreators: creators,
      lastUpdated: new Date(),
    };
    await persist(updated, set);
  },

  upsertInfluencerGroup: async (group) => {
    const { profile } = get();
    if (!profile) return;
    const filtered = (profile.topInfluencers ?? []).filter(
      (g) => g.niche.toLowerCase() !== group.niche.toLowerCase()
    );
    const updated: CreatorProfile = {
      ...profile,
      topInfluencers: [...filtered, group],
      lastUpdated: new Date(),
    };
    await persist(updated, set);
  },

  appendSimilarCreators: async (creators) => {
    const { profile } = get();
    if (!profile) return;
    const dedupeKey = (c: SimilarCreator): string =>
      `${c.platform}:${c.name.toLowerCase()}`;
    const seen = new Set(
      (profile.similarCreators ?? []).map(dedupeKey)
    );
    const additions = creators.filter((c) => {
      const k = dedupeKey(c);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (additions.length === 0) return;
    const updated: CreatorProfile = {
      ...profile,
      similarCreators: [...(profile.similarCreators ?? []), ...additions],
      lastUpdated: new Date(),
    };
    await persist(updated, set);
  },
}));
