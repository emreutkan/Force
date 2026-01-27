import { getAccount } from '@/api/account';
import {
    addUserSupplement,
    CreateUserSupplementRequest,
    deleteSupplementLog,
    getSupplementLogs,
    getSupplements,
    getTodayLogs,
    getUserSupplements,
    logUserSupplement,
    Supplement,
    SupplementLog,
    UserSupplement
} from '@/api/Supplements';
import { getAccountResponse, Workout } from '@/api/types';
import { getWorkouts } from '@/api/Workout';
import { create } from 'zustand';

interface UserState {
    user: getAccountResponse | null;
    isLoading: boolean;
    fetchUser: () => Promise<void>;
    clearUser: () => void;
}

interface WorkoutState {
    workouts: Workout[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    currentPage: number;
    fetchWorkouts: (reset?: boolean) => Promise<void>;
    loadMoreWorkouts: () => Promise<void>;
    clearWorkouts: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isLoading: false,
    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const userData = await getAccount();
            set({ user: userData });
        } catch (error) {
            console.error('Failed to fetch user:', error);
            set({ user: null });
        } finally {
            set({ isLoading: false });
        }
    },
    clearUser: () => set({ user: null }),
}));

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    workouts: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    currentPage: 1,
    fetchWorkouts: async (reset = true) => {
        if (reset) {
            set({ isLoading: true, currentPage: 1 });
        }
        try {
            const workoutsData = await getWorkouts(1);
            const workoutsArray = workoutsData?.results || [];
            set({ 
                workouts: workoutsArray,
                hasMore: !!workoutsData?.next,
                currentPage: 1,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch workouts:', error);
            set({ workouts: [], hasMore: false, isLoading: false });
        }
    },
    loadMoreWorkouts: async () => {
        const { currentPage, hasMore, isLoadingMore } = get();
        if (!hasMore || isLoadingMore) return;
        
        set({ isLoadingMore: true });
        try {
            const nextPage = currentPage + 1;
            const workoutsData = await getWorkouts(nextPage);
            const newWorkouts = workoutsData?.results || [];
            set((state) => ({
                workouts: [...state.workouts, ...newWorkouts],
                hasMore: !!workoutsData?.next,
                currentPage: nextPage,
                isLoadingMore: false
            }));
        } catch (error) {
            console.error('Failed to load more workouts:', error);
            set({ isLoadingMore: false });
        }
    },
    clearWorkouts: () => set({ workouts: [], currentPage: 1, hasMore: false }),
}));

interface ActiveWorkoutState {
    lastSetTimestamp: number | null;
    lastExerciseCategory: string;
    setLastSetTimestamp: (timestamp: number | null) => void;
    setLastExerciseCategory: (category: string) => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set) => ({
    lastSetTimestamp: null,
    lastExerciseCategory: 'isolation',
    setLastSetTimestamp: (timestamp) => set({ lastSetTimestamp: timestamp }),
    setLastExerciseCategory: (category) => set({ lastExerciseCategory: category }),
}));

interface HomeLoadingState {
    isInitialLoadComplete: boolean;
    todayStatus: any | null;
    recoveryStatus: Record<string, any> | null;
    setInitialLoadComplete: (complete: boolean) => void;
    setTodayStatus: (status: any) => void;
    setRecoveryStatus: (status: Record<string, any>) => void;
    clearHomeData: () => void;
}

export const useHomeLoadingStore = create<HomeLoadingState>((set) => ({
    isInitialLoadComplete: false,
    todayStatus: null,
    recoveryStatus: null,
    setInitialLoadComplete: (complete) => set({ isInitialLoadComplete: complete }),
    setTodayStatus: (status) => set({ todayStatus: status }),
    setRecoveryStatus: (status) => set({ recoveryStatus: status }),
    clearHomeData: () => set({ 
        isInitialLoadComplete: false, 
        todayStatus: null, 
        recoveryStatus: null 
    }),
}));

interface DateState {
    today: Date;
    setToday: (date: Date) => void;
}

export const useDateStore = create<DateState>((set) => ({
    today: new Date(),
    setToday: (date) => set({ today: date }),
}));

interface SupplementState {
    userSupplements: UserSupplement[];
    availableSupplements: Supplement[];
    todayLogsMap: Map<number, boolean>;
    viewingLogs: SupplementLog[];
    isLoading: boolean;
    isLoadingLogs: boolean;
    fetchData: () => Promise<void>;
    logSupplement: (item: UserSupplement) => Promise<{ success: boolean; error?: string }>;
    addSupplement: (data: CreateUserSupplementRequest) => Promise<boolean>;
    fetchLogs: (userSupplementId: number) => Promise<void>;
    deleteLog: (logId: number) => Promise<void>;
    clearSupplements: () => void;
}

export const useSupplementStore = create<SupplementState>((set, get) => ({
    userSupplements: [],
    availableSupplements: [],
    todayLogsMap: new Map(),
    viewingLogs: [],
    isLoading: false,
    isLoadingLogs: false,
    
    fetchData: async () => {
        set({ isLoading: true });
        try {
            const [userData, allData, todayData] = await Promise.all([
                getUserSupplements(),
                getSupplements(),
                getTodayLogs()
            ]);
            
            const logMap = new Map<number, boolean>();
            if (todayData?.logs) {
                todayData.logs.forEach(log => {
                    if (log.user_supplement_details?.id) {
                        logMap.set(log.user_supplement_details.id, true);
                    }
                });
            }
            
            set({ 
                userSupplements: userData,
                availableSupplements: allData,
                todayLogsMap: logMap,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch supplements:', error);
            set({ isLoading: false });
        }
    },
    
    logSupplement: async (item: UserSupplement): Promise<{ success: boolean; error?: string }> => {
        const now = new Date();
        const result = await logUserSupplement({
            user_supplement_id: item.id,
            date: now.toISOString().split('T')[0],
            time: `${now.getHours()}:${now.getMinutes()}:00`,
            dosage: item.dosage
        });
        if (result && 'error' in result) {
            return { success: false, error: result.error };
        }
        if (result) {
            await get().fetchData();
            return { success: true };
        }
        return { success: false, error: 'Failed to log supplement' };
    },
    
    addSupplement: async (data: CreateUserSupplementRequest) => {
        const result = await addUserSupplement(data);
        if (result) {
            await get().fetchData();
            return true;
        }
        return false;
    },
    
    fetchLogs: async (userSupplementId: number) => {
        set({ isLoadingLogs: true });
        try {
            const logs = await getSupplementLogs(userSupplementId);
            set({ viewingLogs: logs, isLoadingLogs: false });
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            set({ isLoadingLogs: false });
        }
    },
    
    deleteLog: async (logId: number) => {
        await deleteSupplementLog(logId);
        const { viewingLogs } = get();
        const log = viewingLogs.find(l => l.id === logId);
        if (log) {
            await get().fetchLogs(log.user_supplement_id);
        }
        await get().fetchData();
    },
    
    clearSupplements: () => set({ 
        userSupplements: [], 
        availableSupplements: [], 
        todayLogsMap: new Map(),
        viewingLogs: []
    }),
}));