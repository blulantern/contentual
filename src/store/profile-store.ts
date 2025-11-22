import { create } from 'zustand';
import { CreatorProfile } from '@/types/profile';
import { getProfile } from '@/lib/storage/db';

interface ProfileState {
  profile: CreatorProfile | null;
  isLoading: boolean;
  setProfile: (profile: CreatorProfile) => void;
  loadProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
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
}));
