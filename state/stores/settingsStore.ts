import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsState {
    /** Countdown seconds before TUT tracking starts (default 3) */
    tutCountdown: number;
    /** Reaction time seconds to subtract when TUT stops (default 2) */
    tutReactionOffset: number;
    /** Premium subscription status (synced from RevenueCat) */
    isPro: boolean;

    setTutCountdown: (seconds: number) => void;
    setTutReactionOffset: (seconds: number) => void;
    setIsPro: (isPro: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            tutCountdown: 3,
            tutReactionOffset: 2,
            isPro: false,

            setTutCountdown: (seconds) => set({ tutCountdown: seconds }),
            setTutReactionOffset: (seconds) => set({ tutReactionOffset: seconds }),
            setIsPro: (isPro) => set({ isPro }),
        }),
        {
            name: 'force-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
