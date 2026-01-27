import { renderHook, act } from '@testing-library/react-native';
import { useUserStore, useWorkoutStore, useActiveWorkoutStore } from '../userStore';
import { getAccount } from '@/api/account';
import { getWorkouts } from '@/api/Workout';

// Mock API calls
jest.mock('@/api/account');
jest.mock('@/api/Workout');

const mockedGetAccount = getAccount as jest.MockedFunction<typeof getAccount>;
const mockedGetWorkouts = getWorkouts as jest.MockedFunction<typeof getWorkouts>;

describe('User Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset stores
    useUserStore.getState().clearUser();
    useWorkoutStore.getState().clearWorkouts();
  });

  describe('useUserStore', () => {
    it('should initialize with null user', () => {
      const { result } = renderHook(() => useUserStore());
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      mockedGetAccount.mockResolvedValue(mockUser as any);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.fetchUser();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(mockedGetAccount).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch user error', async () => {
      mockedGetAccount.mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.fetchUser();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear user', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.clearUser();
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('useWorkoutStore', () => {
    it('should initialize with empty workouts', () => {
      const { result } = renderHook(() => useWorkoutStore());
      expect(result.current.workouts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasMore).toBe(false);
    });

    it('should fetch workouts successfully', async () => {
      const mockWorkouts = {
        results: [
          { id: 1, name: 'Workout 1' },
          { id: 2, name: 'Workout 2' },
        ],
        next: null,
      };

      mockedGetWorkouts.mockResolvedValue(mockWorkouts as any);

      const { result } = renderHook(() => useWorkoutStore());

      await act(async () => {
        await result.current.fetchWorkouts();
      });

      expect(result.current.workouts).toEqual(mockWorkouts.results);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasMore).toBe(false);
    });

    it('should load more workouts', async () => {
      const firstPage = {
        results: [{ id: 1, name: 'Workout 1' }],
        next: 'http://api.com/workouts?page=2',
      };

      const secondPage = {
        results: [{ id: 2, name: 'Workout 2' }],
        next: null,
      };

      mockedGetWorkouts
        .mockResolvedValueOnce(firstPage as any)
        .mockResolvedValueOnce(secondPage as any);

      const { result } = renderHook(() => useWorkoutStore());

      await act(async () => {
        await result.current.fetchWorkouts();
      });

      expect(result.current.hasMore).toBe(true);

      await act(async () => {
        await result.current.loadMoreWorkouts();
      });

      expect(result.current.workouts).toHaveLength(2);
      expect(result.current.hasMore).toBe(false);
    });

    it('should not load more if already loading', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      // Set loading state
      act(() => {
        useWorkoutStore.setState({ isLoadingMore: true });
      });

      await act(async () => {
        await result.current.loadMoreWorkouts();
      });

      expect(mockedGetWorkouts).not.toHaveBeenCalled();
    });
  });

  describe('useActiveWorkoutStore', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useActiveWorkoutStore());
      expect(result.current.lastSetTimestamp).toBeNull();
      expect(result.current.lastExerciseCategory).toBe('isolation');
    });

    it('should update last set timestamp', () => {
      const { result } = renderHook(() => useActiveWorkoutStore());
      const timestamp = Date.now();

      act(() => {
        result.current.setLastSetTimestamp(timestamp);
      });

      expect(result.current.lastSetTimestamp).toBe(timestamp);
    });

    it('should update exercise category', () => {
      const { result } = renderHook(() => useActiveWorkoutStore());

      act(() => {
        result.current.setLastExerciseCategory('compound');
      });

      expect(result.current.lastExerciseCategory).toBe('compound');
    });
  });
});
